/* =========================================================
   ProfApp — Multi-page portfolio JS
   ========================================================= */

const DATA  = './data';
const PAGES = ['home','publications','projects','conferences','phd','background','contact','portal'];

// Set this to your deployed API URL (e.g. Render) when not running locally.
// Local dev uses '' (same-origin). Replace the URL below after deploying to Render.
const API_BASE = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? ''
  : 'https://profapp-api.onrender.com'; // ← replace with your Render URL

async function fetchJson(file) {
  const r = await fetch(`${DATA}/${file}`);
  if (!r.ok) throw new Error(`Could not load ${file}`);
  return r.json();
}

function clean(v) {
  if (v === null || v === undefined || v === '' || v === 'null' || v === '-') return '';
  return String(v).trim();
}

// ── Badge helpers ─────────────────────────────────────────
function ratingBadge(r) {
  const v = clean(r);
  if (!v) return '';
  const cls = v === 'A*' ? 'badge-red' : v === 'A' ? 'badge-ink' : v === 'B' ? 'badge-moss' : 'badge-gray';
  return `<span class="badge ${cls}">ABDC ${v}</span>`;
}
function scopusBadge(v) {
  const s = clean(v);
  if (!s) return '';
  if (s.includes('SSCI'))                  return `<span class="badge badge-green">SSCI</span>`;
  if (s.toLowerCase().includes('scopus'))  return `<span class="badge badge-moss">Scopus</span>`;
  return '';
}
function statusBadge(s) {
  const v = clean(s);
  if (!v) return '';
  const l = v.toLowerCase();
  if (l.includes('approv') || l.includes('sanctioned') || l.includes('complete'))
    return `<span class="badge badge-green">${v}</span>`;
  if (l.includes('reject') || l.includes('not shortlist'))
    return `<span class="badge badge-gray">${v}</span>`;
  return `<span class="badge badge-ink">${v}</span>`;
}

// ── Auth helpers ──────────────────────────────────────────
const AUTH_KEY = 'profapp_auth';

function getAuth() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY)) || null; } catch { return null; }
}
function setAuth(data) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(data));
}
function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
}
function isLoggedIn() { return !!getAuth(); }
function getRole()    { return (getAuth() || {}).role || ''; }

function updateNavAuth() {
  const auth = getAuth();
  const loginItem  = document.getElementById('navLoginItem');
  const authItem   = document.getElementById('navAuthItem');
  const portalItem = document.getElementById('navPortalItem');

  if (auth) {
    loginItem.style.display  = 'none';
    authItem.classList.add('visible');
    document.getElementById('navUserName').textContent = auth.name || auth.username || '';
    document.getElementById('navUserRole').textContent = auth.role || '';
    portalItem.style.display = auth.role === 'admin' || auth.role === 'scholar' || auth.role === 'faculty'
      ? 'block' : 'none';
  } else {
    loginItem.style.display  = '';
    authItem.classList.remove('visible');
    portalItem.style.display = 'none';
  }
}

// ── Page router ───────────────────────────────────────────
function showPage(pageId) {
  if (!PAGES.includes(pageId)) pageId = 'home';
  if (pageId === 'portal' && !isLoggedIn()) {
    openLoginModal();
    return;
  }
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById('page-' + pageId);
  if (page) page.classList.add('active');
  document.querySelectorAll('#navLinks a[data-page]').forEach(a =>
    a.classList.toggle('active', a.dataset.page === pageId));
  history.replaceState(null, '', '#' + pageId);
  window.scrollTo(0, 0);
  if (pageId === 'portal') renderPortal();
}

// ── Login modal ───────────────────────────────────────────
function openLoginModal() {
  document.getElementById('loginModal').classList.add('open');
  document.getElementById('loginUser').focus();
}
function closeLoginModal() {
  document.getElementById('loginModal').classList.remove('open');
  document.getElementById('loginError').style.display = 'none';
  document.getElementById('loginError').textContent = '';
  document.getElementById('loginUser').value = '';
  document.getElementById('loginPass').value = '';
}

async function submitLogin() {
  const username = document.getElementById('loginUser').value.trim();
  const password = document.getElementById('loginPass').value;
  const errEl    = document.getElementById('loginError');
  const btn      = document.getElementById('loginSubmit');

  errEl.style.display = 'none';
  btn.textContent = 'Signing in…';
  btn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) {
      errEl.textContent = data.error || 'Invalid credentials.';
      errEl.style.display = 'block';
    } else {
      setAuth({ token: data.token, role: data.role, name: data.name, username });
      updateNavAuth();
      closeLoginModal();
      showPage('portal');
    }
  } catch (e) {
    errEl.textContent = 'Cannot reach server. Run the local server (npm start) to login.';
    errEl.style.display = 'block';
  }

  btn.textContent = 'Sign In';
  btn.disabled = false;
}

// ── Portal rendering ──────────────────────────────────────
let _portalLoaded = false;

async function renderPortal() {
  if (_portalLoaded) return;
  _portalLoaded = true;

  const auth = getAuth();
  if (!auth) return;

  document.getElementById('portalSubtitle').textContent =
    `Welcome, ${auth.name || auth.username} (${auth.role})`;

  // Pipeline
  try {
    const res = await fetch(`${API_BASE}/api/data/Pipeline`, {
      headers: { Authorization: `Bearer ${auth.token}` }
    });
    const { rows } = await res.json();
    const listEl = document.getElementById('pipelineList');
    listEl.innerHTML = '';
    const valid = rows.filter(r => clean(r['Title']));
    if (!valid.length) {
      listEl.innerHTML = '<p style="color:var(--ink-3);font-size:.84rem">No pipeline records.</p>';
    } else {
      valid.forEach(r => {
        const title   = clean(r['Title']);
        const jour    = clean(r['Journal']);
        const status  = clean(r['Status']) || clean(r['Remarks']);
        listEl.insertAdjacentHTML('beforeend', `
          <div class="pipeline-item">
            <div class="pipeline-title">${title}</div>
            <div class="pipeline-meta">${jour}${status ? ' · ' + status : ''}</div>
          </div>`);
      });
    }
  } catch (e) {
    document.getElementById('pipelineList').innerHTML =
      '<p style="color:var(--ink-3);font-size:.84rem">Could not load pipeline data.</p>';
  }

  // Ideas — admin only
  if (auth.role === 'admin') {
    document.getElementById('ideasCard').style.display = '';
    try {
      const res = await fetch(`${API_BASE}/api/data/Ideas`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      const { rows } = await res.json();
      const listEl = document.getElementById('ideasList');
      listEl.innerHTML = '';
      const valid = rows.filter(r => clean(r['Title']) || clean(r['Idea']));
      if (!valid.length) {
        listEl.innerHTML = '<p style="color:var(--ink-3);font-size:.84rem">No ideas recorded.</p>';
      } else {
        valid.forEach(r => {
          const idea = clean(r['Idea']) || clean(r['Title']);
          const note = clean(r['Notes']) || clean(r['Description']);
          listEl.insertAdjacentHTML('beforeend', `
            <div class="pipeline-item">
              <div class="pipeline-title">${idea}</div>
              ${note ? `<div class="pipeline-meta">${note}</div>` : ''}
            </div>`);
        });
      }
    } catch (e) {
      document.getElementById('ideasList').innerHTML =
        '<p style="color:var(--ink-3);font-size:.84rem">Could not load ideas.</p>';
    }
  }
}

// ── Config / Hero ─────────────────────────────────────────
async function loadConfig() {
  const cfg = await fetchJson('config.json');

  document.title = `${cfg.name} | Academic Portfolio`;
  document.getElementById('nav-name').textContent = cfg.shortName || cfg.name;
  document.getElementById('heroName').textContent = cfg.shortName || cfg.name;

  const credEl = document.getElementById('heroCredential');
  if (credEl) credEl.textContent = cfg.credential || '';

  document.getElementById('aboutBio').textContent   = cfg.bio || '';
  document.getElementById('contactBio').textContent = cfg.bio || '';
  document.getElementById('contactInst').innerHTML  =
    `${cfg.name}<br>${cfg.department || ''}<br>${cfg.institution || ''}` +
    (cfg.email ? `<br><a href="mailto:${cfg.email}">${cfg.email}</a>` : '');
  document.getElementById('footerText').innerHTML =
    `&copy; ${new Date().getFullYear()} ${cfg.name}`;

  if (cfg.photo)
    document.getElementById('heroPhoto').innerHTML = `<img src="${cfg.photo}" alt="${cfg.name}">`;

  // contact links are now loaded from Contact.json — see loadContact()
}

// ── Contact (from Excel Contact sheet) ───────────────────
async function loadContact() {
  const ct = await fetchJson('Contact.json');

  // Icon + display label + href builder for each known key
  const FIELDS = [
    { keys: ['Email'],       icon: '✉',  label: v => v,               href: v => `mailto:${v}` },
    { keys: ['Email2'],      icon: '✉',  label: v => v,               href: v => `mailto:${v}` },
    { keys: ['Phone'],       icon: '📞', label: v => v,               href: v => `tel:${v.replace(/\s/g,'')}` },
    { keys: ['Scholar'],     icon: '🎓', label: () => 'Google Scholar', href: v => v },
    { keys: ['ORCID'],       icon: '🆔', label: () => 'ORCID',         href: v => v },
    { keys: ['LinkedIn'],    icon: '💼', label: () => 'LinkedIn',      href: v => v },
    { keys: ['Researchgate'],icon: '🔬', label: () => 'ResearchGate',  href: v => v },
    { keys: ['Scopus'],      icon: '📊', label: () => 'Scopus',        href: v => v },
  ];

  const items = [];
  FIELDS.forEach(f => {
    f.keys.forEach(k => {
      const v = clean(ct[k]);
      if (v) items.push({ icon: f.icon, label: f.label(v), href: f.href(v) });
    });
  });

  // Home sidebar (small list)
  const homeEl = document.getElementById('homeContactLinks');
  if (homeEl) {
    items.forEach(({ icon, label, href }) => {
      homeEl.insertAdjacentHTML('beforeend', `
        <li><a href="${href}" target="_blank" rel="noopener">
          <span class="contact-icon">${icon}</span>${label}
        </a></li>`);
    });
  }

  // Bottom contact bar (pill buttons)
  const barEl = document.getElementById('contactBar');
  if (barEl) {
    items.forEach(({ icon, label, href }) => {
      barEl.insertAdjacentHTML('beforeend', `
        <a href="${href}" class="contact-bar-item" target="_blank" rel="noopener">
          <span class="contact-bar-icon">${icon}</span>
          <span>${label}</span>
        </a>`);
    });

    // Address block below the pills
    const addr = clean(ct['Address']);
    if (addr) {
      barEl.insertAdjacentHTML('afterend', `
        <div class="contact-bar-address">
          <span class="contact-bar-icon">📍</span>
          ${addr.replace(/\n/g, ' &nbsp;·&nbsp; ')}
        </div>`);
    }
  }

  // Contact page links
  const contactEl = document.getElementById('contactLinks');
  if (contactEl) {
    items.forEach(({ icon, label, href }) => {
      contactEl.insertAdjacentHTML('beforeend', `
        <li><a href="${href}" target="_blank" rel="noopener">
          <span class="contact-icon">${icon}</span>${label}
        </a></li>`);
    });
  }

  // Contact page address
  const instEl = document.getElementById('contactInst');
  if (instEl && ct['Address']) {
    const cfg = await fetchJson('config.json').catch(() => ({}));
    instEl.innerHTML =
      `${ct['Name'] || cfg.name || ''}<br>` +
      ct['Address'].replace(/\n/g, '<br>');
  }
}

// ── Publications ──────────────────────────────────────────
async function loadPublications() {
  const { rows } = await fetchJson('Published.json');
  const panel = document.getElementById('panel-journal');
  panel.innerHTML = '';

  const valid = rows.filter(r => clean(r['Title']));
  if (!valid.length) { panel.innerHTML = '<p style="color:var(--ink-3)">No publications found.</p>'; return; }

  valid.forEach((r, i) => {
    const sno    = clean(r['S. No.']) || (i + 1);
    const title  = clean(r['Title']);
    const auth   = clean(r['Author(s)']);
    const jour   = clean(r['Journal']);
    const vol    = clean(r['Vol/Year']);
    const doi    = clean(r['DOI']);
    const abdc   = clean(r['ABDC Rating']);
    const scopus = clean(r['SSCI/Scopus']);
    const qx     = clean(r['SCImago Qx']);

    panel.insertAdjacentHTML('beforeend', `
      <div class="pub-item">
        <div class="pub-sno">${sno}.</div>
        <div class="pub-body">
          <div class="pub-title">${title}</div>
          <div class="pub-authors">${auth}</div>
          <div class="pub-journal">${jour}${vol ? `, ${vol}` : ''}</div>
          <div class="pub-meta">
            ${ratingBadge(abdc)}${scopusBadge(scopus)}
            ${qx ? `<span class="badge badge-moss">${qx}</span>` : ''}
            ${doi ? `<span class="pub-doi"><a href="https://doi.org/${doi}" target="_blank" rel="noopener">↗ DOI</a></span>` : ''}
          </div>
        </div>
      </div>`);
  });
  // stat counter removed from UI
}

// ── Book Chapters ─────────────────────────────────────────
async function loadChapters() {
  const { rows } = await fetchJson('Book_Chapter.json');
  const panel = document.getElementById('panel-chapters');
  panel.innerHTML = '';

  const valid = rows.filter(r => clean(r['Chapter Title']));
  if (!valid.length) { panel.innerHTML = '<p style="color:var(--ink-3)">No book chapters found.</p>'; return; }

  valid.forEach((r, i) => {
    const sno   = clean(r['S. No.']) || (i + 1);
    const title = clean(r['Chapter Title']);
    const auth  = clean(r['Author(s)']);
    const book  = clean(r['Book Title']);
    const pages = clean(r['Page No.']);
    const doi   = clean(r['DOI']);

    panel.insertAdjacentHTML('beforeend', `
      <div class="pub-item">
        <div class="pub-sno">${sno}.</div>
        <div class="pub-body">
          <div class="pub-title">${title}</div>
          <div class="pub-authors">${auth}</div>
          <div class="pub-journal">in <em>${book}</em>${pages ? `, pp. ${pages}` : ''}</div>
          <div class="pub-meta">
            ${doi ? `<span class="pub-doi"><a href="https://doi.org/${doi}" target="_blank" rel="noopener">↗ DOI</a></span>` : ''}
          </div>
        </div>
      </div>`);
  });
  // stat counter removed from UI
}

// ── Projects ──────────────────────────────────────────────
async function loadProjects() {
  const { rows } = await fetchJson('Projects.json');
  const grid = document.getElementById('projGrid');
  grid.innerHTML = '';

  const INACTIVE = ['reject', 'not shortlist', 'not selected', 'declined', 'submitted'];
  const valid = rows.filter(r => {
    if (!clean(r['Project Title'])) return false;
    const s = String(r['Status'] || '').toLowerCase();
    return !INACTIVE.some(kw => s.includes(kw));
  });
  if (!valid.length) { grid.innerHTML = '<p style="color:var(--ink-3)">No active projects found.</p>'; return; }

  valid.forEach(r => {
    const title    = clean(r['Project Title']);
    const agency   = clean(r['Agency/Funder']);
    const role     = clean(r['Role']);
    const amount   = clean(r['Amount (Fund Sanctioned)']);
    const duration = clean(r['Duration (months)']);
    const status   = clean(r['Status']);

    grid.insertAdjacentHTML('beforeend', `
      <div class="proj-card">
        <div class="proj-agency">${agency}</div>
        <div class="proj-title">${title}</div>
        <div class="proj-role">${role}</div>
        <div class="proj-footer">
          <span class="proj-amount">${[amount, duration ? duration + ' mo.' : ''].filter(Boolean).join(' · ')}</span>
          ${statusBadge(status)}
        </div>
      </div>`);
  });
  // stat counter removed from UI
}

// ── Conferences ───────────────────────────────────────────
async function loadConferences() {
  const { rows } = await fetchJson('Conferences.json');
  const list = document.getElementById('confList');
  list.innerHTML = '';

  if (!rows.length) { list.innerHTML = '<li style="color:var(--ink-3)">No records found.</li>'; return; }

  rows.forEach((r, i) => {
    const title = clean(r['Title']);
    const auth  = clean(r['Author(s)']);
    const conf  = clean(r['Conference Name']);
    const org   = clean(r['Organizer (Place)']);
    const mode  = clean(r['Presentation Mode']);
    const date  = clean(r['Date(s)']);
    const num   = clean(r['S. No.']) || (i + 1);

    list.insertAdjacentHTML('beforeend', `
      <li class="conf-item">
        <div class="conf-num">${num}.</div>
        <div class="conf-body">
          <div class="conf-title">${title || '(Untitled)'}</div>
          <div class="conf-authors">${auth}</div>
          <div class="conf-venue">${conf}${org ? ' · ' + org : ''}</div>
          <div class="conf-meta">
            ${date ? `<span class="badge badge-gray">${date}</span>` : ''}
            ${mode ? `<span class="badge badge-ink">${mode}</span>`  : ''}
          </div>
        </div>
      </li>`);
  });
  // stat counter removed from UI
}

// ── Research Team (tabbed by category) ───────────────────
async function loadTeam() {
  const { rows } = await fetchJson('PhD_Supervision.json');
  const valid = rows.filter(r => clean(r['Name']));

  // Classify each member.
  // Expects a "Category" column in the sheet: "PhD Scholar" | "Master's Thesis" |
  // "Research Assistant" | "Research Associate". Falls back to "PhD Scholar".
  const CATS = {
    phd:    ['phd', 'doctoral', 'ph.d'],
    masters:['master', 'mtech', 'mba', 'mphil', 'thesis'],
    ra:     ['research assistant', 'ra'],
    rassoc: ['research associate']
  };

  function classify(r) {
    const cat = String(r['Category'] || r['Program'] || '').toLowerCase().trim();
    if (!cat) return 'phd';
    for (const [key, kws] of Object.entries(CATS))
      if (kws.some(k => cat.includes(k))) return key;
    return 'phd';
  }

  function statusBadgeTeam(r) {
    const def = clean(r['Defense']);
    const rem = clean(r['Remarks']);
    if (def) return `<span class="badge badge-green">Defended</span>`;
    if (rem) return `<span class="badge badge-ink">${rem}</span>`;
    return `<span class="badge badge-gray">Ongoing</span>`;
  }

  const groups = { phd: [], masters: [], ra: [], rassoc: [] };
  valid.forEach((r, i) => { groups[classify(r)].push({ ...r, _idx: i + 1 }); });

  function emptyRow(cols) {
    return `<tr><td colspan="${cols}" style="text-align:center;color:var(--ink-3);padding:24px">No records in this category yet.</td></tr>`;
  }

  // PhD Scholars
  const phdBody = document.getElementById('phdBody');
  phdBody.innerHTML = groups.phd.length ? '' : emptyRow(7);
  groups.phd.forEach(r => {
    phdBody.insertAdjacentHTML('beforeend', `
      <tr>
        <td>${clean(r['S. No.']) || r._idx}</td>
        <td><strong>${clean(r['Name'])}</strong></td>
        <td><span class="badge badge-gray">${clean(r['Full/Part-Time']) || 'Full-Time'}</span></td>
        <td>${clean(r['Title']) || '—'}</td>
        <td>${clean(r['My Role']) || '—'}</td>
        <td>${clean(r['Co-Supervisor']) || '—'}</td>
        <td>${statusBadgeTeam(r)}</td>
      </tr>`);
  });

  // Master's Thesis
  const mastersBody = document.getElementById('mastersBody');
  mastersBody.innerHTML = groups.masters.length ? '' : emptyRow(6);
  groups.masters.forEach(r => {
    mastersBody.insertAdjacentHTML('beforeend', `
      <tr>
        <td>${clean(r['S. No.']) || r._idx}</td>
        <td><strong>${clean(r['Name'])}</strong></td>
        <td>${clean(r['Title']) || '—'}</td>
        <td>${clean(r['My Role']) || '—'}</td>
        <td>${clean(r['Co-Supervisor']) || '—'}</td>
        <td>${statusBadgeTeam(r)}</td>
      </tr>`);
  });

  // Research Assistants
  const raBody = document.getElementById('raBody');
  raBody.innerHTML = groups.ra.length ? '' : emptyRow(5);
  groups.ra.forEach(r => {
    const from = clean(r['From Date']); const to = clean(r['To Date']);
    raBody.insertAdjacentHTML('beforeend', `
      <tr>
        <td>${clean(r['S. No.']) || r._idx}</td>
        <td><strong>${clean(r['Name'])}</strong></td>
        <td>${clean(r['Title']) || '—'}</td>
        <td>${[from, to].filter(Boolean).join(' – ') || '—'}</td>
        <td>${statusBadgeTeam(r)}</td>
      </tr>`);
  });

  // Research Associates
  const rassocBody = document.getElementById('rassocBody');
  rassocBody.innerHTML = groups.rassoc.length ? '' : emptyRow(5);
  groups.rassoc.forEach(r => {
    const from = clean(r['From Date']); const to = clean(r['To Date']);
    rassocBody.insertAdjacentHTML('beforeend', `
      <tr>
        <td>${clean(r['S. No.']) || r._idx}</td>
        <td><strong>${clean(r['Name'])}</strong></td>
        <td>${clean(r['Title']) || '—'}</td>
        <td>${[from, to].filter(Boolean).join(' – ') || '—'}</td>
        <td>${statusBadgeTeam(r)}</td>
      </tr>`);
  });
}

// ── Education ─────────────────────────────────────────────
async function loadEducation() {
  const { rows } = await fetchJson('Academic.json');
  const tl = document.getElementById('eduTimeline');
  tl.innerHTML = '';

  const valid = rows.filter(r => clean(r['Exam/Qualification']));
  if (!valid.length) { tl.innerHTML = '<p style="color:var(--ink-3)">No records found.</p>'; return; }

  [...valid].reverse().forEach(r => {
    const deg   = clean(r['Exam/Qualification']);
    const inst  = clean(r['Institute/Organization Name']);
    const marks = clean(r['Marks']);
    const to    = clean(r['Leaving Date']);

    tl.insertAdjacentHTML('beforeend', `
      <div class="edu-item">
        <div class="edu-degree">${deg}</div>
        ${inst  ? `<div class="edu-inst">${inst}</div>`   : ''}
        ${to    ? `<div class="edu-year">${to}</div>`     : ''}
        ${marks ? `<div class="edu-marks">${marks}%</div>`: ''}
      </div>`);
  });
}

// ── Experience / Responsibilities ─────────────────────────
async function loadExperience() {
  const { rows } = await fetchJson('Admin-Addl.json');
  const list = document.getElementById('expList');
  list.innerHTML = '';

  const valid = rows.filter(r => clean(r['Duties/In-charge']));
  if (!valid.length) { list.innerHTML = '<li style="color:var(--ink-3)">No records found.</li>'; return; }

  valid.forEach(r => {
    const duty   = clean(r['Duties/In-charge']);
    const inst   = clean(r['Institute']);
    const from   = clean(r['From Date']);
    const to     = clean(r['To Date']);
    const period = [from, to].filter(Boolean).join(' – ');

    list.insertAdjacentHTML('beforeend', `
      <li class="exp-item">
        <div class="exp-dot"></div>
        <div>
          <div class="exp-role">${duty}</div>
          ${inst   ? `<div class="exp-inst">${inst}</div>`     : ''}
          ${period ? `<div class="exp-period">${period}</div>` : ''}
        </div>
      </li>`);
  });
}

// ── Inner tabs ────────────────────────────────────────────
function initInnerTabs() {
  document.querySelectorAll('.inner-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = btn.closest('.page');
      page.querySelectorAll('.inner-tab').forEach(b  => b.classList.remove('active'));
      page.querySelectorAll('.inner-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const panel = page.querySelector('#panel-' + btn.dataset.tab);
      if (panel) panel.classList.add('active');
    });
  });
}

// ── Init ──────────────────────────────────────────────────
(async function () {
  // Nav page links
  document.querySelectorAll('#navLinks a[data-page]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      showPage(a.dataset.page);
      document.getElementById('navLinks').classList.remove('open');
    });
  });

  // data-navto buttons
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-navto]');
    if (el) { e.preventDefault(); showPage(el.dataset.navto); }
  });

  // Hamburger
  document.getElementById('navToggle').addEventListener('click', () =>
    document.getElementById('navLinks').classList.toggle('open'));

  // Login modal
  document.getElementById('navLoginBtn').addEventListener('click', e => {
    e.preventDefault(); openLoginModal();
  });
  document.getElementById('modalClose').addEventListener('click', closeLoginModal);
  document.getElementById('loginModal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeLoginModal();
  });
  document.getElementById('loginSubmit').addEventListener('click', submitLogin);
  document.getElementById('loginPass').addEventListener('keydown', e => {
    if (e.key === 'Enter') submitLogin();
  });

  // Logout
  document.getElementById('navLogoutBtn').addEventListener('click', e => {
    e.preventDefault();
    clearAuth();
    _portalLoaded = false;
    updateNavAuth();
    showPage('home');
  });

  initInnerTabs();
  updateNavAuth();

  // Load public data
  try { await loadConfig(); } catch (e) { console.warn('Config:', e); }

  await Promise.all([
    loadContact(),
    loadPublications(), loadChapters(),
    loadProjects(),     loadConferences(),
    loadTeam(),         loadExperience()
  ].map(p => p.catch(e => console.warn(e))));

  // Honour hash or default to home
  const hash = location.hash.replace('#', '');
  showPage(PAGES.includes(hash) ? hash : 'home');
})();
