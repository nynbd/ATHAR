/* ============================================================
   ATHAR AI Chat Assistant — drop-in widget.
   Include with: <script src="chatbot.js"></script> on any page.
   Self-contained: injects its own CSS + markup, talks to Gemini
   directly from the browser (no backend needed).
   ============================================================ */
(function () {
  // ---- Config ----------------------------------------------------------
  // The real Gemini key lives on the Cloudflare Worker (see cloudflare-worker.js),
  // never here — this URL is just the Worker's public address, safe to expose.
  var WORKER_URL = "https://nyn-chatbot.nexterayouthnetwork.workers.dev";

  // Grounding context — kept short so every request stays cheap & fast.
  var SYSTEM_INSTRUCTION =
    "You are the official AI assistant for ATHAR Islamic Youth Forum (AIYF), a youth-led Islamic forum " +
    "whose motto is 'Inspiring Faith, Building Character' (ঈমানের প্রেরণায়, চরিত্র গঠনে). " +
    "ATHAR runs Quran learning circles, study circles, youth character development, community service and media work " +
    "for young people, mainly in Bangladesh. Its departments are: Quran & Islamic Education, Dawah & Awareness, " +
    "Youth & Character Development, Social Welfare & Charity, Media & Publications, and Events & Volunteers. " +
    "Membership has three levels: General Member, Active Member and Executive Member. " +
    "The website has these pages: Home (index.html) with About, Departments, Membership, Team preview, " +
    "Programs & Events preview and Contact details; team.html lists the team by group; " +
    "programs.html lists every program with a 'Join This Program' button on each card; " +
    "certificate.html lets members download their certificate and verify.html checks a certificate ID. " +
    "To become a member or join a program, a visitor should open the Programs page and tap a " +
    "program card, or use the 'Join Us' / 'Become a Member' button on the home page. " +
    "Be warm, respectful and helpful, but always VERY BRIEF — 1 to 3 short sentences max, never long paragraphs. " +
    "Reply in the same language the visitor uses — Bangla (বাংলা) " +
    "or English — matching their script. If you don't know a specific fact about ATHAR (like exact dates, numbers or " +
    "contact details), say so honestly and suggest they check the Contact section or message the team directly, rather than " +
    "inventing details. For questions about Islamic rulings (fatwa), do not issue rulings yourself; share only well-known basics and " +
    "advise asking a qualified scholar. You can also help with general questions outside ATHAR topics, but gently steer " +
    "the conversation back when it fits.";

  var MAX_HISTORY_TURNS = 8; // user+model pairs kept for context

  // ---- Styles -------------------------------------------------------
  var css = [
    ".atharbot-fab{position:fixed;right:20px;bottom:20px;z-index:8000;width:58px;height:58px;",
    "border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;",
    "background:linear-gradient(135deg,var(--orange,#D6A640),var(--orange-dk,#B98A2B));",
    "box-shadow:0 10px 28px rgba(214,166,64,.4);transition:transform .25s cubic-bezier(.2,.8,.2,1);}",
    ".atharbot-fab:hover{transform:scale(1.07);}",
    ".atharbot-fab svg{width:26px;height:26px;fill:#071F3D;}",
    ".atharbot-fab .atharbot-dot{position:absolute;top:6px;right:6px;width:10px;height:10px;border-radius:50%;",
    "background:#2ecc71;border:2px solid #fff;}",
    ".atharbot-panel{position:fixed;right:20px;bottom:90px;z-index:8000;width:340px;max-width:calc(100vw - 32px);",
    "height:460px;max-height:calc(100vh - 140px);background:var(--bg,#fff);border-radius:18px;",
    "box-shadow:0 24px 60px rgba(7,31,61,.28);display:flex;flex-direction:column;overflow:hidden;",
    "opacity:0;transform:translateY(16px) scale(.97);pointer-events:none;",
    "transition:opacity .22s ease,transform .22s cubic-bezier(.2,.8,.2,1);",
    "font-family:'Inter',system-ui,-apple-system,Segoe UI,sans-serif;border:1px solid var(--line,rgba(7,31,61,.1));}",
    ".atharbot-panel.open{opacity:1;transform:translateY(0) scale(1);pointer-events:all;}",
    ".atharbot-head{background:linear-gradient(135deg,var(--navy,#071F3D),var(--navy-dk,#071F3D));",
    "color:#fff;padding:14px 16px;display:flex;align-items:center;gap:10px;flex-shrink:0;}",
    ".atharbot-head-ico{width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.14);",
    "display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:16px;}",
    ".atharbot-head-txt{flex:1;min-width:0;}",
    ".atharbot-head-txt strong{display:block;font-size:.88rem;font-family:'Montserrat',sans-serif;font-weight:700;}",
    ".atharbot-head-txt span{display:block;font-size:.72rem;color:#C3CEDF;}",
    ".atharbot-close{background:none;border:none;color:#fff;opacity:.8;cursor:pointer;padding:4px;font-size:1.1rem;line-height:1;}",
    ".atharbot-close:hover{opacity:1;}",
    ".atharbot-msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;",
    "background:var(--bg-alt,#F5F1E8);}",
    ".atharbot-row{display:flex;max-width:88%;}",
    ".atharbot-row.user{align-self:flex-end;justify-content:flex-end;}",
    ".atharbot-row.bot{align-self:flex-start;}",
    ".atharbot-bubble{padding:9px 13px;border-radius:14px;font-size:.86rem;line-height:1.5;white-space:pre-wrap;word-break:break-word;}",
    ".atharbot-row.user .atharbot-bubble{background:linear-gradient(135deg,var(--orange,#D6A640),var(--orange-dk,#B98A2B));",
    "color:#071F3D;font-weight:500;border-bottom-right-radius:4px;}",
    ".atharbot-row.bot .atharbot-bubble{background:var(--bg,#fff);color:var(--ink,#071F3D);",
    "border:1px solid var(--line,rgba(7,31,61,.1));border-bottom-left-radius:4px;}",
    ".atharbot-typing{display:flex;gap:4px;padding:10px 13px;}",
    ".atharbot-typing span{width:6px;height:6px;border-radius:50%;background:var(--muted,#5B6472);",
    "animation:atharbot-bounce 1.2s infinite ease-in-out;}",
    ".atharbot-typing span:nth-child(2){animation-delay:.15s;}",
    ".atharbot-typing span:nth-child(3){animation-delay:.3s;}",
    "@keyframes atharbot-bounce{0%,60%,100%{transform:translateY(0);opacity:.5;}30%{transform:translateY(-4px);opacity:1;}}",
    ".atharbot-inputbar{display:flex;gap:8px;padding:10px;border-top:1px solid var(--line,rgba(7,31,61,.1));",
    "background:var(--bg,#fff);flex-shrink:0;}",
    ".atharbot-inputbar textarea{flex:1;resize:none;border:1px solid var(--line,rgba(7,31,61,.1));",
    "background:var(--bg-alt,#F5F1E8);color:var(--ink,#071F3D);border-radius:10px;padding:9px 12px;",
    "font-size:.86rem;font-family:inherit;outline:none;max-height:90px;transition:border-color .2s;}",
    ".atharbot-inputbar textarea:focus{border-color:var(--orange,#D6A640);}",
    ".atharbot-send{flex-shrink:0;width:38px;height:38px;border-radius:10px;border:none;cursor:pointer;",
    "background:linear-gradient(135deg,var(--orange,#D6A640),var(--orange-dk,#B98A2B));color:#071F3D;",
    "display:flex;align-items:center;justify-content:center;transition:opacity .2s;}",
    ".atharbot-send:disabled{opacity:.5;cursor:default;}",
    ".atharbot-send svg{width:16px;height:16px;fill:#071F3D;}",
    "@media(max-width:480px){.atharbot-panel{right:12px;left:12px;width:auto;bottom:84px;height:min(70vh,520px);}",
    ".atharbot-fab{right:16px;bottom:16px;}}"
  ].join("");
  var styleEl = document.createElement("style");
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ---- Markup ---------------------------------------------------------
  var wrap = document.createElement("div");
  wrap.innerHTML =
    '<button class="atharbot-fab" id="atharbot-fab" aria-label="Chat with ATHAR assistant" aria-expanded="false">' +
      '<span class="atharbot-dot"></span>' +
      '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 5.94 2 10.8c0 2.73 1.44 5.16 3.7 6.76L5 22l4.3-2.1c.87.2 1.78.3 2.7.3 5.52 0 10-3.94 10-8.8S17.52 2 12 2z"/></svg>' +
    '</button>' +
    '<div class="atharbot-panel" id="atharbot-panel" role="dialog" aria-label="ATHAR AI chat assistant">' +
      '<div class="atharbot-head">' +
        '<div class="atharbot-head-ico">🤖</div>' +
        '<div class="atharbot-head-txt"><strong>ATHAR Assistant</strong><span>Ask about programs, joining, anything</span></div>' +
        '<button class="atharbot-close" id="atharbot-close" aria-label="Close chat">✕</button>' +
      '</div>' +
      '<div class="atharbot-msgs" id="atharbot-msgs"></div>' +
      '<div class="atharbot-inputbar">' +
        '<textarea id="atharbot-input" rows="1" placeholder="লিখুন... / Type a message..."></textarea>' +
        '<button class="atharbot-send" id="atharbot-send" aria-label="Send">' +
          '<svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>' +
        '</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(wrap);

  var fab = document.getElementById("atharbot-fab");
  var panel = document.getElementById("atharbot-panel");
  var closeBtn = document.getElementById("atharbot-close");
  var msgsEl = document.getElementById("atharbot-msgs");
  var input = document.getElementById("atharbot-input");
  var sendBtn = document.getElementById("atharbot-send");

  var history = []; // {role:'user'|'model', parts:[{text}]}
  var greeted = false;

  function addBubble(role, text) {
    var row = document.createElement("div");
    row.className = "atharbot-row " + (role === "user" ? "user" : "bot");
    var b = document.createElement("div");
    b.className = "atharbot-bubble";
    b.textContent = text;
    row.appendChild(b);
    msgsEl.appendChild(row);
    msgsEl.scrollTop = msgsEl.scrollHeight;
    return b;
  }

  function showTyping() {
    var row = document.createElement("div");
    row.className = "atharbot-row bot";
    row.id = "atharbot-typing-row";
    row.innerHTML = '<div class="atharbot-bubble atharbot-typing"><span></span><span></span><span></span></div>';
    msgsEl.appendChild(row);
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }
  function hideTyping() {
    var row = document.getElementById("atharbot-typing-row");
    if (row) row.remove();
  }

  function openPanel() {
    panel.classList.add("open");
    fab.setAttribute("aria-expanded", "true");
    if (!greeted) {
      greeted = true;
      addBubble("model", "আস-সালামু আলাইকুম! আমি ATHAR-এর AI সহকারী। প্রোগ্রাম, মেম্বারশিপ বা ATHAR নিয়ে যেকোনো প্রশ্ন করতে পারেন। 🌙");
    }
    setTimeout(function () { input.focus(); }, 200);
  }
  function closePanel() {
    panel.classList.remove("open");
    fab.setAttribute("aria-expanded", "false");
  }

  fab.addEventListener("click", function () {
    panel.classList.contains("open") ? closePanel() : openPanel();
  });
  closeBtn.addEventListener("click", closePanel);

  input.addEventListener("input", function () {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 90) + "px";
  });
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });
  sendBtn.addEventListener("click", send);

  function send() {
    var text = input.value.trim();
    if (!text) return;
    input.value = "";
    input.style.height = "auto";
    addBubble("user", text);
    history.push({ role: "user", parts: [{ text: text }] });
    if (history.length > MAX_HISTORY_TURNS * 2) {
      history = history.slice(history.length - MAX_HISTORY_TURNS * 2);
    }
    askGemini();
  }

  function askGemini() {
    sendBtn.disabled = true;
    showTyping();
    fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { role: "system", parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: history,
        generationConfig: { temperature: 0.6, maxOutputTokens: 160 }
      })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        hideTyping();
        sendBtn.disabled = false;
        var reply =
          data &&
          data.candidates &&
          data.candidates[0] &&
          data.candidates[0].content &&
          data.candidates[0].content.parts &&
          data.candidates[0].content.parts[0] &&
          data.candidates[0].content.parts[0].text;
        if (!reply) {
          reply = "দুঃখিত, এই মুহূর্তে উত্তর দিতে পারছি না। একটু পরে আবার চেষ্টা করুন।";
        }
        addBubble("model", reply);
        history.push({ role: "model", parts: [{ text: reply }] });
      })
      .catch(function () {
        hideTyping();
        sendBtn.disabled = false;
        addBubble("model", "নেটওয়ার্ক সমস্যা হচ্ছে — একটু পরে আবার চেষ্টা করুন।");
      });
  }
})();
