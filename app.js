document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const form = document.getElementById('calc-form');
  const meetingDateInput = document.getElementById('meeting-date');
  const kallelseRegelRadios = document.getElementsByName('kallelse-regel');

  const resultsContainer = document.getElementById('results-container');
  const resultsList = document.getElementById('results-list');
  const planningList = document.getElementById('planning-list');

  const weekendWarning = document.getElementById('weekend-warning');
  const extraWarning = document.getElementById('extra-warning');

  const btnCopy = document.getElementById('btn-copy');

  const popover = document.getElementById('popover');

  const modalHelp = document.getElementById('modal-help');
  const btnHelp = document.getElementById('btn-help');
  const btnCloseHelp = document.getElementById('btn-close-help');
  const linkSources = document.getElementById('link-sources');

  // Theme logic
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  const iconMoon = document.getElementById('icon-moon');
  const iconSun = document.getElementById('icon-sun');

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

  // Initialize theme
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    setTheme('dark');
  } else {
    setTheme('light');
  }

  btnThemeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  });

  // UI State management
  function getFormValues() {
    const dateStr = meetingDateInput.value;
    const regel = document.querySelector('input[name="kallelse-regel"]:checked').value;
    return { dateStr, regel };
  }

  // Listeners for recalculation
  meetingDateInput.addEventListener('change', handleCalculate);
  Array.from(kallelseRegelRadios).forEach(radio => radio.addEventListener('change', handleCalculate));

  // Date utility wrapper to safely calculate dates
  // Using local noon to prevent exact UTC offsets pushing dates into the previous/next day
  function createDateAtNoon(dateString) {
    if (!dateString) return null;
    const [year, month, day] = dateString.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);
  }

  function subtractWeeks(date, weeks) {
    const result = new Date(date);
    // Weeks = 7 days
    result.setDate(result.getDate() - (weeks * 7));
    return result;
  }

  function isWeekend(date) {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
  }

  const dateFormatter = new Intl.DateTimeFormat('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'long'
  });

  function formatSwedishDate(date) {
    // Output: 2026-05-30 (lördag)
    const parts = dateFormatter.formatToParts(date);
    let year, month, day, weekday;
    parts.forEach(p => {
      if (p.type === 'year') year = p.value;
      if (p.type === 'month') month = p.value;
      if (p.type === 'day') day = p.value;
      if (p.type === 'weekday') weekday = p.value;
    });
    return `${year}-${month}-${day} (${weekday})`;
  }

  // Main Calculation Logic
  function handleCalculate() {
    const { dateStr, regel } = getFormValues();

    // Hide errors and results reset
    meetingDateInput.parentElement.classList.remove('has-error');

    if (!dateStr) {
      resultsContainer.classList.add('hidden');
      return;
    }

    const meetingDate = createDateAtNoon(dateStr);
    resultsContainer.classList.remove('hidden');

    const results = [];
    const planning = [];
    let hasWeekendDeadline = false;

    // Compute Rules
    if (extraWarning) extraWarning.classList.add('hidden');

    // Tidigast
    const tidigastDate = subtractWeeks(meetingDate, 6);
    results.push({
      label: 'Kallelse – tidigast',
      date: tidigastDate,
      explainer: 'Kallelsen får enligt lag utfärdas tidigast sex veckor före stämman.',
      meaning: 'Senast: ni får inte skicka kallelse före detta datum.',
      sourceHtml: '<a href="https://lagen.nu/2018:672#K6P17S1" target="_blank" rel="noopener">EFL 6 kap. 17 § (lagen.nu)</a>, <a href="https://lagen.nu/1991:614#K9P14S1" target="_blank" rel="noopener">BRL 9 kap. 14 § (lagen.nu)</a>'
    });

    // Senast
    let senastWeeks = (regel === '4v') ? 4 : 2;
    const senastDate = subtractWeeks(meetingDate, senastWeeks);
    if (isWeekend(senastDate)) hasWeekendDeadline = true;

    let senastExplainer = (regel === '4v')
      ? 'Enligt huvudregel ska kallelse vara utskickad senast fyra veckor före stämman.'
      : 'Era stadgar tillåter att kallelsen utfärdas senast två veckor före stämman.';

    results.push({
      label: 'Kallelse – senast',
      date: senastDate,
      explainer: senastExplainer,
      meaning: 'Senast: kallelsen måste vara utskickad senast detta datum (om era stadgar inte säger annat).',
      sourceHtml: '<a href="https://lagen.nu/2018:672#K6P17S1" target="_blank" rel="noopener">EFL 6 kap. 17 § (lagen.nu)</a>, <a href="https://lagen.nu/1991:614#K9P14S1" target="_blank" rel="noopener">BRL 9 kap. 14 § (lagen.nu)</a>'
    });

    // Handlingar
    const handlingarDate = subtractWeeks(meetingDate, 2);
    if (isWeekend(handlingarDate)) hasWeekendDeadline = true;
    results.push({
      label: 'Handlingar senast tillgängliga',
      date: handlingarDate,
      explainer: 'Enligt lag ska redovisningshandlingar (och ev. revisionsberättelse) hållas tillgängliga för medlemmarna under minst två veckor närmast före årsstämman.',
      meaning: 'Senast: handlingarna ska gå att läsa från detta datum.',
      sourceHtml: '<a href="https://lagen.nu/2018:672#K6P23S1" target="_blank" rel="noopener">EFL 6 kap. 23 § (lagen.nu)</a>'
    });

    // Praktisk planering (endast ordinarie relevans för årsredovisning vanligtvis)
    planningList.style.display = 'block';

    planning.push({
      label: 'Valberedning: Rekommenderad sista dag för förslag',
      date: subtractWeeks(meetingDate, 8),
      explainer: 'Vanligt arbetssätt för att valberedningen ska hinna arbeta innan kallelse går ut. Ofta rekommenderas att medlemmar inkommer med förslag senast ca 2 månader före stämman.',
      sourceHtml: '<a href="https://www.bostadsratterna.se/kunskapsbanken" target="_blank" rel="noopener">Rekommendation (praxis) – se Bostadsrätterna</a>'
    });

    planning.push({
      label: 'Årsredovisning till revisor (praxis)',
      date: subtractWeeks(meetingDate, 6),
      explainer: 'Ett vanligt arbetssätt för att revisorn ska hinna granska i god tid före kallelse.',
      sourceHtml: '<a href="https://www.bostadsratterna.se/kunskapsbanken" target="_blank" rel="noopener">Rekommendation (praxis) – se Bostadsrätterna</a>'
    });

    planning.push({
      label: 'Revisionsberättelse tillbaka (praxis)',
      date: subtractWeeks(meetingDate, 3),
      explainer: 'Planera så att berättelsen hinner bifogas innan handlingar enligt lag ska vara tillgängliga (minst 2 v före).',
      sourceHtml: '<a href="https://www.bostadsratterna.se/kunskapsbanken" target="_blank" rel="noopener">Rekommendation (praxis) – se Bostadsrätterna</a>'
    });

    // Weekend warning toggle
    if (hasWeekendDeadline) {
      weekendWarning.classList.remove('hidden');
    } else {
      weekendWarning.classList.add('hidden');
    }

    renderResults(resultsList, results);
    renderResults(planningList, planning, false);
  }

  function renderResults(container, items, isMain = true) {
    if (!isMain && items.length > 0) {
      container.innerHTML = '<h3>Praktisk planering (praxis)</h3>';
    } else {
      container.innerHTML = '';
    }

    items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'result-row';
      if (isWeekend(item.date)) {
        row.classList.add('is-weekend');
      }

      row.innerHTML = `
          <div class="result-header-group">
            <div class="result-label">
              ${item.label}
              <!-- tooltip for results -->
              <button type="button" class="info-btn" aria-label="Information om ${item.label}" data-info="${item.meaning || item.explainer}">ⓘ</button>
            </div>
            <div class="result-date">${formatSwedishDate(item.date)}</div>
          </div>
          <div class="result-explainer"><strong>Varför?</strong> ${item.explainer}</div>
          <div class="result-sources"><strong>Källa:</strong> ${item.sourceHtml}</div>
        `;
      container.appendChild(row);
    });

    attachPopoverListeners(container);
  }

  // Tooltips / Popovers via "info-btn"
  function attachPopoverListeners(rootNode) {
    const btns = rootNode.querySelectorAll('.info-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const infoText = btn.getAttribute('data-info');

        if (popover.classList.contains('hidden') || popover.innerText !== infoText) {
          popover.innerText = infoText;
          popover.classList.remove('hidden');

          // Positioning roughly below the button
          const rect = btn.getBoundingClientRect();
          let topPos = rect.bottom + window.scrollY + 8;
          let leftPos = rect.left + window.scrollX - 100; // Center approximation

          if (leftPos < 10) leftPos = 10;

          popover.style.top = topPos + 'px';
          popover.style.left = leftPos + 'px';
        } else {
          popover.classList.add('hidden');
        }
      });
    });
  }

  // Global click dismiss for popover
  document.addEventListener('click', (e) => {
    if (!e.target.classList.contains('info-btn') && !popover.classList.contains('hidden')) {
      popover.classList.add('hidden');
    }
  });

  attachPopoverListeners(document);

  // Modal Management
  function openModal() {
    modalHelp.showModal();
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modalHelp.close();
    document.body.style.overflow = '';
  }

  btnHelp.addEventListener('click', openModal);
  btnCloseHelp.addEventListener('click', closeModal);

  modalHelp.addEventListener('click', (e) => {
    // Closes if clicked on backdrop
    const dialogDimensions = modalHelp.getBoundingClientRect();
    if (
      e.clientX < dialogDimensions.left ||
      e.clientX > dialogDimensions.right ||
      e.clientY < dialogDimensions.top ||
      e.clientY > dialogDimensions.bottom
    ) {
      closeModal();
    }
  });

  linkSources.addEventListener('click', (e) => {
    e.preventDefault();
    openModal();
    const sourcesHeading = document.getElementById('sources-section');
    setTimeout(() => {
      sourcesHeading.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  });

  const btnShowSources = document.getElementById('btn-show-sources');
  if (btnShowSources) {
    btnShowSources.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
      const sourcesHeading = document.getElementById('sources-section');
      setTimeout(() => {
        sourcesHeading.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });
  }

  // Copy Output to Clipboard
  btnCopy.addEventListener('click', async () => {
    const { dateStr } = getFormValues();
    if (!dateStr) return;

    const stämma = 'Ordinarie stämma (årsstämma)';
    const meetingDateFormat = formatSwedishDate(createDateAtNoon(dateStr));

    let copyText = `Datum för föreningsstämman: ${meetingDateFormat}\nTyp: ${stämma}\n\nHålltider:\n`;

    const rows = document.querySelectorAll('.result-row');
    rows.forEach(row => {
      const rawLabel = row.querySelector('.result-label').innerText.replace('ⓘ', '').trim();
      const rawDate = row.querySelector('.result-date').innerText.trim();
      copyText += `- ${rawLabel}: ${rawDate}\n`;
    });

    copyText += `\nObservera: Detta är en beräkning från stämmokalkylatorn. Kontrollera alltid lag och era stadgar.\n`;

    try {
      await navigator.clipboard.writeText(copyText);
      const origText = btnCopy.innerText;
      btnCopy.innerText = "Kopierat!";
      setTimeout(() => {
        btnCopy.innerText = origText;
      }, 3000);
    } catch (err) {
      console.error('Kunde inte kopiera:', err);
      alert('Kopiering misslyckades.');
    }
  });
});
