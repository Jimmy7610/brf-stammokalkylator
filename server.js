const fs = require('fs');
const path = require('path');
const express = require('express');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
app.set('etag', false);
const port = Number(process.env.PORT || 4173);
const requestLog = new Map();
const dataDir = path.join(__dirname, 'data');
const appStatePath = path.join(dataDir, 'app-state.json');

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  next();
});

app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname, {
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
    } else if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    } else if (filePath.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
  }
}));

function rateLimit(req, res, next) {
  const key = `${req.ip}:${req.path}`;
  const now = Date.now();
  const entry = requestLog.get(key) || { count: 0, expiresAt: now + RATE_LIMIT_WINDOW_MS };

  if (now > entry.expiresAt) {
    entry.count = 0;
    entry.expiresAt = now + RATE_LIMIT_WINDOW_MS;
  }

  entry.count += 1;
  requestLog.set(key, entry);

  if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({ error: 'För många förfrågningar. Försök igen om en stund.' });
  }

  return next();
}

function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error('SMTP saknar konfiguration. Fyll i SMTP_HOST, SMTP_PORT, SMTP_USER och SMTP_PASS i .env.');
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: String(SMTP_SECURE).toLowerCase() === 'true',
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });
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

function trimTo(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

function sanitizeRecipient(recipient) {
  return {
    id: trimTo(recipient?.id, 100),
    name: trimTo(recipient?.name, 120),
    email: trimTo(recipient?.email, 200),
    unit: trimTo(recipient?.unit, 120)
  };
}

function ensureDataFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(appStatePath)) {
    fs.writeFileSync(appStatePath, JSON.stringify({
      meetingTitle: '',
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
    }, null, 2));
  }
}

function readAppState() {
  ensureDataFile();
  const raw = fs.readFileSync(appStatePath, 'utf8');
  return JSON.parse(raw);
}

function writeAppState(state) {
  ensureDataFile();
  fs.writeFileSync(appStatePath, JSON.stringify(state, null, 2), 'utf8');
}

function sanitizeMember(member) {
  const distributionStatuses = new Set(['draft', 'scheduled', 'sent', 'opened']);
  const rsvpStatuses = new Set(['pending', 'attending', 'not_attending', 'proxy']);
  const attendanceStatuses = new Set(['unchecked', 'present', 'proxy', 'absent']);
  const preferredDistributionValues = new Set(['paper', 'email', 'both']);
  const ownershipTypes = new Set(['single', 'co_owner', 'representative']);

  const voteWeight = Number(member?.voteWeight);

  return {
    id: trimTo(member?.id, 100) || `member-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    name: trimTo(member?.name, 120),
    address: trimTo(member?.address, 160),
    unit: trimTo(member?.unit, 160),
    email: trimTo(member?.email, 200),
    phone: trimTo(member?.phone, 60),
    voteWeight: Number.isFinite(voteWeight) ? Math.max(0, Math.floor(voteWeight)) : 1,
    emailConsent: Boolean(member?.emailConsent),
    preferredDistribution: preferredDistributionValues.has(member?.preferredDistribution) ? member.preferredDistribution : 'paper',
    ownershipType: ownershipTypes.has(member?.ownershipType) ? member.ownershipType : 'single',
    distributionStatus: distributionStatuses.has(member?.distributionStatus) ? member.distributionStatus : 'draft',
    rsvpStatus: rsvpStatuses.has(member?.rsvpStatus) ? member.rsvpStatus : 'pending',
    attendanceStatus: attendanceStatuses.has(member?.attendanceStatus) ? member.attendanceStatus : 'unchecked',
    proxyHolder: trimTo(member?.proxyHolder, 120),
    proxyDocument: trimTo(member?.proxyDocument, 200),
    notes: trimTo(member?.notes, 500)
  };
}

function sanitizeAdminState(body) {
  const members = Array.isArray(body?.members) ? body.members.map(sanitizeMember) : [];
  const distributionMethods = new Set(['email', 'letterbox', 'post', 'portal']);
  const meetings = Array.isArray(body?.meetings)
    ? body.meetings.map((meeting) => ({
      id: trimTo(meeting?.id, 100) || `meeting-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
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
      distributionMethod: distributionMethods.has(meeting?.distributionMethod) ? meeting.distributionMethod : 'email',
      emailSubject: trimTo(meeting?.emailSubject, 200),
      emailMessage: trimTo(meeting?.emailMessage, 5000),
      memberStates: typeof meeting?.memberStates === 'object' && meeting.memberStates !== null ? meeting.memberStates : {}
    }))
    : [];

  return {
    meetingTitle: trimTo(body?.meetingTitle, 160),
    meetingType: ['annual', 'extra', 'information'].includes(body?.meetingType) ? body.meetingType : 'annual',
    meetingLocation: trimTo(body?.meetingLocation, 200),
    meetingFormat: ['physical', 'hybrid', 'digital'].includes(body?.meetingFormat) ? body.meetingFormat : 'physical',
    meetingStatus: ['planning', 'ready_for_call', 'called', 'completed'].includes(body?.meetingStatus) ? body.meetingStatus : 'planning',
    meetingAgenda: trimTo(body?.meetingAgenda, 3000),
    meetingSpecialMatters: trimTo(body?.meetingSpecialMatters, 3000),
    meetingPaperRequired: Boolean(body?.meetingPaperRequired),
    distributionMethod: distributionMethods.has(body?.distributionMethod) ? body.distributionMethod : 'email',
    emailSubject: trimTo(body?.emailSubject, 200),
    emailMessage: trimTo(body?.emailMessage, 5000),
    activeMeetingId: trimTo(body?.activeMeetingId, 100),
    meetings,
    members
  };
}

function validatePayload(body) {
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

app.get('/api/admin-state', rateLimit, (req, res) => {
  try {
    const state = readAppState();
    return res.json({ state });
  } catch (error) {
    return res.status(500).json({ error: 'Kunde inte läsa sparad appdata.' });
  }
});

app.put('/api/admin-state', rateLimit, (req, res) => {
  try {
    const state = sanitizeAdminState(req.body);
    writeAppState(state);
    return res.json({ state });
  } catch (error) {
    return res.status(500).json({ error: 'Kunde inte spara appdata.' });
  }
});

app.post('/api/send-invitations', rateLimit, async (req, res) => {
  const validated = validatePayload(req.body);
  if (validated.error) {
    return res.status(400).json({ error: validated.error });
  }

  const {
    subject,
    message,
    recipients,
    meeting
  } = validated;

  let transporter;
  try {
    transporter = getTransporter();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const sent = [];
  const failed = [];

  for (const recipient of recipients) {
    const html = `
      <div style="font-family: Arial, sans-serif; line-height:1.5;">
        <p>Hej ${escapeHtml(recipient.name || '')},</p>
        <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
        <hr>
        <p><strong>Stämma:</strong> ${escapeHtml(meeting?.title || 'Ordinarie föreningsstämma')}</p>
        <p><strong>Datum:</strong> ${escapeHtml(meeting?.dateLabel || meeting?.date || '')}</p>
        <p><strong>Plats:</strong> ${escapeHtml(meeting?.location || '')}</p>
      </div>
    `;

    try {
      await transporter.sendMail({
        from,
        to: recipient.email,
        subject,
        text: `Hej ${recipient.name || ''},\n\n${message}\n`,
        html
      });
      sent.push({ id: recipient.id, email: recipient.email });
    } catch (error) {
      failed.push({ id: recipient.id, email: recipient.email, error: error.message });
    }
  }

  if (sent.length === 0) {
    return res.status(502).json({ error: failed[0]?.error || 'Inga mejl kunde skickas.', failed });
  }

  return res.json({ sent, failed });
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`BRF-stammokalkylatorn kör på http://127.0.0.1:${port}`);
});
