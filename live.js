/* ATHAR Home: Daily Ayah/Hadith, Prayer Times + Hijri date, Notice & News.
   Content comes from Admin (content/site). Prayer times: Aladhan public API. */
(function(){
  var NAMES=[['Fajr','ফজর'],['Sunrise','সূর্যোদয়'],['Dhuhr','যোহর'],['Asr','আসর'],['Maghrib','মাগরিব'],['Isha','এশা']];
  var DEFAULT_DAILY={type:'ayah',arabic:'إِنَّ مَعَ الْعُسْرِ يُسْرًا',text:'নিশ্চয়ই কষ্টের সাথেই রয়েছে স্বস্তি।',reference:'সূরা আশ-শারহ ৯৪:৬'};
  var $=function(id){return document.getElementById(id);};
  function esc(t){ return (window.escHtml?window.escHtml(t):String(t==null?'':t)); }
  function pad(n){return (n<10?'0':'')+n;}
  function to12(h,m){ var ap=h>=12?'PM':'AM'; var hh=h%12; if(hh===0) hh=12; return hh+':'+pad(m)+' '+ap; }
  function ready(fn){ if(document.readyState!=='loading') fn(); else document.addEventListener('DOMContentLoaded',fn); }

  /* ---------- Daily Ayah / Hadith ---------- */
  function renderDaily(d){
    d=d||{}; var x={type:d.type||DEFAULT_DAILY.type,arabic:d.arabic,text:d.text,reference:d.reference};
    if(!x.arabic && !x.text){ x=DEFAULT_DAILY; }
    var tag=$('ayah-tag'); if(tag) tag.textContent = x.type==='hadith' ? 'আজকের হাদিস · Hadith of the Day' : 'আজকের আয়াত · Ayah of the Day';
    var ar=$('ayah-ar'); if(ar){ ar.textContent=x.arabic||''; ar.style.display=x.arabic?'':'none'; }
    var tx=$('ayah-tx'); if(tx){ tx.textContent=x.text||''; tx.style.display=x.text?'':'none'; }
    var rf=$('ayah-ref'); if(rf){ rf.textContent=x.reference?('— '+x.reference):''; }
  }

  function pickDaily(c){
    var list=(c&&Array.isArray(c.dailyList))?c.dailyList.filter(function(x){return x&&(x.text||x.arabic);}):[];
    if(list.length){ var d=new Date(); var day=Math.floor(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/86400000); return list[day%list.length]; }
    return c&&c.daily;
  }

  /* ---------- Hijri fallback (offline / API failure) ---------- */
  function hijriLocal(adj){
    try{
      var dt=new Date(); if(adj) dt.setDate(dt.getDate()+adj);
      return new Intl.DateTimeFormat('en-u-ca-islamic-umalqura',{day:'numeric',month:'long',year:'numeric'}).format(dt).replace(/\s*AH$/,'')+' AH';
    }catch(e){ return ''; }
  }
  function gregLocal(){
    try{ return new Intl.DateTimeFormat('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date()); }catch(e){ return ''; }
  }

  /* ---------- Prayer times ---------- */
  var timer=null;
  function nowIn(tz){
    try{
      var p=new Intl.DateTimeFormat('en-GB',{timeZone:tz,hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).formatToParts(new Date());
      var g=function(t){ return parseInt((p.filter(function(o){return o.type===t;})[0]||{}).value||'0',10)%24; };
      return g('hour')*3600+g('minute')*60+g('second');
    }catch(e){ var d=new Date(); return d.getHours()*3600+d.getMinutes()*60+d.getSeconds(); }
  }
  function startCountdown(times,tz){
    var order=['Fajr','Dhuhr','Asr','Maghrib','Isha'];
    function tick(){
      var now=nowIn(tz), next=null, diff=0;
      for(var i=0;i<order.length;i++){ if(times[order[i]]>now){ next=order[i]; diff=times[order[i]]-now; break; } }
      if(!next){ next='Fajr'; diff=times.Fajr+86400-now; }
      var h=Math.floor(diff/3600), m=Math.floor((diff%3600)/60), s=diff%60;
      var bn=NAMES.filter(function(n){return n[0]===next;})[0][1];
      var el=$('pr-next'); if(el) el.innerHTML='পরবর্তী নামাজ: <strong>'+bn+' · '+next+'</strong> <span class="pr-count">'+pad(h)+':'+pad(m)+':'+pad(s)+'</span>';
      document.querySelectorAll('#pr-grid .pr-item').forEach(function(n){ n.classList.toggle('next',n.getAttribute('data-k')===next); });
    }
    if(timer) clearInterval(timer); tick(); timer=setInterval(tick,1000);
  }
  function renderPrayer(data,cfg){
    var t=data.timings, tz=(data.meta&&data.meta.timezone)||'Asia/Dhaka', secs={}, html='';
    NAMES.forEach(function(n){
      var m=/(\d{1,2}):(\d{2})/.exec(t[n[0]]||''); if(!m) return;
      var h=parseInt(m[1],10), mi=parseInt(m[2],10); secs[n[0]]=h*3600+mi*60;
      html+='<div class="pr-item" data-k="'+n[0]+'"><span class="pr-bn">'+n[1]+'</span><span class="pr-en">'+n[0]+'</span><span class="pr-time">'+to12(h,mi)+'</span></div>';
    });
    $('pr-grid').innerHTML=html;
    var hj=data.date&&data.date.hijri;
    $('pr-hijri').textContent = hj ? (hj.day+' '+hj.month.en+' '+hj.year+' AH') : hijriLocal(cfg.adjustment);
    $('pr-greg').textContent = data.date&&data.date.gregorian ? (data.date.gregorian.weekday.en+', '+data.date.readable) : gregLocal();
    if(secs.Fajr!==undefined && secs.Isha!==undefined) startCountdown(secs,tz);
  }
  function prayerFail(cfg){
    $('pr-hijri').textContent=hijriLocal(cfg.adjustment); $('pr-greg').textContent=gregLocal();
    $('pr-grid').innerHTML='<p class="pr-fail">নামাজের সময় এই মুহূর্তে লোড করা যাচ্ছে না। কিছুক্ষণ পরে আবার চেষ্টা করুন।</p>';
    var n=$('pr-next'); if(n) n.textContent='';
  }
  function loadPrayer(cfg){
    cfg=cfg||{};
    var city=cfg.city||'Dhaka', country=cfg.country||'Bangladesh', method=cfg.method||'1', school=cfg.school||'1', adj=parseInt(cfg.adjustment||0,10)||0;
    $('pr-city').textContent='📍 '+city;
    var key='athar-pray:'+[city,country,method,school,adj].join('|')+':'+new Date().toDateString();
    try{ var c=localStorage.getItem(key); if(c){ renderPrayer(JSON.parse(c),cfg); return; } }catch(e){}
    var url='https://api.aladhan.com/v1/timingsByCity?city='+encodeURIComponent(city)+'&country='+encodeURIComponent(country)+'&method='+encodeURIComponent(method)+'&school='+encodeURIComponent(school)+'&adjustment='+adj;
    fetch(url).then(function(r){return r.json();}).then(function(j){
      if(!j||!j.data||!j.data.timings) throw new Error('bad');
      try{ localStorage.setItem(key,JSON.stringify(j.data)); }catch(e){}
      renderPrayer(j.data,cfg);
    }).catch(function(){ prayerFail(cfg); });
  }

  /* ---------- Notice & News ---------- */
  function renderNotices(list){
    var sec=$('notices'), grid=$('notice-grid'); if(!sec||!grid) return;
    list=(list||[]).filter(function(n){return n&&n.title;}).sort(function(a,b){ return String(b.date||'').localeCompare(String(a.date||'')); }).slice(0,6);
    if(!list.length){ sec.style.display='none'; return; }
    var now=Date.now();
    grid.innerHTML=list.map(function(n){
      var d=n.date?new Date(n.date+'T00:00:00'):null, isNew=d&&(now-d.getTime())<7*86400000&&(now-d.getTime())>-86400000;
      var ds=d&&!isNaN(d)?d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}):'';
      var link=window.safeFormUrl?window.safeFormUrl(n.link):'';
      return '<article class="notice-card reveal"><div class="notice-meta"><span class="notice-date">📅 '+esc(ds)+'</span>'+(isNew?'<span class="notice-new">NEW</span>':'')+'</div><h3>'+esc(n.title)+'</h3>'+(n.text?'<p>'+esc(n.text)+'</p>':'')+(link?'<a class="notice-link" href="'+esc(link)+'" target="_blank" rel="noopener">বিস্তারিত দেখুন →</a>':'')+'</article>';
    }).join('');
    sec.style.display='';
    window.atharReveal&&window.atharReveal(grid);
  }

  ready(async function(){
    renderDaily(null);
    loadPrayer({});
    try{
      await waitForFirebase();
      var c=await loadSiteContent();
      if(c){
        renderDaily(pickDaily(c));
        if(c.prayer && (c.prayer.city||c.prayer.method||c.prayer.school||c.prayer.adjustment!==undefined)) loadPrayer(c.prayer);
        renderNotices(c.notices);
      }
    }catch(e){ console.error('live.js',e); }
  });
})();
