(() => {
  const LETTERS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
  const STORAGE_KEY = 'wordsmart-progress-v1';
  const STATUSES = ['New', 'Learning', 'Mastered', 'Weak'];

  const els = {
    menuBtn: document.getElementById('menuBtn'),
    menuDrawer: document.getElementById('menuDrawer'),
    drawerBackdrop: document.getElementById('drawerBackdrop'),
    closeMenuBtn: document.getElementById('closeMenuBtn'),
    closeMenuBtn2: document.getElementById('closeMenuBtn2'),
    tabFilterBtn: document.getElementById('tabFilterBtn'),
    tabStatsBtn: document.getElementById('tabStatsBtn'),
    filterSection: document.getElementById('filterSection'),
    statsSection: document.getElementById('statsSection'),
    homeBtn: document.getElementById('homeBtn'),
    statsHomeBtn: document.getElementById('statsHomeBtn'),
    clearAllFiltersBtn: document.getElementById('clearAllFiltersBtn'),
    letterFilter: document.getElementById('letterFilter'),
    statsGrid: document.getElementById('statsGrid'),
    searchInput: document.getElementById('searchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    resultNote: document.getElementById('resultNote'),
    mainHomeBtn: document.getElementById('mainHomeBtn'),
    cardGrid: document.getElementById('cardGrid'),
    readerPanel: document.getElementById('readerPanel'),
    backBtn: document.getElementById('backBtn'),
    backBottomBtn: document.getElementById('backBottomBtn'),
    prevBtn: document.getElementById('prevBtn'),
    prevBottomBtn: document.getElementById('prevBottomBtn'),
    nextBtn: document.getElementById('nextBtn'),
    nextBottomBtn: document.getElementById('nextBottomBtn'),
    fitBtn: document.getElementById('fitBtn'),
    actualBtn: document.getElementById('actualBtn'),
    zoomOutBtn: document.getElementById('zoomOutBtn'),
    zoomInBtn: document.getElementById('zoomInBtn'),
    statusButtons: document.getElementById('statusButtons'),
    imageStage: document.getElementById('imageStage'),
    mainImage: document.getElementById('mainImage'),
    readerTitle: document.getElementById('readerTitle'),
    readerMeta: document.getElementById('readerMeta'),
    readerPosition: document.getElementById('readerPosition'),
    scrollTopBtn: document.getElementById('scrollTopBtn'),
  };

  const activeLetters = new Set((WORDS || []).map(w => w.letter));
  const state = {
    selectedLetter: 'ALL',
    search: '',
    mode: 'browse',
    statusFilter: 'ALL',
    currentUid: null,
    currentList: [],
    zoom: 'fit',
    lastRandomUid: null,
    currentTab: 'filter'
  };
  let progress = loadProgress();

  function freshProgress() {
    return { statuses: {}, lastOpenedUid: null, lastOpenedId: null, lastLetter: 'ALL', lastMode: 'browse', updatedAt: null };
  }
  function loadProgress() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return {
        statuses: parsed.statuses && typeof parsed.statuses === 'object' ? parsed.statuses : {},
        lastOpenedUid: parsed.lastOpenedUid || null,
        lastOpenedId: Number(parsed.lastOpenedId) || null,
        lastLetter: parsed.lastLetter || 'ALL',
        lastMode: parsed.lastMode || 'browse',
        updatedAt: parsed.updatedAt || null
      };
    } catch (_) {
      return freshProgress();
    }
  }
  function saveProgress() {
    progress.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }
  function getStatus(word) {
    return progress.statuses[word.uid] || progress.statuses[String(word.id)] || 'New';
  }
  function setStatus(word, status) {
    if (!word || !STATUSES.includes(status)) return;
    progress.statuses[word.uid] = status;
    saveProgress();
    renderAll();
    if (state.currentUid) renderReader();
  }
  function cardTitle(word) {
    return word.word && !/^Word\s+\d+$/.test(word.word) ? word.word : `Word ${word.id}`;
  }
  function englishMeaning(word) { return word.englishMeaning || 'Meaning not added yet'; }
  function banglaMeaning(word) { return word.banglaMeaning || 'বাংলা অর্থ এখনো যোগ করা হয়নি'; }
  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  function getBaseList() {
    let list = WORDS.slice();
    if (state.selectedLetter !== 'ALL') list = list.filter(w => w.letter === state.selectedLetter);
    const q = state.search.trim().toLowerCase();
    if (q) {
      list = list.filter(w => {
        const hay = [w.uid, w.id, w.word, w.letter, w.book, w.pack, w.image, w.sourceName, w.englishMeaning, w.banglaMeaning]
          .filter(Boolean).join(' ').toLowerCase();
        return hay.includes(q);
      });
    }
    return list.sort((a, b) => a.id - b.id || a.word.localeCompare(b.word));
  }
  function getVisibleList() {
    let list = getBaseList();
    if (state.mode === 'weak') list = list.filter(w => ['Weak', 'Learning'].includes(getStatus(w)));
    if (state.statusFilter !== 'ALL') list = list.filter(w => getStatus(w) === state.statusFilter);
    return list.sort((a, b) => a.id - b.id || a.word.localeCompare(b.word));
  }

  function renderLetterFilter() {
    els.letterFilter.innerHTML = '';
    els.letterFilter.appendChild(makeLetterBtn('ALL', true));
    LETTERS.forEach(letter => els.letterFilter.appendChild(makeLetterBtn(letter, activeLetters.has(letter))));
  }
  function makeLetterBtn(letter, enabled) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'letter-btn';
    btn.textContent = letter === 'ALL' ? 'All' : letter;
    btn.disabled = !enabled;
    btn.title = enabled ? `${letter} is available` : `${letter} is not added yet`;
    if (state.selectedLetter === letter) btn.classList.add('active');
    btn.addEventListener('click', () => {
      if (letter !== 'ALL' && !activeLetters.has(letter)) return;
      state.selectedLetter = letter;
      progress.lastLetter = letter;
      saveProgress();
      renderLetterFilter();
      renderAll();
    });
    return btn;
  }

  function renderStats() {
    const counts = { New: 0, Learning: 0, Mastered: 0, Weak: 0 };
    WORDS.forEach(w => counts[getStatus(w)]++);
    const masteredPct = WORDS.length ? Math.round((counts.Mastered / WORDS.length) * 100) : 0;
    const currentVisible = getVisibleList().length;
    const items = [
      { key: 'all', label: 'Total Flashcards', value: WORDS.length.toLocaleString(), cls: '', action: () => resetHome() },
      { key: 'letters', label: 'Available Letters', value: `${[...activeLetters].sort()[0] || 'A'} to ${[...activeLetters].sort().slice(-1)[0] || 'Z'}`, cls: '', action: () => switchToFilter() },
      { key: 'current', label: 'Current View', value: state.selectedLetter === 'ALL' ? 'All' : state.selectedLetter, cls: '', action: () => switchToFilter() },
      { key: 'showing', label: 'Showing Now', value: currentVisible.toLocaleString(), cls: '', action: null },
      { key: 'new', label: 'New', value: counts.New.toLocaleString(), cls: 'new clickable', action: () => applyStatusFilter('New') },
      { key: 'learning', label: 'Learning', value: counts.Learning.toLocaleString(), cls: 'learning clickable', action: () => applyStatusFilter('Learning') },
      { key: 'mastered', label: 'Mastered', value: counts.Mastered.toLocaleString(), cls: 'mastered clickable', action: () => applyStatusFilter('Mastered') },
      { key: 'weak', label: 'Weak', value: counts.Weak.toLocaleString(), cls: 'weak clickable', action: () => applyWeakShortcut() },
      { key: 'progress', label: 'Mastered %', value: `${masteredPct}%`, cls: 'mastered clickable', action: () => applyStatusFilter('Mastered') }
    ];
    const frag = document.createDocumentFragment();
    items.forEach(item => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `stat-button ${item.cls || ''}`.trim();
      btn.innerHTML = `<span>${escapeHTML(item.label)}</span><strong>${escapeHTML(item.value)}</strong>`;
      if (item.action) btn.addEventListener('click', item.action);
      else btn.disabled = true;
      frag.appendChild(btn);
    });
    els.statsGrid.innerHTML = '';
    els.statsGrid.appendChild(frag);
  }

  function renderCards() {
    const visible = getVisibleList();
    state.currentList = visible;
    const modeText = state.mode === 'weak' ? 'Weak Review' : state.mode === 'browse' ? 'Browse All Words' : state.mode === 'focus' ? 'Focus Study' : 'Random Word Review';
    const statusText = state.statusFilter === 'ALL' ? '' : ` • ${state.statusFilter} only`;
    els.resultNote.textContent = visible.length
      ? `${visible.length} flashcard${visible.length === 1 ? '' : 's'} ready • ${modeText}${statusText}`
      : 'No flashcards match this filter. Try another search or filter.';

    const frag = document.createDocumentFragment();
    visible.forEach(word => {
      const status = getStatus(word);
      const card = document.createElement('article');
      card.className = 'word-card';
      card.innerHTML = `
        <div class="number">#${escapeHTML(word.id)}</div>
        <h3>${escapeHTML(cardTitle(word))}</h3>
        <div class="label-line">Picture Flashcard • Letter ${escapeHTML(word.letter)}</div>
        <div class="meaning-card">
          <div class="meaning-row"><span class="meaning-label">English</span><span class="meaning-text">${escapeHTML(englishMeaning(word))}</span></div>
          <div class="meaning-row"><span class="meaning-label">বাংলা</span><span class="meaning-text">${escapeHTML(banglaMeaning(word))}</span></div>
        </div>
        <span class="status-pill ${escapeHTML(status)}">Status: ${escapeHTML(status)}</span>
        <div class="card-actions"><button class="primary-btn" type="button">Open Picture Flashcard</button></div>
      `;
      card.querySelector('button').addEventListener('click', e => { e.stopPropagation(); openReader(word.uid, visible); });
      card.addEventListener('click', () => openReader(word.uid, visible));
      frag.appendChild(card);
    });
    els.cardGrid.innerHTML = '';
    els.cardGrid.appendChild(frag);
  }

  function recoverEmptyBlankView() {
    if (state.search.trim()) return;
    if (getVisibleList().length) return;
    state.selectedLetter = 'ALL';
    state.statusFilter = 'ALL';
    state.mode = 'browse';
    progress.lastLetter = 'ALL';
    progress.lastMode = 'browse';
    saveProgress();
    renderLetterFilter();
  }

  function isHomeState() {
    return state.selectedLetter === 'ALL'
      && state.search.trim() === ''
      && state.mode === 'browse'
      && state.statusFilter === 'ALL';
  }

  function updateMainHomeButton() {
    if (!els.mainHomeBtn) return;
    els.mainHomeBtn.classList.toggle('hidden', isHomeState());
  }

  function renderAll() {
    recoverEmptyBlankView();
    renderCards();
    renderStats();
    toggleSearchClear();
    syncModeButtons();
    updateMainHomeButton();
  }

  function ensureHomeHasContent() {
    if (getVisibleList().length) return;
    state.mode = 'browse';
    state.statusFilter = 'ALL';
    state.selectedLetter = 'ALL';
    state.search = '';
    if (els.searchInput) els.searchInput.value = '';
    renderLetterFilter();
  }

  function syncModeButtons() {
    document.querySelectorAll('.menu-mode-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.mode === state.mode));
    document.querySelectorAll('.drawer-tab').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === state.currentTab));
  }

  function toggleSearchClear() {
    if (!els.clearSearchBtn) return;
    els.clearSearchBtn.classList.toggle('hidden', !state.search.trim());
  }

  function openMenu(tab = 'filter') {
    state.currentTab = tab;
    syncModeButtons();
    els.menuDrawer.classList.remove('hidden');
    els.drawerBackdrop.classList.remove('hidden');
    els.menuBtn.setAttribute('aria-expanded', 'true');
    switchDrawerTab(tab);
  }
  function closeMenu() {
    els.menuDrawer.classList.add('hidden');
    els.drawerBackdrop.classList.add('hidden');
    els.menuBtn.setAttribute('aria-expanded', 'false');
  }
  function switchDrawerTab(tab) {
    state.currentTab = tab;
    els.filterSection.classList.toggle('hidden', tab !== 'filter');
    els.statsSection.classList.toggle('hidden', tab !== 'stats');
    syncModeButtons();
  }

  function resetHome() {
    state.selectedLetter = 'ALL';
    state.statusFilter = 'ALL';
    state.mode = 'browse';
    state.search = '';
    if (els.searchInput) els.searchInput.value = '';
    progress.lastLetter = 'ALL';
    progress.lastMode = 'browse';
    saveProgress();
    renderLetterFilter();
    renderAll();
    closeMenu();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function switchToFilter() {
    switchDrawerTab('filter');
  }
  function applyStatusFilter(status) {
    state.mode = 'browse';
    state.statusFilter = status;
    renderAll();
    closeMenu();
  }
  function applyWeakShortcut() {
    state.statusFilter = 'ALL';
    state.mode = 'weak';
    renderAll();
    closeMenu();
  }
  function setMode(mode) {
    state.mode = mode;
    progress.lastMode = mode;
    saveProgress();
    if (mode !== 'weak' && state.statusFilter === 'Weak') state.statusFilter = 'ALL';
    renderAll();
    if (mode === 'focus') focusStudy();
    if (mode === 'random') randomReview();
    if (mode === 'browse' || mode === 'weak') closeMenu();
  }

  function getWordByUid(uid) { return WORDS.find(w => w.uid === uid) || null; }
  function openReader(uid, list = null) {
    const word = getWordByUid(uid);
    if (!word) return;
    state.zoom = 'fit';
    const visible = list && list.length ? list : getVisibleList();
    state.currentList = visible.some(item => item.uid === uid) ? visible : WORDS.slice();
    state.currentUid = uid;
    progress.lastOpenedUid = uid;
    progress.lastOpenedId = word.id;
    progress.lastLetter = state.selectedLetter;
    progress.lastMode = state.mode;
    saveProgress();
    els.readerPanel.classList.remove('hidden');
    if (els.scrollTopBtn) els.scrollTopBtn.classList.add('hidden');
    document.body.style.overflow = 'hidden';
    renderReader();
  }
  function closeReader() {
    els.readerPanel.classList.add('hidden');
    document.body.style.overflow = '';
    if (els.scrollTopBtn) els.scrollTopBtn.classList.toggle('hidden', window.scrollY < 450);
    state.currentUid = null;
  }
  function renderReader() {
    const word = getWordByUid(state.currentUid);
    if (!word) return;
    const list = state.currentList.length ? state.currentList : getVisibleList();
    const index = list.findIndex(item => item.uid === word.uid);
    const status = getStatus(word);
    els.readerTitle.textContent = cardTitle(word);
    els.readerMeta.innerHTML = `
      <span class="meaning-chip"><strong>#${escapeHTML(word.id)}</strong></span>
      <span class="meaning-chip"><strong>English:</strong>&nbsp;${escapeHTML(englishMeaning(word))}</span>
      <span class="meaning-chip"><strong>বাংলা:</strong>&nbsp;${escapeHTML(banglaMeaning(word))}</span>
    `;
    els.readerPosition.textContent = index >= 0 ? `Position: ${index + 1} of ${list.length}` : 'Outside current filter';
    els.mainImage.src = word.image;
    els.mainImage.alt = `Word Smart 1 picture flashcard for word number ${word.id}`;
    els.readerPanel.scrollTop = 0;
    els.imageStage.scrollTop = 0;
    els.imageStage.scrollLeft = 0;
    const noPrev = index <= 0;
    const noNext = index < 0 || index >= list.length - 1;
    els.prevBtn.disabled = noPrev;
    els.nextBtn.disabled = noNext;
    if (els.prevBottomBtn) els.prevBottomBtn.disabled = noPrev;
    if (els.nextBottomBtn) els.nextBottomBtn.disabled = noNext;
    [...els.statusButtons.querySelectorAll('.status-btn')].forEach(btn => btn.classList.toggle('active', btn.dataset.status === status));
    applyZoom();
    preloadNext(index, list);
  }
  function go(delta) {
    const list = state.currentList.length ? state.currentList : getVisibleList();
    const index = list.findIndex(item => item.uid === state.currentUid);
    const target = list[index + delta];
    if (target) openReader(target.uid, list);
  }
  function applyZoom() {
    els.imageStage.classList.remove('actual');
    els.mainImage.style.maxWidth = '100vw';
    els.mainImage.style.maxHeight = 'none';
    els.mainImage.style.width = '100vw';
    els.mainImage.style.height = 'auto';
  }
  function setZoom(value) { state.zoom = value; applyZoom(); }
  function zoomBy(delta) {
    const levels = [75, 100, 125, 150, 175, 200];
    const current = state.zoom === 'fit' ? 100 : Number(state.zoom);
    let idx = levels.findIndex(v => v >= current);
    if (idx === -1) idx = levels.length - 1;
    idx = Math.max(0, Math.min(levels.length - 1, idx + (delta > 0 ? 1 : -1)));
    setZoom(levels[idx]);
  }
  function preloadNext(index, list) {
    const next = list[index + 1];
    if (!next) return;
    const img = new Image();
    img.src = next.image;
  }
  function findNearestById(id) {
    if (!WORDS.length) return null;
    let best = WORDS[0];
    let dist = Math.abs(best.id - id);
    for (const word of WORDS) {
      const d = Math.abs(word.id - id);
      if (d < dist) { best = word; dist = d; }
    }
    return best;
  }
  function focusStudy() {
    const list = getVisibleList();
    if (!list.length) return;
    const last = progress.lastOpenedUid ? list.find(w => w.uid === progress.lastOpenedUid) : null;
    openReader((last || list[0]).uid, list);
  }
  function randomReview() {
    const list = getVisibleList();
    if (!list.length) return;
    let pool = list;
    if (list.length > 1 && state.lastRandomUid) pool = list.filter(w => w.uid !== state.lastRandomUid);
    const target = pool[Math.floor(Math.random() * pool.length)];
    state.lastRandomUid = target.uid;
    openReader(target.uid, list);
  }

  function bindEvents() {
    if (els.mainHomeBtn) els.mainHomeBtn.addEventListener('click', resetHome);
    els.menuBtn.addEventListener('click', () => openMenu('filter'));
    els.closeMenuBtn.addEventListener('click', closeMenu);
    els.closeMenuBtn2.addEventListener('click', closeMenu);
    els.drawerBackdrop.addEventListener('click', closeMenu);
    els.tabFilterBtn.addEventListener('click', () => switchDrawerTab('filter'));
    els.tabStatsBtn.addEventListener('click', () => switchDrawerTab('stats'));
    els.homeBtn.addEventListener('click', resetHome);
    els.statsHomeBtn.addEventListener('click', resetHome);
    els.clearAllFiltersBtn.addEventListener('click', () => {
      state.statusFilter = 'ALL';
      state.mode = 'browse';
      state.selectedLetter = 'ALL';
      renderLetterFilter();
      renderAll();
      closeMenu();
    });
    els.searchInput.addEventListener('input', e => { state.search = e.target.value; renderAll(); });
    els.clearSearchBtn.addEventListener('click', () => { state.search = ''; els.searchInput.value = ''; renderAll(); els.searchInput.focus(); });
    document.querySelectorAll('.menu-mode-btn').forEach(btn => btn.addEventListener('click', () => setMode(btn.dataset.mode)));
    els.backBtn.addEventListener('click', closeReader);
    els.prevBtn.addEventListener('click', () => go(-1));
    els.nextBtn.addEventListener('click', () => go(1));
    if (els.prevBottomBtn) els.prevBottomBtn.addEventListener('click', () => go(-1));
    if (els.nextBottomBtn) els.nextBottomBtn.addEventListener('click', () => go(1));
    if (els.backBottomBtn) els.backBottomBtn.addEventListener('click', closeReader);
    els.statusButtons.addEventListener('click', e => {
      const btn = e.target.closest('.status-btn');
      if (!btn || !state.currentUid) return;
      setStatus(getWordByUid(state.currentUid), btn.dataset.status);
    });
    if (els.scrollTopBtn) {
      els.scrollTopBtn.addEventListener('click', () => {
        if (!els.readerPanel.classList.contains('hidden')) {
          els.readerPanel.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
      window.addEventListener('scroll', () => {
        if (els.readerPanel.classList.contains('hidden')) {
          els.scrollTopBtn.classList.toggle('hidden', window.scrollY < 450);
        }
      });
      els.readerPanel.addEventListener('scroll', () => {
        if (!els.readerPanel.classList.contains('hidden')) {
          els.scrollTopBtn.classList.toggle('hidden', els.readerPanel.scrollTop < 450);
        }
      });
    }
    document.addEventListener('keydown', handleKeyboard);
  }
  function handleKeyboard(e) {
    const el = document.activeElement;
    if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
    if (e.key === 'Escape') {
      if (!els.readerPanel.classList.contains('hidden')) { closeReader(); return; }
      if (!els.menuDrawer.classList.contains('hidden')) { closeMenu(); return; }
    }
    if (els.readerPanel.classList.contains('hidden')) {
      if (e.key.toLowerCase() === 'r') randomReview();
      return;
    }
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'ArrowRight') go(1);
    const status = ({ n: 'New', l: 'Learning', m: 'Mastered', w: 'Weak' })[e.key.toLowerCase()];
    if (status && state.currentUid) setStatus(getWordByUid(state.currentUid), status);
  }

  function init() {
    if (!WORDS || !WORDS.length) {
      els.resultNote.textContent = 'No flashcard data found.';
      return;
    }
    if (progress.lastLetter && (progress.lastLetter === 'ALL' || activeLetters.has(progress.lastLetter))) state.selectedLetter = progress.lastLetter;
    if (progress.lastMode) state.mode = progress.lastMode;
    renderLetterFilter();
    ensureHomeHasContent();
    renderAll();
    bindEvents();
  }
  init();
})();
