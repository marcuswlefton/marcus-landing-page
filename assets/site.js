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

  // Only campaign labels are retained, for the current tab; never form answers.
  const params = new URLSearchParams(location.search);
  const safeLabel = v => (v || '').replace(/[^a-zA-Z0-9 _.-]/g, '').slice(0,80);
  try {
    const campaign = ['utm_source','utm_medium','utm_campaign'].map(key => safeLabel(params.get(key))).filter(Boolean).join(' / ');
    if (campaign) sessionStorage.setItem('ml_campaign', campaign);
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
