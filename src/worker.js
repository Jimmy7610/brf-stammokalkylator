const DEFAULT_ADMIN_STATE = {
  meetingTitle: '',
  meetingDate: '',
  callRule: '4v',
  meetingType: 'annual',
  meetingLocation: '',
  meetingFormat: 'physical',
  meetingStatus: 'planning',
  meetingAgenda: '',
  meetingSpecialMatters: '',
  meetingPaperRequired: false,
  distributionMethod: 'email',
  emailSubject: '',
  emailMessage: '',
  activeMeetingId: '',
  meetings: [],
  members: []
};

const DISTRIBUTION_METHODS = new Set(['email', 'letterbox', 'post', 'portal']);
const DISTRIBUTION_STATUSES = new Set(['draft', 'scheduled', 'sent', 'opened']);
const RSVP_STATUSES = new Set(['pending', 'attending', 'not_attending', 'proxy']);
const ATTENDANCE_STATUSES = new Set(['unchecked', 'present', 'proxy', 'absent']);
const OWNERSHIP_TYPES = new Set(['single', 'co_owner', 'representative']);
const PREFERRED_DISTRIBUTIONS = new Set(['paper', 'email', 'both']);

const requestLog = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/healthz') {
      return jsonResponse({ ok: true });
    }

    if (url.pathname.startsWith('/api/')) {
      if (!rateLimit(request, url.pathname)) {
        return jsonResponse({ error: 'För många förfrågningar. Försök igen om en stund.' }, 429);
      }

      if (url.pathname === '/api/admin-state' && request.method === 'GET') {
        return handleGetAdminState(env);
      }

      if (url.pathname === '/api/admin-state' && request.method === 'PUT') {
        return handlePutAdminState(request, env);
      }

      if (url.pathname === '/api/send-invitations' && request.method === 'POST') {
        return handleSendInvitations(request, env);
      }

      return jsonResponse({ error: 'Hittade inte endpointen.' }, 404);
    }

    return env.ASSETS.fetch(request);
  }
};

function rateLimit(request, pathName) {
  const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
  const key = `${clientIp}:${pathName}`;
  const now = Date.now();
  const entry = requestLog.get(key) || { count: 0, expiresAt: now + RATE_LIMIT_WINDOW_MS };

  if (now > entry.expiresAt) {
    entry.count = 0;
    entry.expiresAt = now + RATE_LIMIT_WINDOW_MS;
  }

  entry.count += 1;
  requestLog.set(key, entry);
  return entry.count <= RATE_LIMIT_MAX_REQUESTS;
}

async function handleGetAdminState(env) {
  try {
    const state = await readAdminState(env);
    return jsonResponse({ state });
  } catch (error) {
    return jsonResponse({ error: 'Kunde inte läsa sparad appdata.' }, 500);
  }
}

async function handlePutAdminState(request, env) {
  try {
    const body = await request.json();
    const state = sanitizeAdminState(body);
    await writeAdminState(env, state);
    return jsonResponse({ state });
  } catch (error) {
    return jsonResponse({ error: 'Kunde inte spara appdata.' }, 500);
  }
}

async function handleSendInvitations(request, env) {
  let body;

  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Ogiltig JSON i begäran.' }, 400);
  }

  const validated = validateInvitationPayload(body);
  if (validated.error) {
    return jsonResponse({ error: validated.error }, 400);
  }

  if (!env.RESEND_API_KEY || !env.RESEND_FROM) {
    return jsonResponse({
      error: 'E-postutskick är inte konfigurerat. Lägg till RESEND_API_KEY och RESEND_FROM i Cloudflare.'
    }, 500);
  }

  const sent = [];
  const failed = [];

  for (const recipient of validated.recipients) {
    const html = buildInvitationHtml(validated.message, validated.meeting, recipient);

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: env.RESEND_FROM,
          to: [recipient.email],
          subject: validated.subject,
          text: `Hej ${recipient.name || ''},\n\n${validated.message}\n`,
          html
        })
      });

      if (!response.ok) {
        const payload = await response.text();
        throw new Error(payload || 'Kunde inte skicka e-post.');
      }

      sent.push({ id: recipient.id, email: recipient.email });
    } catch (error) {
      failed.push({
        id: recipient.id,
        email: recipient.email,
        error: error.message || 'Okänt fel vid utskick.'
      });
    }
  }

  if (sent.length === 0) {
    return jsonResponse({ error: failed[0]?.error || 'Inga mejl kunde skickas.', failed }, 502);
  }

  return jsonResponse({ sent, failed });
}

async function readAdminState(env) {
  const row = await env.DB.prepare('SELECT state_json FROM app_state WHERE id = ?')
    .bind('singleton')
    .first();

  if (!row?.state_json) {
    return structuredClone(DEFAULT_ADMIN_STATE);
  }

  const parsed = JSON.parse(row.state_json);
  return sanitizeAdminState(parsed);
}

async function writeAdminState(env, state) {
  await env.DB.prepare(`
    INSERT INTO app_state (id, state_json, updated_at)
    VALUES (?1, ?2, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      state_json = excluded.state_json,
      updated_at = CURRENT_TIMESTAMP
  `)
    .bind('singleton', JSON.stringify(state))
    .run();
}

function sanitizeAdminState(body) {
  const members = Array.isArray(body?.members) ? body.members.map(sanitizeMember) : [];
  const meetings = Array.isArray(body?.meetings) ? body.meetings.map(sanitizeMeeting) : [];

  return {
    meetingTitle: trimTo(body?.meetingTitle, 160),
    meetingDate: trimTo(body?.meetingDate, 40),
    callRule: ['4v', '2v'].includes(body?.callRule) ? body.callRule : '4v',
    meetingType: ['annual', 'extra', 'information'].includes(body?.meetingType) ? body.meetingType : 'annual',
    meetingLocation: trimTo(body?.meetingLocation, 200),
    meetingFormat: ['physical', 'hybrid', 'digital'].includes(body?.meetingFormat) ? body.meetingFormat : 'physical',
    meetingStatus: ['planning', 'ready_for_call', 'called', 'completed'].includes(body?.meetingStatus) ? body.meetingStatus : 'planning',
    meetingAgenda: trimTo(body?.meetingAgenda, 3000),
    meetingSpecialMatters: trimTo(body?.meetingSpecialMatters, 3000),
    meetingPaperRequired: Boolean(body?.meetingPaperRequired),
    distributionMethod: DISTRIBUTION_METHODS.has(body?.distributionMethod) ? body.distributionMethod : 'email',
    emailSubject: trimTo(body?.emailSubject, 200),
    emailMessage: trimTo(body?.emailMessage, 5000),
    activeMeetingId: trimTo(body?.activeMeetingId, 100),
    meetings,
    members
  };
}

function sanitizeMeeting(meeting) {
  const memberStates = sanitizeMeetingMemberStates(meeting?.memberStates);

  return {
    id: trimTo(meeting?.id, 100) || createId('meeting'),
    title: trimTo(meeting?.title, 160),
    type: ['annual', 'extra', 'information'].includes(meeting?.type) ? meeting.type : 'annual',
    date: trimTo(meeting?.date, 40),
    callRule: ['4v', '2v'].includes(meeting?.callRule) ? meeting.callRule : '4v',
    location: trimTo(meeting?.location, 200),
    format: ['physical', 'hybrid', 'digital'].includes(meeting?.format) ? meeting.format : 'physical',
    status: ['planning', 'ready_for_call', 'called', 'completed'].includes(meeting?.status) ? meeting.status : 'planning',
    agenda: trimTo(meeting?.agenda, 3000),
    specialMatters: trimTo(meeting?.specialMatters, 3000),
    paperRequired: Boolean(meeting?.paperRequired),
    distributionMethod: DISTRIBUTION_METHODS.has(meeting?.distributionMethod) ? meeting.distributionMethod : 'email',
    emailSubject: trimTo(meeting?.emailSubject, 200),
    emailMessage: trimTo(meeting?.emailMessage, 5000),
    memberStates
  };
}

function sanitizeMeetingMemberStates(memberStates) {
  if (!memberStates || typeof memberStates !== 'object') {
    return {};
  }

  return Object.fromEntries(
    Object.entries(memberStates).map(([memberId, state]) => [
      trimTo(memberId, 100),
      {
        distributionStatus: DISTRIBUTION_STATUSES.has(state?.distributionStatus) ? state.distributionStatus : 'draft',
        rsvpStatus: RSVP_STATUSES.has(state?.rsvpStatus) ? state.rsvpStatus : 'pending',
        attendanceStatus: ATTENDANCE_STATUSES.has(state?.attendanceStatus) ? state.attendanceStatus : 'unchecked',
        proxyHolder: trimTo(state?.proxyHolder, 120),
        proxyDocument: trimTo(state?.proxyDocument, 200)
      }
    ])
  );
}

function sanitizeMember(member) {
  const voteWeight = Number(member?.voteWeight);

  return {
    id: trimTo(member?.id, 100) || createId('member'),
    name: trimTo(member?.name, 120),
    address: trimTo(member?.address, 160),
    unit: trimTo(member?.unit, 160),
    email: trimTo(member?.email, 200),
    phone: trimTo(member?.phone, 60),
    voteWeight: Number.isFinite(voteWeight) ? Math.max(0, Math.floor(voteWeight)) : 1,
    emailConsent: Boolean(member?.emailConsent),
    preferredDistribution: PREFERRED_DISTRIBUTIONS.has(member?.preferredDistribution) ? member.preferredDistribution : 'paper',
    ownershipType: OWNERSHIP_TYPES.has(member?.ownershipType) ? member.ownershipType : 'single',
    distributionStatus: DISTRIBUTION_STATUSES.has(member?.distributionStatus) ? member.distributionStatus : 'draft',
    rsvpStatus: RSVP_STATUSES.has(member?.rsvpStatus) ? member.rsvpStatus : 'pending',
    attendanceStatus: ATTENDANCE_STATUSES.has(member?.attendanceStatus) ? member.attendanceStatus : 'unchecked',
    proxyHolder: trimTo(member?.proxyHolder, 120),
    proxyDocument: trimTo(member?.proxyDocument, 200),
    notes: trimTo(member?.notes, 500)
  };
}

function validateInvitationPayload(body) {
  const subject = trimTo(body?.subject, 200);
  const message = trimTo(body?.message, 5000);
  const recipients = Array.isArray(body?.recipients) ? body.recipients.map(sanitizeRecipient) : [];
  const meeting = {
    title: trimTo(body?.meeting?.title, 160),
    date: trimTo(body?.meeting?.date, 40),
    dateLabel: trimTo(body?.meeting?.dateLabel, 120),
    location: trimTo(body?.meeting?.location, 200),
    agenda: trimTo(body?.meeting?.agenda, 3000),
    distributionMethod: trimTo(body?.meeting?.distributionMethod, 40)
  };

  if (!subject || !message) {
    return { error: 'Ämne och meddelande krävs.' };
  }

  if (recipients.length === 0) {
    return { error: 'Minst en mottagare krävs.' };
  }

  const invalidRecipient = recipients.find((recipient) => !recipient.email || !isValidEmail(recipient.email));
  if (invalidRecipient) {
    return { error: `Ogiltig e-postadress för mottagare: ${invalidRecipient.name || invalidRecipient.email || 'okänd mottagare'}.` };
  }

  return { subject, message, recipients, meeting };
}

function sanitizeRecipient(recipient) {
  return {
    id: trimTo(recipient?.id, 100),
    name: trimTo(recipient?.name, 120),
    email: trimTo(recipient?.email, 200),
    unit: trimTo(recipient?.unit, 120)
  };
}

function buildInvitationHtml(message, meeting, recipient) {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <p>Hej ${escapeHtml(recipient.name || '')},</p>
      <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
      <hr>
      <p><strong>Stämma:</strong> ${escapeHtml(meeting?.title || 'Ordinarie föreningsstämma')}</p>
      <p><strong>Datum:</strong> ${escapeHtml(meeting?.dateLabel || meeting?.date || '')}</p>
      <p><strong>Plats:</strong> ${escapeHtml(meeting?.location || '')}</p>
    </div>
  `;
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function trimTo(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}
