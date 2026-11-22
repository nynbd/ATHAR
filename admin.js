function toast(msg, isErr) {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  t.classList.toggle('err', !!isErr);
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

/*===== AUTH =====*/
function doLogin() {
  const u = document.getElementById('lu').value.trim();
  const p = document.getElementById('lp').value;
  const err = document.getElementById('lerr');
  const btn = document.getElementById('login-btn');
  err.classList.remove('show');

  if (!u || !p) {
    err.textContent = "Please enter both email and password.";
    err.classList.add('show');
    return;
  }

  if (!window.firebaseAuthFunctions || !window.firebaseAuth) {
    err.textContent = "Still connecting — please wait a second and try again.";
    err.classList.add('show');
    return;
  }

  btn.disabled = true;
  btn.textContent = "Logging in...";
  const { signInWithEmailAndPassword } = window.firebaseAuthFunctions;
  signInWithEmailAndPassword(window.firebaseAuth, u, p)
    .catch((error) => {
      err.textContent = "Incorrect email or password.";
      err.classList.add('show');
      console.error(error.code);
    })
    .finally(() => {
      btn.disabled = false;
      btn.textContent = "Login";
    });
}

function doLogout() {
  const { signOut } = window.firebaseAuthFunctions;
  signOut(window.firebaseAuth);
}

function initAuthListener() {
  const { onAuthStateChanged } = window.firebaseAuthFunctions;
  onAuthStateChanged(window.firebaseAuth, (user) => {
    const login = document.getElementById('adm-login');
    const shell = document.getElementById('adm-shell');
    if (user) {
      login.style.display = 'none';
      shell.style.display = 'flex';
      populateForm();
      renderProgramsTable();
      renderTeamTable();
      renderParticipantsTable();
      loadFormFieldsIntoBuilder();
    } else {
      login.style.display = 'flex';
      shell.style.display = 'none';
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  await waitForFirebase();
  initAuthListener();
});

/*===== SIDEBAR =====*/
function openSidebar() {
  document.getElementById('adm-sb').classList.add('open');
  document.getElementById('sb-ov').classList.add('open');
}
function closeSidebar() {
  document.getElementById('adm-sb').classList.remove('open');
  document.getElementById('sb-ov').classList.remove('open');
}

/*===== NAVIGATION =====*/
function goSec(btn) {
  const secId = btn.getAttribute('data-sec');

  document.querySelectorAll('.adm-sec').forEach(s => s.classList.remove('active'));
  const sec = document.getElementById(secId);
  if (sec) sec.classList.add('active');

  document.querySelectorAll('.adm-nb').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const titles = {
    'dash': 'Dashboard',
    'home-ed': 'Home Page Editor',
    'dept-adm': 'Departments',
    'mem-adm': 'Membership',
    'notice-adm': 'Notice & News',
    'daily-adm': 'Ayah & Prayer Times',
    'cert-adm': 'Certificate Design',
    'prog-adm': 'Manage Programs & Events',
    'team-adm': 'Manage Team',
    'network-adm': 'Our Network',
    'part-adm': 'Participants',
    'site-adm': 'Site Info'
  };
  document.getElementById('adm-ptitle').textContent = titles[secId] || secId;

  const actions = document.getElementById('adm-topbar-actions');
  actions.innerHTML = '';
  if (secId === 'home-ed') {
    actions.innerHTML = `<button class="save-btn" onclick="saveHomeContent()">💾 Save Changes</button>`;
  } else if (secId === 'dept-adm' || secId === 'mem-adm') {
    const k = secId === 'dept-adm' ? 'dept' : 'mem';
    actions.innerHTML = `<button class="add-btn" onclick="addInfoRow('${k}')">+ Add</button> <button class="save-btn" onclick="saveInfoList('${k}')">💾 Save</button>`;
  } else if (secId === 'cert-adm') {
    actions.innerHTML = `<button class="save-btn" onclick="saveCertDesign()">💾 Save Design</button>`;
  } else if (secId === 'notice-adm') {
    actions.innerHTML = `<button class="add-btn" onclick="openNoticeForm()">+ Add Notice</button>`;
  } else if (secId === 'prog-adm') {
    actions.innerHTML = `<button class="add-btn" onclick="openProgramForm()">+ Add Program</button>`;
  } else if (secId === 'team-adm') {
    actions.innerHTML = `<button class="add-btn" onclick="openTeamForm()">+ Add Member</button>`;
  } else if (secId === 'network-adm') {
    actions.innerHTML = `<button class="add-btn" onclick="openNetworkForm()">+ Add Page</button>`;
  } else if (secId === 'part-adm') {
    actions.innerHTML = `<button class="save-btn" onclick="renderParticipantsTable()">🔄 Refresh</button> <button class="add-btn" onclick="openCertForm()">+ Add Certificate</button> <button class="add-btn" onclick="syncCertificates()">🎓 Sync Certificates</button>`;
  } else if (secId === 'site-adm') {
    actions.innerHTML = `<button class="save-btn" onclick="saveSiteInfo()">💾 Save Changes</button>`;
  }

  // Re-fetch fresh data every time these tabs are opened, instead of only
  // once at login — otherwise a submission made after login never shows
  // up until the admin manually reloads the whole page.
  if (secId === 'dept-adm' || secId === 'mem-adm') loadInfoLists();
  if (secId === 'cert-adm') loadCertDesign();
  if (secId === 'notice-adm') loadNoticesAdmin();
  if (secId === 'daily-adm') loadDailySettings();
  if (secId === 'prog-adm') renderProgramsTable();
  if (secId === 'team-adm') renderTeamTable();
  if (secId === 'network-adm') renderNetworkTable();
  if (secId === 'part-adm') { renderParticipantsTable(); loadFormFieldsIntoBuilder(); }

  closeSidebar();
}

/*===== HOME PAGE CONTENT (hero, stats, about, join banner) =====*/
async function populateForm() {
  const content = await loadSiteContent();
  if (content) {
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el && val !== undefined && val !== null) el.value = val;
    };

    setVal('hero-eyebrow', content.hero?.eyebrow);
    setVal('hero-headline', content.hero?.headline);
    setVal('hero-sub', content.hero?.sub);
    setVal('hero-bn', content.hero?.bn);

    (content.stats || []).forEach((s, i) => {
      setVal(`stat${i + 1}-num`, s?.num);
      setVal(`stat${i + 1}-label`, s?.label);
    });

    setVal('about-title', content.about?.title);
    setVal('about-text1', content.about?.text1);
    setVal('about-text2', content.about?.text2);

    setVal('join-title', content.joinBanner?.title);
    setVal('join-text', content.joinBanner?.text);

    setVal('contact-email', content.contact?.email);
    setVal('contact-phone', content.contact?.phone);
    setVal('contact-location', content.contact?.location);

    setVal('social-fb', content.social?.facebook);
    setVal('social-ig', content.social?.instagram);
    setVal('social-li', content.social?.linkedin);

    setVal('footer-desc', content.footerDesc);
  }
}

async function saveHomeContent() {
  const val = (id) => document.getElementById(id).value.trim();
  const btn = document.querySelector('#adm-topbar-actions .save-btn');

  const partial = {
    hero: { eyebrow: val('hero-eyebrow'), headline: val('hero-headline'), bn: val('hero-bn'), sub: val('hero-sub') },
    stats: [1, 2, 3, 4].map(i => ({ num: val(`stat${i}-num`), label: val(`stat${i}-label`) })),
    about: { title: val('about-title'), text1: val('about-text1'), text2: val('about-text2') },
    joinBanner: { title: val('join-title'), text: val('join-text') }
  };

  if (btn) { btn.disabled = true; btn.textContent = "Saving..."; }
  const result = await saveSiteContent(partial);
  if (btn) { btn.disabled = false; btn.textContent = "💾 Save Changes"; }

  toast(result.success ? "Saved! Refresh the website to see changes. ✅" : (result.error || "Save failed!"), !result.success);
}

async function saveSiteInfo() {
  const val = (id) => document.getElementById(id).value.trim();
  const btn = document.querySelector('#adm-topbar-actions .save-btn');

  const partial = {
    contact: { email: val('contact-email'), phone: val('contact-phone'), location: val('contact-location') },
    social: { facebook: val('social-fb'), instagram: val('social-ig'), linkedin: val('social-li') },
    footerDesc: val('footer-desc')
  };

  if (btn) { btn.disabled = true; btn.textContent = "Saving..."; }
  const result = await saveSiteContent(partial);
  if (btn) { btn.disabled = false; btn.textContent = "💾 Save Changes"; }

  toast(result.success ? "Saved! Refresh the website to see changes. ✅" : (result.error || "Save failed!"), !result.success);
}

/*===== PROGRAMS (list — add/edit/delete) =====*/
let cachedPrograms = [];
let cachedParticipants = [];

async function renderProgramsTable() {
  const body = document.getElementById('ptbl-body');
  body.innerHTML = `<tr class="empty-row"><td colspan="5">Loading...</td></tr>`;
  cachedPrograms = await loadPrograms();
  renderProgramsTableFromCache();
}

function renderProgramsTableFromCache() {
  const body = document.getElementById('ptbl-body');
  updateDashboardStats();

  if (!cachedPrograms.length) {
    body.innerHTML = `<tr class="empty-row"><td colspan="5">No programs yet. Click "+ Add Program" to create one.</td></tr>`;
    return;
  }

  body.innerHTML = cachedPrograms.map(p => `
    <tr>
      <td>${p.image ? `<img class="thumb" src="${p.image}">` : `<div class="thumb-ph">📋</div>`}</td>
      <td><strong>${p.title}</strong></td>
      <td>${p.category || '—'}</td>
      <td><span class="bs ${p.status || 'active'}">${p.status || 'active'}</span></td>
      <td class="tbl-acts">
        <button class="e-btn" onclick="editProgram('${p.id}')">Edit</button>
        <button class="d-btn" onclick="deleteProgramAction('${p.id}')">Delete</button>
      </td>
    </tr>`).join('');
}

function updateDashboardStats() {
  const total = cachedPrograms.length;
  const active = cachedPrograms.filter(p => p.status === 'active').length;
  const upcoming = cachedPrograms.filter(p => p.status === 'upcoming').length;
  const draft = cachedPrograms.filter(p => p.status === 'draft').length;
  const newParts = cachedParticipants.filter(p => p.status === 'new').length;
  const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  setText('db-prog-total', total);
  setText('db-prog-active', active);
  setText('db-prog-upcoming', upcoming);
  setText('db-prog-draft', draft);
  setText('db-part-new', newParts);
}

function openProgramForm() {
  document.getElementById('pmodal-title').textContent = "Add Program";
  document.getElementById('p-id').value = '';
  document.getElementById('p-title').value = '';
  document.getElementById('p-category').value = 'Quran & Learning';
  document.getElementById('p-status').value = 'active';
  document.getElementById('p-short').value = '';
  document.getElementById('p-formurl').value = '';
  document.getElementById('p-full').value = '';
  document.getElementById('p-image').value = '';
  document.getElementById('p-image-url').value = '';
  document.getElementById('p-image-prev').innerHTML = '';
  document.getElementById('pmodal').classList.add('open');
}

function editProgram(id) {
  const p = cachedPrograms.find(x => x.id === id);
  if (!p) return;
  document.getElementById('pmodal-title').textContent = "Edit Program";
  document.getElementById('p-id').value = p.id;
  document.getElementById('p-title').value = p.title || '';
  document.getElementById('p-category').value = p.category || 'Quran & Learning';
  document.getElementById('p-status').value = p.status || 'active';
  document.getElementById('p-short').value = p.short || '';
  document.getElementById('p-formurl').value = p.formUrl || '';
  document.getElementById('p-full').value = p.full || '';
  document.getElementById('p-image').value = p.image || '';
  document.getElementById('p-image-url').value = p.image || '';
  document.getElementById('p-image-prev').innerHTML = p.image ? `<img src="${p.image}">` : '';
  document.getElementById('pmodal').classList.add('open');
}

function closeProgramForm() {
  document.getElementById('pmodal').classList.remove('open');
}

// Resize/compress an image client-side before upload — keeps uploads fast on slow connections.
function compressImage(file, maxDim = 1200, quality = 0.75) {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => { img.src = e.target.result; };
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) { height = Math.round(height * maxDim / width); width = maxDim; }
        else { width = Math.round(width * maxDim / height); height = maxDim; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => resolve(blob || file), 'image/jpeg', quality);
    };
    img.onerror = () => resolve(file);
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

async function prevProgramImage(input) {
  if (!input.files?.[0]) return;
  const prev = document.getElementById('p-image-prev');
  prev.innerHTML = `<div style="color:var(--muted);font-size:.82rem;">⏳ Uploading...</div>`;
  const compressed = await compressImage(input.files[0]);
  const result = await uploadToImgBB(compressed);
  if (result.success) {
    document.getElementById('p-image').value = result.url;
    document.getElementById('p-image-url').value = result.url;
    prev.innerHTML = `<img src="${result.url}">`;
  } else {
    prev.innerHTML = `<div style="color:#c0392b;font-size:.82rem;">❌ Upload failed</div>`;
  }
}

async function saveProgram() {
  const id = document.getElementById('p-id').value;
  const title = document.getElementById('p-title').value.trim();
  const short = document.getElementById('p-short').value.trim();
  if (!title) return toast("Program title is required!", true);
  if (!short) return toast("Short description is required!", true);

  const program = {
    title,
    category: document.getElementById('p-category').value,
    status: document.getElementById('p-status').value,
    short,
    formUrl: document.getElementById('p-formurl').value.trim(),
    full: document.getElementById('p-full').value.trim(),
    image: document.getElementById('p-image').value.trim()
  };

  const saveBtn = document.querySelector('.fs-btn');
  const prevLabel = saveBtn.textContent;
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  const result = id ? await updateProgram(id, program) : await addProgram(program);

  saveBtn.disabled = false;
  saveBtn.textContent = prevLabel;

  if (result.success) {
    toast(id ? "Program updated!" : "Program added!");
    closeProgramForm();
    if (id) {
      const idx = cachedPrograms.findIndex(p => p.id === id);
      if (idx !== -1) cachedPrograms[idx] = { ...cachedPrograms[idx], ...program };
    } else {
      cachedPrograms.unshift({ id: result.id, ...program, createdAt: Date.now() });
    }
    renderProgramsTableFromCache();
  } else {
    toast(result.error || "Save failed!", true);
  }
}

async function deleteProgramAction(id) {
  if (!confirm("Delete this program?")) return;
  if (await deleteProgram(id)) {
    toast("Program deleted.");
    cachedPrograms = cachedPrograms.filter(p => p.id !== id);
    renderProgramsTableFromCache();
  } else {
    toast("Delete failed!", true);
  }
}

/*===== PARTICIPANTS ("Join This Program" submissions) =====*/
async function loadFormFieldsIntoBuilder() {
  const content = await loadSiteContent();
  const m = document.getElementById('membership-form-url');
  const v = document.getElementById('volunteer-form-url');
  if (m) m.value = (content && content.membershipFormUrl) || '';
  if (v) v.value = (content && content.volunteerFormUrl) || '';
}

async function saveFormLinks() {
  const membershipFormUrl = document.getElementById('membership-form-url').value.trim();
  const volunteerFormUrl = document.getElementById('volunteer-form-url').value.trim();
  const bad = [membershipFormUrl, volunteerFormUrl].some(u => u && !/^https?:\/\//i.test(u));
  if (bad) return toast("Links must start with https://", true);
  const result = await saveSiteContent({ membershipFormUrl, volunteerFormUrl });
  toast(result.success ? "Form links saved! ✅" : (result.error || "Save failed!"), !result.success);
}

async function renderParticipantsTable() {
  const body = document.getElementById('partbl-body');
  if (!body) return;
  body.innerHTML = `<tr class="empty-row"><td colspan="6">Loading...</td></tr>`;
  cachedParticipants = await loadParticipants();
  updateDashboardStats();

  if (!cachedParticipants.length) {
    body.innerHTML = `<tr class="empty-row"><td colspan="6">No one has joined a program yet.</td></tr>`;
    return;
  }

  body.innerHTML = cachedParticipants.map(p => {
    const dateStr = p.submittedAt ? new Date(p.submittedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
    const phoneVal = p.phone || (p.fields && Object.entries(p.fields).find(([k]) => /phone/i.test(k))?.[1]);
    return `
    <tr>
      <td><strong>${p.name}</strong></td>
      <td>${p.programTitle || '—'}</td>
      <td style="font-size:.8rem;color:var(--muted);">${p.email}${phoneVal ? '<br>' + phoneVal : ''}</td>
      <td><span class="bs ${p.status || 'new'}">${p.status || 'new'}</span>${p.certId && p.status === 'completed' ? '<br><span style="font-size:.7rem;color:var(--muted);font-family:monospace;">' + p.certId + '</span>' : ''}</td>
      <td style="font-size:.8rem;color:var(--muted);white-space:nowrap;">${dateStr}</td>
      <td class="tbl-acts">
        <button class="e-btn" onclick="openPartForm('${p.id}')">View</button>
        <button class="d-btn" onclick="deletePartAction('${p.id}')">Delete</button>
      </td>
    </tr>`;
  }).join('');
}

function openPartForm(id) {
  const p = cachedParticipants.find(x => x.id === id);
  if (!p) return;
  document.getElementById('part-id').value = p.id;
  document.getElementById('part-name').value = p.name || '';
  document.getElementById('part-email').value = p.email || '';
  document.getElementById('part-program').value = p.programTitle || '';
  document.getElementById('part-status').value = p.status || 'new';

  // Dynamic extra answers (new submissions use p.fields; older ones may
  // still have separate phone/message properties — show both gracefully).
  const extra = document.getElementById('part-extra-fields');
  const entries = [];
  if (p.fields && typeof p.fields === 'object') {
    Object.entries(p.fields).forEach(([label, val]) => { if (val) entries.push([label, val]); });
  }
  if (!p.fields) {
    if (p.phone) entries.push(['Phone', p.phone]);
    if (p.message) entries.push(['Message', p.message]);
  }
  extra.innerHTML = entries.length
    ? entries.map(([label, val]) => `<div class="fg"><label>${label}</label><textarea class="fi" disabled>${val}</textarea></div>`).join('')
    : `<p style="color:var(--muted);font-size:.85rem;">No additional answers.</p>`;

  document.getElementById('partmodal').classList.add('open');
}

function closePartForm() {
  document.getElementById('partmodal').classList.remove('open');
}

async function savePartStatus() {
  const id = document.getElementById('part-id').value;
  const status = document.getElementById('part-status').value;
  const part = cachedParticipants.find(x => x.id === id);
  const changes = { status };

  if (part && status === 'completed') {
    const issued = await issueCertificate(part);
    if (!issued.success) {
      toast("Certificate could not be issued: " + (issued.error || "error"), true);
      return;
    }
    changes.certId = issued.certId;
  } else if (part && part.certId && part.status === 'completed') {
    // Moving away from "completed" -> the certificate stops verifying.
    const rev = await revokeCertificate(part.certId);
    if (!rev.success) {
      toast("Certificate could not be revoked: " + (rev.error || "error"), true);
      return;
    }
  }

  const result = await updateParticipant(id, changes);
  if (result.success) {
    toast(changes.certId ? "Status updated — certificate " + changes.certId + " issued." : "Status updated!");
    closePartForm();
    renderParticipantsTable();
  } else {
    toast(result.error || "Update failed!", true);
  }
}

// Issues certificates for every "completed" participant that doesn't have a
// valid one yet (e.g. people marked completed before verification existed).
async function syncCertificates() {
  if (!cachedParticipants.length) cachedParticipants = await loadParticipants();
  const todo = cachedParticipants.filter(p => p.status === 'completed' && !p.certId);
  if (!todo.length) { toast("All completed participants already have certificates."); return; }
  let ok = 0;
  for (const p of todo) {
    const r = await issueCertificate(p);
    if (r.success && (await updateParticipant(p.id, { certId: r.certId })).success) ok++;
  }
  toast(ok + " of " + todo.length + " certificate(s) issued.", ok !== todo.length);
  renderParticipantsTable();
}

async function deletePartAction(id) {
  if (!confirm("Delete this participant entry?")) return;
  const part = cachedParticipants.find(x => x.id === id);
  if (part && part.certId) await revokeCertificate(part.certId);
  if (await deleteParticipant(id)) {
    toast("Deleted.");
    renderParticipantsTable();
  } else {
    toast("Delete failed!", true);
  }
}

/*===== TEAM MEMBERS =====*/
let cachedTeam = [];

async function renderTeamTable() {
  const body = document.getElementById('ttbl-body');
  if (!body) return;
  body.innerHTML = `<tr class="empty-row"><td colspan="5">Loading...</td></tr>`;
  cachedTeam = await loadTeam();

  if (!cachedTeam.length) {
    body.innerHTML = `<tr class="empty-row"><td colspan="5">No team members yet. Click "+ Add Member" to create one.</td></tr>`;
    return;
  }

  body.innerHTML = cachedTeam.map(t => `
    <tr>
      <td>${t.photo ? `<img class="thumb" src="${t.photo}">` : `<div class="thumb-ph">👤</div>`}</td>
      <td><strong>${t.name}</strong></td>
      <td>${t.role || '—'}</td>
      <td><span class="bs ${t.status || 'active'}">${t.status || 'active'}</span></td>
      <td class="tbl-acts">
        <button class="e-btn" onclick="editTeamMember('${t.id}')">Edit</button>
        <button class="d-btn" onclick="deleteTeamAction('${t.id}')">Delete</button>
      </td>
    </tr>`).join('');
}

function openTeamForm() {
  document.getElementById('tmodal-title').textContent = "Add Team Member";
  document.getElementById('t-id').value = '';
  document.getElementById('t-name').value = '';
  document.getElementById('t-role').value = '';
  document.getElementById('t-group').value = 'Members & Volunteers';
  document.getElementById('t-bio').value = '';
  document.getElementById('t-status').value = 'active';
  document.getElementById('t-photo').value = '';
  document.getElementById('t-photo-url').value = '';
  document.getElementById('t-photo-prev').innerHTML = '';
  document.getElementById('tmodal').classList.add('open');
}

function editTeamMember(id) {
  const t = cachedTeam.find(x => x.id === id);
  if (!t) return;
  document.getElementById('tmodal-title').textContent = "Edit Team Member";
  document.getElementById('t-id').value = t.id;
  document.getElementById('t-name').value = t.name || '';
  document.getElementById('t-role').value = t.role || '';
  document.getElementById('t-group').value = t.group || 'Members & Volunteers';
  document.getElementById('t-bio').value = t.bio || '';
  document.getElementById('t-status').value = t.status || 'active';
  document.getElementById('t-photo').value = t.photo || '';
  document.getElementById('t-photo-url').value = t.photo || '';
  document.getElementById('t-photo-prev').innerHTML = t.photo ? `<img src="${t.photo}">` : '';
  document.getElementById('tmodal').classList.add('open');
}

function closeTeamForm() {
  document.getElementById('tmodal').classList.remove('open');
}

async function prevTeamPhoto(input) {
  if (!input.files?.[0]) return;
  const prev = document.getElementById('t-photo-prev');
  prev.innerHTML = `<div style="color:var(--muted);font-size:.82rem;">⏳ Uploading...</div>`;
  const result = await uploadToImgBB(input.files[0]);
  if (result.success) {
    document.getElementById('t-photo').value = result.url;
    document.getElementById('t-photo-url').value = result.url;
    prev.innerHTML = `<img src="${result.url}">`;
  } else {
    prev.innerHTML = `<div style="color:#c0392b;font-size:.82rem;">❌ Upload failed</div>`;
  }
}

async function saveTeamMember() {
  const id = document.getElementById('t-id').value;
  const name = document.getElementById('t-name').value.trim();
  const role = document.getElementById('t-role').value.trim();
  if (!name) return toast("Name is required!", true);
  if (!role) return toast("Role / Position is required!", true);

  const member = {
    name,
    role,
    group: document.getElementById('t-group').value,
    bio: document.getElementById('t-bio').value.trim(),
    status: document.getElementById('t-status').value,
    photo: document.getElementById('t-photo').value.trim()
  };

  const result = id ? await updateTeamMember(id, member) : await addTeamMember(member);
  if (result.success) {
    toast(id ? "Team member updated!" : "Team member added!");
    closeTeamForm();
    renderTeamTable();
  } else {
    toast(result.error || "Save failed!", true);
  }
}

async function deleteTeamAction(id) {
  if (!confirm("Remove this team member?")) return;
  if (await deleteTeamMember(id)) {
    toast("Removed.");
    renderTeamTable();
  } else {
    toast("Delete failed!", true);
  }
}

/*===== OUR NETWORK (affiliated pages) =====*/
let cachedNetwork = [];

async function renderNetworkTable() {
  const body = document.getElementById('nptbl-body');
  body.innerHTML = `<tr class="empty-row"><td colspan="5">Loading...</td></tr>`;
  cachedNetwork = await loadNetworkPages();

  if (!cachedNetwork.length) {
    body.innerHTML = `<tr class="empty-row"><td colspan="5">No network pages yet. Click "+ Add Page" to create one.</td></tr>`;
    return;
  }

  body.innerHTML = cachedNetwork.map(p => `
    <tr>
      <td><strong style="color:var(--navy)">${p.order || '—'}</strong></td>
      <td>${p.logo ? `<img class="thumb" src="${p.logo}">` : `<div class="thumb-ph">🌐</div>`}</td>
      <td><strong>${p.name}</strong></td>
      <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"><a href="${p.url}" target="_blank" rel="noopener">${p.url}</a></td>
      <td class="tbl-acts">
        <button class="e-btn" onclick="editNetworkPage('${p.id}')">Edit</button>
        <button class="d-btn" onclick="deleteNetworkAction('${p.id}')">Delete</button>
      </td>
    </tr>`).join('');
}

function openNetworkForm() {
  document.getElementById('npmodal-title').textContent = "Add Network Page";
  document.getElementById('np-id').value = '';
  document.getElementById('np-name').value = '';
  document.getElementById('np-url').value = '';
  document.getElementById('np-desc').value = '';
  document.getElementById('np-order').value = '';
  document.getElementById('np-logo').value = '';
  document.getElementById('np-logo-url').value = '';
  document.getElementById('np-logo-prev').innerHTML = '';
  document.getElementById('npmodal').classList.add('open');
}

function editNetworkPage(id) {
  const p = cachedNetwork.find(x => x.id === id);
  if (!p) return;
  document.getElementById('npmodal-title').textContent = "Edit Network Page";
  document.getElementById('np-id').value = p.id;
  document.getElementById('np-name').value = p.name || '';
  document.getElementById('np-url').value = p.url || '';
  document.getElementById('np-desc').value = p.description || '';
  document.getElementById('np-order').value = p.order || '';
  document.getElementById('np-logo').value = p.logo || '';
  document.getElementById('np-logo-url').value = p.logo || '';
  document.getElementById('np-logo-prev').innerHTML = p.logo ? `<img src="${p.logo}">` : '';
  document.getElementById('npmodal').classList.add('open');
}

function closeNetworkForm() {
  document.getElementById('npmodal').classList.remove('open');
}

async function prevNetworkLogo(input) {
  if (!input.files?.[0]) return;
  const prev = document.getElementById('np-logo-prev');
  prev.innerHTML = `<div style="color:var(--muted);font-size:.82rem;">⏳ Uploading...</div>`;
  const result = await uploadToImgBB(input.files[0]);
  if (result.success) {
    document.getElementById('np-logo').value = result.url;
    document.getElementById('np-logo-url').value = result.url;
    prev.innerHTML = `<img src="${result.url}">`;
  } else {
    prev.innerHTML = `<div style="color:#c0392b;font-size:.82rem;">❌ Upload failed</div>`;
  }
}

async function saveNetworkPage() {
  const id = document.getElementById('np-id').value;
  const name = document.getElementById('np-name').value.trim();
  let url = document.getElementById('np-url').value.trim();
  if (!name) return toast("Page name is required!", true);
  if (!url) return toast("Website/Facebook URL is required!", true);
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

  const page = {
    name,
    url,
    description: document.getElementById('np-desc').value.trim(),
    order: parseInt(document.getElementById('np-order').value) || 999,
    logo: document.getElementById('np-logo').value.trim()
  };

  const result = id ? await updateNetworkPage(id, page) : await addNetworkPage(page);
  if (result.success) {
    toast(id ? "Network page updated!" : "Network page added!");
    closeNetworkForm();
    renderNetworkTable();
  } else {
    toast(result.error || "Save failed!", true);
  }
}

async function deleteNetworkAction(id) {
  if (!confirm("Remove this network page?")) return;
  if (await deleteNetworkPage(id)) {
    toast("Removed.");
    renderNetworkTable();
  } else {
    toast("Delete failed!", true);
  }
}


/*===== DEPARTMENTS & MEMBERSHIP (list editors, stored in content/site) =====*/
const INFO_CFG = {
  dept: { key: 'departments', list: 'dept-list', icon: true, label: 'Department' },
  mem:  { key: 'membership',  list: 'mem-list',  icon: false, label: 'Membership level' }
};
const infoLists = { dept: [], mem: [] };

async function loadInfoLists() {
  const c = await loadSiteContent();
  infoLists.dept = ((c && c.departments && c.departments.length) ? c.departments : ATHAR_DEFAULTS.departments).map(x => ({ ...x }));
  infoLists.mem = ((c && c.membership && c.membership.length) ? c.membership : ATHAR_DEFAULTS.membership).map(x => ({ ...x }));
  renderInfoRows('dept');
  renderInfoRows('mem');
}

function renderInfoRows(kind) {
  const cfg = INFO_CFG[kind];
  const box = document.getElementById(cfg.list);
  if (!box) return;
  box.innerHTML = infoLists[kind].map((it, i) => `
    <div class="card" data-i="${i}">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <strong style="font-size:.9rem;">${cfg.label} ${i + 1}</strong>
        <button class="d-btn" onclick="removeInfoRow('${kind}',${i})">Remove</button>
      </div>
      <div class="row2">
        <div class="fg"><label>Title</label><input class="fi" data-f="title" value="${escHtml(it.title || '')}"></div>
        <div class="fg"><label>Bangla name (optional)</label><input class="fi" data-f="bn" value="${escHtml(it.bn || '')}"></div>
      </div>
      ${cfg.icon ? `<div class="fg"><label>Icon (one emoji)</label><input class="fi" data-f="icon" value="${escHtml(it.icon || '')}" style="max-width:120px;"></div>` : ''}
      <div class="fg"><label>Description</label><textarea class="fi" data-f="text">${escHtml(it.text || '')}</textarea></div>
    </div>`).join('') || '<div class="card"><p style="color:var(--muted);">Nothing here yet — press “+ Add”.</p></div>';
}

function syncInfoFromDom(kind) {
  const box = document.getElementById(INFO_CFG[kind].list);
  if (!box) return;
  box.querySelectorAll('.card[data-i]').forEach(card => {
    const i = parseInt(card.getAttribute('data-i'), 10);
    const item = infoLists[kind][i];
    if (!item) return;
    card.querySelectorAll('[data-f]').forEach(inp => { item[inp.getAttribute('data-f')] = inp.value.trim(); });
  });
}

function addInfoRow(kind) {
  syncInfoFromDom(kind);
  infoLists[kind].push({ icon: '🌙', title: '', bn: '', text: '' });
  renderInfoRows(kind);
}

function removeInfoRow(kind, i) {
  if (!confirm('Remove this card?')) return;
  syncInfoFromDom(kind);
  infoLists[kind].splice(i, 1);
  renderInfoRows(kind);
}

async function saveInfoList(kind) {
  syncInfoFromDom(kind);
  const cfg = INFO_CFG[kind];
  const list = infoLists[kind].filter(x => x.title);
  if (!list.length) return toast('Add at least one card with a title.', true);
  const result = await saveSiteContent({ [cfg.key]: list });
  if (result.success) { infoLists[kind] = list; renderInfoRows(kind); }
  toast(result.success ? 'Saved! Refresh the website to see changes. ✅' : (result.error || 'Save failed!'), !result.success);
}

/*===== ATHAR STARTER CONTENT (one-click seed) =====*/
async function seedAtharContent() {
  if (!confirm('Load ATHAR starter content?\n\nThis overwrites the home page text, departments and membership levels with the ATHAR defaults.')) return;
  const D = ATHAR_DEFAULTS;
  const content = {
    ...D.content,
    hero: { ...D.content.hero, bn: 'ঈমানের প্রেরণায়, চরিত্র গঠনে।' },
    departments: D.departments,
    membership: D.membership
  };
  const r = await saveSiteContent(content);
  if (!r.success) return toast(r.error || 'Could not save content.', true);

  const replaceOld = confirm('Also DELETE all existing programs and team members (the old ones) and start fresh with the ATHAR starter programs?\n\nOK = delete old ones and add the starter programs\nCancel = keep what exists and only add starter programs that are missing');
  const existing = await loadPrograms();
  if (replaceOld) {
    for (const p of existing) await deleteProgram(p.id);
    const team = await loadTeam();
    for (const t of team) await deleteTeamMember(t.id);
  }
  const have = new Set((replaceOld ? [] : existing).map(p => p.title));
  const toAdd = D.programs.filter(p => !have.has(p.title)).reverse(); // newest-first listing keeps the intended order
  let added = 0;
  for (const p of toAdd) { const res = await addProgram({ ...p }); if (res.success) added++; }

  toast('ATHAR content loaded — ' + added + ' program(s) added. ✅');
  renderProgramsTable();
  renderTeamTable();
  populateForm();
}


/*===== ADD CERTIFICATE (manual, no sign-up needed) =====*/
function openCertForm() {
  document.getElementById('cert-name').value = '';
  document.getElementById('cert-email').value = '';
  document.getElementById('cert-program').value = '';
  const dl = document.getElementById('cert-program-list');
  dl.innerHTML = (typeof cachedPrograms !== 'undefined' ? cachedPrograms : []).map(p => `<option value="${escHtml(p.title)}"></option>`).join('');
  document.getElementById('cert-form-view').style.display = 'block';
  document.getElementById('cert-done-view').style.display = 'none';
  document.getElementById('certmodal').classList.add('open');
}

function closeCertForm() {
  document.getElementById('certmodal').classList.remove('open');
}

async function saveNewCertificate() {
  const name = document.getElementById('cert-name').value.trim();
  const email = document.getElementById('cert-email').value.trim();
  const programTitle = document.getElementById('cert-program').value.trim();
  if (!name || !email || !programTitle) return toast("Name, email and program are required!", true);
  if (!/^\S+@\S+\.\S+$/.test(email)) return toast("Please enter a valid email.", true);

  const btn = document.getElementById('cert-save-btn');
  btn.disabled = true; btn.textContent = 'Issuing...';

  // A participant record is created (status "completed") so it shows in the list like any other certificate.
  const added = await addParticipant({ name, email, programTitle, programId: 'manual', fields: {}, status: 'completed', addedBy: 'admin' });
  if (!added.success) {
    btn.disabled = false; btn.textContent = 'Issue Certificate';
    return toast(added.error || "Could not save!", true);
  }
  const issued = await issueCertificate({ id: added.id, name, email, programTitle });
  if (!issued.success) {
    await deleteParticipant(added.id);
    btn.disabled = false; btn.textContent = 'Issue Certificate';
    return toast("Certificate could not be issued: " + (issued.error || "error"), true);
  }
  await updateParticipant(added.id, { certId: issued.certId });

  btn.disabled = false; btn.textContent = 'Issue Certificate';
  document.getElementById('cert-done-id').textContent = issued.certId;
  document.getElementById('cert-done-verify').href = 'verify.html?id=' + encodeURIComponent(issued.certId);
  document.getElementById('cert-form-view').style.display = 'none';
  document.getElementById('cert-done-view').style.display = 'block';
  toast("Certificate " + issued.certId + " issued!");
  renderParticipantsTable();
}


/*===== NOTICE & NEWS (stored in content/site → notices[]) =====*/
let cachedNotices = [];

async function loadNoticesAdmin() {
  const body = document.getElementById('ntbl-body');
  if (body) body.innerHTML = `<tr class="empty-row"><td colspan="4">Loading...</td></tr>`;
  const c = await loadSiteContent();
  cachedNotices = (c && Array.isArray(c.notices)) ? c.notices : [];
  renderNoticesTable();
}

function renderNoticesTable() {
  const body = document.getElementById('ntbl-body');
  if (!body) return;
  if (!cachedNotices.length) {
    body.innerHTML = `<tr class="empty-row"><td colspan="4">No notices yet. Click "+ Add Notice" to publish one.</td></tr>`;
    return;
  }
  const sorted = [...cachedNotices].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  body.innerHTML = sorted.map(n => `
    <tr>
      <td>${escHtml(n.date || '—')}</td>
      <td><strong>${escHtml(n.title)}</strong></td>
      <td>${n.link ? '🔗' : '—'}</td>
      <td class="tbl-acts">
        <button class="e-btn" onclick="openNoticeForm('${escHtml(n.id)}')">Edit</button>
        <button class="d-btn" onclick="deleteNoticeAction('${escHtml(n.id)}')">Delete</button>
      </td>
    </tr>`).join('');
}

function openNoticeForm(id) {
  const n = id ? cachedNotices.find(x => x.id === id) : null;
  document.getElementById('nmodal-title').textContent = n ? 'Edit Notice' : 'Add Notice';
  document.getElementById('n-id').value = n ? n.id : '';
  document.getElementById('n-title').value = n ? (n.title || '') : '';
  document.getElementById('n-date').value = n ? (n.date || '') : new Date().toISOString().slice(0, 10);
  document.getElementById('n-text').value = n ? (n.text || '') : '';
  document.getElementById('n-link').value = n ? (n.link || '') : '';
  document.getElementById('noticemodal').classList.add('open');
}

function closeNoticeForm() {
  document.getElementById('noticemodal').classList.remove('open');
}

async function saveNotice() {
  const id = document.getElementById('n-id').value;
  const title = document.getElementById('n-title').value.trim();
  const link = document.getElementById('n-link').value.trim();
  if (!title) return toast("Title is required!", true);
  if (link && !/^https?:\/\//i.test(link)) return toast("Link must start with https://", true);
  const item = {
    id: id || ('n' + Date.now()),
    title,
    date: document.getElementById('n-date').value || new Date().toISOString().slice(0, 10),
    text: document.getElementById('n-text').value.trim(),
    link
  };
  // Re-read the latest list first so notices saved from another device aren't overwritten.
  const c = await loadSiteContent();
  let list = (c && Array.isArray(c.notices)) ? c.notices : [];
  list = id ? list.map(x => x.id === id ? item : x) : [item, ...list];
  const result = await saveSiteContent({ notices: list });
  if (result.success) {
    cachedNotices = list;
    toast(id ? "Notice updated!" : "Notice published!");
    closeNoticeForm();
    renderNoticesTable();
  } else {
    toast(result.error || "Save failed!", true);
  }
}

async function deleteNoticeAction(id) {
  if (!confirm("Delete this notice?")) return;
  const c = await loadSiteContent();
  const list = ((c && Array.isArray(c.notices)) ? c.notices : []).filter(x => x.id !== id);
  const result = await saveSiteContent({ notices: list });
  if (result.success) {
    cachedNotices = list;
    toast("Deleted.");
    renderNoticesTable();
  } else {
    toast(result.error || "Delete failed!", true);
  }
}

/*===== DAILY AYAH / HADITH + PRAYER SETTINGS =====*/
async function loadDailySettings() {
  const c = await loadSiteContent();
  const d = (c && c.daily) || {};
  const p = (c && c.prayer) || {};
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
  set('daily-type', d.type || 'ayah');
  set('daily-ref', d.reference || '');
  set('daily-ar', d.arabic || '');
  set('daily-tx', d.text || '');
  set('pr-city-in', p.city || '');
  set('pr-country-in', p.country || '');
  set('pr-method-in', p.method || '1');
  set('pr-school-in', p.school !== undefined ? p.school : '1');
  set('pr-adj-in', p.adjustment !== undefined ? String(p.adjustment) : '0');
}

async function saveDaily() {
  const text = document.getElementById('daily-tx').value.trim();
  const arabic = document.getElementById('daily-ar').value.trim();
  if (!text && !arabic) return toast("Add the Arabic text or the translation.", true);
  const daily = {
    type: document.getElementById('daily-type').value,
    reference: document.getElementById('daily-ref').value.trim(),
    arabic, text
  };
  const r = await saveSiteContent({ daily });
  toast(r.success ? "Saved! ✅ Live on the Home page." : (r.error || "Save failed!"), !r.success);
}

async function savePrayerSettings() {
  const prayer = {
    city: document.getElementById('pr-city-in').value.trim() || 'Dhaka',
    country: document.getElementById('pr-country-in').value.trim() || 'Bangladesh',
    method: document.getElementById('pr-method-in').value,
    school: document.getElementById('pr-school-in').value,
    adjustment: parseInt(document.getElementById('pr-adj-in').value, 10) || 0
  };
  const r = await saveSiteContent({ prayer });
  toast(r.success ? "Prayer settings saved! ✅" : (r.error || "Save failed!"), !r.success);
}


/*===== CERTIFICATE DESIGN (template + name/QR/ID placement) =====*/
let _ctImg = null;
const ctv = (id) => document.getElementById(id);

function readCertTpl() {
  const num = (id, d) => { const v = parseFloat(ctv(id).value); return isNaN(v) ? d : v; };
  return {
    url: ctv('ct-url').value,
    name: { x: num('ct-nx', 50), y: num('ct-ny', 50), size: num('ct-nsize', 5), color: ctv('ct-ncolor').value, font: ctv('ct-nfont').value, weight: '800', maxW: num('ct-nmaxw', 80) },
    qr: { on: ctv('ct-qon').checked, x: num('ct-qx', 86), y: num('ct-qy', 80), size: num('ct-qsize', 11) },
    id: { on: ctv('ct-ion').checked, x: num('ct-ix', 50), y: num('ct-iy', 95), size: num('ct-isize', 1.3), color: ctv('ct-icolor').value }
  };
}

function fillCertForm(t) {
  t = certMergeTpl(t);
  ctv('ct-url').value = t.url;
  ctv('ct-nx').value = t.name.x; ctv('ct-ny').value = t.name.y; ctv('ct-nsize').value = t.name.size;
  ctv('ct-ncolor').value = t.name.color; ctv('ct-nfont').value = t.name.font; ctv('ct-nmaxw').value = t.name.maxW;
  ctv('ct-qon').checked = !!t.qr.on; ctv('ct-qx').value = t.qr.x; ctv('ct-qy').value = t.qr.y; ctv('ct-qsize').value = t.qr.size;
  ctv('ct-ion').checked = !!t.id.on; ctv('ct-ix').value = t.id.x; ctv('ct-iy').value = t.id.y;
  ctv('ct-isize').value = t.id.size; ctv('ct-icolor').value = t.id.color;
}

async function loadCertDesign() {
  const c = await loadSiteContent();
  const t = c && c.certTemplate;
  fillCertForm(t);
  _ctImg = null;
  if (t && t.url) {
    ctv('ct-status').textContent = 'Loading your design…';
    try { _ctImg = await loadCertImage(t.url); ctv('ct-status').textContent = '✅ Design loaded.'; }
    catch (e) { ctv('ct-status').textContent = '⚠️ The saved design image could not be loaded.'; }
  } else {
    ctv('ct-status').textContent = 'No design uploaded yet — the built-in certificate is being used.';
  }
  redrawCertPreview();
}

async function uploadCertDesign(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  if (file.size > 12 * 1024 * 1024) return toast("Image is too large (max 12 MB).", true);
  ctv('ct-status').textContent = '⏳ Uploading…';
  const r = await uploadToImgBB(file);   // original quality — no compression
  input.value = '';
  if (!r.success) { ctv('ct-status').textContent = '❌ Upload failed.'; return toast("Upload failed!", true); }
  ctv('ct-url').value = r.url;
  try { _ctImg = await loadCertImage(r.url); ctv('ct-status').textContent = '✅ Uploaded. Place the name/QR/ID, then Save.'; }
  catch (e) { ctv('ct-status').textContent = '⚠️ Uploaded, but the preview could not load.'; }
  redrawCertPreview();
}

let _ctTimer = null;
function redrawCertPreview() {
  clearTimeout(_ctTimer);
  _ctTimer = setTimeout(async () => {
    const canvas = ctv('ct-canvas');
    if (!_ctImg) {
      canvas.width = 1200; canvas.height = 850;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#f3f4f6'; ctx.fillRect(0, 0, 1200, 850);
      ctx.fillStyle = '#9aa3b2'; ctx.font = '600 28px Inter, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Upload your design to start', 600, 425);
      return;
    }
    const certId = 'ATH-SAMPL-E000-0000';
    const verifyUrl = new URL('verify.html?id=' + certId, location.href).href;
    await drawCertTemplate(canvas, _ctImg, readCertTpl(), { name: ctv('ct-sample').value || 'Sample Name', certId, verifyUrl });
  }, 60);
}

document.addEventListener('click', (e) => {
  const canvas = ctv('ct-canvas');
  if (!canvas || e.target !== canvas || !_ctImg) return;
  const rect = canvas.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
  const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1);
  const target = (document.querySelector('input[name="ct-target"]:checked') || {}).value || 'name';
  const map = { name: ['ct-nx', 'ct-ny'], qr: ['ct-qx', 'ct-qy'], id: ['ct-ix', 'ct-iy'] }[target];
  ctv(map[0]).value = x; ctv(map[1]).value = y;
  redrawCertPreview();
});

async function saveCertDesign() {
  const t = readCertTpl();
  if (!t.url) return toast("Upload your certificate design first.", true);
  const r = await saveSiteContent({ certTemplate: t });
  toast(r.success ? "Certificate design saved! ✅" : (r.error || "Save failed!"), !r.success);
}

async function removeCertDesign() {
  if (!confirm("Remove your design and go back to the built-in certificate?")) return;
  const r = await saveSiteContent({ certTemplate: { url: '' } });
  if (r.success) { toast("Removed."); _ctImg = null; fillCertForm({}); ctv('ct-status').textContent = 'Built-in certificate is being used.'; redrawCertPreview(); }
  else toast(r.error || "Failed!", true);
}
