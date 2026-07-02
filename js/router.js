/* ==========================================================================
   Album Finder - Dedicated View Router
   ========================================================================== */

import { store } from './state/store.js';

class ViewRouter {
  constructor() {
    this.viewport = null;
    this.routes = {};
    this.currentViewInstance = null;
    this.navigationHistory = [];
    this.isBackNavigating = false;
  }

  _initElements() {
    if (!this.viewport) {
      this.viewport = document.getElementById('main-viewport');
    }
  }

  /**
   * Register a route mapping
   * @param {string} viewName 
   * @param {BaseView} viewControllerInstance 
   */
  register(viewName, viewControllerInstance) {
    this.routes[viewName] = viewControllerInstance;
  }

  /**
   * Navigate forward to a view
   */
  async navigateToView(viewName, data = null) {
    this._initElements();
    const activeView = store.get('currentView');
    const activeData = store.get('viewData');

    if (!this.isBackNavigating && activeView) {
      this.navigationHistory.push({ view: activeView, data: activeData });
      const backBtn = document.getElementById('header-back-btn');
      if (backBtn) backBtn.style.opacity = '1';
    }

    this.isBackNavigating = false;
    store.set('viewData', data);
    store.set('currentView', viewName);
    
    await this.mountView(viewName, data);
  }

  /**
   * Navigate backward in stack
   */
  async navigateBack() {
    this._initElements();
    if (this.navigationHistory.length === 0) {
      return;
    }

    const previousRoute = this.navigationHistory.pop();
    
    if (this.navigationHistory.length === 0) {
      const backBtn = document.getElementById('header-back-btn');
      if (backBtn) backBtn.style.opacity = '0.4';
    }

    this.isBackNavigating = true;
    store.set('viewData', previousRoute.data);
    store.set('currentView', previousRoute.view);
    
    await this.mountView(previousRoute.view, previousRoute.data);
  }

  /**
   * Destroy previous and mount new view controller
   */
  async mountView(viewName, data = null, bypassSkeleton = false) {
    this._initElements();
    const viewInstance = this.routes[viewName];
    if (!viewInstance) {
      console.error(`Route "${viewName}" is not registered.`);
      return;
    }

    // Scroll smoothly to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Tear down current active view
    if (this.currentViewInstance) {
      this.currentViewInstance.destroy();
    }

    this._syncNavigationUI(viewName);

    // Render loading state if not bypassed
    if (!bypassSkeleton) {
      this.viewport.innerHTML = viewInstance.renderGridSkeleton(6);
    }

    try {
      this.currentViewInstance = viewInstance;
      await viewInstance.init(data);
      viewInstance.render();
      viewInstance.bindEvents();
    } catch (err) {
      console.error(`Mounting view "${viewName}" failed:`, err);
      this._renderErrorState(err);
    }
  }

  _syncNavigationUI(viewName) {
    const navButtons = document.querySelectorAll('.sidebar-link-btn, .mobile-nav-btn');
    navButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });
  }

  _renderErrorState(err) {
    const is403 = err.message && err.message.includes('403');
    if (is403) {
      this.viewport.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; max-width: 500px; margin: 0 auto; animation: modalEnter 0.4s cubic-bezier(0.16, 1, 0.3, 1);">
          <i class="ri-lock-2-line" style="font-size: 3.5rem; color: #1db954; margin-bottom: 20px; display: inline-block; text-shadow: 0 0 30px rgba(29,185,84,0.25);"></i>
          <h2 style="font-size: 1.45rem; font-weight: 800; margin-bottom: 12px; font-family: 'Outfit', sans-serif;">Spotify Access Forbidden (403)</h2>
          
          <p style="color: var(--text-secondary); font-size: 0.88rem; line-height: 1.6; margin-bottom: 24px; text-align: left;">
            This error occurs because your Spotify Developer App is in <strong>Development Mode</strong>, and your Spotify account email has not been whitelisted under the developer dashboard.
          </p>
          
          <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 16px; border-radius: 8px; text-align: left; margin-bottom: 28px; font-size: 0.82rem; line-height: 1.5;">
            <h4 style="font-weight: 700; margin-bottom: 8px; color: var(--text-primary);">How to fix this:</h4>
            <ol style="margin-left: 18px; color: var(--text-secondary); display: flex; flex-direction: column; gap: 6px;">
              <li>Go to the <a href="https://developer.spotify.com/dashboard" target="_blank" style="color: #1db954; font-weight: 600; text-decoration: underline;">Spotify Developer Dashboard <i class="ri-external-link-line" style="font-size: 0.75rem;"></i></a>.</li>
              <li>Select your App and click on <strong>Users and Access</strong> in the left sidebar.</li>
              <li>Click <strong>Add New User</strong> and enter the email address of the Spotify account you are logging in with.</li>
              <li>Wait 30 seconds, reload this page, and select **Retry Connection**.</li>
            </ol>
          </div>
          
          <div style="display: flex; gap: 12px; justify-content: center;">
            <button class="pill-btn active" onclick="location.reload()">Retry Connection</button>
            <button class="pill-btn" onclick="document.getElementById('header-settings-btn').click()">App Settings</button>
          </div>
        </div>
      `;
      return;
    }

    this.viewport.innerHTML = `
      <div style="text-align: center; padding: 80px 20px;">
        <i class="ri-error-warning-line" style="font-size: 3.5rem; color: var(--explicit-red); margin-bottom: 20px; display: inline-block;"></i>
        <h2 style="font-size: 1.3rem; font-weight: 800; margin-bottom: 8px;">Network lost or resource block</h2>
        <p style="color: var(--text-secondary); font-size: 0.82rem; max-width: 500px; margin: 0 auto 20px auto; font-family: monospace; background: rgba(255, 45, 85, 0.08); padding: 10px 14px; border-radius: 6px; border: 1px solid rgba(255, 45, 85, 0.15); text-align: left; overflow-x: auto; white-space: pre-wrap;">
          Error Details: ${err.name} - ${err.message}
        </p>
        <button class="pill-btn active" style="margin: 0 auto;" onclick="location.reload()">Retry Connection</button>
      </div>
    `;
  }
}

export const router = new ViewRouter();
window.router = router; // Expose globally for components that aren't modules but need navigation
