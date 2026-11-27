/* ATHAR premium motion: scroll progress, 3D tilt, hero depth, cursor glow, back-to-top. */
(function(){
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  function ready(fn){ if(document.readyState!=='loading') fn(); else document.addEventListener('DOMContentLoaded',fn); }

  ready(function(){
    /* Dark / light toggle (saved in this browser; default follows the device setting) */
    (function(){
      var btn=document.createElement('button'); btn.id='theme-toggle'; btn.type='button';
      function cur(){ var t=document.documentElement.getAttribute('data-theme'); if(t) return t; return (window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light'; }
      function paint(){ var d=cur()==='dark'; btn.textContent=d?'☀️':'🌙'; btn.setAttribute('aria-label',d?'Switch to light mode':'Switch to dark mode'); btn.title=d?'Light mode':'Dark mode'; }
      btn.addEventListener('click',function(){
        var next=cur()==='dark'?'light':'dark';
        document.documentElement.setAttribute('data-theme',next);
        try{ localStorage.setItem('athar-theme',next); }catch(e){}
        paint();
      });
      paint();
      var hb=document.querySelector('header .hamburger');
      if(hb && hb.parentNode) hb.parentNode.insertBefore(btn,hb); else { var hd=document.querySelector('header'); if(hd) hd.appendChild(btn); }
    })();

    /* Smooth scroll ONLY for menu/anchor clicks (a global scroll-behavior:smooth made the page
       slide back whenever layout shifted while scrolling, especially on phones). */
    document.addEventListener('click',function(e){
      var a=e.target.closest&&e.target.closest('a[href^="#"]'); if(!a) return;
      var id=a.getAttribute('href'); if(id.length<2) return;
      var t=document.getElementById(id.slice(1)); if(!t) return;
      e.preventDefault();
      var hd=document.querySelector('header'), off=hd?hd.offsetHeight:0;
      window.scrollTo({top:t.getBoundingClientRect().top+window.scrollY-off+1,behavior:reduce?'auto':'smooth'});
    });

    /* Scroll progress bar */
    var bar=document.createElement('div'); bar.id='scroll-progress'; document.body.appendChild(bar);
    /* Back to top */
    var top=document.createElement('button'); top.id='to-top'; top.type='button'; top.setAttribute('aria-label','Back to top'); top.textContent='↑';
    top.addEventListener('click',function(){ window.scrollTo({top:0,behavior:reduce?'auto':'smooth'}); });
    document.body.appendChild(top);
    var ticking=false;
    function onScroll(){
      var h=document.documentElement.scrollHeight-window.innerHeight;
      var p=h>0?Math.min(1,window.scrollY/h):0;
      bar.style.transform='scaleX('+p+')';
      var ds=document.getElementById('dev-strip'), nearEnd=false;
      if(ds){ nearEnd=ds.getBoundingClientRect().top < window.innerHeight; }   // keep the ↑ button away from the credit
      top.classList.toggle('show',window.scrollY>500 && !nearEnd);
      var hv=document.querySelector('.hero-visual');
      if(hv && !reduce && window.scrollY<900){ hv.style.setProperty('--py',(window.scrollY*0.12)+'px'); }
      ticking=false;
    }
    window.addEventListener('scroll',function(){ if(!ticking){ticking=true;requestAnimationFrame(onScroll);} },{passive:true});
    onScroll();

    /* Hero floating 3D stars */
    var hero=document.querySelector('.hero');
    if(hero && !reduce){
      var wrap=document.createElement('div'); wrap.className='hero-stars'; wrap.setAttribute('aria-hidden','true');
      [[ '8%','18%',46,15,0],['82%','12%',34,12,2],['70%','62%',58,17,1],['14%','70%',30,13,3],['46%','8%',26,11,4],['92%','78%',38,16,2]].forEach(function(c){
        var i=document.createElement('i'); i.style.cssText='--x:'+c[0]+';--y:'+c[1]+';--s:'+c[2]+'px;--d:'+c[3]+'s;--dl:-'+c[4]+'s';
        wrap.appendChild(i);
      });
      hero.insertBefore(wrap,hero.firstChild);
    }


    /* Islamic skyline (mosque, domes, minarets) – shared by hero and footer */
    function skyline(fill, windows){
      var w=windows?'<circle class="win" cx="600" cy="128" r="3"/><circle class="win" cx="560" cy="132" r="2.6"/><circle class="win" cx="640" cy="132" r="2.6"/><circle class="win" cx="339" cy="96" r="2.4"/><circle class="win" cx="861" cy="96" r="2.4"/><circle class="win" cx="150" cy="118" r="2.2"/><circle class="win" cx="1050" cy="118" r="2.2"/>':'';
      return '<svg viewBox="0 0 1200 180" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><g fill="'+fill+'" stroke="#E9C676" stroke-opacity=".28" stroke-width="1.2">'
      +'<rect x="0" y="152" width="1200" height="28"/>'
      +'<rect x="40" y="126" width="110" height="28"/><path d="M52 126a43 30 0 0 1 86 0z"/>'
      +'<rect x="1050" y="126" width="110" height="28"/><path d="M1062 126a43 30 0 0 1 86 0z"/>'
      +'<rect x="140" y="70" width="20" height="84"/><path d="M136 70L150 36L164 70z"/><rect x="134" y="88" width="32" height="6"/>'
      +'<rect x="1040" y="70" width="20" height="84"/><path d="M1036 70L1050 36L1064 70z"/><rect x="1034" y="88" width="32" height="6"/>'
      +'<rect x="320" y="52" width="38" height="102"/><path d="M314 52L339 6L364 52z"/><rect x="312" y="76" width="54" height="7"/>'
      +'<rect x="842" y="52" width="38" height="102"/><path d="M836 52L861 6L886 52z"/><rect x="834" y="76" width="54" height="7"/>'
      +'<rect x="380" y="116" width="440" height="38"/>'
      +'<path d="M392 116V100a44 34 0 0 1 88 0V116z"/><path d="M720 116V100a44 34 0 0 1 88 0V116z"/>'
      +'<rect x="470" y="96" width="260" height="58"/>'
      +'<path d="M482 96A118 78 0 0 1 718 96z"/>'
      +'<path d="M600 18V2M600 10a7 7 0 1 0 5-6.5"/>'
      +'</g>'+w+'</svg>';
    }

    /* Hero: night sky + crescent + twinkling stars + mosque */
    if(hero){
      var sky=document.createElement('div'); sky.className='hero-sky'; sky.setAttribute('aria-hidden','true');
      var stars=[['6%','12%',3,2.6,0],['18%','30%',2,3.4,1],['27%','8%',3,3,2],['38%','22%',2,2.8,0.5],['52%','10%',2,3.6,1.5],['61%','28%',3,3.1,2.4],['73%','9%',2,2.7,0.8],['88%','34%',3,3.3,1.9],['94%','16%',2,2.9,0.3],['12%','52%',2,3.8,2.2],['45%','46%',2,3.2,1.1],['81%','55%',2,2.6,0.6]];
      var html='<div class="hero-moon"></div>';
      stars.forEach(function(c){ html+='<span class="sky-star" style="--x:'+c[0]+';--y:'+c[1]+';--s:'+c[2]+'px;--d:'+c[3]+'s;--dl:-'+c[4]+'s"></span>'; });
      sky.innerHTML=html;
      hero.insertBefore(sky,hero.firstChild);
      var m=document.createElement('div'); m.className='hero-mosque'; m.innerHTML=skyline('#03101f',true);
      m.firstChild.setAttribute('class','hero-mosque-svg');
      hero.appendChild(m);
      m.style.pointerEvents='none';
    }
    /* Footer skyline on every page */
    var strip=document.querySelector('.dev-strip');
    var foot=strip||document.querySelector('footer');
    if(foot){ var fs=document.createElement('div'); fs.className='foot-skyline'; fs.innerHTML=skyline('#071F3D',true); fs.firstChild.style.cssText='width:100%;height:100%;display:block'; foot.insertBefore(fs,foot.firstChild); }
    if(strip){
      if('IntersectionObserver' in window){
        var io=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ strip.classList.add('in'); io.disconnect(); } }); },{threshold:.35});
        io.observe(strip);
      } else strip.classList.add('in');
    }

    if(reduce || !fine) return;

    /* Cursor glow */
    var glow=document.createElement('div'); glow.id='cursor-glow'; document.body.appendChild(glow);
    var gx=0,gy=0,gt=false;
    document.addEventListener('pointermove',function(e){
      gx=e.clientX; gy=e.clientY; glow.classList.add('on');
      if(!gt){ gt=true; requestAnimationFrame(function(){ glow.style.transform='translate3d('+gx+'px,'+gy+'px,0)'; gt=false; }); }
    },{passive:true});
    document.addEventListener('pointerleave',function(){ glow.classList.remove('on'); });

    /* Hero parallax tilt following the pointer */
    if(hero){
      hero.addEventListener('pointermove',function(e){
        var hv=hero.querySelector('.hero-visual'); if(!hv) return;
        var r=hero.getBoundingClientRect();
        var x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
        hv.style.transform='translateY(var(--py,0px)) rotateY('+(x*16)+'deg) rotateX('+(-y*12)+'deg)';
      });
      hero.addEventListener('pointerleave',function(){ var hv=hero.querySelector('.hero-visual'); if(hv) hv.style.transform='translateY(var(--py,0px))'; });
    }

    /* 3D tilt on cards (event delegation, so cards loaded later also work) */
    var SEL='.notice-card,.ayah-card,.prog-card,.team-card,.dept-card,.mem-card,.about-graphic,.pg-values>div,.contact-row,.join-banner';
    var cur=null;
    function reset(el){ if(!el) return; el.classList.remove('tilting'); el.style.transform=''; el.style.boxShadow=''; }
    document.addEventListener('pointermove',function(e){
      var el=e.target.closest&&e.target.closest(SEL);
      if(cur && cur!==el){ reset(cur); cur=null; }
      if(!el) return;
      cur=el;
      if(!el.classList.contains('tilt')){ el.classList.add('tilt'); var g=document.createElement('span'); g.className='tilt-glare'; el.appendChild(g); }
      var r=el.getBoundingClientRect(), px=(e.clientX-r.left)/r.width, py=(e.clientY-r.top)/r.height;
      var max=el.classList.contains('join-banner')?3:9;
      el.classList.add('tilting');
      el.style.transform='perspective(900px) rotateX('+((.5-py)*max*2)+'deg) rotateY('+((px-.5)*max*2)+'deg) translateY(-6px) scale(1.015)';
      el.style.boxShadow=(-(px-.5)*30)+'px '+(18+(py-.5)*20)+'px 44px rgba(7,31,61,.22),0 0 0 1px rgba(233,198,118,.5)';
      el.style.setProperty('--gx',(px*100)+'%'); el.style.setProperty('--gy',(py*100)+'%');
    },{passive:true});
    document.addEventListener('pointerleave',function(){ reset(cur); cur=null; });
    window.addEventListener('blur',function(){ reset(cur); cur=null; });
  });
})();
