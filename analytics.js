// Analytics Module for Nodum.tech
// Collects comprehensive user behavior data

class AnalyticsTracker {
    constructor(config = {}) {
        this.sessionId = this.generateSessionId();
        this.userId = this.getUserId();
        this.startTime = Date.now();
        this.currentPage = window.location.pathname;
        this.events = [];
        this.chatEvents = [];
        this.clickHeatmap = {};
        this.scrollDepth = 0;
        this.maxScrollDepth = 0;
        this.lastActiveTime = Date.now();
        this.config = {
            endpoint: config.endpoint || '/api/analytics',
            flushInterval: config.flushInterval || 30000, // 30 seconds
            maxEvents: config.maxEvents || 100,
            ...config
        };
        
        this.init();
    }

    generateSessionId() {
        return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getUserId() {
        let userId = localStorage.getItem('nodum_user_id');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('nodum_user_id', userId);
        }
        return userId;
    }

    init() {
        this.trackPageView();
        this.setupClickTracking();
        this.setupScrollTracking();
        this.setupTimeTracking();
        this.setupChatTracking();
        this.setupNavigationTracking();
        
        // Flush events periodically
        setInterval(() => this.flushEvents(), this.config.flushInterval);
        
        // Flush on page unload
        window.addEventListener('beforeunload', () => this.flushEvents(true));
    }

    detectDeviceType() {
        const userAgent = navigator.userAgent;
        const width = window.screen.width;
        
        // Mobile detection
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
            if (/iPad/i.test(userAgent) || (width >= 768 && width <= 1024)) {
                return 'tablet';
            }
            return 'mobile';
        }
        
        // Tablet detection based on screen size
        if (width >= 768 && width <= 1024) {
            return 'tablet';
        }
        
        return 'desktop';
    }

    trackPageView() {
        this.addEvent({
            type: 'page_view',
            page: this.currentPage,
            referrer: document.referrer,
            userAgent: navigator.userAgent,
            deviceType: this.detectDeviceType(),
            screen: {
                width: window.screen.width,
                height: window.screen.height
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            language: navigator.language,
            timestamp: Date.now()
        });
    }

    setupClickTracking() {
        document.addEventListener('click', (e) => {
            const target = e.target;
            const selector = this.getElementSelector(target);
            const text = target.textContent?.trim().substring(0, 50) || '';
            
            // Track click
            this.addEvent({
                type: 'click',
                element: selector,
                text: text,
                x: e.clientX,
                y: e.clientY,
                pageX: e.pageX,
                pageY: e.pageY,
                timestamp: Date.now()
            });

            // Update heatmap
            const heatmapKey = Math.floor(e.pageX / 50) + '_' + Math.floor(e.pageY / 50);
            this.clickHeatmap[heatmapKey] = (this.clickHeatmap[heatmapKey] || 0) + 1;
        }, true);
    }

    setupScrollTracking() {
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const scrollTop = window.scrollY;
                const docHeight = document.documentElement.scrollHeight - window.innerHeight;
                const scrollPercent = Math.round((scrollTop / docHeight) * 100);
                
                if (scrollPercent > this.maxScrollDepth) {
                    this.maxScrollDepth = scrollPercent;
                    
                    this.addEvent({
                        type: 'scroll_milestone',
                        depth: scrollPercent,
                        timestamp: Date.now()
                    });
                }
            }, 100);
        });
    }

    setupTimeTracking() {
        // Track time on page
        this.timeOnPage = 0;
        setInterval(() => {
            const now = Date.now();
            const timeSinceLastActive = now - this.lastActiveTime;
            
            // Consider inactive if no activity for 30 seconds
            if (timeSinceLastActive < 30000) {
                this.timeOnPage += 10;
            }
            
            this.lastActiveTime = now;
        }, 10000);

        // Track visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.addEvent({
                    type: 'page_hidden',
                    timeOnPage: this.timeOnPage,
                    timestamp: Date.now()
                });
            } else {
                this.addEvent({
                    type: 'page_visible',
                    timestamp: Date.now()
                });
                this.lastActiveTime = Date.now();
            }
        });
    }

    setupChatTracking() {
        // Track chat interactions
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        // Check if it's a chat message
                        if (node.classList?.contains('message')) {
                            const isUserMessage = node.classList?.contains('user-message');
                            const isBotMessage = node.classList?.contains('bot-message');
                            const text = node.textContent?.trim() || '';
                            
                            this.chatEvents.push({
                                type: isUserMessage ? 'user_message' : 'bot_message',
                                text: text.substring(0, 200),
                                timestamp: Date.now(),
                                messageId: this.generateMessageId()
                            });

                            // Calculate response time for bot
                            if (isBotMessage && this.lastUserMessageTime) {
                                const responseTime = Date.now() - this.lastUserMessageTime;
                                this.chatEvents.push({
                                    type: 'bot_response_time',
                                    responseTime: responseTime,
                                    timestamp: Date.now()
                                });
                            }

                            if (isUserMessage) {
                                this.lastUserMessageTime = Date.now();
                            }
                        }
                    }
                });
            });
        });

        // Observe chat messages container
        const chatMessages = document.getElementById('main-chat-messages');
        if (chatMessages) {
            observer.observe(chatMessages, { childList: true, subtree: true });
        }

        // Track quick action button clicks
        document.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const message = btn.getAttribute('data-message');
                this.chatEvents.push({
                    type: 'quick_action',
                    message: message,
                    timestamp: Date.now()
                });
            });
        });

        // Track traditional form submission
        const traditionalForm = document.getElementById('traditional-form');
        if (traditionalForm) {
            traditionalForm.addEventListener('submit', () => {
                this.chatEvents.push({
                    type: 'form_submission',
                    formType: 'traditional',
                    timestamp: Date.now()
                });
            });
        }
    }

    setupNavigationTracking() {
        // Track navigation to different sections
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                this.addEvent({
                    type: 'section_navigation',
                    target: href,
                    text: link.textContent?.trim().substring(0, 50),
                    timestamp: Date.now()
                });
            });
        });

        // Track modal opens
        const modalButtons = document.querySelectorAll('.pricing-btn');
        modalButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const card = btn.closest('.pricing-card');
                const tariffName = card?.querySelector('.pricing-name')?.textContent;
                this.addEvent({
                    type: 'tariff_click',
                    tariff: tariffName,
                    timestamp: Date.now()
                });
            });
        });

        // Track portfolio card clicks
        const observer = new MutationObserver(() => {
            document.querySelectorAll('.bento-card').forEach(card => {
                if (!card.dataset.analyticsTracked) {
                    card.dataset.analyticsTracked = 'true';
                    card.addEventListener('click', () => {
                        const title = card.querySelector('h3')?.textContent;
                        this.addEvent({
                            type: 'portfolio_click',
                            module: title,
                            timestamp: Date.now()
                        });
                    });
                }
            });
        });
        
        observer.observe(document.getElementById('bento-container') || document.body, { childList: true, subtree: true });
    }

    addEvent(event) {
        this.events.push({
            ...event,
            sessionId: this.sessionId,
            userId: this.userId
        });

        // Flush if we have too many events
        if (this.events.length >= this.config.maxEvents) {
            this.flushEvents();
        }
    }

    generateMessageId() {
        return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getElementSelector(element) {
        if (element.id) return '#' + element.id;
        if (element.className) return '.' + element.className.split(' ')[0];
        return element.tagName.toLowerCase();
    }

    async flushEvents(isSync = false) {
        if (this.events.length === 0 && this.chatEvents.length === 0) return;

        const payload = {
            sessionId: this.sessionId,
            userId: this.userId,
            events: this.events,
            chatEvents: this.chatEvents,
            clickHeatmap: this.clickHeatmap,
            maxScrollDepth: this.maxScrollDepth,
            timeOnPage: this.timeOnPage,
            sessionDuration: Date.now() - this.startTime,
            timestamp: Date.now()
        };

        if (isSync) {
            // Use navigator.sendBeacon for reliable sending on page unload
            const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
            navigator.sendBeacon(this.config.endpoint, blob);
        } else {
            try {
                await fetch(this.config.endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
            } catch (error) {
                console.error('Failed to send analytics:', error);
                // Store in localStorage for retry
                this.storeOffline(payload);
            }
        }

        // Clear events after sending
        this.events = [];
        this.chatEvents = [];
    }

    storeOffline(payload) {
        const offlineData = JSON.parse(localStorage.getItem('nodum_offline_analytics') || '[]');
        offlineData.push(payload);
        localStorage.setItem('nodum_offline_analytics', JSON.stringify(offlineData));
    }

    // Public method to track custom events
    trackCustomEvent(eventName, data = {}) {
        this.addEvent({
            type: 'custom',
            eventName: eventName,
            data: data,
            timestamp: Date.now()
        });
    }

    // Get session summary
    getSessionSummary() {
        return {
            sessionId: this.sessionId,
            userId: this.userId,
            eventsCount: this.events.length,
            chatEventsCount: this.chatEvents.length,
            timeOnPage: this.timeOnPage,
            maxScrollDepth: this.maxScrollDepth,
            sessionDuration: Date.now() - this.startTime
        };
    }
}

// Initialize analytics
const analytics = new AnalyticsTracker({
    endpoint: 'https://nhost.weebx.duckdns.org/v1/analytics'
});

// Make available globally for debugging
window.analytics = analytics;
