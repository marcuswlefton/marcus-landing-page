(() => {
  'use strict';
  const form = document.querySelector('form[data-form="application"]');
  if (!form) return;
  // Reveal an invalid optional field before the browser moves focus to it.
  form.addEventListener('invalid', event => {
    const context = event.target.closest('.application-context');
    if (context) context.open = true;
  }, true);
})();
