(() => {
  const LETTERS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
  const STORAGE_KEY = 'wordsmart-progress-v1';
  const STATUSES = ['New', 'Learning', 'Mastered', 'Weak'];

  const els = {
    continueBtn: document.getElementById('continueBtn'),
    progressBtn: document.getElementById('progressBtn'),
    resetBtn: document.getElementById('resetBtn'),
    statTotal: document.getElementById('statTotal'),
    statLetters: document.getElementById('statLetters'),
    statCurrent: document.getElementById('statCurrent'),
    statNew: document.getElementById('statNew'),
    statLearning: document.getElementById('statLearning'),
    statMastered: document.getElementById('statMastered'),
    statWeak: document.getElementById('statWeak'),
    statProgress: document.getElementById('statProgress'),
    activeSummary: document.getElementById('activeSummary'),
    letterFilter: document.getElementById('letterFilter'),
    searchInput: document.getElementById('searchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    resultNote: document.getElementById('resultNote'),
    cardGrid: document.getElementById('cardGrid'),
    galleryPanel: document.getElementById('galleryPanel'),
    readerPanel: document.getElementById('readerPanel'),
    backBtn: document.getElementById('backBtn'),
    backBottomBtn: document.getElementById('backBottomBtn'),
    readerTitle: document.getElementById('readerTitle'),
    readerMeta: document.getElementById('readerMeta'),
    readerPosition: document.getElementById('readerPosition'),
    openRawLink: document.getElementById('openRawLink'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    prevBottomBtn: document.getElementById('prevBottomBtn'),
    nextBottomBtn: document.getElementById('nextBottomBtn'),
    fitBtn: document.getElementById('fitBtn'),
    actualBtn: document.getElementById('actualBtn'),
    zoomOutBtn: document.getElementById('zoomOutBtn'),
    zoomInBtn: document.getElementById('zoomInBtn'),
    statusButtons: document.getElementById('statusButtons'),
    imageStage: document.getElementById('imageStage'),
    mainImage: document.getElementById('mainImage'),
    scrollTopBtn: document.getElementById('scrollTopBtn'),
    resetDialog: document.getElementById('resetDialog'),
    confirmResetBtn: document.getElementById('confirmResetBtn'),
    dashboard: document.querySelector('.dashboard')
  };

  const activeLetters = new Set((WORDS || []).map(w => w.letter));
  const state = {
    selectedLetter: 'ALL',
    search: '',
    mode: 'browse',
    currentUid: null,
    currentList: [],
    zoom: 'fit',
    lastRandomUid: null
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
  function englishMeaning(word) {
    return word.englishMeaning || 'Meaning not added yet';
  }
  function banglaMeaning(word) {
    return word.banglaMeaning || 'বাংলা অর্থ এখনো যোগ করা হয়নি';
  }
  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }
  function collectionLabel(active) {
    if (!active.size) return 'No letters';
    const arr = [...active].sort();
    return arr.length === 1 ? arr[0] : `${arr[0]} to ${arr[arr.length - 1]}`;
  }
  function modeLabel(mode) {
    return ({ browse: 'Browse All Words', focus: 'Focus Study', random: 'Random Word Review', weak: 'Weak Word Review' })[mode] || 'Browse All Words';
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
    return list.sort((a, b) => a.id - b.id || a.word.localeCompare(b.word));
  }
  function renderLetterFilter() {
    els.letterFilter.innerHTML = '';
    const allBtn = makeLetterBtn('ALL', true);
    els.letterFilter.appendChild(allBtn);
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
    btn.addEventListener('click', () => setLetter(letter));
    return btn;
  }
  function setLetter(letter) {
    if (letter !== 'ALL' && !activeLetters.has(letter)) return;
    state.selectedLetter = letter;
    progress.lastLetter = letter;
    saveProgress();
    renderLetterFilter();
    renderAll();
  }
  function renderDashboard() {
    const counts = { New: 0, Learning: 0, Mastered: 0, Weak: 0 };
    WORDS.forEach(w => counts[getStatus(w)]++);
    const pct = WORDS.length ? Math.round((counts.Mastered / WORDS.length) * 100) : 0;
    els.statTotal.textContent = WORDS.length.toLocaleString();
    els.statLetters.textContent = collectionLabel(activeLetters);
    els.statCurrent.textContent = state.selectedLetter === 'ALL' ? 'All' : state.selectedLetter;
    els.statNew.textContent = counts.New.toLocaleString();
    els.statLearning.textContent = counts.Learning.toLocaleString();
    els.statMastered.textContent = counts.Mastered.toLocaleString();
    els.statWeak.textContent = counts.Weak.toLocaleString();
    els.statProgress.textContent = `${pct}%`;
  }
  function renderSummary() {
    const visible = getVisibleList();
    const missing = LETTERS.filter(l => !activeLetters.has(l));
    const missingText = missing.length ? ` Missing letters currently inactive: ${missing.join(' ')}.` : ' Full A to Z currently available.';
    const view = state.selectedLetter === 'ALL' ? 'All available letters' : `Letter ${state.selectedLetter}`;
    els.activeSummary.textContent = `${collectionLabel(activeLetters)} active • ${view} • ${modeLabel(state.mode)} • ${visible.length} picture flashcard${visible.length === 1 ? '' : 's'} • Numeric order preserved.${missingText}`;
  }

  function toggleSearchClear() {
    if (!els.clearSearchBtn) return;
    els.clearSearchBtn.classList.toggle('hidden', !state.search.trim());
  }

  function renderCards() {
    const visible = getVisibleList();
    state.currentList = visible;
    els.resultNote.textContent = visible.length
      ? `${visible.length} flashcard${visible.length === 1 ? '' : 's'} ready. Open any card to read the exact original image.`
      : 'No flashcards match this filter. Try another letter or search term.';
    const frag = document.createDocumentFragment();
    visible.forEach(word => {
      const article = document.createElement('article');
      article.className = 'word-card';
      const status = getStatus(word);
      article.innerHTML = `
        <div class="number">#${escapeHTML(word.id)}</div>
        <h3>${escapeHTML(cardTitle(word))}</h3>
        <div class="label-line">Picture Flashcard • Letter ${escapeHTML(word.letter)}</div>
        <div class="meaning-card premium-meaning">
          <div class="meaning-row english-meaning">
            <span class="meaning-label">English</span>
            <span class="meaning-text">${escapeHTML(englishMeaning(word))}</span>
          </div>
          <div class="meaning-row bangla-meaning">
            <span class="meaning-label">বাংলা</span>
            <span class="meaning-text bangla-line">${escapeHTML(banglaMeaning(word))}</span>
          </div>
        </div>
        <span class="status-pill ${escapeHTML(status)}">Status: ${escapeHTML(status)}</span>
        <div class="card-actions"><button class="btn btn-primary" type="button">Open Picture Flashcard</button></div>
      `;
      article.querySelector('button').addEventListener('click', e => { e.stopPropagation(); openReader(word.uid, visible); });
      article.addEventListener('click', () => openReader(word.uid, visible));
      frag.appendChild(article);
    });
    els.cardGrid.innerHTML = '';
    els.cardGrid.appendChild(frag);
  }
  function renderAll() {
    renderDashboard();
    renderSummary();
    renderCards();
    toggleSearchClear();
  }
  function getWordByUid(uid) {
    return WORDS.find(w => w.uid === uid) || null;
  }
  function openReader(uid, list = null) {
    const word = getWordByUid(uid);
    if (!word) return;
    const visible = list && list.length ? list : getVisibleList();
    state.currentList = visible.some(item => item.uid === uid) ? visible : WORDS.slice();
    state.currentUid = uid;
    progress.lastOpenedUid = uid;
    progress.lastOpenedId = word.id;
    progress.lastLetter = state.selectedLetter;
    progress.lastMode = state.mode;
    saveProgress();
    els.galleryPanel.classList.add('hidden');
    els.readerPanel.classList.remove('hidden');
    renderReader();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function closeReader() {
    state.currentUid = null;
    els.readerPanel.classList.add('hidden');
    els.galleryPanel.classList.remove('hidden');
    renderAll();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function renderReader() {
    const word = getWordByUid(state.currentUid);
    if (!word) return;
    const list = state.currentList.length ? state.currentList : getVisibleList();
    const index = list.findIndex(item => item.uid === word.uid);
    const status = getStatus(word);
    els.readerTitle.textContent = `#${word.id} — ${cardTitle(word)}`;
    els.readerMeta.innerHTML = `
      <span class="meaning-chip meaning-chip-en"><span class="chip-label">English</span><span>${escapeHTML(englishMeaning(word))}</span></span>
      <span class="meaning-chip meaning-chip-bn"><span class="chip-label">বাংলা</span><span>${escapeHTML(banglaMeaning(word))}</span></span>
      <span class="reader-status-pill ${escapeHTML(status)}">Status: ${escapeHTML(status)}</span>
    `;
    els.readerPosition.textContent = index >= 0 ? `Position: ${index + 1} of ${list.length} in current list` : 'Outside current filter';
    els.mainImage.src = word.image;
    els.mainImage.alt = `Word Smart 1 picture flashcard for word number ${word.id}`;
    els.openRawLink.href = word.image;
    const noPrev = index <= 0;
    const noNext = index < 0 || index >= list.length - 1;
    [els.prevBtn, els.prevBottomBtn].forEach(el => el.disabled = noPrev);
    [els.nextBtn, els.nextBottomBtn].forEach(el => el.disabled = noNext);
    [...els.statusButtons.querySelectorAll('.status-btn')].forEach(btn => btn.classList.toggle('active', btn.dataset.status === status));
    applyZoom();
    preloadNext(index, list);
  }
  function go(delta) {
    const list = state.currentList.length ? state.currentList : getVisibleList();
    const index = list.findIndex(item => item.uid === state.currentUid);
    const next = list[index + delta];
    if (next) openReader(next.uid, list);
  }
  function applyZoom() {
    els.imageStage.classList.toggle('actual', state.zoom !== 'fit');
    if (state.zoom === 'fit') {
      els.mainImage.style.maxWidth = '100%';
      els.mainImage.style.width = '';
    } else {
      els.mainImage.style.maxWidth = 'none';
      els.mainImage.style.width = `${state.zoom}%`;
    }
  }
  function setZoom(value) { state.zoom = value; applyZoom(); }
  function zoomBy(delta) {
    const levels = [75, 100, 125, 150, 175, 200];
    const current = state.zoom === 'fit' ? 100 : Number(state.zoom);
    let i = levels.findIndex(v => v >= current);
    if (i === -1) i = levels.length - 1;
    i = Math.max(0, Math.min(levels.length - 1, i + (delta > 0 ? 1 : -1)));
    setZoom(levels[i]);
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
    let dist = Math.abs(WORDS[0].id - id);
    for (const word of WORDS) {
      const d = Math.abs(word.id - id);
      if (d < dist) { best = word; dist = d; }
    }
    return best;
  }
  function continueLast() {
    let target = progress.lastOpenedUid ? getWordByUid(progress.lastOpenedUid) : null;
    if (!target && progress.lastOpenedId) target = findNearestById(progress.lastOpenedId);
    if (!target) target = WORDS[0] || null;
    if (target) openReader(target.uid, WORDS);
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
  function setMode(mode) {
    state.mode = mode;
    progress.lastMode = mode;
    saveProgress();
    document.querySelectorAll('.mode-card').forEach(btn => btn.classList.toggle('active', btn.dataset.mode === mode));
    renderAll();
    if (mode === 'focus') focusStudy();
    if (mode === 'random') randomReview();
  }
  function resetProgress() {
    progress = freshProgress();
    saveProgress();
    renderAll();
    if (state.currentUid) renderReader();
  }
  function bindEvents() {
    els.continueBtn.addEventListener('click', continueLast);
    els.progressBtn.addEventListener('click', () => els.dashboard.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    els.resetBtn.addEventListener('click', () => {
      if (typeof els.resetDialog.showModal === 'function') els.resetDialog.showModal();
      else if (confirm('Reset all progress?')) resetProgress();
    });
    els.confirmResetBtn.addEventListener('click', () => resetProgress());
    els.searchInput.addEventListener('input', e => { state.search = e.target.value; renderAll(); });
    if (els.clearSearchBtn) els.clearSearchBtn.addEventListener('click', () => { state.search = ''; els.searchInput.value = ''; renderAll(); els.searchInput.focus(); });
    document.querySelectorAll('.mode-card').forEach(btn => btn.addEventListener('click', () => setMode(btn.dataset.mode)));
    els.backBtn.addEventListener('click', closeReader);
    els.backBottomBtn.addEventListener('click', closeReader);
    els.prevBtn.addEventListener('click', () => go(-1));
    els.nextBtn.addEventListener('click', () => go(1));
    els.prevBottomBtn.addEventListener('click', () => go(-1));
    els.nextBottomBtn.addEventListener('click', () => go(1));
    els.fitBtn.addEventListener('click', () => setZoom('fit'));
    els.actualBtn.addEventListener('click', () => setZoom(100));
    els.zoomOutBtn.addEventListener('click', () => zoomBy(-1));
    els.zoomInBtn.addEventListener('click', () => zoomBy(1));
    els.statusButtons.addEventListener('click', e => {
      const btn = e.target.closest('.status-btn');
      if (!btn || !state.currentUid) return;
      setStatus(getWordByUid(state.currentUid), btn.dataset.status);
    });
    els.scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    window.addEventListener('scroll', () => els.scrollTopBtn.classList.toggle('visible', window.scrollY > 480));
    document.addEventListener('keydown', handleKeyboard);
  }
  function handleKeyboard(e) {
    const el = document.activeElement;
    if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
    const key = e.key;
    if (key === 'Escape' && !els.readerPanel.classList.contains('hidden')) { closeReader(); return; }
    if (els.readerPanel.classList.contains('hidden')) {
      if (key.toLowerCase() === 'r') randomReview();
      return;
    }
    if (key === 'ArrowLeft') go(-1);
    if (key === 'ArrowRight') go(1);
    if (key === '+' || key === '=') zoomBy(1);
    if (key === '-' || key === '_') zoomBy(-1);
    if (key === '0') setZoom(100);
    if (key.toLowerCase() === 'f') setZoom('fit');
    if (key.toLowerCase() === 'r') randomReview();
    const map = { n: 'New', l: 'Learning', m: 'Mastered', w: 'Weak' };
    const status = map[key.toLowerCase()];
    if (status && state.currentUid) setStatus(getWordByUid(state.currentUid), status);
  }
  function init() {
    if (!WORDS || !WORDS.length) {
      els.resultNote.textContent = 'No flashcard data found. Run tools/generate_words.py first.';
      return;
    }
    if (progress.lastLetter && (progress.lastLetter === 'ALL' || activeLetters.has(progress.lastLetter))) state.selectedLetter = progress.lastLetter;
    if (progress.lastMode) state.mode = progress.lastMode;
    renderLetterFilter();
    bindEvents();
    renderAll();
    document.querySelectorAll('.mode-card').forEach(btn => btn.classList.toggle('active', btn.dataset.mode === state.mode));
  }
  init();
})();
