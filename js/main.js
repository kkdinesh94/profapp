/* =========================================================
   ProfApp — Public Portfolio JS (fetches static JSON files)
   ========================================================= */

// Relative path — works on both localhost:3000 and GitHub Pages /profapp/
const DATA = './data';

async function fetchJson(file) {
  const r = await fetch(`${DATA}/${file}`);
  if (!r.ok) throw new Error(`Failed to load ${file}`);
  return r.json();
}

// ── Animated counter ──────────────────────────────────────
function animateCount(el, target) {
  const n = parseInt(target, 10);
  if (isNaN(n)) { el.textContent = target; return; }
  let cur = 0;
  const step = Math.ceil(n / 40);
  const t = setInterval(() => {
    cur = Math.min(cur + step, n);
    el.textContent = cur;
    if (cur >= n) clearInterval(t);
  }, 25);
}

// ── Badge helpers ─────────────────────────────────────────
function ratingBadge(r) {
  if (!r || r === '-') return '';
  const cls = r === 'A*' ? 'badge-gold' : r === 'A' ? 'badge-navy' : r === 'B' ? 'badge-blue' : 'badge-gray';
  return `<span class="badge ${cls}">ABDC ${r}</span>`;
}
function scopusBadge(v) {
  if (!v) return '';
  const s = String(v);
  if (s.includes('SSCI')) return `<span class="badge badge-green">SSCI</span>`;
  if (s.toLowerCase().includes('scopus')) return `<span class="badge badge-blue">Scopus</span>`;
  return '';
}
function statusBadge(s) {
  if (!s) return '';
  const sl = String(s).toLowerCase();
  if (sl.includes('approv') || sl.includes('sanctioned') || sl.includes('complete'))
    return `<span class="badge badge-green">${s}</span>`;
  if (sl.includes('reject') || sl.includes('not shortlist'))
    return `<span class="badge badge-red">${s}</span>`;
  if (sl.includes('progress') || sl.includes('ongoing') || sl.includes('review'))
    return `<span class="badge badge-blue">${s}</span>`;
  return `<span class="badge badge-gray">${s}</span>`;
}
function clean(v) { return v && v !== 'null' && v !== '-' ? String(v).trim() : ''; }

// ── Config / Hero ─────────────────────────────────────────
async function loadConfig() {
  const cfg = await fetchJson('config.json');

  document.title = cfg.name + ' | Academic Portfolio';
  document.getElementById('nav-name').textContent = cfg.shortName || cfg.name;
  document.getElementById('heroName').textContent = cfg.name;
  document.getElementById('heroTitle').textContent = [cfg.title, cfg.department].filter(Boolean).join(', ');
  document.getElementById('heroInst').textContent = cfg.institution || '';
  document.getElementById('aboutBio').textContent = cfg.bio || '';
  document.getElementById('contactBio').textContent = cfg.bio || '';
  document.getElementById('contactInst').innerHTML =
    `<strong>${cfg.name}</strong><br>${cfg.department || ''}<br>${cfg.institution || ''}` +
    (cfg.email ? `<br><a href="mailto:${cfg.email}" style="color:var(--gold-lt)">${cfg.email}</a>` : '');
  document.getElementById('footerText').innerHTML =
    `&copy; ${new Date().getFullYear()} ${cfg.name}. All rights reserved.`;

  if (cfg.photo) {
    document.getElementById('heroPhoto').innerHTML = `<img src="${cfg.photo}" alt="${cfg.name}">`;
  }

  const tags = document.getElementById('heroTags');
  (cfg.researchInterests || []).forEach(r => {
    tags.insertAdjacentHTML('beforeend', `<span class="hero-tag">${r}</span>`);
  });

  const list = document.getElementById('interestsList');
  (cfg.researchInterests || []).forEach(r => {
    list.insertAdjacentHTML('beforeend', `<li>${r}</li>`);
  });

  const btns = document.getElementById('heroBtns');
  if (cfg.cvLink) {
    btns.insertAdjacentHTML('beforeend',
      `<a href="${cfg.cvLink}" class="btn btn-outline" target="_blank">Download CV</a>`);
  }

  const cl = document.getElementById('contactLinks');
  const addLink = (icon, label, href) => {
    cl.insertAdjacentHTML('beforeend', `
      <li><a href="${href}" target="_blank">
        <span class="contact-icon">${icon}</span>${label}
      </a></li>`);
  };
  if (cfg.email)          addLink('✉', cfg.email, `mailto:${cfg.email}`);
  if (cfg.googleScholar)  addLink('🎓', 'Google Scholar', cfg.googleScholar);
  if (cfg.orcid)          addLink('🆔', 'ORCID', cfg.orcid);
  if (cfg.linkedin)       addLink('💼', 'LinkedIn', cfg.linkedin);
  if (cfg.researchgate)   addLink('🔬', 'ResearchGate', cfg.researchgate);
  if (cfg.officialWebsite)addLink('🌐', 'Official Website', cfg.officialWebsite);
}

// ── Publications ──────────────────────────────────────────
async function loadPublications() {
  const { rows } = await fetchJson('Published.json');
  const panel = document.getElementById('panel-journal');
  panel.innerHTML = '';

  if (!rows.length) { panel.innerHTML = '<p style="color:var(--muted)">No publications found.</p>'; return; }

  rows.forEach((r, i) => {
    const sno   = clean(r['S. No.']) || (i + 1);
    const title = clean(r['Title']);
    const auth  = clean(r['Author(s)']);
    const jour  = clean(r['Journal']);
    const vol   = clean(r['Vol/Year']);
    const doi   = clean(r['DOI']);
    const abdc  = clean(r['ABDC Rating']);
    const scopus= clean(r['SSCI/Scopus']);
    const qx    = clean(r['SCImago Qx']);

    panel.insertAdjacentHTML('beforeend', `
      <div class="pub-card">
        <div class="pub-num">Article ${sno}</div>
        <div class="pub-title">${title || '(Untitled)'}</div>
        <div class="pub-authors">${auth}</div>
        <div class="pub-journal">${jour}${vol ? `, ${vol}` : ''}</div>
        <div class="pub-meta">
          ${ratingBadge(abdc)} ${scopusBadge(scopus)}
          ${qx ? `<span class="badge badge-blue">${qx}</span>` : ''}
          ${doi ? `<span class="pub-doi"><a href="https://doi.org/${doi}" target="_blank">DOI ↗</a></span>` : ''}
        </div>
      </div>`);
  });
  animateCount(document.getElementById('statPub'), rows.length);
}

// ── Book Chapters ─────────────────────────────────────────
async function loadChapters() {
  const { rows } = await fetchJson('Book_Chapter.json');
  const panel = document.getElementById('panel-chapters');
  panel.innerHTML = '';

  const validRows = rows.filter(r => clean(r['Chapter Title']));
  if (!validRows.length) { panel.innerHTML = '<p style="color:var(--muted)">No book chapters found.</p>'; return; }

  validRows.forEach((r, i) => {
    const sno   = clean(r['S. No.']) || (i + 1);
    const title = clean(r['Chapter Title']);
    const auth  = clean(r['Author(s)']);
    const book  = clean(r['Book Title']);
    const pages = clean(r['Page No.']);
    const doi   = clean(r['DOI']);

    panel.insertAdjacentHTML('beforeend', `
      <div class="pub-card" style="border-left-color:var(--blue)">
        <div class="pub-num">Chapter ${sno}</div>
        <div class="pub-title">${title}</div>
        <div class="pub-authors">${auth}</div>
        <div class="pub-journal">in: <em>${book}</em>${pages ? `, pp. ${pages}` : ''}</div>
        <div class="pub-meta">
          ${doi ? `<span class="pub-doi"><a href="https://doi.org/${doi}" target="_blank">DOI ↗</a></span>` : ''}
        </div>
      </div>`);
  });
  animateCount(document.getElementById('statChap'), validRows.length);
}

// ── Projects ──────────────────────────────────────────────
async function loadProjects() {
  const { rows } = await fetchJson('Projects.json');
  const grid = document.getElementById('projGrid');
  grid.innerHTML = '';

  const validRows = rows.filter(r => clean(r['Project Title']));
  if (!validRows.length) { grid.innerHTML = '<p style="color:var(--muted)">No projects found.</p>'; return; }

  validRows.forEach(r => {
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
        <div class="proj-role">Role: ${role}</div>
        <div class="proj-footer">
          <div style="font-size:.78rem;color:var(--muted)">${amount ? '💰 ' + amount : ''}${duration ? ' · ' + duration + ' mo.' : ''}</div>
          ${statusBadge(status)}
        </div>
      </div>`);
  });
  animateCount(document.getElementById('statProj'), validRows.length);
}

// ── Conferences ───────────────────────────────────────────
async function loadConferences() {
  const { rows } = await fetchJson('Conferences.json');
  const list = document.getElementById('confList');
  list.innerHTML = '';

  if (!rows.length) { list.innerHTML = '<li style="color:var(--muted)">No conferences found.</li>'; return; }

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
        <div class="conf-num">${num}</div>
        <div class="conf-body">
          <div class="conf-title">${title || '(Untitled)'}</div>
          <div class="conf-authors">${auth}</div>
          <div class="conf-venue">${conf}${org ? ' · ' + org : ''}</div>
          <div class="conf-meta">
            ${date ? `<span class="badge badge-gray">📅 ${date}</span>` : ''}
            ${mode ? `<span class="badge badge-blue">${mode}</span>` : ''}
          </div>
        </div>
      </li>`);
  });
  animateCount(document.getElementById('statConf'), rows.length);
}

// ── PhD Supervision ───────────────────────────────────────
async function loadPhd() {
  const { rows } = await fetchJson('PhD_Supervision.json');
  const tbody = document.getElementById('phdBody');
  tbody.innerHTML = '';

  const validRows = rows.filter(r => clean(r['Name']));
  if (!validRows.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="color:var(--muted);text-align:center">No records found.</td></tr>';
    return;
  }

  validRows.forEach((r, i) => {
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
      : rem ? `<span class="badge badge-blue">${rem}</span>`
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
  animateCount(document.getElementById('statPhd'), validRows.length);
}

// ── Admin Responsibilities ────────────────────────────────
async function loadAdmin() {
  const { rows } = await fetchJson('Admin-Addl.json');
  const grid = document.getElementById('adminGrid');
  grid.innerHTML = '';

  const validRows = rows.filter(r => clean(r['Duties/In-charge']));
  if (!validRows.length) { grid.innerHTML = '<p style="color:var(--muted)">No records found.</p>'; return; }

  validRows.forEach(r => {
    const duty   = clean(r['Duties/In-charge']);
    const inst   = clean(r['Institute']);
    const from   = clean(r['From Date']);
    const to     = clean(r['To Date']);
    const period = [from, to].filter(Boolean).join(' – ');

    grid.insertAdjacentHTML('beforeend', `
      <div class="admin-card">
        <div class="admin-role">${duty}</div>
        <div class="admin-inst">${inst}</div>
        ${period ? `<div class="admin-period">📅 ${period}</div>` : ''}
      </div>`);
  });
}

// ── Education ─────────────────────────────────────────────
async function loadEducation() {
  const { rows } = await fetchJson('Academic.json');
  const tl = document.getElementById('eduTimeline');
  tl.innerHTML = '';

  const validRows = rows.filter(r => clean(r['Exam/Qualification']));
  if (!validRows.length) { tl.innerHTML = '<p style="color:var(--muted)">No records found.</p>'; return; }

  [...validRows].reverse().forEach(r => {
    const deg   = clean(r['Exam/Qualification']);
    const inst  = clean(r['Institute/Organization Name']);
    const marks = clean(r['Marks']);
    const to    = clean(r['Leaving Date']);

    tl.insertAdjacentHTML('beforeend', `
      <div class="edu-item">
        <div class="edu-degree">${deg}</div>
        <div class="edu-inst">${inst}</div>
        ${to ? `<div class="edu-year">${to}</div>` : ''}
        ${marks ? `<div class="edu-marks">Marks: ${marks}%</div>` : ''}
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

// ── Navbar toggle (mobile) ────────────────────────────────
document.getElementById('navToggle').addEventListener('click', () => {
  document.getElementById('navLinks').classList.toggle('open');
});
document.querySelectorAll('#navLinks a').forEach(a => {
  a.addEventListener('click', () => document.getElementById('navLinks').classList.remove('open'));
});

// ── Active link on scroll ─────────────────────────────────
const sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
  let cur = '';
  sections.forEach(s => { if (window.scrollY >= s.offsetTop - 80) cur = s.id; });
  document.querySelectorAll('#navLinks a').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === '#' + cur);
  });
});

// ── Bootstrap all ─────────────────────────────────────────
(async function init() {
  try { await loadConfig(); } catch (e) { console.warn('Config load failed:', e); }
  [loadPublications, loadChapters, loadProjects, loadConferences, loadPhd, loadAdmin, loadEducation]
    .forEach(fn => fn().catch(e => console.warn(fn.name, e)));
})();
