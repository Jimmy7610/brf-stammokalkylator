document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'brf-hjalpen-admin-v3';
  const LEGACY_STORAGE_KEYS = [
    'brf-stammokalkylator-admin-v1',
    'brf-stammokalkylator-admin-v2',
    'brf-hjalpen-admin-v1',
    'brf-hjalpen-admin-v2'
  ];
  const RELEASE_RESET_KEY = 'brf-hjalpen-release-reset-20260323';

  const DISTRIBUTION_OPTIONS = [
    { value: 'draft', label: 'Ej skickad' },
    { value: 'scheduled', label: 'Planerad' },
    { value: 'sent', label: 'Skickad' },
    { value: 'opened', label: 'Öppnad' }
  ];

  const RSVP_OPTIONS = [
    { value: 'pending', label: 'Inväntar svar' },
    { value: 'attending', label: 'Kommer' },
    { value: 'not_attending', label: 'Kommer inte' },
    { value: 'proxy', label: 'Kommer via ombud' }
  ];

  const ATTENDANCE_OPTIONS = [
    { value: 'unchecked', label: 'Ej incheckad' },
    { value: 'present', label: 'Närvarande' },
    { value: 'proxy', label: 'Närvarande via ombud' },
    { value: 'absent', label: 'Frånvarande' }
  ];

  const DISTRIBUTION_METHOD_LABELS = {
    email: 'E-post',
    letterbox: 'Brevlåda eller postfack',
    post: 'Post',
    portal: 'Portal eller webbplats'
  };

  function createId() {
    return `member-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  }

  function createMember(overrides = {}) {
    return {
      id: overrides.id || createId(),
      name: overrides.name || '',
      address: overrides.address || '',
      unit: overrides.unit || '',
      email: overrides.email || '',
      phone: overrides.phone || '',
      voteWeight: Number.isFinite(Number(overrides.voteWeight)) ? Number(overrides.voteWeight) : 1,
      emailConsent: overrides.emailConsent !== false,
      preferredDistribution: overrides.preferredDistribution || 'paper',
      ownershipType: overrides.ownershipType || 'single',
      distributionStatus: overrides.distributionStatus || 'draft',
      rsvpStatus: overrides.rsvpStatus || 'pending',
      attendanceStatus: overrides.attendanceStatus || 'unchecked',
      proxyHolder: overrides.proxyHolder || '',
      proxyDocument: overrides.proxyDocument || '',
      notes: overrides.notes || ''
    };
  }

  function createMeetingRecord(overrides = {}) {
    return {
      id: overrides.id || `meeting-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      title: overrides.title || '',
      type: overrides.type || 'annual',
      date: overrides.date || '',
      callRule: overrides.callRule || '4v',
      location: overrides.location || '',
      format: overrides.format || 'physical',
      status: overrides.status || 'planning',
      agenda: overrides.agenda || '',
      specialMatters: overrides.specialMatters || '',
      paperRequired: Boolean(overrides.paperRequired),
      distributionMethod: overrides.distributionMethod || 'email',
      emailSubject: overrides.emailSubject || '',
      emailMessage: overrides.emailMessage || '',
      memberStates: overrides.memberStates || {}
    };
  }

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

  function clearLegacyLocalState() {
    if (!localStorage.getItem(RELEASE_RESET_KEY)) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(RELEASE_RESET_KEY, 'done');
    }

    LEGACY_STORAGE_KEYS.forEach((key) => {
      if (key !== STORAGE_KEY) {
        localStorage.removeItem(key);
      }
    });
  }

  function resetMeetingFields(state) {
    state.meetingTitle = '';
    state.meetingDate = '';
    state.callRule = '4v';
    state.meetingType = 'annual';
    state.meetingLocation = '';
    state.meetingFormat = 'physical';
    state.meetingStatus = 'planning';
    state.meetingAgenda = '';
    state.meetingSpecialMatters = '';
    state.meetingPaperRequired = false;
    state.distributionMethod = 'email';
    state.emailSubject = '';
    state.emailMessage = '';
  }

  const form = document.getElementById('calc-form');
  const meetingDateInput = document.getElementById('meeting-date');
  const kallelseRegelRadios = document.getElementsByName('kallelse-regel');
  const resultsContainer = document.getElementById('results-container');
  const resultsList = document.getElementById('results-list');
  const planningList = document.getElementById('planning-list');
  const weekendWarning = document.getElementById('weekend-warning');
  const extraWarning = document.getElementById('extra-warning');
  const btnCopy = document.getElementById('btn-copy');
  const btnCopyAdmin = document.getElementById('btn-copy-admin');
  const popover = document.getElementById('popover');
  const modalHelp = document.getElementById('modal-help');
  const btnHelp = document.getElementById('btn-help');
  const btnCloseHelp = document.getElementById('btn-close-help');
  const btnShowSources = document.getElementById('btn-show-sources');
  const linkSources = document.getElementById('link-sources');
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  const iconMoon = document.getElementById('icon-moon');
  const iconSun = document.getElementById('icon-sun');
  const landingScreen = document.getElementById('landing-screen');
  const btnEnterApp = document.getElementById('btn-enter-app');
  const appShell = document.getElementById('app-shell');
  const navLinks = document.querySelectorAll('.nav-link');
  const appViews = document.querySelectorAll('.app-view');
  const quickViewButtons = document.querySelectorAll('[data-open-view]');
  const meetingAdmin = document.getElementById('meeting-admin');
  const meetingTitleInput = document.getElementById('meeting-title');
  const meetingTypeInput = document.getElementById('meeting-type');
  const meetingLocationInput = document.getElementById('meeting-location');
  const meetingFormatInput = document.getElementById('meeting-format');
  const meetingStatusInput = document.getElementById('meeting-status');
  const meetingAgendaInput = document.getElementById('meeting-agenda');
  const meetingSpecialMattersInput = document.getElementById('meeting-special-matters');
  const meetingPaperRequiredInput = document.getElementById('meeting-paper-required');
  const distributionMethodSelect = document.getElementById('distribution-method');
  const memberForm = document.getElementById('member-form');
  const memberNameInput = document.getElementById('member-name');
  const memberAddressInput = document.getElementById('member-address');
  const memberUnitInput = document.getElementById('member-unit');
  const memberEmailInput = document.getElementById('member-email');
  const memberPhoneInput = document.getElementById('member-phone');
  const memberVoteWeightInput = document.getElementById('member-vote-weight');
  const memberDistributionInput = document.getElementById('member-distribution');
  const memberOwnershipInput = document.getElementById('member-ownership');
  const memberEmailConsentInput = document.getElementById('member-email-consent');
  const memberList = document.getElementById('member-list');
  const adminSummary = document.getElementById('admin-summary');
  const meetingChecklist = document.getElementById('meeting-checklist');
  const voteRollSummary = document.getElementById('vote-roll-summary');
  const voteRollList = document.getElementById('vote-roll-list');
  const csvFileInput = document.getElementById('csv-file-input');
  const btnImportCsv = document.getElementById('btn-import-csv');
  const btnExportCsv = document.getElementById('btn-export-csv');
  const btnExportVoteRoll = document.getElementById('btn-export-voteroll');
  const csvStatus = document.getElementById('csv-status');
  const emailSubjectInput = document.getElementById('email-subject');
  const emailMessageInput = document.getElementById('email-message');
  const btnSendEmail = document.getElementById('btn-send-email');
  const btnPreviewEmail = document.getElementById('btn-preview-email');
  const emailPreview = document.getElementById('email-preview');
  const emailStatus = document.getElementById('email-status');
  const btnPreviewPaperCall = document.getElementById('btn-preview-paper-call');
  const btnPrintPaperCall = document.getElementById('btn-print-paper-call');
  const paperCallPreview = document.getElementById('paper-call-preview');
  const paperCallStatus = document.getElementById('paper-call-status');
  const overviewNextMeeting = document.getElementById('overview-next-meeting');
  const overviewNextDeadline = document.getElementById('overview-next-deadline');
  const overviewStats = document.getElementById('overview-stats');
  const overviewChecklist = document.getElementById('overview-checklist');
  const meetingList = document.getElementById('meeting-list');
  const btnAddMeeting = document.getElementById('btn-add-meeting');
  const memberModuleSummary = document.getElementById('member-module-summary');
  const memberModuleChecklist = document.getElementById('member-module-checklist');
  const distributionModuleSummary = document.getElementById('distribution-module-summary');
  const distributionModuleChecklist = document.getElementById('distribution-module-checklist');
  const attendanceModuleSummary = document.getElementById('attendance-module-summary');
  const attendanceModuleChecklist = document.getElementById('attendance-module-checklist');

  clearLegacyLocalState();

  let adminState = loadAdminState();
  let saveTimeoutId = null;
  let serverSyncEnabled = true;

  function loadAdminState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(DEFAULT_ADMIN_STATE);
      const parsed = JSON.parse(raw);
      const state = {
        meetingTitle: parsed.meetingTitle || '',
        meetingDate: parsed.meetingDate || '',
        callRule: parsed.callRule || '4v',
        meetingType: parsed.meetingType || 'annual',
        meetingLocation: parsed.meetingLocation || '',
        meetingFormat: parsed.meetingFormat || 'physical',
        meetingStatus: parsed.meetingStatus || 'planning',
        meetingAgenda: parsed.meetingAgenda || '',
        meetingSpecialMatters: parsed.meetingSpecialMatters || '',
        meetingPaperRequired: Boolean(parsed.meetingPaperRequired),
        distributionMethod: parsed.distributionMethod || 'email',
        emailSubject: parsed.emailSubject || '',
        emailMessage: parsed.emailMessage || '',
        activeMeetingId: parsed.activeMeetingId || '',
        meetings: Array.isArray(parsed.meetings) ? parsed.meetings.map((meeting) => createMeetingRecord(meeting)) : [],
        members: Array.isArray(parsed.members)
          ? parsed.members.map((member) => createMember(member))
          : []
      };
      return ensureMeetingCollection(state);
    } catch (error) {
      console.error('Kunde inte läsa adminläge från localStorage:', error);
      return structuredClone(DEFAULT_ADMIN_STATE);
    }
  }

  function persistAdminState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(adminState));
    scheduleServerSync();
  }

  function ensureMeetingCollection(state) {
    if (!Array.isArray(state.meetings) || state.meetings.length === 0) {
      state.meetings = [];
      state.activeMeetingId = '';
      resetMeetingFields(state);
      return state;
    }

    if (!state.activeMeetingId || !state.meetings.some((meeting) => meeting.id === state.activeMeetingId)) {
      state.activeMeetingId = state.meetings[0].id;
    }

    syncStateFromActiveMeeting(state);
    return state;
  }

  function getActiveMeeting() {
    return adminState.meetings.find((meeting) => meeting.id === adminState.activeMeetingId) || adminState.meetings[0];
  }

  function createDefaultMeetingMemberState(member) {
    return {
      distributionStatus: member.distributionStatus || 'draft',
      rsvpStatus: member.rsvpStatus || 'pending',
      attendanceStatus: member.attendanceStatus || 'unchecked',
      proxyHolder: member.proxyHolder || '',
      proxyDocument: member.proxyDocument || ''
    };
  }

  function ensureMeetingMemberState(meeting, member) {
    if (!meeting.memberStates) {
      meeting.memberStates = {};
    }

    if (!meeting.memberStates[member.id]) {
      meeting.memberStates[member.id] = createDefaultMeetingMemberState(member);
    }

    return meeting.memberStates[member.id];
  }

  function getActiveMeetingMemberState(member) {
    const activeMeeting = getActiveMeeting();
    if (!activeMeeting) return createDefaultMeetingMemberState(member);
    return ensureMeetingMemberState(activeMeeting, member);
  }

  function updateActiveMeetingMemberField(memberId, field, value) {
    adminState.meetings = adminState.meetings.map((meeting) => {
      if (meeting.id !== adminState.activeMeetingId) return meeting;
      const current = meeting.memberStates?.[memberId] || createDefaultMeetingMemberState({});
      return {
        ...meeting,
        memberStates: {
          ...(meeting.memberStates || {}),
          [memberId]: {
            ...current,
            [field]: value
          }
        }
      };
    });
    syncStateFromActiveMeeting();
  }

  function syncStateFromActiveMeeting(state = adminState) {
    const activeMeeting = state.meetings.find((meeting) => meeting.id === state.activeMeetingId) || state.meetings[0];
    if (!activeMeeting) return;

    state.activeMeetingId = activeMeeting.id;
    state.meetingTitle = activeMeeting.title;
    state.meetingType = activeMeeting.type;
    state.meetingDate = activeMeeting.date;
    state.callRule = activeMeeting.callRule;
    state.meetingLocation = activeMeeting.location;
    state.meetingFormat = activeMeeting.format;
    state.meetingStatus = activeMeeting.status;
    state.meetingAgenda = activeMeeting.agenda;
    state.meetingSpecialMatters = activeMeeting.specialMatters;
    state.meetingPaperRequired = activeMeeting.paperRequired;
    state.distributionMethod = activeMeeting.distributionMethod;
    state.emailSubject = activeMeeting.emailSubject;
    state.emailMessage = activeMeeting.emailMessage;
  }

  function updateActiveMeetingField(field, value) {
    adminState.meetings = adminState.meetings.map((meeting) => (
      meeting.id === adminState.activeMeetingId
        ? { ...meeting, [field]: value }
        : meeting
    ));
    syncStateFromActiveMeeting();
  }

  async function fetchAdminStateFromServer() {
    const response = await fetch('/api/admin-state', {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error('Kunde inte hämta sparad data från servern.');
    }

    const payload = await response.json();
    const state = payload?.state || {};

    return ensureMeetingCollection({
      meetingTitle: state.meetingTitle || '',
      meetingDate: state.meetingDate || '',
      callRule: state.callRule || '4v',
      meetingType: state.meetingType || 'annual',
      meetingLocation: state.meetingLocation || '',
      meetingFormat: state.meetingFormat || 'physical',
      meetingStatus: state.meetingStatus || 'planning',
      meetingAgenda: state.meetingAgenda || '',
      meetingSpecialMatters: state.meetingSpecialMatters || '',
      meetingPaperRequired: Boolean(state.meetingPaperRequired),
      distributionMethod: state.distributionMethod || 'email',
      emailSubject: state.emailSubject || '',
      emailMessage: state.emailMessage || '',
      activeMeetingId: state.activeMeetingId || '',
      meetings: Array.isArray(state.meetings) ? state.meetings.map((meeting) => createMeetingRecord(meeting)) : [],
      members: Array.isArray(state.members)
        ? state.members.map((member) => createMember(member))
        : []
    });
  }

  async function saveAdminStateToServer() {
    if (!serverSyncEnabled) return;

    const response = await fetch('/api/admin-state', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(adminState)
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || 'Kunde inte spara data till servern.');
    }

    const payload = await response.json();
    if (payload?.state) {
      adminState = {
        ...adminState,
        ...payload.state,
        members: Array.isArray(payload.state.members)
          ? payload.state.members.map((member) => createMember(member))
          : adminState.members
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(adminState));
    }
  }

  function scheduleServerSync() {
    if (!serverSyncEnabled) return;
    window.clearTimeout(saveTimeoutId);
    saveTimeoutId = window.setTimeout(async () => {
      try {
        await saveAdminStateToServer();
      } catch (error) {
        console.error('Kunde inte synka till servern:', error);
      }
    }, 500);
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      iconMoon.classList.add('hidden');
      iconSun.classList.remove('hidden');
    } else {
      iconMoon.classList.remove('hidden');
      iconSun.classList.add('hidden');
    }
  }

  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  setTheme(savedTheme === 'dark' || (!savedTheme && prefersDark) ? 'dark' : 'light');

  btnThemeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  });

  if (landingScreen && appShell && appShell.classList.contains('hidden')) {
    document.body.classList.add('landing-active');
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }

  function enterApp() {
    if (!landingScreen || !appShell) return;
    landingScreen.classList.add('is-leaving');
    appShell.classList.remove('hidden');
    document.body.classList.remove('landing-active');
    setActiveView('overview');
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    window.setTimeout(() => {
      landingScreen.classList.add('hidden');
      landingScreen.classList.remove('is-leaving');
    }, 260);
  }

  if (btnEnterApp) {
    btnEnterApp.addEventListener('click', (event) => {
      event.stopPropagation();
      enterApp();
    });
  }

  if (landingScreen) {
    landingScreen.addEventListener('click', enterApp);
    landingScreen.addEventListener('touchend', enterApp, { passive: true });
  }

  function setActiveView(viewName) {
    appViews.forEach((view) => {
      view.classList.toggle('is-active', view.dataset.view === viewName);
    });

    navLinks.forEach((link) => {
      link.classList.toggle('is-active', link.dataset.viewTarget === viewName);
    });
  }

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      setActiveView(link.dataset.viewTarget);
    });
  });

  quickViewButtons.forEach((button) => {
    button.addEventListener('click', () => {
      setActiveView(button.dataset.openView);
    });
  });

  function getFormValues() {
    return {
      dateStr: meetingDateInput.value,
      regel: document.querySelector('input[name="kallelse-regel"]:checked').value
    };
  }

  function createDateAtNoon(dateString) {
    if (!dateString) return null;
    const [year, month, day] = dateString.split('-');
    return new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0);
  }

  function subtractWeeks(date, weeks) {
    const result = new Date(date);
    result.setDate(result.getDate() - weeks * 7);
    return result;
  }

  function isWeekend(date) {
    const day = date.getDay();
    return day === 0 || day === 6;
  }

  const dateFormatter = new Intl.DateTimeFormat('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'long'
  });

  function formatSwedishDate(date) {
    const parts = dateFormatter.formatToParts(date);
    const values = {};
    parts.forEach((part) => {
      values[part.type] = part.value;
    });
    return `${values.year}-${values.month}-${values.day} (${values.weekday})`;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function handleCalculate() {
    const { dateStr, regel } = getFormValues();
    meetingDateInput.parentElement.classList.remove('has-error');

    if (!dateStr) {
      resultsContainer.classList.add('hidden');
      renderAdminPanel();
      renderOverview();
      return;
    }

    const meetingDate = createDateAtNoon(dateStr);
    resultsContainer.classList.remove('hidden');
    if (extraWarning) extraWarning.classList.add('hidden');

    const results = [];
    const planning = [];
    let hasWeekendDeadline = false;

    const earliestCall = subtractWeeks(meetingDate, 6);
    results.push({
      label: 'Kallelse - tidigast',
      date: earliestCall,
      explainer: 'Kallelsen får enligt lag utfärdas tidigast sex veckor före stämman.',
      meaning: 'Ni får inte skicka kallelsen före detta datum.',
      sourceHtml: '<a href="https://lagen.nu/2018:672#K6P17S1" target="_blank" rel="noopener">EFL 6 kap. 17 §</a>, <a href="https://lagen.nu/1991:614#K9P14S1" target="_blank" rel="noopener">BRL 9 kap. 14 §</a>'
    });

    const latestCall = subtractWeeks(meetingDate, regel === '4v' ? 4 : 2);
    if (isWeekend(latestCall)) hasWeekendDeadline = true;
    results.push({
      label: 'Kallelse - senast',
      date: latestCall,
      explainer: regel === '4v'
        ? 'Huvudregeln är att kallelsen ska vara utskickad senast fyra veckor före stämman.'
        : 'Era stadgar tillåter att kallelsen utfärdas senast två veckor före stämman.',
      meaning: 'Kallelsen måste vara utskickad senast detta datum om inte stadgarna säger annat.',
      sourceHtml: '<a href="https://lagen.nu/2018:672#K6P17S1" target="_blank" rel="noopener">EFL 6 kap. 17 §</a>, <a href="https://lagen.nu/1991:614#K9P14S1" target="_blank" rel="noopener">BRL 9 kap. 14 §</a>'
    });

    const documentsDate = subtractWeeks(meetingDate, 2);
    if (isWeekend(documentsDate)) hasWeekendDeadline = true;
    results.push({
      label: 'Handlingar senast tillgängliga',
      date: documentsDate,
      explainer: 'Redovisningshandlingar och eventuell revisionsberättelse ska hållas tillgängliga för medlemmarna under minst två veckor före årsstämman.',
      meaning: 'Handlingarna ska kunna läsas från detta datum.',
      sourceHtml: '<a href="https://lagen.nu/2018:672#K6P23S1" target="_blank" rel="noopener">EFL 6 kap. 23 §</a>'
    });

    planning.push({
      label: 'Valberedning - rekommenderad sista dag för förslag',
      date: subtractWeeks(meetingDate, 8),
      explainer: 'Vanligt arbetssätt för att valberedningen ska hinna arbeta innan kallelsen går ut.',
      sourceHtml: '<a href="https://www.bostadsratterna.se/kunskapsbanken" target="_blank" rel="noopener">Praxis via Bostadsrätterna</a>'
    });

    planning.push({
      label: 'Årsredovisning till revisor',
      date: subtractWeeks(meetingDate, 6),
      explainer: 'Vanlig planeringspunkt för att revisorn ska hinna arbeta i god tid före kallelse.',
      sourceHtml: '<a href="https://www.bostadsratterna.se/kunskapsbanken" target="_blank" rel="noopener">Praxis via Bostadsrätterna</a>'
    });

    planning.push({
      label: 'Revisionsberättelse tillbaka',
      date: subtractWeeks(meetingDate, 3),
      explainer: 'Planera så att revisionsberättelsen hinner in innan handlingarna ska vara tillgängliga.',
      sourceHtml: '<a href="https://www.bostadsratterna.se/kunskapsbanken" target="_blank" rel="noopener">Praxis via Bostadsrätterna</a>'
    });

    weekendWarning.classList.toggle('hidden', !hasWeekendDeadline);
    renderResults(resultsList, results);
    renderResults(planningList, planning, false);
    renderAdminPanel();
    renderOverview();
  }

  function renderResults(container, items, isMain = true) {
    container.innerHTML = isMain ? '' : '<h3>Praktisk planering (praxis)</h3>';
    items.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'result-row';
      if (isWeekend(item.date)) row.classList.add('is-weekend');
      row.innerHTML = `
        <div class="result-header-group">
          <div class="result-label">
            ${escapeHtml(item.label)}
            <button type="button" class="info-btn" aria-label="Information om ${escapeHtml(item.label)}" data-info="${escapeHtml(item.meaning || item.explainer)}">i</button>
          </div>
          <div class="result-date">${formatSwedishDate(item.date)}</div>
        </div>
        <div class="result-explainer"><strong>Varför?</strong> ${escapeHtml(item.explainer)}</div>
        <div class="result-sources"><strong>Källa:</strong> ${item.sourceHtml}</div>
      `;
      container.appendChild(row);
    });
    attachPopoverListeners(container);
  }

  function attachPopoverListeners(rootNode) {
    rootNode.querySelectorAll('.info-btn').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        const text = button.getAttribute('data-info');
        if (popover.classList.contains('hidden') || popover.innerText !== text) {
          popover.innerText = text;
          popover.classList.remove('hidden');
          const rect = button.getBoundingClientRect();
          popover.style.top = `${rect.bottom + window.scrollY + 8}px`;
          popover.style.left = `${Math.max(10, rect.left + window.scrollX - 100)}px`;
        } else {
          popover.classList.add('hidden');
        }
      });
    });
  }

  document.addEventListener('click', (event) => {
    if (!event.target.classList.contains('info-btn') && !popover.classList.contains('hidden')) {
      popover.classList.add('hidden');
    }
  });

  function openModal() {
    btnHelp.setAttribute('aria-expanded', 'true');
    modalHelp.showModal();
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    btnHelp.setAttribute('aria-expanded', 'false');
    modalHelp.close();
    document.body.style.overflow = '';
  }

  btnHelp.addEventListener('click', () => {
    if (modalHelp.open) {
      closeModal();
      return;
    }
    openModal();
  });
  btnCloseHelp.addEventListener('click', closeModal);

  modalHelp.addEventListener('click', (event) => {
    const dimensions = modalHelp.getBoundingClientRect();
    if (
      event.clientX < dimensions.left ||
      event.clientX > dimensions.right ||
      event.clientY < dimensions.top ||
      event.clientY > dimensions.bottom
    ) {
      closeModal();
    }
  });

  modalHelp.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeModal();
  });

  [btnShowSources, linkSources].forEach((button) => {
    if (!button) return;
    button.addEventListener('click', (event) => {
      event.preventDefault();
      openModal();
      setTimeout(() => {
        document.getElementById('sources-section').scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });
  });

  async function writeToClipboard(text, button) {
    try {
      await navigator.clipboard.writeText(text);
      const original = button.innerText;
      button.innerText = 'Kopierat!';
      setTimeout(() => {
        button.innerText = original;
      }, 2500);
    } catch (error) {
      console.error('Kunde inte kopiera:', error);
      alert('Kopiering misslyckades.');
    }
  }

  btnCopy.addEventListener('click', async () => {
    const { dateStr } = getFormValues();
    if (!dateStr) return;
    const lines = [
      `Datum för föreningsstämman: ${formatSwedishDate(createDateAtNoon(dateStr))}`,
      'Typ: Ordinarie föreningsstämma',
      '',
      'Hålltider:'
    ];
    document.querySelectorAll('#results-container .result-row').forEach((row) => {
      const label = row.querySelector('.result-label').innerText.replace('i', '').trim();
      const date = row.querySelector('.result-date').innerText.trim();
      lines.push(`- ${label}: ${date}`);
    });
    lines.push('', 'Observera: Kontrollera alltid lag och stadgar.');
    writeToClipboard(lines.join('\n'), btnCopy);
  });

  btnCopyAdmin.addEventListener('click', async () => {
    const summary = buildSummary();
    const voteRoll = buildVoteRoll();
    const lines = [
      `Stämma: ${adminState.meetingTitle || 'Ordinarie föreningsstämma'}`,
      `Plats: ${adminState.meetingLocation || 'Ej angiven'}`,
      `Distributionskanal: ${DISTRIBUTION_METHOD_LABELS[adminState.distributionMethod]}`,
      '',
      `Medlemmar: ${summary.totalMembers}`,
      `Utskick markerade som skickade eller öppnade: ${summary.sentCount}`,
      `Svarat kommer: ${summary.attendingCount}`,
      `Svarat via ombud: ${summary.proxyCount}`,
      `Närvarande eller via ombud: ${summary.checkedInCount}`,
      `Röster på stämman: ${voteRoll.totalVotes}`,
      '',
      'Röstlängd:'
    ];
    voteRoll.rows.forEach((row) => {
      lines.push(`- ${row.memberName}: ${row.representedBy} | röster ${row.voteWeight} | status ${row.statusLabel}`);
    });
    writeToClipboard(lines.join('\n'), btnCopyAdmin);
  });

  function buildSummary() {
    const totalMembers = adminState.members.length;
    const sentCount = adminState.members.filter((member) => ['sent', 'opened'].includes(getActiveMeetingMemberState(member).distributionStatus)).length;
    const openedCount = adminState.members.filter((member) => getActiveMeetingMemberState(member).distributionStatus === 'opened').length;
    const attendingCount = adminState.members.filter((member) => getActiveMeetingMemberState(member).rsvpStatus === 'attending').length;
    const proxyCount = adminState.members.filter((member) => getActiveMeetingMemberState(member).rsvpStatus === 'proxy').length;
    const checkedInCount = adminState.members.filter((member) => ['present', 'proxy'].includes(getActiveMeetingMemberState(member).attendanceStatus)).length;
    return { totalMembers, sentCount, openedCount, attendingCount, proxyCount, checkedInCount };
  }

  function buildVoteRoll() {
    const rows = adminState.members
      .filter((member) => {
        const state = getActiveMeetingMemberState(member);
        return ['present', 'proxy'].includes(state.attendanceStatus) || state.rsvpStatus === 'proxy';
      })
      .map((member) => ({
        memberName: member.name,
        unit: member.unit,
        voteWeight: Number(member.voteWeight) || 0,
        representedBy: (() => {
          const state = getActiveMeetingMemberState(member);
          return state.attendanceStatus === 'proxy' || state.rsvpStatus === 'proxy'
            ? state.proxyHolder || 'Ombud ej angivet'
            : member.name;
        })(),
        proxyDocument: getActiveMeetingMemberState(member).proxyDocument || '',
        statusLabel: labelForOption(ATTENDANCE_OPTIONS, getActiveMeetingMemberState(member).attendanceStatus)
      }));

    const totalVotes = rows.reduce((sum, row) => sum + row.voteWeight, 0);
    return { rows, totalVotes };
  }

  function renderAdminPanel() {
    const { dateStr, regel } = getFormValues();
    const summary = buildSummary();
    const latestCall = dateStr ? subtractWeeks(createDateAtNoon(dateStr), regel === '4v' ? 4 : 2) : null;
    adminSummary.innerHTML = [
      createSummaryCard('Medlemmar', summary.totalMembers),
      createSummaryCard('Skickade', `${summary.sentCount}/${summary.totalMembers || 0}`),
      createSummaryCard('Öppnade', summary.openedCount),
      createSummaryCard('Kommer', summary.attendingCount),
      createSummaryCard('Ombud', summary.proxyCount),
      createSummaryCard('Incheckade', summary.checkedInCount)
    ].join('');

    meetingChecklist.innerHTML = [
      latestCall
        ? `Säkerställ att kallelsen går ut senast ${formatSwedishDate(latestCall)} via ${DISTRIBUTION_METHOD_LABELS[adminState.distributionMethod].toLowerCase()}.`
        : 'Välj först ett stämmodatum under Datumhjälp för att få juridiska deadlines.',
      summary.sentCount < adminState.members.length
        ? `Det återstår ${adminState.members.length - summary.sentCount} medlem${adminState.members.length - summary.sentCount === 1 ? '' : 'mar'} utan markerat utskick.`
        : 'Alla medlemmar är markerade som skickade eller öppnade i distributionsflödet.',
      summary.attendingCount + summary.proxyCount > 0
        ? `${summary.attendingCount} kommer och ${summary.proxyCount} deltar via ombud.`
        : 'Inga deltagarsvar ännu. Följ upp med påminnelse före stämman.',
      'På stämmodagen kan kolumnen Check-in användas som enkel avprickning vid dörren.'
    ].map((item) => `<li>${escapeHtml(item)}</li>`).join('');

    renderMemberList();
    renderVoteRoll();
  }

  function renderMemberList() {
    if (adminState.members.length === 0) {
      memberList.innerHTML = '<div class="empty-state">Inga medlemmar ännu. Lägg till första personen eller importera en CSV-fil.</div>';
      return;
    }

    memberList.innerHTML = adminState.members.map((member) => `
      <article class="member-card" data-member-id="${member.id}">
        <div class="member-card-top">
          <div>
            <h4>${escapeHtml(member.name)}</h4>
            <p class="member-meta">
              ${escapeHtml([member.address, member.unit].filter(Boolean).join(', ') || 'Ingen adress eller lägenhet angiven')}
              ${member.email ? ` | ${escapeHtml(member.email)}` : ''}
              ${member.phone ? ` | ${escapeHtml(member.phone)}` : ''}
            </p>
          </div>
          <button type="button" class="btn-text btn-danger" data-action="delete-member" data-member-id="${member.id}">Ta bort</button>
        </div>
        <div class="member-status-grid">
          <label>Utskick${buildSelectHtml('distributionStatus', DISTRIBUTION_OPTIONS, getActiveMeetingMemberState(member).distributionStatus)}</label>
          <label>RSVP${buildSelectHtml('rsvpStatus', RSVP_OPTIONS, getActiveMeetingMemberState(member).rsvpStatus)}</label>
          <label>Check-in${buildSelectHtml('attendanceStatus', ATTENDANCE_OPTIONS, getActiveMeetingMemberState(member).attendanceStatus)}</label>
        </div>
        <div class="member-details-grid">
          <label>Adress
            <input type="text" data-field="address" value="${escapeHtml(member.address)}" placeholder="Adress">
          </label>
          <label>Lägenhet
            <input type="text" data-field="unit" value="${escapeHtml(member.unit)}" placeholder="Lägenhet">
          </label>
          <label>Telefon
            <input type="text" data-field="phone" value="${escapeHtml(member.phone)}" placeholder="Telefon">
          </label>
          <label>E-postsamtycke
            <select data-field="emailConsent">
              <option value="true"${member.emailConsent ? ' selected' : ''}>Ja</option>
              <option value="false"${member.emailConsent ? '' : ' selected'}>Nej</option>
            </select>
          </label>
          <label>Föredragen distribution
            <select data-field="preferredDistribution">
              <option value="paper"${member.preferredDistribution === 'paper' ? ' selected' : ''}>Papper</option>
              <option value="email"${member.preferredDistribution === 'email' ? ' selected' : ''}>E-post</option>
              <option value="both"${member.preferredDistribution === 'both' ? ' selected' : ''}>Både och</option>
            </select>
          </label>
          <label>Ägarform
            <select data-field="ownershipType">
              <option value="single"${member.ownershipType === 'single' ? ' selected' : ''}>Ensam ägare</option>
              <option value="co_owner"${member.ownershipType === 'co_owner' ? ' selected' : ''}>Delägare / samägande</option>
              <option value="representative"${member.ownershipType === 'representative' ? ' selected' : ''}>Kontaktperson för hushåll</option>
            </select>
          </label>
          <label>Röstvärde
            <input type="number" min="0" step="1" data-field="voteWeight" value="${escapeHtml(member.voteWeight)}">
          </label>
          <label>Ombud
            <input type="text" data-field="proxyHolder" value="${escapeHtml(getActiveMeetingMemberState(member).proxyHolder)}" placeholder="Namn på ombud">
          </label>
          <label>Fullmakt
            <input type="text" data-field="proxyDocument" value="${escapeHtml(getActiveMeetingMemberState(member).proxyDocument)}" placeholder="Exempel: mottagen 2026-05-12">
          </label>
        </div>
      </article>
    `).join('');
  }

  function renderMemberList() {
    if (adminState.members.length === 0) {
      memberList.innerHTML = '<div class="empty-state">Inga medlemmar ännu. Lägg till första personen eller importera en CSV-fil.</div>';
      return;
    }

    memberList.innerHTML = adminState.members.map((member) => {
      const state = getActiveMeetingMemberState(member);
      const ownershipLabel = member.ownershipType === 'co_owner'
        ? 'Delägare / samägande'
        : member.ownershipType === 'representative'
          ? 'Kontaktperson för hushåll'
          : 'Ensam ägare';

      return `
        <article class="member-card" data-member-id="${member.id}">
          <div class="member-card-top">
            <div>
              <h4>${escapeHtml(member.name)}</h4>
              <p class="member-meta">
                ${escapeHtml([member.address, member.unit].filter(Boolean).join(', ') || 'Ingen adress eller lägenhet angiven')}
                ${member.email ? ` | ${escapeHtml(member.email)}` : ''}
                ${member.phone ? ` | ${escapeHtml(member.phone)}` : ''}
              </p>
              <div class="member-badge-row">
                <span class="member-badge">${escapeHtml(labelForOption(DISTRIBUTION_OPTIONS, state.distributionStatus))}</span>
                <span class="member-badge">${escapeHtml(labelForOption(RSVP_OPTIONS, state.rsvpStatus))}</span>
                <span class="member-badge">${escapeHtml(labelForOption(ATTENDANCE_OPTIONS, state.attendanceStatus))}</span>
              </div>
            </div>
            <button type="button" class="btn-text btn-danger" data-action="delete-member" data-member-id="${member.id}">Ta bort</button>
          </div>

          <div class="member-card-summary">
            <div class="member-summary-item">
              <span class="member-summary-label">Distribution</span>
              <strong>${escapeHtml(DISTRIBUTION_METHOD_LABELS[member.preferredDistribution] || member.preferredDistribution || 'Ej valt')}</strong>
            </div>
            <div class="member-summary-item">
              <span class="member-summary-label">Ägarform</span>
              <strong>${escapeHtml(ownershipLabel)}</strong>
            </div>
            <div class="member-summary-item">
              <span class="member-summary-label">Röstvärde</span>
              <strong>${escapeHtml(String(Number(member.voteWeight) || 0))}</strong>
            </div>
            <div class="member-summary-item">
              <span class="member-summary-label">E-postsamtycke</span>
              <strong>${member.emailConsent ? 'Ja' : 'Nej'}</strong>
            </div>
          </div>

          <div class="member-status-grid">
            <label><span class="member-field-label">Utskick</span>${buildSelectHtml('distributionStatus', DISTRIBUTION_OPTIONS, state.distributionStatus)}</label>
            <label><span class="member-field-label">RSVP</span>${buildSelectHtml('rsvpStatus', RSVP_OPTIONS, state.rsvpStatus)}</label>
            <label><span class="member-field-label">Check-in</span>${buildSelectHtml('attendanceStatus', ATTENDANCE_OPTIONS, state.attendanceStatus)}</label>
          </div>

          <div class="member-details-grid">
            <label><span class="member-field-label">Adress</span>
              <input type="text" data-field="address" value="${escapeHtml(member.address)}" placeholder="Adress">
            </label>
            <label><span class="member-field-label">Lägenhet</span>
              <input type="text" data-field="unit" value="${escapeHtml(member.unit)}" placeholder="Lägenhet">
            </label>
            <label><span class="member-field-label">Telefon</span>
              <input type="text" data-field="phone" value="${escapeHtml(member.phone)}" placeholder="Telefon">
            </label>
            <label><span class="member-field-label">E-postsamtycke</span>
              <select data-field="emailConsent">
                <option value="true"${member.emailConsent ? ' selected' : ''}>Ja</option>
                <option value="false"${member.emailConsent ? '' : ' selected'}>Nej</option>
              </select>
            </label>
            <label><span class="member-field-label">Föredragen distribution</span>
              <select data-field="preferredDistribution">
                <option value="paper"${member.preferredDistribution === 'paper' ? ' selected' : ''}>Papper</option>
                <option value="email"${member.preferredDistribution === 'email' ? ' selected' : ''}>E-post</option>
                <option value="both"${member.preferredDistribution === 'both' ? ' selected' : ''}>Både och</option>
              </select>
            </label>
            <label><span class="member-field-label">Ägarform</span>
              <select data-field="ownershipType">
                <option value="single"${member.ownershipType === 'single' ? ' selected' : ''}>Ensam ägare</option>
                <option value="co_owner"${member.ownershipType === 'co_owner' ? ' selected' : ''}>Delägare / samägande</option>
                <option value="representative"${member.ownershipType === 'representative' ? ' selected' : ''}>Kontaktperson för hushåll</option>
              </select>
            </label>
            <label><span class="member-field-label">Röstvärde</span>
              <input type="number" min="0" step="1" data-field="voteWeight" value="${escapeHtml(member.voteWeight)}">
            </label>
            <label><span class="member-field-label">Ombud</span>
              <input type="text" data-field="proxyHolder" value="${escapeHtml(state.proxyHolder)}" placeholder="Namn på ombud">
            </label>
            <label><span class="member-field-label">Fullmakt</span>
              <input type="text" data-field="proxyDocument" value="${escapeHtml(state.proxyDocument)}" placeholder="Exempel: mottagen 2026-05-12">
            </label>
          </div>
        </article>
      `;
    }).join('');
  }

  function renderVoteRoll() {
    const voteRoll = buildVoteRoll();
    const proxyDocuments = voteRoll.rows.filter((row) => row.proxyDocument).length;

    voteRollSummary.innerHTML = [
      createSummaryCard('Röstberättigade på plats', voteRoll.rows.length),
      createSummaryCard('Totala röster', voteRoll.totalVotes),
      createSummaryCard('Fullmakter noterade', proxyDocuments)
    ].join('');

    if (voteRoll.rows.length === 0) {
      voteRollList.innerHTML = '<div class="empty-state">Ingen röstlängd ännu. Markera närvaro eller ombud på medlemmarna ovan.</div>';
      return;
    }

    voteRollList.innerHTML = `
      <div class="vote-roll-table">
        <div class="vote-roll-head">Medlem</div>
        <div class="vote-roll-head">Representeras av</div>
        <div class="vote-roll-head">Röster</div>
        <div class="vote-roll-head">Notering</div>
        ${voteRoll.rows.map((row) => `
          <div>${escapeHtml(row.memberName)}${row.unit ? ` (${escapeHtml(row.unit)})` : ''}</div>
          <div>${escapeHtml(row.representedBy)}</div>
          <div>${escapeHtml(row.voteWeight)}</div>
          <div>${escapeHtml(row.proxyDocument || row.statusLabel)}</div>
        `).join('')}
      </div>
    `;
  }

  function createSummaryCard(label, value) {
    return `<div class="summary-card"><span class="summary-value">${escapeHtml(value)}</span><span class="summary-label">${escapeHtml(label)}</span></div>`;
  }

  function buildSelectHtml(fieldName, options, selectedValue) {
    return `
      <select data-field="${fieldName}">
        ${options.map((option) => `<option value="${option.value}"${option.value === selectedValue ? ' selected' : ''}>${escapeHtml(option.label)}</option>`).join('')}
      </select>
    `;
  }

  function labelForOption(options, value) {
    const option = options.find((item) => item.value === value);
    return option ? option.label : value;
  }

  function updateMeetingInputsFromState() {
    meetingTitleInput.value = adminState.meetingTitle;
    meetingTypeInput.value = adminState.meetingType;
    meetingDateInput.value = adminState.meetingDate || '';
    const selectedRule = adminState.callRule || '4v';
    Array.from(kallelseRegelRadios).forEach((radio) => {
      radio.checked = radio.value === selectedRule;
    });
    meetingLocationInput.value = adminState.meetingLocation;
    meetingFormatInput.value = adminState.meetingFormat;
    meetingStatusInput.value = adminState.meetingStatus;
    meetingAgendaInput.value = adminState.meetingAgenda;
    meetingSpecialMattersInput.value = adminState.meetingSpecialMatters;
    meetingPaperRequiredInput.checked = Boolean(adminState.meetingPaperRequired);
    distributionMethodSelect.value = adminState.distributionMethod;
    emailSubjectInput.value = adminState.emailSubject || buildDefaultEmailSubject();
    emailMessageInput.value = adminState.emailMessage || buildDefaultEmailMessage();
  }

  function buildDefaultEmailSubject() {
    const meetingLabel = adminState.meetingType === 'extra'
      ? 'Extra föreningsstämma'
      : adminState.meetingType === 'information'
        ? 'Informationsmöte'
        : 'Ordinarie föreningsstämma';
    return adminState.meetingTitle
      ? `Kallelse: ${adminState.meetingTitle}`
      : `Kallelse till ${meetingLabel.toLowerCase()}`;
  }

  function buildDefaultEmailMessage() {
    const { dateStr } = getFormValues();
    const formattedDate = dateStr ? formatSwedishDate(createDateAtNoon(dateStr)) : '[ange datum]';
    return [
      'Hej!',
      '',
      'Här kommer kallelse till föreningsstämman.',
      `Datum: ${formattedDate}`,
      `Plats: ${adminState.meetingLocation || '[ange plats]'}`,
      `Format: ${adminState.meetingFormat === 'physical' ? 'Fysisk stämma' : adminState.meetingFormat === 'hybrid' ? 'Hybridmöte' : 'Digitalt möte'}`,
      '',
      adminState.meetingAgenda || 'Agenda meddelas i anslutning till handlingarna.',
      adminState.meetingSpecialMatters ? `Särskilda ärenden: ${adminState.meetingSpecialMatters}` : '',
      '',
      'Vänligen återkom om du kommer, inte kommer eller deltar via ombud.',
      '',
      'Med vänlig hälsning',
      'Styrelsen'
    ].join('\n');
  }

  function persistAndRender() {
    persistAdminState();
    updateMeetingInputsFromState();
    renderAdminPanel();
    renderOverview();
    renderMemberModule();
    renderDistributionModule();
    renderAttendanceModule();
  }

  function setStatus(element, message, isError) {
    element.textContent = message;
    element.classList.toggle('status-error', Boolean(isError));
    element.classList.toggle('status-success', !isError && Boolean(message));
  }

  function getEmailableMembers() {
    return adminState.members.filter((member) => member.email && member.emailConsent);
  }

  function buildEmailBodyPreview() {
    const text = emailMessageInput.value.trim() || buildDefaultEmailMessage();
    return [
      text,
      '',
      '---',
      `Datum: ${meetingDateInput.value ? formatSwedishDate(createDateAtNoon(meetingDateInput.value)) : 'Ej valt'}`,
      `Plats: ${adminState.meetingLocation || 'Ej angiven'}`,
      `Distributionskanal: ${DISTRIBUTION_METHOD_LABELS[adminState.distributionMethod]}`,
      adminState.meetingAgenda ? `Agenda: ${adminState.meetingAgenda}` : ''
    ].filter(Boolean).join('\n');
  }

  function renderOverview() {
    const { dateStr, regel } = getFormValues();
    const summary = buildSummary();
    const voteRoll = buildVoteRoll();

    overviewStats.innerHTML = [
      createSummaryCard('Medlemmar', summary.totalMembers),
      createSummaryCard('Svar inkomna', summary.attendingCount + summary.proxyCount),
      createSummaryCard('Pappers- eller digitala utskick klara', summary.sentCount),
      createSummaryCard('Ombud noterade', summary.proxyCount),
      createSummaryCard('Incheckade', summary.checkedInCount),
      createSummaryCard('Röster just nu', voteRoll.totalVotes)
    ].join('');

    if (dateStr) {
      const latestCall = subtractWeeks(createDateAtNoon(dateStr), regel === '4v' ? 4 : 2);
      overviewNextMeeting.textContent = formatSwedishDate(createDateAtNoon(dateStr));
      overviewNextDeadline.textContent = `${adminState.meetingType === 'extra' ? 'Extra stämma' : 'Vald stämma'} - senaste kallelse enligt vald regel: ${formatSwedishDate(latestCall)}.`;
    } else {
      overviewNextMeeting.textContent = 'Ingen stämma vald ännu';
      overviewNextDeadline.textContent = 'Välj datum under Datumhjälp för att få juridiska hållpunkter.';
    }

    overviewChecklist.innerHTML = [
      summary.totalMembers === 0
        ? 'Börja med att lägga upp medlemmar i registret så att resten av flödet kan byggas på riktig data.'
        : `Medlemsregistret innehåller nu ${summary.totalMembers} medlem${summary.totalMembers === 1 ? '' : 'mar'}.`,
      dateStr
        ? 'Nästa steg är att kontrollera kallelse och välja vilka som ska ha papper, e-post eller båda.'
        : 'Sätt datum för nästa ordinarie stämma för att börja planera deadlines och utskick.',
      adminState.meetingPaperRequired
        ? 'Mötet är markerat för pappersutskick som huvudregel. Säkerställ att distributionslistan följer det.'
        : 'Papperskrav är inte särskilt markerat ännu. Kontrollera stadgar och mötestyp innan utskick.',
      summary.proxyCount > 0
        ? `${summary.proxyCount} medlem${summary.proxyCount === 1 ? '' : 'mar'} är noterade via ombud. Säkerställ att fullmakterna finns på plats.`
        : 'När ombud börjar registreras kommer röstlängden att uppdateras automatiskt här.',
      summary.sentCount < summary.totalMembers
        ? `Det finns fortfarande ${Math.max(summary.totalMembers - summary.sentCount, 0)} medlem${summary.totalMembers - summary.sentCount === 1 ? '' : 'mar'} utan markerat utskick.`
        : 'Alla medlemmar har markerats som skickade eller öppnade i distributionsstatusen.'
    ].map((item) => `<li>${escapeHtml(item)}</li>`).join('');

    renderMeetingList();
  }

  function renderMeetingList() {
    if (!meetingList) return;

    if (adminState.meetings.length === 0) {
      meetingList.innerHTML = '<div class="empty-state">Inga stämmor ännu. Skapa första stämman när ni är redo.</div>';
      return;
    }

    meetingList.innerHTML = adminState.meetings.map((meeting) => `
      <button type="button" class="meeting-item${meeting.id === adminState.activeMeetingId ? ' is-active' : ''}" data-meeting-id="${meeting.id}">
        <span class="meeting-item-title">${escapeHtml(meeting.title || (meeting.type === 'extra' ? 'Extra stämma' : meeting.type === 'information' ? 'Informationsmöte' : 'Ordinarie årsstämma'))}</span>
        <span class="meeting-item-meta">${escapeHtml(meeting.date || 'Datum ej valt')} | ${escapeHtml(meeting.status || 'planning')}</span>
      </button>
    `).join('');
  }

  function renderMemberModule() {
    const totalMembers = adminState.members.length;
    const withEmail = adminState.members.filter((member) => member.email).length;
    const withConsent = adminState.members.filter((member) => member.emailConsent).length;
    const withAddress = adminState.members.filter((member) => member.address).length;
    const withPhone = adminState.members.filter((member) => member.phone).length;

    memberModuleSummary.innerHTML = [
      createSummaryCard('Medlemmar', totalMembers),
      createSummaryCard('Med e-post', withEmail),
      createSummaryCard('Med samtycke', withConsent),
      createSummaryCard('Med adress', withAddress),
      createSummaryCard('Med telefon', withPhone)
    ].join('');

    memberModuleChecklist.innerHTML = [
      totalMembers === 0
        ? 'Lägg upp första medlemmen eller importera en CSV-fil för att få igång resten av arbetsflödet.'
        : 'Kontrollera att varje medlem har korrekt adress, lägenhet och kontaktuppgifter.',
      withConsent < totalMembers
        ? `${Math.max(totalMembers - withConsent, 0)} medlem${totalMembers - withConsent === 1 ? '' : 'mar'} saknar samtycke till e-postutskick.`
        : 'Alla registrerade medlemmar är markerade med e-postsamtycke.',
      withAddress < totalMembers
        ? `${Math.max(totalMembers - withAddress, 0)} medlem${totalMembers - withAddress === 1 ? '' : 'mar'} saknar adressuppgift.`
        : 'Adressuppgifter finns för samtliga registrerade medlemmar.',
      withPhone < totalMembers
        ? `${Math.max(totalMembers - withPhone, 0)} medlem${totalMembers - withPhone === 1 ? '' : 'mar'} saknar telefonnummer.`
        : 'Telefonnummer finns registrerat för samtliga medlemmar.'
    ].map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  }

  function renderDistributionModule() {
    const summary = buildSummary();
    const paperLikely = adminState.members.filter((member) => member.preferredDistribution === 'paper' || member.preferredDistribution === 'both' || !member.emailConsent || !member.email).length;
    const digitalPreferred = adminState.members.filter((member) => member.preferredDistribution === 'email' || member.preferredDistribution === 'both').length;

    distributionModuleSummary.innerHTML = [
      createSummaryCard('Skickade/öppnade', summary.sentCount),
      createSummaryCard('Öppnade', summary.openedCount),
      createSummaryCard('Behöver sannolikt papper', paperLikely),
      createSummaryCard('Kan få digitalt', digitalPreferred),
      createSummaryCard('Svar inkomna', summary.attendingCount + summary.proxyCount)
    ].join('');

    distributionModuleChecklist.innerHTML = [
      'Utgå inte från att e-post räcker. Kallelser behöver kunna hanteras i papper enligt stadgar och praktisk rutin.',
      adminState.meetingPaperRequired
        ? 'Det här mötet är markerat med pappersutskick som huvudregel.'
        : 'Pappersutskick är inte markerat som huvudregel, men det kan ändå krävas enligt stadgar eller ärendetyp.',
      paperLikely > 0
        ? `${paperLikely} medlem${paperLikely === 1 ? '' : 'mar'} saknar e-post eller samtycke och bör därför få pappersutskick.`
        : 'Alla registrerade medlemmar kan i nuläget nås digitalt, men kontrollera ändå stadgar och distributionskrav.',
      adminState.distributionMethod === 'email'
        ? 'Primär kanal står på e-post. Säkerställ att detta verkligen är tillåtet och praktiskt rätt för föreningen.'
        : `Primär kanal är satt till ${DISTRIBUTION_METHOD_LABELS[adminState.distributionMethod].toLowerCase()}.`,
      adminState.meetingSpecialMatters
        ? `Särskilda ärenden noterade: ${adminState.meetingSpecialMatters}`
        : 'Inga särskilda ärenden är noterade för mötet ännu.'
    ].map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  }

  function renderAttendanceModule() {
    const summary = buildSummary();
    const voteRoll = buildVoteRoll();
    const missingProxyDocs = adminState.members.filter((member) => member.rsvpStatus === 'proxy' && !member.proxyDocument).length;

    attendanceModuleSummary.innerHTML = [
      createSummaryCard('Kommer', summary.attendingCount),
      createSummaryCard('Via ombud', summary.proxyCount),
      createSummaryCard('Incheckade', summary.checkedInCount),
      createSummaryCard('Röster just nu', voteRoll.totalVotes)
    ].join('');

    attendanceModuleChecklist.innerHTML = [
      summary.proxyCount > 0
        ? `${summary.proxyCount} medlem${summary.proxyCount === 1 ? '' : 'mar'} deltar via ombud.`
        : 'Inga ombud registrerade ännu.',
      missingProxyDocs > 0
        ? `${missingProxyDocs} ombud saknar notering om fullmakt och bör kontrolleras före stämman.`
        : 'Alla registrerade ombud har någon form av fullmaktsnotering eller så finns inga ombud ännu.',
      summary.checkedInCount > 0
        ? `${summary.checkedInCount} deltagare är redan markerade som närvarande eller via ombud.`
        : 'När stämman börjar kan ni använda statusfältet Check-in som enkel avprickning vid dörren.'
    ].map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  }

  function getPaperRecipients() {
    return adminState.members.filter((member) => {
      const state = getActiveMeetingMemberState(member);
      return adminState.meetingPaperRequired
        || member.preferredDistribution === 'paper'
        || member.preferredDistribution === 'both'
        || !member.emailConsent
        || !member.email
        || adminState.distributionMethod === 'letterbox'
        || adminState.distributionMethod === 'post';
    }).map((member) => ({
      member,
      state: getActiveMeetingMemberState(member)
    }));
  }

  function getMeetingTypeLabel(type) {
    if (type === 'extra') return 'Extra föreningsstämma';
    if (type === 'information') return 'Informationsmöte';
    return 'Ordinarie föreningsstämma';
  }

  function getMeetingStatusLabel(status) {
    if (status === 'ready_for_call') return 'Klar för kallelse';
    if (status === 'called') return 'Kallad';
    if (status === 'completed') return 'Genomförd';
    return 'Planering';
  }

  function buildPaperCallMarkup() {
    const { dateStr, regel } = getFormValues();
    const latestCall = dateStr ? subtractWeeks(createDateAtNoon(dateStr), regel === '4v' ? 4 : 2) : null;
    const dateLabel = dateStr ? formatSwedishDate(createDateAtNoon(dateStr)) : 'Datum ej valt';

    return `
      <div class="paper-call-sheet">
        <div class="paper-call-header">
          <div>
            <span class="paper-call-kicker">Kallelse</span>
            <h3>${escapeHtml(adminState.meetingTitle || getMeetingTypeLabel(adminState.meetingType))}</h3>
            <p>${escapeHtml(getMeetingTypeLabel(adminState.meetingType))} · ${escapeHtml(getMeetingStatusLabel(adminState.meetingStatus))}</p>
          </div>
          <div class="paper-call-badge">${escapeHtml(adminState.meetingFormat === 'physical' ? 'Fysisk' : adminState.meetingFormat === 'hybrid' ? 'Hybrid' : 'Digital')}</div>
        </div>

        <div class="paper-call-grid">
          <div class="paper-call-block">
            <strong>Datum</strong>
            <span>${escapeHtml(dateLabel)}</span>
          </div>
          <div class="paper-call-block">
            <strong>Plats</strong>
            <span>${escapeHtml(adminState.meetingLocation || 'Ej angiven')}</span>
          </div>
          <div class="paper-call-block">
            <strong>Senaste kallelse</strong>
            <span>${escapeHtml(latestCall ? formatSwedishDate(latestCall) : 'Beräknas när datum är valt')}</span>
          </div>
          <div class="paper-call-block">
            <strong>Primär distribution</strong>
            <span>${escapeHtml(DISTRIBUTION_METHOD_LABELS[adminState.distributionMethod])}</span>
          </div>
        </div>

        <div class="paper-call-body">
          <h4>Dagordning / information</h4>
          <p>${escapeHtml(adminState.meetingAgenda || 'Dagordning och handlingar meddelas enligt föreningens rutin.').replace(/\n/g, '<br>')}</p>
          ${adminState.meetingSpecialMatters ? `<div class="paper-call-special"><strong>Särskilda ärenden:</strong><p>${escapeHtml(adminState.meetingSpecialMatters).replace(/\n/g, '<br>')}</p></div>` : ''}
          <div class="paper-call-note">
            <strong>Praktisk information</strong>
            <p>Denna kallelse är framtagen i BRF Hjälpen för utskrift i pappersform. Kontrollera alltid att kallelsen, distributionssättet och eventuella bilagor följer stadgar och lag.</p>
          </div>
        </div>

      </div>
    `;
  }

  function buildPaperCallMarkup() {
    const { dateStr, regel } = getFormValues();
    const latestCall = dateStr ? subtractWeeks(createDateAtNoon(dateStr), regel === '4v' ? 4 : 2) : null;
    const dateLabel = dateStr ? formatSwedishDate(createDateAtNoon(dateStr)) : 'Datum ej valt';
    const meetingLabel = escapeHtml(adminState.meetingTitle || getMeetingTypeLabel(adminState.meetingType));
    const meetingTypeLabel = escapeHtml(getMeetingTypeLabel(adminState.meetingType));
    const meetingStatusLabel = escapeHtml(getMeetingStatusLabel(adminState.meetingStatus));
    const meetingFormatLabel = escapeHtml(adminState.meetingFormat === 'physical' ? 'Fysisk' : adminState.meetingFormat === 'hybrid' ? 'Hybrid' : 'Digital');
    const locationLabel = escapeHtml(adminState.meetingLocation || 'Meddelas separat');
    const latestCallLabel = escapeHtml(latestCall ? formatSwedishDate(latestCall) : 'Ber\u00e4knas n\u00e4r datum \u00e4r valt');
    const distributionLabel = escapeHtml(DISTRIBUTION_METHOD_LABELS[adminState.distributionMethod]);
    const introText = adminState.meetingType === 'annual'
      ? 'H\u00e4rmed kallas f\u00f6reningens medlemmar till ordinarie f\u00f6reningsst\u00e4mma.'
      : adminState.meetingType === 'extra'
        ? 'H\u00e4rmed kallas f\u00f6reningens medlemmar till extra f\u00f6reningsst\u00e4mma.'
        : 'H\u00e4rmed inbjuds f\u00f6reningens medlemmar till informationsm\u00f6te.';
    const agendaText = adminState.meetingAgenda
      ? escapeHtml(adminState.meetingAgenda).replace(/\n/g, '<br>')
      : 'Dagordning och \u00f6vriga handlingar h\u00e5lls tillg\u00e4ngliga enligt f\u00f6reningens rutiner och g\u00e4llande regelverk.';
    const practicalText = adminState.meetingPaperRequired
      ? 'Denna kallelse \u00e4r framtagen f\u00f6r utdelning i pappersform. Kontrollera att eventuella bilagor och utskicksrutiner f\u00f6ljer f\u00f6reningens stadgar och till\u00e4mpliga regler.'
      : 'Kontrollera att utskickss\u00e4tt, eventuella bilagor och tidpunkter f\u00f6ljer f\u00f6reningens stadgar och till\u00e4mpliga regler.';

    return `
      <div class="paper-call-sheet">
        <div class="paper-call-header">
          <div>
            <span class="paper-call-kicker">Kallelse</span>
            <h3>${meetingLabel}</h3>
            <p>${meetingTypeLabel} - ${meetingStatusLabel}</p>
          </div>
          <div class="paper-call-badge">${meetingFormatLabel}</div>
        </div>

        <div class="paper-call-body">
          <p>${introText}</p>
        </div>

        <div class="paper-call-grid">
          <div class="paper-call-block">
            <strong>Tid</strong>
            <span>${escapeHtml(dateLabel)}</span>
          </div>
          <div class="paper-call-block">
            <strong>Plats</strong>
            <span>${locationLabel}</span>
          </div>
          <div class="paper-call-block">
            <strong>Senast f\u00f6r utskick</strong>
            <span>${latestCallLabel}</span>
          </div>
          <div class="paper-call-block">
            <strong>Planerat distributionss\u00e4tt</strong>
            <span>${distributionLabel}</span>
          </div>
        </div>

        <div class="paper-call-body">
          <h4>Dagordning och information</h4>
          <p>${agendaText}</p>
          ${adminState.meetingSpecialMatters ? `<div class="paper-call-special"><strong>S\u00e4rskilda \u00e4renden</strong><p>${escapeHtml(adminState.meetingSpecialMatters).replace(/\n/g, '<br>')}</p></div>` : ''}
          <div class="paper-call-note">
            <strong>Praktisk information</strong>
            <p>${practicalText}</p>
          </div>
        </div>
      </div>
    `;
  }

  function renderPaperCallPreview() {
    const recipients = getPaperRecipients();
    if (!adminState.meetingTitle && !meetingDateInput.value) {
      setStatus(paperCallStatus, 'Fyll i mötesuppgifter först för att skapa en meningsfull papperskallelse.', true);
      return;
    }

    paperCallPreview.classList.remove('empty-state');
    paperCallPreview.innerHTML = buildPaperCallMarkup();
    setStatus(paperCallStatus, `Preview skapad. ${recipients.length} medlem${recipients.length === 1 ? '' : 'mar'} är i nuläget markerade för pappersutskick.`, false);
  }

  function printPaperCall() {
    const previewHtml = buildPaperCallMarkup();
    const printWindow = window.open('', '_blank', 'width=900,height=1200');
    if (!printWindow) {
      setStatus(paperCallStatus, 'Kunde inte öppna utskriftsfönster. Kontrollera popup-blockering.', true);
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="sv">
      <head>
        <meta charset="UTF-8">
        <title>Papperskallelse</title>
        <style>
          body { font-family: Georgia, 'Times New Roman', serif; margin: 0; padding: 24px; color: #1d1a15; background: #f4efe8; }
          .paper-call-sheet { position: relative; max-width: 780px; margin: 0 auto; background: linear-gradient(180deg, #fffefe, #fff8f0); border: 1px solid #d9cfc2; border-radius: 22px; padding: 32px; overflow: hidden; box-shadow: 0 18px 45px rgba(42, 32, 18, 0.12); }
          .paper-call-sheet::before { content: ''; position: absolute; inset: 0 0 auto 0; height: 6px; background: linear-gradient(90deg, #8ee0b8, #d4b071, #8ee0b8); }
          .paper-call-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 20px; padding-bottom: 14px; border-bottom: 1px solid #ddd3c8; }
          .paper-call-kicker { display: inline-block; margin-bottom: 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; font-weight: 700; color: #0d5b46; }
          .paper-call-header h3 { margin: 0; font-size: 34px; line-height: 1.06; }
          .paper-call-header p { margin: 8px 0 0; color: #6f6258; font-family: Arial, sans-serif; font-size: 14px; }
          .paper-call-badge { align-self: flex-start; padding: 10px 14px; border-radius: 999px; background: linear-gradient(135deg, rgba(124, 216, 173, 0.22), rgba(236, 209, 166, 0.3)); color: #083d2f; font-weight: 700; font-family: Arial, sans-serif; border: 1px solid rgba(8, 61, 47, 0.08); }
          .paper-call-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin: 18px 0 24px; }
          .paper-call-block, .paper-call-special, .paper-call-note { border: 1px solid #ddd3c8; border-radius: 16px; padding: 15px 16px; background: rgba(255, 255, 255, 0.84); box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.75); }
          .paper-call-block { display: grid; gap: 6px; }
          .paper-call-block strong { font-family: Arial, sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #6e5d4d; }
          .paper-call-block span { font-family: Arial, sans-serif; font-size: 16px; line-height: 1.45; }
          .paper-call-body { display: grid; gap: 12px; }
          .paper-call-body > p { margin: 0; line-height: 1.7; font-size: 17px; }
          .paper-call-body h4 { margin: 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #6e5d4d; font-family: Arial, sans-serif; }
          .paper-call-special, .paper-call-note { margin-top: 16px; }
          .paper-call-special { background: linear-gradient(180deg, rgba(248, 238, 225, 0.84), rgba(255, 252, 247, 0.9)); }
          .paper-call-note { background: linear-gradient(180deg, rgba(250, 242, 231, 0.92), rgba(255, 250, 244, 0.92)); }
          .paper-call-special p, .paper-call-note p { margin: 8px 0 0; line-height: 1.65; font-family: Arial, sans-serif; }
          @media print {
            body { background: #fff; padding: 0; }
            .paper-call-sheet { border: none; border-radius: 0; padding: 0; box-shadow: none; background: #fff; }
          }
        </style>
      </head>
      <body>${previewHtml}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  btnAddMeeting.addEventListener('click', () => {
    const newMeeting = createMeetingRecord({
      title: `Ny stämma ${adminState.meetings.length + 1}`,
      type: 'annual',
      callRule: '4v',
      distributionMethod: 'email'
    });
    adminState.meetings.unshift(newMeeting);
    adminState.activeMeetingId = newMeeting.id;
    syncStateFromActiveMeeting();
    persistAndRender();
    setActiveView('dates');
  });

  meetingList.addEventListener('click', (event) => {
    const target = event.target.closest('[data-meeting-id]');
    if (!target) return;
    adminState.activeMeetingId = target.dataset.meetingId;
    syncStateFromActiveMeeting();
    updateMeetingInputsFromState();
    renderAdminPanel();
    renderOverview();
    renderDistributionModule();
    handleCalculate();
  });

  meetingTitleInput.addEventListener('input', (event) => {
    updateActiveMeetingField('title', event.target.value);
    if (!adminState.emailSubject || adminState.emailSubject.startsWith('Kallelse')) {
      updateActiveMeetingField('emailSubject', buildDefaultEmailSubject());
    }
    persistAndRender();
  });

  meetingTypeInput.addEventListener('change', (event) => {
    updateActiveMeetingField('type', event.target.value);
    if (!adminState.emailSubject || adminState.emailSubject.startsWith('Kallelse')) {
      updateActiveMeetingField('emailSubject', buildDefaultEmailSubject());
    }
    persistAndRender();
  });

  meetingLocationInput.addEventListener('input', (event) => {
    updateActiveMeetingField('location', event.target.value);
    persistAndRender();
  });

  meetingFormatInput.addEventListener('change', (event) => {
    updateActiveMeetingField('format', event.target.value);
    persistAndRender();
  });

  meetingStatusInput.addEventListener('change', (event) => {
    updateActiveMeetingField('status', event.target.value);
    persistAndRender();
  });

  meetingAgendaInput.addEventListener('input', (event) => {
    updateActiveMeetingField('agenda', event.target.value);
    persistAndRender();
  });

  meetingSpecialMattersInput.addEventListener('input', (event) => {
    updateActiveMeetingField('specialMatters', event.target.value);
    persistAndRender();
  });

  meetingPaperRequiredInput.addEventListener('change', (event) => {
    updateActiveMeetingField('paperRequired', event.target.checked);
    persistAndRender();
  });

  distributionMethodSelect.addEventListener('change', (event) => {
    updateActiveMeetingField('distributionMethod', event.target.value);
    persistAndRender();
  });

  emailSubjectInput.addEventListener('input', (event) => {
    updateActiveMeetingField('emailSubject', event.target.value);
    persistAdminState();
  });

  emailMessageInput.addEventListener('input', (event) => {
    updateActiveMeetingField('emailMessage', event.target.value);
    persistAdminState();
  });

  memberForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = memberNameInput.value.trim();
    if (!name) {
      memberNameInput.focus();
      return;
    }

    adminState.members.unshift(createMember({
      name,
      address: memberAddressInput.value.trim(),
      unit: memberUnitInput.value.trim(),
      email: memberEmailInput.value.trim(),
      phone: memberPhoneInput.value.trim(),
      voteWeight: Number(memberVoteWeightInput.value) || 1,
      emailConsent: memberEmailConsentInput.checked,
      preferredDistribution: memberDistributionInput.value,
      ownershipType: memberOwnershipInput.value
    }));

    memberForm.reset();
    memberVoteWeightInput.value = '1';
    memberDistributionInput.value = 'paper';
    memberOwnershipInput.value = 'single';
    memberEmailConsentInput.checked = true;
    persistAndRender();
    memberNameInput.focus();
  });

  memberList.addEventListener('change', (event) => {
    const target = event.target;
    const row = target.closest('[data-member-id]');
    if (!row) return;
    const member = adminState.members.find((item) => item.id === row.dataset.memberId);
    if (!member) return;
    const field = target.dataset.field;
    if (!field) return;

    if (['distributionStatus', 'rsvpStatus', 'attendanceStatus', 'proxyHolder', 'proxyDocument'].includes(field)) {
      updateActiveMeetingMemberField(member.id, field, target.value);
      if (field === 'rsvpStatus' && target.value === 'proxy') {
        updateActiveMeetingMemberField(member.id, 'attendanceStatus', getActiveMeetingMemberState(member).attendanceStatus === 'unchecked' ? 'proxy' : getActiveMeetingMemberState(member).attendanceStatus);
      }
      persistAndRender();
      return;
    }

    if (field === 'emailConsent') {
      member.emailConsent = target.value === 'true';
    } else if (field === 'voteWeight') {
      member.voteWeight = Math.max(0, Number(target.value) || 0);
    } else {
      member[field] = target.value;
    }

    persistAndRender();
  });

  memberList.addEventListener('input', (event) => {
    const target = event.target;
    const row = target.closest('[data-member-id]');
    if (!row) return;
    const member = adminState.members.find((item) => item.id === row.dataset.memberId);
    if (!member) return;
    const field = target.dataset.field;
    if (!field) return;

    if (['proxyHolder', 'proxyDocument'].includes(field)) {
      updateActiveMeetingMemberField(member.id, field, target.value);
      persistAdminState();
      return;
    }

    if (field === 'voteWeight') {
      member.voteWeight = Math.max(0, Number(target.value) || 0);
    } else {
      member[field] = target.value;
    }

    persistAdminState();
  });

  memberList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action="delete-member"]');
    if (!button) return;
    const memberId = button.dataset.memberId;
    adminState.members = adminState.members.filter((member) => member.id !== memberId);
    adminState.meetings = adminState.meetings.map((meeting) => {
      const nextMemberStates = { ...(meeting.memberStates || {}) };
      delete nextMemberStates[memberId];
      return {
        ...meeting,
        memberStates: nextMemberStates
      };
    });
    persistAndRender();
  });

  btnPreviewEmail.addEventListener('click', () => {
    const recipients = getEmailableMembers();
    emailPreview.innerHTML = `
      <h4>Förhandsgranskning</h4>
      <p><strong>Mottagare:</strong> ${escapeHtml(recipients.map((member) => member.email).join(', ') || 'Inga mottagare')}</p>
      <p><strong>Ämne:</strong> ${escapeHtml(emailSubjectInput.value.trim() || buildDefaultEmailSubject())}</p>
      <pre>${escapeHtml(buildEmailBodyPreview())}</pre>
    `;
    emailPreview.classList.remove('hidden');
  });

  btnPreviewPaperCall.addEventListener('click', () => {
    renderPaperCallPreview();
  });

  btnPrintPaperCall.addEventListener('click', () => {
    renderPaperCallPreview();
    printPaperCall();
  });

  btnSendEmail.addEventListener('click', async () => {
    const recipients = getEmailableMembers();
    if (recipients.length === 0) {
      setStatus(emailStatus, 'Inga medlemmar med e-post och samtycke att skicka till.', true);
      return;
    }

    btnSendEmail.disabled = true;
    setStatus(emailStatus, 'Skickar kallelser...', false);

    try {
      const response = await fetch('/api/send-invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meeting: {
            title: adminState.meetingTitle || 'Ordinarie föreningsstämma',
            type: adminState.meetingType,
            date: meetingDateInput.value,
            dateLabel: meetingDateInput.value ? formatSwedishDate(createDateAtNoon(meetingDateInput.value)) : '',
            location: adminState.meetingLocation,
            format: adminState.meetingFormat,
            status: adminState.meetingStatus,
            agenda: adminState.meetingAgenda,
            specialMatters: adminState.meetingSpecialMatters,
            paperRequired: adminState.meetingPaperRequired,
            distributionMethod: adminState.distributionMethod
          },
          subject: emailSubjectInput.value.trim() || buildDefaultEmailSubject(),
          message: buildEmailBodyPreview(),
          recipients: recipients.map((member) => ({
            id: member.id,
            name: member.name,
            email: member.email,
            unit: member.unit
          }))
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'E-postutskicket misslyckades.');
      }

      const sentIds = new Set(payload.sent.map((item) => item.id));
      adminState.members = adminState.members.map((member) => (
        sentIds.has(member.id)
          ? { ...member, distributionStatus: 'sent' }
          : member
      ));
      persistAndRender();
      setStatus(emailStatus, `Skickade ${payload.sent.length} kallelser.`, false);
    } catch (error) {
      console.error(error);
      setStatus(emailStatus, error.message, true);
    } finally {
      btnSendEmail.disabled = false;
    }
  });

  btnImportCsv.addEventListener('click', async () => {
    const file = csvFileInput.files[0];
    if (!file) {
      setStatus(csvStatus, 'Välj en CSV-fil först.', true);
      return;
    }

    try {
      const text = await file.text();
      const imported = parseCsv(text);
      if (imported.length === 0) {
        throw new Error('CSV-filen innehöll inga rader att importera.');
      }

      adminState.members = imported.map((row) => createMember({
        name: row.name || row.namn,
        address: row.address || row.adress,
        unit: row.unit || row.lagenhet || row.lägenhet,
        email: row.email || row.epost || row['e-post'],
        phone: row.phone || row.telefon,
        voteWeight: row.voteweight || row.rostvarde || row.röstvärde || 1,
        emailConsent: parseBoolean(row.emailconsent || row.epostsamtycke || row['e-postsamtycke']),
        preferredDistribution: row.preferreddistribution || row.distribution || 'paper',
        ownershipType: row.ownershiptype || row.agarform || row.ägarform || 'single',
        distributionStatus: row.distributionstatus || 'draft',
        rsvpStatus: row.rsvpstatus || 'pending',
        attendanceStatus: row.attendancestatus || 'unchecked',
        proxyHolder: row.proxyholder || row.ombud || '',
        proxyDocument: row.proxydocument || row.fullmakt || ''
      }));

      persistAndRender();
      setStatus(csvStatus, `Importerade ${adminState.members.length} medlemmar från CSV.`, false);
    } catch (error) {
      console.error(error);
      setStatus(csvStatus, error.message, true);
    }
  });

  btnExportCsv.addEventListener('click', () => {
    const rows = adminState.members.map((member) => ({
      name: member.name,
      address: member.address,
      unit: member.unit,
      email: member.email,
      phone: member.phone,
      voteWeight: member.voteWeight,
      emailConsent: member.emailConsent,
      preferredDistribution: member.preferredDistribution,
      ownershipType: member.ownershipType,
      distributionStatus: member.distributionStatus,
      rsvpStatus: member.rsvpStatus,
      attendanceStatus: member.attendanceStatus,
      proxyHolder: member.proxyHolder,
      proxyDocument: member.proxyDocument
    }));
    downloadCsv('medlemslista.csv', rows);
    setStatus(csvStatus, 'CSV exporterad.', false);
  });

  btnExportVoteRoll.addEventListener('click', () => {
    const voteRoll = buildVoteRoll().rows.map((row) => ({
      memberName: row.memberName,
      unit: row.unit,
      representedBy: row.representedBy,
      voteWeight: row.voteWeight,
      proxyDocument: row.proxyDocument,
      status: row.statusLabel
    }));
    downloadCsv('rostlangd.csv', voteRoll);
    setStatus(csvStatus, 'Röstlängd exporterad.', false);
  });

  function parseCsv(text) {
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n');
    if (lines.length < 2) return [];
    const headers = splitCsvLine(lines[0]).map(normalizeCsvHeader);
    return lines.slice(1).filter(Boolean).map((line) => {
      const values = splitCsvLine(line);
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row;
    });
  }

  function splitCsvLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      const next = line[i + 1];
      if (char === '"' && inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);
    return values.map((value) => value.trim());
  }

  function normalizeCsvHeader(header) {
    return header.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function parseBoolean(value) {
    if (value === undefined || value === null || value === '') return true;
    return ['true', '1', 'ja', 'yes'].includes(String(value).trim().toLowerCase());
  }

  function downloadCsv(filename, rows) {
    if (rows.length === 0) {
      setStatus(csvStatus, 'Det finns inget att exportera ännu.', true);
      return;
    }
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(','),
      ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function csvEscape(value) {
    const text = String(value ?? '');
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    handleCalculate();
  });

  meetingDateInput.addEventListener('change', handleCalculate);
  meetingDateInput.addEventListener('change', () => {
    updateActiveMeetingField('date', meetingDateInput.value);
  });
  Array.from(kallelseRegelRadios).forEach((radio) => radio.addEventListener('change', () => {
    if (radio.checked) {
      updateActiveMeetingField('callRule', radio.value);
    }
    handleCalculate();
  }));

  async function initializeApp() {
    try {
      adminState = await fetchAdminStateFromServer();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(adminState));
    } catch (error) {
      console.warn('Använder lokal cache som fallback:', error);
      serverSyncEnabled = true;
    }

    updateMeetingInputsFromState();
    renderAdminPanel();
    renderOverview();
    renderMemberModule();
    renderDistributionModule();
    renderAttendanceModule();
    handleCalculate();
  }

  initializeApp();
});
