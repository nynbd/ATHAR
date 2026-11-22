// All editable site text lives in one Firestore document: content/site.
// The public page renders its own hardcoded defaults first (so it never
// looks broken/empty), then overwrites with whatever is saved here, if
// anything. The admin panel reads/writes this same document.

function waitForFirebase() {
  return new Promise((resolve) => {
    const check = setInterval(() => {
      if (window.firebaseDB && window.firebaseFunctions) {
        clearInterval(check);
        resolve();
      }
    }, 80);
  });
}

async function loadSiteContent() {
  await waitForFirebase();
  const { doc, getDoc } = window.firebaseFunctions;
  const db = window.firebaseDB;
  try {
    const snap = await getDoc(doc(db, "content", "site"));
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.error("Load site content error:", err);
    return null;
  }
}

async function saveSiteContent(content) {
  await waitForFirebase();
  const { doc, setDoc } = window.firebaseFunctions;
  const db = window.firebaseDB;
  try {
    await setDoc(doc(db, "content", "site"), content, { merge: true });
    return { success: true };
  } catch (err) {
    console.error("Save site content error:", err);
    return { success: false, error: err.message };
  }
}

/*===== PROGRAMS (full list — unlimited, add/edit/delete) =====*/
async function loadPrograms() {
  await waitForFirebase();
  const { collection, getDocs, query, orderBy } = window.firebaseFunctions;
  const db = window.firebaseDB;
  try {
    const snap = await getDocs(query(collection(db, "programs"), orderBy("createdAt", "desc")));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("Load programs error:", err);
    return [];
  }
}

async function addProgram(program) {
  await waitForFirebase();
  const { collection, addDoc } = window.firebaseFunctions;
  const db = window.firebaseDB;
  try {
    program.createdAt = Date.now();
    const ref = await addDoc(collection(db, "programs"), program);
    return { success: true, id: ref.id };
  } catch (err) {
    console.error("Add program error:", err);
    return { success: false, error: err.message };
  }
}

async function updateProgram(id, program) {
  await waitForFirebase();
  const { doc, updateDoc } = window.firebaseFunctions;
  const db = window.firebaseDB;
  try {
    await updateDoc(doc(db, "programs", id), program);
    return { success: true };
  } catch (err) {
    console.error("Update program error:", err);
    return { success: false, error: err.message };
  }
}

async function deleteProgram(id) {
  await waitForFirebase();
  const { doc, deleteDoc } = window.firebaseFunctions;
  const db = window.firebaseDB;
  try {
    await deleteDoc(doc(db, "programs", id));
    return true;
  } catch (err) {
    console.error("Delete program error:", err);
    return false;
  }
}

/*===== NETWORK PAGES (Our Network section on homepage) =====*/
async function loadNetworkPages() {
  await waitForFirebase();
  const { collection, getDocs, query, orderBy } = window.firebaseFunctions;
  const db = window.firebaseDB;
  try {
    const snap = await getDocs(query(collection(db, "networkPages"), orderBy("order", "asc")));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("Load network pages error:", err);
    return [];
  }
}

async function addNetworkPage(page) {
  await waitForFirebase();
  const { collection, addDoc } = window.firebaseFunctions;
  const db = window.firebaseDB;
  try {
    page.createdAt = Date.now();
    const ref = await addDoc(collection(db, "networkPages"), page);
    return { success: true, id: ref.id };
  } catch (err) {
    console.error("Add network page error:", err);
    return { success: false, error: err.message };
  }
}

async function updateNetworkPage(id, page) {
  await waitForFirebase();
  const { doc, updateDoc } = window.firebaseFunctions;
  const db = window.firebaseDB;
  try {
    await updateDoc(doc(db, "networkPages", id), page);
    return { success: true };
  } catch (err) {
    console.error("Update network page error:", err);
    return { success: false, error: err.message };
  }
}

async function deleteNetworkPage(id) {
  await waitForFirebase();
  const { doc, deleteDoc } = window.firebaseFunctions;
  const db = window.firebaseDB;
  try {
    await deleteDoc(doc(db, "networkPages", id));
    return true;
  } catch (err) {
    console.error("Delete network page error:", err);
    return false;
  }
}

/*===== TEAM MEMBERS =====*/
async function loadTeam() {
  await waitForFirebase();
  const { collection, getDocs, query, orderBy } = window.firebaseFunctions;
  const db = window.firebaseDB;
  try {
    const snap = await getDocs(query(collection(db, "team"), orderBy("createdAt", "desc")));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("Load team error:", err);
    return [];
  }
}

async function addTeamMember(member) {
  await waitForFirebase();
  const { collection, addDoc } = window.firebaseFunctions;
  const db = window.firebaseDB;
  try {
    member.createdAt = Date.now();
    const ref = await addDoc(collection(db, "team"), member);
    return { success: true, id: ref.id };
  } catch (err) {
    console.error("Add team member error:", err);
    return { success: false, error: err.message };
  }
}

async function updateTeamMember(id, member) {
  await waitForFirebase();
  const { doc, updateDoc } = window.firebaseFunctions;
  const db = window.firebaseDB;
  try {
    await updateDoc(doc(db, "team", id), member);
    return { success: true };
  } catch (err) {
    console.error("Update team member error:", err);
    return { success: false, error: err.message };
  }
}

async function deleteTeamMember(id) {
  await waitForFirebase();
  const { doc, deleteDoc } = window.firebaseFunctions;
  const db = window.firebaseDB;
  try {
    await deleteDoc(doc(db, "team", id));
    return true;
  } catch (err) {
    console.error("Delete team member error:", err);
    return false;
  }
}

// Free-tier ImgBB upload — used for program cover images in the admin panel.
async function uploadToImgBB(file) {
  const key = "b374ae6a3edcf12a90a5b7be9ec39f50";
  try {
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const form = new FormData();
    form.append("image", base64);
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${key}`, { method: "POST", body: form });
    const data = await res.json();
    if (data.success) return { success: true, url: data.data.url };
    return { success: false, error: "Upload failed" };
  } catch (err) {
    console.error("ImgBB upload error:", err);
    return { success: false, error: err.message };
  }
}

/*===== PARTICIPANTS ("Join This Program" submissions) =====*/
async function loadParticipants() {
  await waitForFirebase();
  const { collection, getDocs, query, orderBy } = window.firebaseFunctions;
  const db = window.firebaseDB;
  try {
    const snap = await getDocs(query(collection(db, "participants"), orderBy("submittedAt", "desc")));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("Load participants error:", err);
    return [];
  }
}

async function addParticipant(entry) {
  await waitForFirebase();
  const { collection, addDoc } = window.firebaseFunctions;
  const db = window.firebaseDB;
  try {
    entry.submittedAt = Date.now();
    entry.status = entry.status || 'new';
    const ref = await addDoc(collection(db, "participants"), entry);
    return { success: true, id: ref.id };
  } catch (err) {
    console.error("Add participant error:", err);
    return { success: false, error: err.message };
  }
}

async function updateParticipant(id, changes) {
  await waitForFirebase();
  const { doc, updateDoc } = window.firebaseFunctions;
  const db = window.firebaseDB;
  try {
    await updateDoc(doc(db, "participants", id), changes);
    return { success: true };
  } catch (err) {
    console.error("Update participant error:", err);
    return { success: false, error: err.message };
  }
}

async function deleteParticipant(id) {
  await waitForFirebase();
  const { doc, deleteDoc } = window.firebaseFunctions;
  const db = window.firebaseDB;
  try {
    await deleteDoc(doc(db, "participants", id));
    return true;
  } catch (err) {
    console.error("Delete participant error:", err);
    return false;
  }
}

/*===== CERTIFICATES (issue / revoke / public verify) =====
   certificates/{certId}  -> { certId, name, programTitle, issuedAt, revoked, emailHash, participantId }
   certIndex/{emailHash}  -> { ids: [certId, ...] }
   Neither document stores an email, phone or other private data, so they can be
   readable by anyone who knows the ID / the email hash, without exposing the
   participants collection. */
async function sha256Hex(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function emailHashInput(email) {
  return 'nyn:' + String(email || '').trim().toLowerCase();
}

function generateCertId() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  const chars = Array.from(bytes).map(b => alphabet[b % alphabet.length]).join('');
  return 'ATH-' + chars.slice(0, 4) + '-' + chars.slice(4, 8) + '-' + chars.slice(8, 12);
}

function normalizeCertId(raw) {
  // Accepts ATH-… (current) and NYN-… (certificates issued before the rebrand).
  const s = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const prefix = s.startsWith('NYN') ? 'NYN' : 'ATH';
  const body = (s.startsWith('NYN') || s.startsWith('ATH')) ? s.slice(3) : s;
  if (body.length !== 12) return null;
  return prefix + '-' + body.slice(0, 4) + '-' + body.slice(4, 8) + '-' + body.slice(8, 12);
}

// Admin only (needs write permission). Re-uses the participant's existing
// certId if they already have one, so QR codes on already-downloaded
// certificates keep working after a "re-complete".
async function issueCertificate(participant) {
  await waitForFirebase();
  const { doc, getDoc, setDoc } = window.firebaseFunctions;
  const db = window.firebaseDB;
  try {
    const emailHash = await sha256Hex(emailHashInput(participant.email));
    const certId = participant.certId || generateCertId();
    const existing = await getDoc(doc(db, "certificates", certId));
    const issuedAt = existing.exists() && existing.data().issuedAt ? existing.data().issuedAt : Date.now();
    await setDoc(doc(db, "certificates", certId), {
      certId,
      name: (participant.name || '').trim(),
      programTitle: participant.programTitle || '',
      issuedAt,
      revoked: false,
      emailHash,
      participantId: participant.id
    });
    const idxRef = doc(db, "certIndex", emailHash);
    const idx = await getDoc(idxRef);
    const ids = idx.exists() && Array.isArray(idx.data().ids) ? idx.data().ids : [];
    if (!ids.includes(certId)) ids.push(certId);
    await setDoc(idxRef, { ids });
    return { success: true, certId };
  } catch (err) {
    console.error("Issue certificate error:", err);
    return { success: false, error: err.message };
  }
}

async function revokeCertificate(certId) {
  await waitForFirebase();
  const { doc, setDoc } = window.firebaseFunctions;
  const db = window.firebaseDB;
  try {
    await setDoc(doc(db, "certificates", certId), { revoked: true, revokedAt: Date.now() }, { merge: true });
    return { success: true };
  } catch (err) {
    console.error("Revoke certificate error:", err);
    return { success: false, error: err.message };
  }
}

// Public: look up one certificate by its ID (used by verify.html + QR codes).
async function loadCertificate(certId) {
  await waitForFirebase();
  const { doc, getDoc } = window.firebaseFunctions;
  const db = window.firebaseDB;
  try {
    const snap = await getDoc(doc(db, "certificates", certId));
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.error("Load certificate error:", err);
    throw err;
  }
}

// Public: certificate IDs belonging to an email (looked up by hash only).
async function loadCertIndex(emailHash) {
  await waitForFirebase();
  const { doc, getDoc } = window.firebaseFunctions;
  const db = window.firebaseDB;
  try {
    const snap = await getDoc(doc(db, "certIndex", emailHash));
    return snap.exists() && Array.isArray(snap.data().ids) ? snap.data().ids : [];
  } catch (err) {
    console.error("Load cert index error:", err);
    throw err;
  }
}

/*===== ATHAR DEFAULT CONTENT =====
   Built-in starter content. The public pages show this whenever nothing has
   been saved in Firestore yet, and Admin -> "Load ATHAR starter content"
   writes it into Firestore so it can then be edited from the admin panel. */
const ATHAR_DEFAULTS = {
  content: {
    hero: {
      eyebrow: "ATHAR Islamic Youth Forum (AIYF)",
      headline: "Inspiring Faith, Building Character.",
      sub: "A youth-led forum that brings young people together to learn the Quran and Sunnah, build strong character, and serve their communities."
    },
    stats: [
      { num: "6", label: "Departments" },
      { num: "3", label: "Membership Levels" },
      { num: "4", label: "Program Tracks" },
      { num: "2", label: "Languages — Bangla & English" }
    ],
    about: {
      title: "Faith that shapes character. Youth that serve.",
      text1: "ATHAR Islamic Youth Forum (AIYF) is a youth-led forum rooted in the Quran and Sunnah. “Athar” (أثر) means a lasting trace — the mark a person leaves behind. We help young people leave a good one, through sound knowledge, good character and service to others.",
      text2: "Our work spans Quran learning, study circles, youth development, community service and media, all guided by one aim: Inspiring Faith, Building Character."
    },
    joinBanner: {
      title: "Be part of something that outlasts you.",
      text: "Membership is open to young people who want to learn, grow and serve. Join a study circle, volunteer in a department, or simply come along to our next program."
    },
    footerDesc: "ATHAR Islamic Youth Forum (AIYF) is a youth-led forum inspiring faith and building character through Quran learning, study circles, youth development and community service."
  },

  departments: [
    { icon: "📖", title: "Quran & Islamic Education", bn: "কুরআন ও ইসলামিক শিক্ষা", text: "Quran recitation with tajweed, tafsir study and weekly learning circles for every level." },
    { icon: "🌙", title: "Dawah & Awareness", bn: "দাওয়াহ ও সচেতনতা", text: "Sharing the message of Islam with wisdom and good manners, in our campuses and communities." },
    { icon: "🌱", title: "Youth & Character Development", bn: "যুব ও চরিত্র গঠন", text: "Mentoring, leadership and akhlaq training that turns good intentions into good habits." },
    { icon: "🤝", title: "Social Welfare & Charity", bn: "সমাজসেবা ও দান", text: "Relief drives, community support and service projects for those in need." },
    { icon: "🎥", title: "Media & Publications", bn: "মিডিয়া ও প্রকাশনা", text: "Articles, design, video and social media that carry our work and our message further." },
    { icon: "📅", title: "Events & Volunteers", bn: "ইভেন্ট ও স্বেচ্ছাসেবক", text: "Planning programs, competitions and gatherings, and organising our volunteer teams." }
  ],

  membership: [
    { title: "General Member", bn: "সাধারণ সদস্য", text: "Open to every young person who shares our aims. Join study circles, attend programs and be part of the community." },
    { title: "Active Member", bn: "সক্রিয় সদস্য", text: "Takes part regularly, joins a department and volunteers time to help programs run." },
    { title: "Executive Member", bn: "নির্বাহী সদস্য", text: "Leads a department or a project, helps plan the forum’s direction and is chosen by the executive committee." }
  ],

  teamGroups: [
    { key: "Advisory Board", bn: "উপদেষ্টা পরিষদ", desc: "Senior guides who advise the forum on direction, knowledge and values." },
    { key: "Executive Committee", bn: "নির্বাহী কমিটি", desc: "The core team that plans and runs ATHAR day to day." },
    { key: "Department Heads", bn: "বিভাগীয় প্রধান", desc: "Each one leads a department and its programs." },
    { key: "Members & Volunteers", bn: "সদস্য ও স্বেচ্ছাসেবী", desc: "Active members who serve across our departments." }
  ],

  programCategories: ["Quran & Learning", "Study Circle", "Youth Development", "Community Service", "Events & Competitions", "Other"],

  programs: []
};

function progIcon(category) {
  const map = { "Quran & Learning": "📖", "Study Circle": "🕌", "Youth Development": "🌱", "Community Service": "🤝", "Events & Competitions": "🏆" };
  return map[category] || "🌙";
}

function escHtml(t) {
  return String(t == null ? '' : t).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

// Departments / membership cards (public home page). `kind` is 'dept' or 'mem'.
function renderInfoCards(list, kind) {
  return list.map((d, i) => kind === 'dept'
    ? `<div class="dept-card reveal"><div class="dept-ico">${escHtml(d.icon || '🌙')}</div><h3>${escHtml(d.title)}</h3>${d.bn ? `<span class="dept-bn">${escHtml(d.bn)}</span>` : ''}<p>${escHtml(d.text)}</p></div>`
    : `<div class="mem-card reveal"><div class="mem-num">0${i + 1}</div><h3>${escHtml(d.title)}</h3>${d.bn ? `<span class="dept-bn">${escHtml(d.bn)}</span>` : ''}<p>${escHtml(d.text)}</p></div>`
  ).join('');
}

function teamInitials(name) {
  return (name || '').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function teamCardHtml(t) {
  return `<div class="team-card reveal">
    ${t.photo ? `<img class="team-photo" src="${escHtml(t.photo)}" alt="${escHtml(t.name)}" loading="lazy" decoding="async">` : `<div class="team-photo-ph">${escHtml(teamInitials(t.name))}</div>`}
    <div class="team-info">
      <h3>${escHtml(t.name)}</h3>
      ${t.role ? `<span class="team-role">${escHtml(t.role)}</span>` : ''}
      ${t.bio ? `<p class="team-bio">${escHtml(t.bio)}</p>` : ''}
    </div>
  </div>`;
}

// Team page / section: members grouped by structure. Before anyone is added,
// shows the four groups themselves so the structure is visible.
function renderTeamGroups(team) {
  const groups = ATHAR_DEFAULTS.teamGroups;
  const fallback = groups[groups.length - 1].key;
  const byKey = {};
  groups.forEach(g => byKey[g.key] = []);
  team.forEach(t => (byKey[t.group] || byKey[fallback]).push(t));

  if (!team.length) {
    return `<div class="grp-block reveal"><div class="team-grid">${groups.map(g =>
      `<div class="team-card"><div class="team-info"><h3>${escHtml(g.key)}</h3><span class="team-role">${escHtml(g.bn)}</span><p class="team-bio" style="-webkit-line-clamp:4;">${escHtml(g.desc)}</p></div></div>`).join('')}</div>
      <p style="color:var(--muted);font-size:.85rem;margin-top:16px;">Team profiles will be added soon.</p></div>`;
  }
  return groups.filter(g => byKey[g.key].length).map(g =>
    `<div class="grp-block"><h3 class="grp-title">${escHtml(g.key)}<span class="dept-bn">${escHtml(g.bn)}</span></h3>
      <div class="team-grid">${byKey[g.key].map(teamCardHtml).join('')}</div></div>`).join('');
}


// Only allow http(s) links for Google Form URLs.
function safeFormUrl(u) {
  u = String(u || '').trim();
  return /^https?:\/\//i.test(u) ? u : '';
}


/*===== Certificate design image (kept in Firestore: content/certDesign) =====*/
async function loadCertDesignImage() {
  await waitForFirebase();
  const { doc, getDoc } = window.firebaseFunctions;
  try {
    const snap = await getDoc(doc(window.firebaseDB, "content", "certDesign"));
    return snap.exists() ? (snap.data().dataUrl || '') : '';
  } catch (err) {
    console.error("Load certificate design error:", err);
    return '';
  }
}

async function saveCertDesignImage(dataUrl) {
  await waitForFirebase();
  const { doc, setDoc } = window.firebaseFunctions;
  try {
    await setDoc(doc(window.firebaseDB, "content", "certDesign"), { dataUrl: dataUrl || '', updatedAt: Date.now() });
    return { success: true };
  } catch (err) {
    console.error("Save certificate design error:", err);
    return { success: false, error: err.message };
  }
}
