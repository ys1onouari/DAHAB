import { t } from './i18n.js';

const SVG = {
  warning: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  info: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  edit: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
};

function _showModal({ icon, title, message, input, confirmText, cancelText, showCancel }) {
  return new Promise(resolve => {
    const existing = document.querySelector('.snackalmadina-modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'snackalmadina-modal-overlay';
    overlay.innerHTML = `
      <div class="snackalmadina-modal">
        <div class="snackalmadina-modal-accent"></div>
        <div class="snackalmadina-modal-icon">${icon}</div>
        <div class="snackalmadina-modal-title">${title}</div>
        <div class="snackalmadina-modal-message">${message}</div>
        ${input !== undefined ? `<div class="snackalmadina-modal-input"><input type="text" id="snackalmadinaModalInput" value="${input}" class="snackalmadina-modal-field"/></div>` : ''}
        <div class="snackalmadina-modal-actions">
          ${showCancel ? `<button class="snackalmadina-modal-btn snackalmadina-modal-btn-cancel">${cancelText}</button>` : ''}
          <button class="snackalmadina-modal-btn snackalmadina-modal-btn-confirm">${confirmText}</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('open'));

    const modal = overlay.querySelector('.snackalmadina-modal');
    const confirmBtn = modal.querySelector('.snackalmadina-modal-btn-confirm');
    const cancelBtn = modal.querySelector('.snackalmadina-modal-btn-cancel');
    const inputEl = modal.querySelector('#snackalmadinaModalInput');

    if (inputEl) setTimeout(() => inputEl.focus(), 200);

    let closed = false;

    function close(value) {
      if (closed) return;
      closed = true;
      document.removeEventListener('keydown', keyHandler);
      overlay.classList.remove('open');
      overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
      setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 400);
      resolve(value);
    }

    function keyHandler(e) {
      if (e.key === 'Escape') close(input !== undefined ? null : false);
      if (e.key === 'Enter' && inputEl && document.activeElement === inputEl) close(inputEl.value);
    }
    document.addEventListener('keydown', keyHandler);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(input !== undefined ? null : false); });
    confirmBtn.addEventListener('click', () => close(inputEl ? inputEl.value : true));
    if (cancelBtn) cancelBtn.addEventListener('click', () => close(input !== undefined ? null : false));
  });
}

export function showConfirm(message, title) {
  return _showModal({
    icon: SVG.warning,
    title: title || t('modal.confirmTitle'),
    message,
    confirmText: t('modal.confirm'),
    cancelText: t('modal.cancel'),
    showCancel: true,
  });
}

export function showAlert(message, title) {
  return _showModal({
    icon: SVG.info,
    title: title || t('modal.alertTitle'),
    message,
    confirmText: t('modal.ok'),
    showCancel: false,
  });
}

export function showPrompt(message, defaultValue = '', title) {
  return _showModal({
    icon: SVG.edit,
    title: title || t('modal.promptTitle'),
    message,
    input: defaultValue,
    confirmText: t('modal.confirm'),
    cancelText: t('modal.cancel'),
    showCancel: true,
  });
}
