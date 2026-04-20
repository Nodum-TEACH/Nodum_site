// Cookie Consent Manager - GDPR Compliant
class CookieConsent {
    constructor() {
        this.consentKey = 'cookie_consent';
        this.consentVersion = '1.0';
        this.consent = this.loadConsent();
        this.init();
    }

    init() {
        if (!this.consent) {
            // No consent given - show banner
            this.showBanner();
        } else {
            // Consent exists - check if it needs refresh
            this.checkConsentAge();
            // Apply consent settings
            this.applyConsent();
        }
    }

    loadConsent() {
        try {
            const saved = localStorage.getItem(this.consentKey);
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            console.error('[CookieConsent] Error loading consent:', e);
            return null;
        }
    }

    saveConsent(preferences) {
        this.consent = {
            ...preferences,
            timestamp: new Date().toISOString(),
            version: this.consentVersion
        };
        
        try {
            localStorage.setItem(this.consentKey, JSON.stringify(this.consent));
            this.applyConsent();
        } catch (e) {
            console.error('[CookieConsent] Error saving consent:', e);
        }
    }

    checkConsentAge() {
        if (!this.consent || !this.consent.timestamp) return;
        
        const consentDate = new Date(this.consent.timestamp);
        const now = new Date();
        const daysSinceConsent = (now - consentDate) / (1000 * 60 * 60 * 24);
        
        // Refresh consent every 12 months
        if (daysSinceConsent > 365) {
            this.showBanner();
        }
    }

    showBanner() {
        const banner = document.getElementById('cookie-consent-banner');
        if (banner) {
            banner.style.display = 'block';
        }
    }

    hideBanner() {
        const banner = document.getElementById('cookie-consent-banner');
        if (banner) {
            banner.style.display = 'none';
        }
    }

    showSettings() {
        const modal = document.getElementById('cookie-settings-modal');
        if (modal) {
            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('visible'), 10);
            document.body.style.overflow = 'hidden';
            
            // Set current values in toggles
            if (this.consent) {
                document.getElementById('analytics-toggle').checked = this.consent.analytics || false;
                document.getElementById('functional-toggle').checked = this.consent.functional || false;
            }
        }
    }

    hideSettings() {
        const modal = document.getElementById('cookie-settings-modal');
        if (modal) {
            modal.classList.remove('visible');
            setTimeout(() => {
                modal.style.display = 'none';
                document.body.style.overflow = '';
            }, 300);
        }
    }

    acceptAll() {
        this.saveConsent({
            necessary: true,
            analytics: true,
            functional: true
        });
        this.hideBanner();
    }

    rejectAll() {
        this.saveConsent({
            necessary: true,
            analytics: false,
            functional: false
        });
        this.hideBanner();
    }

    saveCustom() {
        const preferences = {
            necessary: true, // Always true
            analytics: document.getElementById('analytics-toggle').checked,
            functional: document.getElementById('functional-toggle').checked
        };
        this.saveConsent(preferences);
        this.hideSettings();
        this.hideBanner();
    }

    applyConsent() {
        console.log('[CookieConsent] Applying consent:', this.consent);
        
        // Load analytics if consented
        if (this.consent && this.consent.analytics) {
            this.loadAnalytics();
        }
        
        // Load functional cookies if consented
        if (this.consent && this.consent.functional) {
            this.loadFunctional();
        }
        
        // Dispatch custom event for other scripts
        window.dispatchEvent(new CustomEvent('cookieConsentApplied', { 
            detail: this.consent 
        }));
    }

    loadAnalytics() {
        console.log('[CookieConsent] Loading analytics scripts');
        
        // Load analytics.js if not already loaded
        if (!document.querySelector('script[src="analytics.js"]')) {
            const script = document.createElement('script');
            script.src = 'analytics.js';
            script.async = true;
            document.head.appendChild(script);
        }
    }

    loadFunctional() {
        console.log('[CookieConsent] Loading functional cookies');
        // Load any functional cookies or scripts here
        // For example: chat history persistence, user preferences, etc.
    }

    // Method to check if specific cookie type is allowed
    hasConsent(type) {
        if (!this.consent) return false;
        return this.consent[type] === true;
    }

    // Method to revoke consent
    revokeConsent() {
        localStorage.removeItem(this.consentKey);
        this.consent = null;
        this.showBanner();
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.cookieConsent = new CookieConsent();
    
    // Add close functionality to cookie modal
    const cookieModal = document.getElementById('cookie-settings-modal');
    if (cookieModal) {
        cookieModal.addEventListener('click', (e) => {
            if (e.target === cookieModal) {
                window.cookieConsent.hideSettings();
            }
        });
        
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                window.cookieConsent.hideSettings();
            }
        });
    }
});
