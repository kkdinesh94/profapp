/* =========================================================
   ProfApp — Public Portfolio JS
   Fetches pre-generated static JSON from /data/
   ========================================================= */

const DATA = './data';

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
  const cls = v === 'A*' ? 'badge-red' : v === 'A' ? 'badge-ink' : v === 'B' ? 'badge-blue' : 'badge-gray';
  return `<span class="badge ${cls}">ABDC ${v}</span>`;
}
function scopusBadge(v) {
  const s = clean(v);
  if (!s) return '';
  if (s.includes('SSCI'))            return `<span class="badge badge-green">SSCI</span>`;
  if (s.toLowerCase().includes('scopus')) return `<span class="badge badge-blue">Scopus</span>`;
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

// ── Config / Hero ─────────────────────────────────────────
async function loadConfig() {
  const cfg = await fetchJson('config.json');

  document.title = `${cfg.name} | Academic Portfolio`;
  document.getElementById('nav-name').textContent = cfg.shortName || cfg.name;
  document.getElementById('heroName').textContent  = cfg.name;
  document.getElementById('heroTitle').textContent =
    [cfg.title, cfg.department].filter(Boolean).join(' · ');
  document.getElementById('heroInst').textContent  = cfg.institution || '';
  document.getElementById('aboutBio').textContent  = cfg.bio || '';
  document.getElementById('contactBio').textContent = cfg.bio || '';
  document.getElementById('contactInst').innerHTML =
    `${cfg.name}<br>${cfg.department || ''}<br>${cfg.institution || ''}` +
    (cfg.email ? `<br><a href="mailto:${cfg.email}">${cfg.email}</a>` : '');
  document.getElementById('footerText').innerHTML =
    `&copy; ${new Date().getFullYear()} ${cfg.name}`;

  if (cfg.photo)
    document.getElementById('heroPhoto').innerHTML = `<img src="${cfg.photo}" alt="${cfg.name}">`;

  const tagsEl = document.getElementById('heroTags');
  (cfg.researchInterests || []).forEach(t =>
    tagsEl.insertAdjacentHTML('beforeend', `<span class="hero-tag">${t}</span>`));

  const listEl = document.getElementById('interestsList');
  (cfg.researchInterests || []).forEach(t =>
    listEl.insertAdjacentHTML('beforeend', `<li>${t}</li>`));

  if (cfg.cvLink)
    document.getElementById('heroBtns').insertAdjacentHTML('beforeend',
      `<a href="${cfg.cvLink}" class="btn btn-outline" target="_blank">Download CV</a>`);

  const cl = document.getElementById('contactLinks');
  const addLink = (icon, label, href) =>
    cl.insertAdjacentHTML('beforeend', `
      <li><a href="${href}" target="_blank">
        <span class="contact-icon">${icon}</span>${label}
      </a></li>`);
  if (cfg.email)           addLink('✉', cfg.email, `mailto:${cfg.email}`);
  if (cfg.googleScholar)   addLink('🎓', 'Google Scholar', cfg.googleScholar);
  if (cfg.orcid)           addLink('🆔', 'ORCID', cfg.orcid);
  if (cfg.linkedin)        addLink('💼', 'LinkedIn', cfg.linkedin);
  if (cfg.researchgate)    addLink('🔬', 'ResearchGate', cfg.researchgate);
  if (cfg.officialWebsite) addLink('🌐', 'Official Website', cfg.officialWebsite);
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
            ${qx ? `<span class="badge badge-blue">${qx}</span>` : ''}
            ${doi ? `<span class="pub-doi"><a href="https://doi.org/${doi}" target="_blank">↗ DOI</a></span>` : ''}
          </div>
        </div>
      </div>`);
  });
  document.getElementById('statPub').textContent = valid.length;
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
            ${doi ? `<span class="pub-doi"><a href="https://doi.org/${doi}" target="_blank">↗ DOI</a></span>` : ''}
          </div>
        </div>
      </div>`);
  });
  document.getElementById('statChap').textContent = valid.length;
}

// ── Projects ──────────────────────────────────────────────
async function loadProjects() {
  const { rows } = await fetchJson('Projects.json');
  const grid = document.getElementById('projGrid');
  grid.innerHTML = '';

  const valid = rows.filter(r => clean(r['Project Title']));
  if (!valid.length) { grid.innerHTML = '<p style="color:var(--ink-3)">No projects found.</p>'; return; }

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
  document.getElementById('statProj').textContent = valid.length;
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
            ${mode ? `<span class="badge badge-ink">${mode}</span>` : ''}
          </div>
        </div>
      </li>`);
  });
  document.getElementById('statConf').textContent = rows.length;
}

// ── PhD Supervision ───────────────────────────────────────
async function loadPhd() {
  const { rows } = await fetchJson('PhD_Supervision.json');
  const tbody = document.getElementById('phdBody');
  tbody.innerHTML = '';

  const valid = rows.filter(r => clean(r['Name']));
  if (!valid.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--ink-3);padding:24px">No records found.</td></tr>';
    return;
  }

  valid.forEach((r, i) => {
    const name  = clean(r['Name']);
    const type  = clean(r['Full/Part-Time']);
    const title = clean(r['Title']);
    const role  = clean(r['My Role']);
    const cosup = clean(r['Co-Supervisor']);
    const def   = clean(r['Defense']);
    const rem   = clean(r['Remarks']);
    const sno   = clean(r['S. No.']) || (i + 1);

    const status = def
      ? `<span class="badge badge-green">Defended</span>`
      : rem ? `<span class="badge badge-ink">${rem}</span>`
            : `<span class="badge badge-gray">Ongoing</span>`;

    tbody.insertAdjacentHTML('beforeend', `
      <tr>
        <td>${sno}</td>
        <td><strong>${name}</strong></td>
        <td><span class="badge badge-gray">${type || 'Full-Time'}</span></td>
        <td>${title || '—'}</td>
        <td>${role || '—'}</td>
        <td>${cosup || '—'}</td>
        <td>${status}</td>
      </tr>`);
  });
  document.getElementById('statPhd').textContent = valid.length;
}

// ── Admin Responsibilities ────────────────────────────────
async function loadAdmin() {
  const { rows } = await fetchJson('Admin-Addl.json');
  const grid = document.getElementById('adminGrid');
  grid.innerHTML = '';

  const valid = rows.filter(r => clean(r['Duties/In-charge']));
  if (!valid.length) { grid.innerHTML = '<p style="color:var(--ink-3)">No records found.</p>'; return; }

  valid.forEach(r => {
    const duty   = clean(r['Duties/In-charge']);
    const inst   = clean(r['Institute']);
    const from   = clean(r['From Date']);
    const to     = clean(r['To Date']);
    const period = [from, to].filter(Boolean).join(' – ');

    grid.insertAdjacentHTML('beforeend', `
      <div class="admin-card">
        <div class="admin-role">${duty}</div>
        <div class="admin-inst">${inst}</div>
        ${period ? `<div class="admin-period">${period}</div>` : ''}
      </div>`);
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
        <div class="edu-inst">${inst}</div>
        ${to    ? `<div class="edu-year">${to}</div>`         : ''}
        ${marks ? `<div class="edu-marks">${marks}%</div>`    : ''}
      </div>`);
  });
}

// ── Tab switching ─────────────────────────────────────────
document.querySelectorAll('.pub-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.pub-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.pub-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('panel-' + btn.dataset.panel).classList.add('active');
  });
});

// ── Navbar ────────────────────────────────────────────────
document.getElementById('navToggle').addEventListener('click', () =>
  document.getElementById('navLinks').classList.toggle('open'));
document.querySelectorAll('#navLinks a').forEach(a =>
  a.addEventListener('click', () => document.getElementById('navLinks').classList.remove('open')));

const _sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
  let cur = '';
  _sections.forEach(s => { if (window.scrollY >= s.offsetTop - 70) cur = s.id; });
  document.querySelectorAll('#navLinks a').forEach(a =>
    a.classList.toggle('active', a.getAttribute('href') === '#' + cur));
});

// ── Init ──────────────────────────────────────────────────
(async function () {
  try { await loadConfig(); } catch (e) { console.warn('Config:', e); }
  [loadPublications, loadChapters, loadProjects, loadConferences, loadPhd, loadAdmin, loadEducation]
    .forEach(fn => fn().catch(e => console.warn(fn.name, e)));
})();
