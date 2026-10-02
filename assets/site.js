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

  // A finite, user-controlled illustration. The final state is useful without JS.
  const performance = document.querySelector('.virtuosity-explainer');
  if (performance) {
    const stages = {
      ability: ['Develop the pieces.', 'More to draw on.', 'Build the energy, attention, skills, and resources available to you. These are the ingredients. How they work together is the next question.'],
      mastery: ['Practice. Feedback. Refinement.', 'The pieces begin to work as one.', 'Practice connects your capabilities to a result. Feedback sharpens the connection. Mastery keeps developing as you and the demands evolve.'],
      virtuosity: ['Conditions change. Your approach adapts.', 'Your capabilities. One considered response.', 'Bring your capacity, skill, and judgment together to meet the moment. VYRTŪOSITI is deeply practiced mastery, expressed with precision, adaptability, and your own unmistakable style.']
    };
    const play = performance.querySelector('.progression-play');
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let timer, playing = false;
    function stop() { clearTimeout(timer); playing = false; play.innerHTML = 'Watch the story <span aria-hidden="true">↗</span>'; }
    function stage(name) {
      performance.dataset.stage = name;
      performance.querySelectorAll('[data-performance-stage]').forEach(b=>b.setAttribute('aria-pressed', String(b.dataset.performanceStage===name)));
      const text=stages[name];
      ['kicker','heading','copy'].forEach((key,i)=>performance.querySelector('[data-stage-'+key+']').textContent=text[i]);
      performance.querySelectorAll('.performance-paths path').forEach((p,i)=>{
        const y=25+i*50;
        const mid=name==='ability' ? [70,45,145,120,260,220][i] : name==='mastery' ? y : [30,50,70,230,250,270][i];
        const end=name==='ability' ? [55,90,135,170,220,255][i] : name==='mastery' ? 150 : 95;
        p.setAttribute('d',`M 0 ${y} C 160 ${y} 180 ${mid} 285 ${mid} C 410 ${mid} 465 ${end} 560 ${end}`);
      });
      performance.querySelectorAll('.result-point,.result-halo').forEach(c=>c.setAttribute('cy',name==='virtuosity'?'95':'150'));
    }
    performance.querySelectorAll('[data-performance-stage]').forEach(b=>b.addEventListener('click',()=>{stop();stage(b.dataset.performanceStage)}));
    play.addEventListener('click',()=>{
      if(playing){stop();return}
      if(motion.matches){stage('virtuosity');return}
      playing=true;play.textContent='Pause illustration';stage('ability');
      timer=setTimeout(()=>{stage('mastery');timer=setTimeout(()=>{stage('virtuosity');stop()},2300)},2300);
    });
    function reduced(){stop();play.hidden=motion.matches;}
    motion.addEventListener('change',reduced); reduced();
  }

  // Only campaign labels are retained, for the current tab; never form answers.
  const params = new URLSearchParams(location.search);
  const safeLabel = v => (v || '').replace(/[^a-zA-Z0-9 _.-]/g, '').slice(0,80);
  try {
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
      try { const campaign = sessionStorage.getItem('ml_campaign'); if (campaign) payload.source = `${payload.source} | ${campaign}`; } catch (_) {}
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
