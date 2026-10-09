(() => {
  'use strict';
  const system = document.querySelector('[data-advisory-system]');
  if (!system) return;
  const controls = system.querySelector('.advisory-system-controls');
  const buttons = [...system.querySelectorAll('[data-advisory-stage]')];
  const scenes = [...system.querySelectorAll('[data-advisory-case]')];
  const announcement = system.querySelector('.advisory-system-announcement');
  if (!controls || !announcement || scenes.length !== buttons.length) return;

  const select = (name, announce = true) => {
    const scene = scenes.find(item => item.dataset.advisoryCase === name);
    if (!scene) return;
    system.dataset.stage = name;
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.advisoryStage === name)));
    scenes.forEach(item => { item.hidden = item !== scene; });
    if (announce) {
      const heading = scene.querySelector('h3').textContent.replace(/\s+/g, ' ').trim();
      const copy = scene.querySelector('.advisory-system-priority > p:last-child').textContent;
      announcement.textContent = heading + ' ' + copy;
    }
  };
  buttons.forEach(button => button.addEventListener('click', () => select(button.dataset.advisoryStage)));
  select('picture', false);
  system.classList.add('is-ready');
  controls.hidden = false;
  // Native buttons retain focus. No timers or automatic scrolling.
  // Without JavaScript, all three steps and the outcome remain readable.
})();
