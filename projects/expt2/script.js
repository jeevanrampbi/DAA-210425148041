/* ===========================================================
   Smart Document Search — script.js
   Split into two parts:
     1. Algorithms  — pure string-matching functions (no DOM code)
     2. App         — UI wiring, state, rendering
   =========================================================== */

/* ===========================================================
   1. ALGORITHMS
   Each search function returns:
     { positions: number[], steps: Step[] }
   `steps` is a trace of what the algorithm did, character by
   character, so the visualizer can replay the exact same logic
   the search used (no separate "fake" animation).
   =========================================================== */

const Algorithms = (() => {

  /** Naive Search: try every starting position, compare char by char. */
  function naiveSearch(text, pattern) {
    const n = text.length, m = pattern.length;
    const positions = [];
    const steps = [];
    if (m === 0 || m > n) return { positions, steps };

    for (let shift = 0; shift <= n - m; shift++) {
      let j = 0;
      while (j < m && text[shift + j] === pattern[j]) {
        steps.push({ algo: 'naive', shift, j, type: 'compare' });
        j++;
      }
      if (j === m) {
        steps.push({ algo: 'naive', shift, j: m - 1, type: 'match' });
        positions.push(shift);
      } else {
        steps.push({ algo: 'naive', shift, j, type: 'mismatch' });
      }
    }
    return { positions, steps };
  }

  /** Builds the LPS (Longest Prefix that is also a Suffix) array used by KMP. */
  function computeLPS(pattern) {
    const m = pattern.length;
    const lps = new Array(m).fill(0);
    let len = 0, i = 1;
    while (i < m) {
      if (pattern[i] === pattern[len]) {
        len++;
        lps[i] = len;
        i++;
      } else if (len !== 0) {
        len = lps[len - 1]; // fall back using the LPS array, no re-scanning text
      } else {
        lps[i] = 0;
        i++;
      }
    }
    return lps;
  }

  /** KMP Search: uses the LPS array to skip re-checking characters after a mismatch. */
  function kmpSearch(text, pattern) {
    const n = text.length, m = pattern.length;
    const positions = [];
    const steps = [];
    if (m === 0 || m > n) return { positions, steps, lps: [] };

    const lps = computeLPS(pattern);
    let i = 0, j = 0;

    while (i < n) {
      if (text[i] === pattern[j]) {
        steps.push({ algo: 'kmp', shift: i - j, i, j, type: 'compare' });
        i++; j++;
        if (j === m) {
          steps.push({ algo: 'kmp', shift: i - j, i: i - 1, j: m - 1, type: 'match' });
          positions.push(i - j);
          const newJ = lps[j - 1];
          steps.push({ algo: 'kmp', shift: i - newJ, i, j: newJ, type: 'skip', from: j, to: newJ });
          j = newJ;
        }
      } else if (j !== 0) {
        steps.push({ algo: 'kmp', shift: i - j, i, j, type: 'mismatch' });
        const newJ = lps[j - 1];
        steps.push({ algo: 'kmp', shift: i - newJ, i, j: newJ, type: 'skip', from: j, to: newJ });
        j = newJ;
      } else {
        steps.push({ algo: 'kmp', shift: i - j, i, j, type: 'mismatch' });
        i++;
      }
    }
    return { positions, steps, lps };
  }

  /** Rabin-Karp: rolling hash to quickly rule out non-matches, then verifies real matches. */
  function rabinKarp(text, pattern) {
    const n = text.length, m = pattern.length;
    const positions = [];
    const steps = [];
    if (m === 0 || m > n) return { positions, steps };

    const BASE = 256;
    const MOD = 1000003; // a prime, large enough to keep collisions rare for demo text

    let patternHash = 0;
    let windowHash = 0;
    let highOrder = 1; // BASE^(m-1) % MOD, used to "drop" the leading character when sliding

    for (let i = 0; i < m - 1; i++) highOrder = (highOrder * BASE) % MOD;

    for (let i = 0; i < m; i++) {
      patternHash = (BASE * patternHash + pattern.charCodeAt(i)) % MOD;
      windowHash = (BASE * windowHash + text.charCodeAt(i)) % MOD;
    }

    for (let shift = 0; shift <= n - m; shift++) {
      const hashesMatch = patternHash === windowHash;
      steps.push({
        algo: 'rabinkarp', shift, patternHash, windowHash,
        type: hashesMatch ? 'hashmatch' : 'hashmismatch'
      });

      if (hashesMatch) {
        // Hashes matching doesn't guarantee equal strings — verify character by character.
        let realMatch = true;
        for (let k = 0; k < m; k++) {
          if (text[shift + k] !== pattern[k]) { realMatch = false; break; }
        }
        steps.push({ algo: 'rabinkarp', shift, type: realMatch ? 'match' : 'falsepositive' });
        if (realMatch) positions.push(shift);
      }

      if (shift < n - m) {
        windowHash = (BASE * (windowHash - text.charCodeAt(shift) * highOrder) + text.charCodeAt(shift + m)) % MOD;
        if (windowHash < 0) windowHash += MOD;
      }
    }
    return { positions, steps };
  }

  return { naiveSearch, computeLPS, kmpSearch, rabinKarp };
})();


/* ===========================================================
   2. APP — UI state, wiring, rendering
   =========================================================== */

const App = (() => {

  // ---------- Sample documents ----------
  const SAMPLES = {
    ml:
`Machine learning is a branch of artificial intelligence.
Machine learning allows computers to learn from data.
Deep learning is a specialized form of machine learning.
Modern applications use machine learning for recommendation,
prediction, classification, and pattern recognition.`,

    space:
`Space exploration is the ongoing discovery of outer space.
Space exploration relies on advances in rocket technology.
Robotic space exploration missions have visited every planet.
Human space exploration continues with the goal of returning
astronauts to the Moon and eventually sending them to Mars.`,

    net:
`A computer network connects multiple devices to share data.
Every computer network relies on protocols such as TCP/IP.
Wireless computer networks use radio signals instead of cables.
Modern computer networks support routing, switching, and
security measures to keep data safe as it travels.`
  };

  // ---------- Cached DOM elements ----------
  const el = {};
  function cacheDom() {
    [
      'docInput', 'sampleSelect', 'loadSampleBtn', 'fileInput', 'clearBtn',
      'charCount', 'wordCount', 'searchInput', 'algoSelect', 'caseSensitive',
      'resetBtn', 'searchBtn', 'resultsBody', 'highlightCard', 'highlightPanel',
      'vizAlgoSelect', 'visualizeBtn', 'vizBody', 'statusIndicator', 'statusText'
    ].forEach(id => el[id] = document.getElementById(id));
  }

  // ---------- App state ----------
  const state = {
    lastRun: null // { queryText, patternText, caseSensitive, resultsByAlgo }
  };

  // ---------- Utility ----------
  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function countWords(text) {
    const trimmed = text.trim();
    return trimmed === '' ? 0 : trimmed.split(/\s+/).length;
  }

  function setStatus(text, busy = false) {
    el.statusText.textContent = text;
    el.statusIndicator.classList.toggle('busy', busy);
  }

  function formatTime(ms) {
    if (ms < 0.001) return '< 0.001 ms';
    return `${ms.toFixed(3)} ms`;
  }

  // ---------- Document input handling ----------
  function updateDocStats() {
    const text = el.docInput.value;
    el.charCount.textContent = text.length;
    el.wordCount.textContent = countWords(text);
    updateSearchButtonState();
  }

  function updateSearchButtonState() {
    const hasDoc = el.docInput.value.trim().length > 0;
    const hasQuery = el.searchInput.value.trim().length > 0;
    el.searchBtn.disabled = !(hasDoc && hasQuery);
  }

  function loadSample(key) {
    if (!key || !SAMPLES[key]) return;
    el.docInput.value = SAMPLES[key];
    updateDocStats();
    setStatus('Sample loaded');
  }

  // ---------- Search execution ----------
  function normalizeForSearch(str, caseSensitive) {
    return caseSensitive ? str : str.toLowerCase();
  }

  function runAlgorithm(algoKey, text, pattern) {
    const t0 = performance.now();
    let result;
    if (algoKey === 'naive') result = Algorithms.naiveSearch(text, pattern);
    else if (algoKey === 'kmp') result = Algorithms.kmpSearch(text, pattern);
    else result = Algorithms.rabinKarp(text, pattern);
    const t1 = performance.now();
    return { ...result, timeMs: t1 - t0 };
  }

  function handleSearch() {
    const rawDoc = el.docInput.value;
    const rawQuery = el.searchInput.value;

    if (!rawDoc.trim() || !rawQuery.trim()) return;

    const caseSensitive = el.caseSensitive.checked;
    const searchText = normalizeForSearch(rawDoc, caseSensitive);
    const searchPattern = normalizeForSearch(rawQuery, caseSensitive);
    const algoChoice = el.algoSelect.value;

    setStatus('Searching…', true);

    const algosToRun = algoChoice === 'compare' ? ['naive', 'kmp', 'rabinkarp'] : [algoChoice];
    const resultsByAlgo = {};
    algosToRun.forEach(a => {
      resultsByAlgo[a] = runAlgorithm(a, searchText, searchPattern);
    });

    state.lastRun = {
      rawDoc, rawQuery, caseSensitive,
      searchText, searchPattern,
      algoChoice, resultsByAlgo
    };

    renderResults();
    renderHighlight();
    setStatus('Ready');
  }

  // ---------- Results rendering ----------
  const ALGO_LABELS = { naive: 'Naive Search', kmp: 'KMP', rabinkarp: 'Rabin-Karp' };
  const ALGO_COMPLEXITY = { naive: 'O(nm)', kmp: 'O(n+m)', rabinkarp: 'O(n+m)*' };

  function renderResults() {
    const { algoChoice, resultsByAlgo, searchPattern } = state.lastRun;

    if (searchPattern.length === 0) {
      el.resultsBody.innerHTML = `<div class="empty-state">Enter a search query to see results.</div>`;
      return;
    }

    if (algoChoice !== 'compare') {
      const r = resultsByAlgo[algoChoice];
      if (r.positions.length === 0) {
        el.resultsBody.innerHTML = `<div class="no-match-state">No matches found for "${escapeHtml(state.lastRun.rawQuery)}".</div>`;
        return;
      }
      el.resultsBody.innerHTML = `
        <div class="result-grid">
          <div class="stat-card">
            <div class="stat-label">Matches Found</div>
            <div class="stat-value">${r.positions.length}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Search Time</div>
            <div class="stat-value">${formatTime(r.timeMs)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Algorithm</div>
            <div class="stat-value small">${ALGO_LABELS[algoChoice]} · ${ALGO_COMPLEXITY[algoChoice]}</div>
          </div>
        </div>
        <div class="result-positions">Positions: ${r.positions.join(', ')}</div>
      `;
      return;
    }

    // Compare-all mode
    const entries = Object.entries(resultsByAlgo); // [ [algoKey, result], ... ]
    const anyMatches = entries.some(([, r]) => r.positions.length > 0);

    if (!anyMatches) {
      el.resultsBody.innerHTML = `<div class="no-match-state">No matches found for "${escapeHtml(state.lastRun.rawQuery)}".</div>`;
      return;
    }

    const fastestKey = entries.reduce((best, [key, r]) =>
      (best === null || r.timeMs < resultsByAlgo[best].timeMs) ? key : best, null);

    const cards = entries.map(([key, r]) => `
      <div class="algo-card ${key === fastestKey ? 'fastest' : ''}">
        <div class="algo-name">
          ${ALGO_LABELS[key]}
          ${key === fastestKey ? '<span class="fastest-badge">FASTEST</span>' : ''}
        </div>
        <div class="algo-metric"><span class="metric-label">Matches</span><span class="metric-value">${r.positions.length}</span></div>
        <div class="algo-metric"><span class="metric-label">Time</span><span class="metric-value">${formatTime(r.timeMs)}</span></div>
        <div class="algo-metric"><span class="metric-label">Complexity</span><span class="metric-value">${ALGO_COMPLEXITY[key]}</span></div>
      </div>
    `).join('');

    const positions = resultsByAlgo[fastestKey].positions;

    el.resultsBody.innerHTML = `
      <div class="algo-compare-grid">${cards}</div>
      <div class="result-positions">Positions (${ALGO_LABELS[fastestKey]}): ${positions.join(', ')}</div>
      <p class="note">Timings are measured with <code>performance.now()</code> on a single run of this document. For very short text the difference between algorithms is often just measurement noise, not a reliable performance signal.</p>
    `;
  }

  // ---------- Highlighted document ----------
  function renderHighlight() {
    const { rawDoc, resultsByAlgo, algoChoice, searchPattern } = state.lastRun;

    if (searchPattern.length === 0) {
      el.highlightCard.hidden = true;
      return;
    }

    // Use whichever algorithm's positions are available (they should all agree).
    const anyResult = algoChoice === 'compare' ? resultsByAlgo.naive : resultsByAlgo[algoChoice];
    const positions = anyResult.positions;

    if (positions.length === 0) {
      el.highlightCard.hidden = true;
      return;
    }

    const m = searchPattern.length;
    let html = '';
    let cursor = 0;
    positions.forEach(pos => {
      html += escapeHtml(rawDoc.slice(cursor, pos));
      html += `<mark>${escapeHtml(rawDoc.slice(pos, pos + m))}</mark>`;
      cursor = pos + m;
    });
    html += escapeHtml(rawDoc.slice(cursor));

    el.highlightPanel.innerHTML = html;
    el.highlightCard.hidden = false;
  }

  // ---------- Visualization ----------
  const viz = {
    steps: [], text: '', pattern: '', index: 0, timer: null, playing: false
  };

  function buildVizData() {
    const algo = el.vizAlgoSelect.value;
    const caseSensitive = el.caseSensitive.checked;
    const rawDoc = el.docInput.value;
    const rawQuery = el.searchInput.value;

    if (!rawDoc.trim() || !rawQuery.trim()) {
      el.vizBody.innerHTML = `<div class="empty-state">Add a document and a search query first.</div>`;
      return null;
    }

    // Keep the visualization readable: show at most the first 70 characters of the document.
    const VIZ_LIMIT = 70;
    const truncated = rawDoc.length > VIZ_LIMIT;
    const vizDocRaw = rawDoc.slice(0, VIZ_LIMIT);
    const text = normalizeForSearch(vizDocRaw, caseSensitive);
    const pattern = normalizeForSearch(rawQuery, caseSensitive);

    if (pattern.length > text.length) {
      el.vizBody.innerHTML = `<div class="empty-state">Search query is longer than the visible text window, nothing to visualize.</div>`;
      return null;
    }

    let result;
    if (algo === 'naive') result = Algorithms.naiveSearch(text, pattern);
    else if (algo === 'kmp') result = Algorithms.kmpSearch(text, pattern);
    else result = Algorithms.rabinKarp(text, pattern);

    const MAX_STEPS = 250;
    const steps = result.steps.slice(0, MAX_STEPS);

    return { algo, text: vizDocRaw, pattern: rawQuery, steps, truncated };
  }

  function startVisualization() {
    stopPlayback();
    const data = buildVizData();
    if (!data) return;

    viz.algo = data.algo;
    viz.text = data.text;
    viz.pattern = data.pattern;
    viz.steps = data.steps;
    viz.truncated = data.truncated;
    viz.index = 0;

    renderVizShell();
    if (viz.steps.length === 0) {
      el.vizBody.querySelector('.viz-step-info').textContent = 'No comparisons were needed for this input.';
      return;
    }
    renderVizStep();
    play();
  }

  function renderVizShell() {
    el.vizBody.innerHTML = `
      <div class="viz-wrap">
        <div class="viz-controls">
          <button class="btn btn-secondary" id="vizPrev">◀ Prev</button>
          <button class="btn btn-secondary" id="vizPlayPause">Pause</button>
          <button class="btn btn-secondary" id="vizNext">Next ▶</button>
          <button class="btn btn-ghost" id="vizRestart">Restart</button>
          <span class="viz-progress" id="vizProgress"></span>
        </div>
        <div class="viz-track">
          <div class="viz-label">Text${viz.truncated ? ' (first 70 characters shown)' : ''}</div>
          <div class="viz-row" id="vizTextRow"></div>
          <div class="viz-label">Pattern</div>
          <div class="viz-row" id="vizPatternRow"></div>
        </div>
        <div class="viz-step-info" id="vizStepInfo"></div>
      </div>
    `;
    document.getElementById('vizPrev').addEventListener('click', () => { pause(); stepBy(-1); });
    document.getElementById('vizNext').addEventListener('click', () => { pause(); stepBy(1); });
    document.getElementById('vizPlayPause').addEventListener('click', togglePlay);
    document.getElementById('vizRestart').addEventListener('click', () => {
      viz.index = 0;
      renderVizStep();
      play();
    });
  }

  function stepBy(delta) {
    const next = viz.index + delta;
    if (next < 0 || next >= viz.steps.length) return;
    viz.index = next;
    renderVizStep();
  }

  function play() {
    viz.playing = true;
    const btn = document.getElementById('vizPlayPause');
    if (btn) btn.textContent = 'Pause';
    clearInterval(viz.timer);
    viz.timer = setInterval(() => {
      if (viz.index >= viz.steps.length - 1) { pause(); return; }
      viz.index++;
      renderVizStep();
    }, 450);
  }

  function pause() {
    viz.playing = false;
    clearInterval(viz.timer);
    const btn = document.getElementById('vizPlayPause');
    if (btn) btn.textContent = 'Play';
  }

  function togglePlay() {
    if (viz.playing) pause(); else play();
  }

  function stopPlayback() {
    clearInterval(viz.timer);
    viz.playing = false;
  }

  function renderVizStep() {
    const step = viz.steps[viz.index];
    const textRow = document.getElementById('vizTextRow');
    const patternRow = document.getElementById('vizPatternRow');
    const info = document.getElementById('vizStepInfo');
    const progress = document.getElementById('vizProgress');

    progress.textContent = `Step ${viz.index + 1} / ${viz.steps.length}`;

    const text = viz.text;
    const pattern = viz.pattern;
    const m = pattern.length;
    const shift = step.shift;

    // Determine which text/pattern indices to highlight and how.
    let highlightRange = []; // list of {idx, cls} within pattern-relative index 0..m-1

    if (step.type === 'compare') {
      const j = step.j;
      highlightRange = [{ idx: j, cls: 'compare' }];
    } else if (step.type === 'mismatch') {
      highlightRange = [{ idx: step.j, cls: 'mismatch' }];
    } else if (step.type === 'match') {
      for (let k = 0; k < m; k++) highlightRange.push({ idx: k, cls: 'match' });
    } else if (step.type === 'skip') {
      highlightRange = []; // no direct char highlight, described in info text
    } else if (step.type === 'hashmatch' || step.type === 'hashmismatch') {
      const cls = step.type === 'hashmatch' ? 'compare' : 'mismatch';
      for (let k = 0; k < m; k++) highlightRange.push({ idx: k, cls });
    } else if (step.type === 'falsepositive') {
      for (let k = 0; k < m; k++) highlightRange.push({ idx: k, cls: 'mismatch' });
    }

    // Build TEXT row
    textRow.innerHTML = text.split('').map((ch, idx) => {
      const rel = idx - shift;
      const hit = highlightRange.find(h => h.idx === rel);
      const cls = hit ? hit.cls : '';
      return `<div class="viz-cell ${cls}">${escapeHtml(ch === ' ' ? '·' : ch)}</div>`;
    }).join('');

    // Build PATTERN row: ghost cells to push the pattern into alignment, then pattern chars.
    let patternHtml = '';
    for (let g = 0; g < shift; g++) patternHtml += `<div class="viz-cell ghost"></div>`;
    patternHtml += pattern.split('').map((ch, idx) => {
      const hit = highlightRange.find(h => h.idx === idx);
      const cls = hit ? hit.cls : '';
      return `<div class="viz-cell ${cls}">${escapeHtml(ch === ' ' ? '·' : ch)}</div>`;
    }).join('');
    patternRow.innerHTML = patternHtml;

    info.innerHTML = describeStep(step, viz.algo);
  }

  function describeStep(step, algo) {
    if (algo === 'rabinkarp') {
      if (step.type === 'hashmatch') return `Shift ${step.shift}: pattern hash <strong>${step.patternHash}</strong> = window hash <strong>${step.windowHash}</strong> → <span class="ok">verifying characters…</span>`;
      if (step.type === 'hashmismatch') return `Shift ${step.shift}: pattern hash <strong>${step.patternHash}</strong> ≠ window hash <strong>${step.windowHash}</strong> → <span class="skip">skip, no character check needed</span>`;
      if (step.type === 'match') return `Shift ${step.shift}: characters verified → <span class="ok">confirmed match</span>`;
      if (step.type === 'falsepositive') return `Shift ${step.shift}: hashes matched but characters differ → <span class="bad">hash collision, not a real match</span>`;
    }
    if (algo === 'kmp') {
      if (step.type === 'compare') return `Comparing text[${step.i}] with pattern[${step.j}] → <span class="ok">match, move both pointers forward</span>`;
      if (step.type === 'mismatch') return `Comparing text[${step.i}] with pattern[${step.j}] → <span class="bad">mismatch</span>`;
      if (step.type === 'match') return `Pattern fully matched ending at text[${step.i}] → <span class="ok">match found</span>`;
      if (step.type === 'skip') return `Using LPS array: instead of restarting, jump pattern pointer from ${step.from} to <span class="skip">${step.to}</span> (no backtracking in the text)`;
    }
    // naive
    if (step.type === 'compare') return `Shift ${step.shift}: comparing text and pattern at offset ${step.j} → <span class="ok">match, keep comparing</span>`;
    if (step.type === 'mismatch') return `Shift ${step.shift}: comparing text and pattern at offset ${step.j} → <span class="bad">mismatch, slide pattern one position right</span>`;
    if (step.type === 'match') return `Shift ${step.shift}: all characters matched → <span class="ok">match found</span>`;
    return '';
  }

  // ---------- Reset / clear ----------
  function clearDocument() {
    el.docInput.value = '';
    el.sampleSelect.value = '';
    updateDocStats();
    setStatus('Document cleared');
  }

  function resetAll() {
    stopPlayback();
    el.docInput.value = '';
    el.searchInput.value = '';
    el.sampleSelect.value = '';
    el.algoSelect.value = 'compare';
    el.caseSensitive.checked = false;
    state.lastRun = null;
    updateDocStats();
    updateSearchButtonState();
    el.resultsBody.innerHTML = `<div class="empty-state">Enter a document and a search query, then press <strong>Search</strong> to see results here.</div>`;
    el.highlightCard.hidden = true;
    el.vizBody.innerHTML = `<div class="empty-state">Run a search first, then press <strong>Visualize</strong> to watch the algorithm compare the pattern against the text step by step.</div>`;
    setStatus('Ready');
  }

  // ---------- File upload ----------
  function handleFileUpload(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      el.docInput.value = e.target.result || '';
      el.sampleSelect.value = '';
      updateDocStats();
      setStatus(el.docInput.value ? 'File loaded' : 'Uploaded file was empty');
    };
    reader.onerror = () => setStatus('Could not read file');
    reader.readAsText(file);
  }

  // ---------- Event wiring ----------
  function bindEvents() {
    el.docInput.addEventListener('input', updateDocStats);
    el.searchInput.addEventListener('input', updateSearchButtonState);

    el.loadSampleBtn.addEventListener('click', () => {
      const key = el.sampleSelect.value || 'ml';
      el.sampleSelect.value = key;
      loadSample(key);
    });
    el.sampleSelect.addEventListener('change', () => loadSample(el.sampleSelect.value));

    el.clearBtn.addEventListener('click', clearDocument);
    el.resetBtn.addEventListener('click', resetAll);

    el.fileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      handleFileUpload(file);
      el.fileInput.value = '';
    });

    el.searchBtn.addEventListener('click', handleSearch);
    el.visualizeBtn.addEventListener('click', startVisualization);

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!el.searchBtn.disabled) handleSearch();
      }
    });
  }

  // ---------- Init ----------
  function init() {
    cacheDom();
    bindEvents();
    updateDocStats();
    setStatus('Ready');
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', App.init);
