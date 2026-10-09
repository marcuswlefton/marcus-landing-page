(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const menu = document.querySelector('.menu-toggle');
  const nav = document.getElementById('navigation');
  const closeMenu = () => {
    if (!menu || !nav) return;
    menu.setAttribute('aria-expanded', 'false');
    menu.querySelector('span').textContent = '+';
    nav.classList.remove('is-open');
  };
  menu?.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    menu.querySelector('span').textContent = open ? '−' : '+';
    nav.classList.toggle('is-open', open);
  });
  nav?.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); }
  });

  const logoToggle = document.querySelector('.logo-motion-toggle');
  logoToggle?.addEventListener('click', () => {
    const paused = logoToggle.getAttribute('aria-pressed') !== 'true';
    logoToggle.setAttribute('aria-pressed', String(paused));
    logoToggle.setAttribute('aria-label', paused ? 'Resume client logo animation' : 'Pause client logo animation');
    logoToggle.closest('.logo-marquee').classList.toggle('is-paused', paused);
  });

  // Finite, user-directed story. Geometry interpolates in JS for browser consistency.
  const performance = document.querySelector('.synthesis');
  if (performance) {
    const stages = {
      ability: ['More to draw on.', 'Build the energy, attention, skills, and resources available to you.'],
      mastery: ['Precision through practice.', 'Practice and feedback refine how your capabilities work together.'],
      virtuosity: ['Mastery, expressed.', 'Bring your capacity, skill, and judgment together in a response that fits the moment.']
    };
    const play = performance.querySelector('.progression-play');
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const paths = [...performance.querySelectorAll('.synthesis-paths path')];
    const sparks = [...performance.querySelectorAll('.synthesis-sparks circle')];
    let timers = [], frame = 0, playing = false, current = [150,150,150,150,150,150];
    const ends = {ability:[40,85,130,175,220,265],mastery:[125,135,145,155,165,175],virtuosity:[150,150,150,150,150,150]};
    function draw(values) {
      paths.forEach((p,i)=>p.setAttribute('d',`M 0 ${25+i*50} C 210 ${25+i*50} 250 ${values[i]} 450 ${values[i]} L 570 ${values[i]}`));
    }
    function stop() {
      timers.forEach(clearTimeout);timers=[];playing=false;cancelAnimationFrame(frame);
      play.innerHTML='Replay the story <span aria-hidden="true">↗</span>';
      sparks.forEach(dot=>dot.style.opacity='0');
      performance.querySelector('[aria-live]').setAttribute('aria-live','polite');
    }
    function stage(name, instant = false) {
      cancelAnimationFrame(frame);performance.classList.remove('is-arriving');
      performance.dataset.stage=name;
      performance.querySelectorAll('[data-performance-stage]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.performanceStage===name)));
      performance.querySelector('[data-stage-heading]').textContent=stages[name][0];
      performance.querySelector('[data-stage-copy]').textContent=stages[name][1];
      const from=current.slice(), to=ends[name], start=performance.ownerDocument.defaultView.performance.now();
      if(motion.matches || instant){current=to.slice();draw(current);return;}
      function tick(now){
        const t=Math.min(1,(now-start)/850),ease=1-Math.pow(1-t,4);
        current=to.map((n,i)=>from[i]+(n-from[i])*ease);draw(current);
        if(t<1)frame=requestAnimationFrame(tick);
        else if(name==='virtuosity'){
          const pulseStart=now;
          function pulse(time){
            const progress=Math.min(1,(time-pulseStart)/800);
            sparks.forEach((dot,i)=>{const point=paths[i].getPointAtLength(paths[i].getTotalLength()*progress);dot.setAttribute('cx',point.x);dot.setAttribute('cy',point.y);dot.style.opacity=progress<1?'1':'0';});
            if(progress<1)frame=requestAnimationFrame(pulse);
            else performance.classList.add('is-arriving');
          }
          frame=requestAnimationFrame(pulse);
        }
      }
      sparks.forEach(dot=>dot.style.opacity='0');frame=requestAnimationFrame(tick);
    }
    let started = false;
    function run() {
      if(motion.matches)return;
      started=true;playing=true;play.textContent='Pause story';
      performance.querySelector('[aria-live]').setAttribute('aria-live','off');
      stage('ability',true);
      timers.push(setTimeout(()=>stage('mastery'),1300));
      timers.push(setTimeout(()=>stage('virtuosity'),2600));
      timers.push(setTimeout(stop,4400));
    }
    performance.querySelectorAll('[data-performance-stage]').forEach(b=>b.addEventListener('click',()=>{started=true;stop();stage(b.dataset.performanceStage)}));
    play.addEventListener('click',()=>{started=true;if(playing){stop();return;}run();});
    const observer = new IntersectionObserver(entries=>{
      const visible=entries[0].intersectionRatio>=.65;
      if(visible&&!started&&!motion.matches)run();
      else if(!entries[0].isIntersecting&&playing){stop();stage('virtuosity',true);}
    },{threshold:[0,.65]});
    observer.observe(performance.querySelector('.synthesis-canvas'));
    document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing){stop();stage('virtuosity',true);}});
    motion.addEventListener('change',()=>{stop();play.hidden=motion.matches;stage('virtuosity',true);});
    play.hidden=motion.matches;
  }

  // Retain campaign labels and the first essay or case path in this tab, never form answers or full URLs.
  const params = new URLSearchParams(location.search);
  const safeLabel = v => (v || '').replace(/[^a-zA-Z0-9 _.-]/g, '').slice(0,80);
  const essayPaths = new Set([
    '/mastery-in-motion/founder-time-management/',
    '/mastery-in-motion/the-cost-of-compensation/',
    '/mastery-in-motion/think-clearly-under-pressure/',
    '/evidence/founder-dependent-business/',
    '/evidence/capacity-and-career-performance/'
  ]);
  const journeyPaths = new Set(['/', '/advisory/', '/evidence/', '/evidence/commercial-performance/', '/mastery-in-motion/', ...essayPaths]);
  try {
    let journey;
    try { journey = JSON.parse(sessionStorage.getItem('ml_journey') || '[]'); } catch (_) { journey = []; }
    if (!Array.isArray(journey)) journey = [];
    journey = journey.filter(path => journeyPaths.has(path)).slice(0,15);
    if (journeyPaths.has(location.pathname) && journey[journey.length - 1] !== location.pathname) journey.push(location.pathname);
    sessionStorage.setItem('ml_journey', JSON.stringify(journey));
    if (essayPaths.has(location.pathname) && !sessionStorage.getItem('ml_entry_article')) {
      sessionStorage.setItem('ml_entry_article', location.pathname);
    }
    const campaign = ['utm_source','utm_medium','utm_campaign'].map(key => safeLabel(params.get(key))).filter(Boolean).join(' / ');
    if (campaign) sessionStorage.setItem('ml_campaign', campaign);
    else if (!sessionStorage.getItem('ml_campaign') && document.referrer) {
      const referrer = new URL(document.referrer);
      if (referrer.hostname !== location.hostname) sessionStorage.setItem('ml_campaign', 'referral / ' + safeLabel(referrer.hostname));
    }
  } catch (_) { /* Storage may be unavailable; forms remain functional. */ }
  for (const form of document.querySelectorAll('form[data-form]')) {
    const kind = form.dataset.form;
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (!form.reportValidity() || form.dataset.pending === 'true') return;
      const status = form.querySelector('.form-status');
      const button = form.querySelector('button[type="submit"]');
      const initialText = button.textContent;
      const payload = Object.fromEntries(new FormData(form));
      try {
        if (kind === 'application') payload.journey = sessionStorage.getItem('ml_journey') || '[]';
        const entry = sessionStorage.getItem('ml_entry_article');
        const campaign = sessionStorage.getItem('ml_campaign');
        const parts = [String(payload.source || '').slice(0,90)];
        if (essayPaths.has(entry)) parts.push('essay:' + entry.split('/')[2]);
        if (campaign) parts.push(campaign);
        payload.source = parts.join(' | ').slice(0,240);
      } catch (_) {}
      status.textContent = kind === 'newsletter' ? 'Joining…' : 'Sending your application…';
      status.dataset.error = 'false';
      form.dataset.pending = 'true'; button.disabled = true; button.textContent = 'Sending…';
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000);
      try {
        const response = await fetch(form.action, {method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
        const result = await response.json().catch(() => ({}));
        if (!response.ok || result.ok !== true) throw new Error(result.error || 'We could not confirm receipt. Please try again or email marcus@marcuslefton.com.');
        status.textContent = kind === 'newsletter' ? 'Request received. Opening the next step…' : 'Application received. Opening the next step…';
        form.reset();
        location.assign(kind === 'newsletter' ? '/thankyou/' : '/application-received/');
      } catch (error) {
        status.dataset.error = 'true';
        status.textContent = error.name === 'AbortError' ? 'This is taking longer than expected. Receipt is unconfirmed. Please try again or email marcus@marcuslefton.com.' : error.message;
        status.tabIndex = -1; status.focus();
      } finally { clearTimeout(timer); form.dataset.pending = 'false'; button.disabled = false; button.textContent = initialText; }
    });
  }
})();
