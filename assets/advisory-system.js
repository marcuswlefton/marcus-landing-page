(() => {
  'use strict';
  const system = document.querySelector('[data-advisory-system]');
  if (!system) return;

  const stages = {
    picture: {
      judgment: ['Read the', 'pattern.'],
      priority: ['Understand', 'the real load.'],
      action: 'Look at the person, the work, and the demands around both before choosing an intervention.'
    },
    constraint: {
      judgment: ['Find the', 'constraint.'],
      priority: ['Choose what', 'changes first.'],
      action: 'Identify the change most likely to release capacity and move the result forward.'
    },
    refine: {
      judgment: ['Test.', 'Learn.', 'Refine.'],
      priority: ['A better', 'next move.'],
      action: 'Use what happens in your actual week to decide what to keep, change, or stop.'
    }
  };
  const controls = system.querySelector('.advisory-system-controls');
  const buttons = [...system.querySelectorAll('[data-advisory-stage]')];
  const cases = [...system.querySelectorAll('[data-advisory-case]')];
  const judgment = system.querySelector('[data-advisory-judgment]');
  const priority = system.querySelector('[data-advisory-priority]');
  const action = system.querySelector('[data-advisory-action]');
  const story = system.querySelector('.advisory-system-story');
  if (!controls || !judgment || !priority || !action || !story) return;

  // Keep the diagram's line breaks deliberate without inserting HTML strings.
  const lines = (element, content) => {
    element.replaceChildren();
    content.forEach((line, index) => {
      if (index) {
        element.append(document.createTextNode(' '));
        element.append(document.createElement('br'));
      }
      element.append(document.createTextNode(line));
    });
  };
  const select = (name, announce = true) => {
    const next = stages[name];
    if (!next) return;
    story.setAttribute('aria-live', announce ? 'polite' : 'off');
    system.dataset.stage = name;
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.advisoryStage === name)));
    cases.forEach(example => { example.hidden = example.dataset.advisoryCase !== name; });
    lines(judgment, next.judgment);
    lines(priority, next.priority);
    action.textContent = next.action;
  };
  buttons.forEach(button => button.addEventListener('click', () => select(button.dataset.advisoryStage)));
  select('picture', false);
  system.classList.add('is-ready');
  controls.hidden = false;
  // No timers, autoplay, or scroll-triggered changes. Native buttons support Tab, Enter, and Space.
})();
