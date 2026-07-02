/* ==========================================================================
   Album Finder - Toast Notification Component
   ========================================================================== */

class ToastController {
  constructor() {
    this.containerId = 'toast-container';
  }

  getContainer() {
    let container = document.getElementById(this.containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = this.containerId;
      container.className = 'toast-wrapper';
      container.setAttribute('aria-live', 'polite');
      document.body.appendChild(container);
    }
    return container;
  }

  /**
   * Display a warning, error, info, or success toast notification
   * @param {string} text - Message text
   * @param {string} type - 'info' | 'success' | 'warning' | 'error'
   */
  show(text, type = 'info') {
    const container = this.getContainer();
    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;

    let icon = 'ri-information-line';
    if (type === 'success') icon = 'ri-checkbox-circle-line';
    if (type === 'warning') icon = 'ri-error-warning-line';
    if (type === 'error') icon = 'ri-close-circle-line';

    toast.innerHTML = `
      <i class="${icon}"></i>
      <span>${text}</span>
    `;

    container.appendChild(toast);

    // Smooth entry and auto-destruction
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px) scale(0.95)';
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  }
}

export const toast = new ToastController();
