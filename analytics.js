// Advanced Deep Analytics Module for Nodum.tech
// Уровень: Enterprise (Сбор микро-взаимодействий, производительности, чат-воронок)

class DeepAnalyticsTracker {
    constructor(config = {}) {
        this.version = '2.0.0';
        this.sessionId = this.generateId('sess');
        this.userId = this.getOrCreateUserId();
        this.sessionStart = Date.now();
        
        // Буферы данных
        this.events = [];
        this.mouseMovements = [];
        this.chatFunnel = { startedTyping: false, messagesSent: 0, formOpened: false, goalReached: false };
        this.performanceMetrics = {};
        
        // Состояния
        this.lastActiveTime = Date.now();
        this.activeTimeOnPage = 0;
        this.maxScrollDepth = 0;
        this.recentClicks = []; // Для отслеживания Rage Clicks
        
        this.config = {
            endpoint: config.endpoint || 'https://nhost.weebx.duckdns.org/v1/analytics',
            flushInterval: 15000, // Отправка каждые 15 сек
            maxEvents: 50,
            trackMouse: true, // Включить слежение за мышью
            ...config
        };

        this.init();
    }

    generateId(prefix) {
        return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getOrCreateUserId() {
        let uid = localStorage.getItem('nodum_uid');
        if (!uid) {
            uid = this.generateId('usr');
            localStorage.setItem('nodum_uid', uid);
            this.isNewUser = true;
        } else {
            this.isNewUser = false;
        }
        return uid;
    }

    init() {
        this.captureDeviceInfo();
        this.capturePerformance();
        this.setupActivityTracking();
        this.setupClickAndRageTracking();
        this.setupScrollTracking();
        this.setupErrorTracking();
        this.setupChatFunnelTracking();
        this.setupFormTracking();
        
        if (this.config.trackMouse) {
            this.setupMouseTracking();
        }

        // Жизненный цикл сессии
        setInterval(() => this.flush(), this.config.flushInterval);
        window.addEventListener('visibilitychange', () => this.handleVisibilityChange());
        window.addEventListener('beforeunload', () => this.flush(true));
        
        // Отправляем базовое событие входа
        this.track('session_start', {
            isNewUser: this.isNewUser,
            referrer: document.referrer || 'direct',
            landingPage: window.location.pathname
        });
    }

    // 1. СБОР ИНФОРМАЦИИ ОБ УСТРОЙСТВЕ И СЕТИ
    captureDeviceInfo() {
        this.deviceInfo = {
            userAgent: navigator.userAgent,
            language: navigator.language,
            screenRes: `${window.screen.width}x${window.screen.height}`,
            viewportRes: `${window.innerWidth}x${window.innerHeight}`,
            colorDepth: window.screen.colorDepth,
            connection: navigator.connection ? navigator.connection.effectiveType : 'unknown', // 4g, 3g и т.д.
            hardwareConcurrency: navigator.hardwareConcurrency || 1,
            deviceMemory: navigator.deviceMemory || 'unknown'
        };
    }

    // 2. СБОР WEB VITALS И ПРОИЗВОДИТЕЛЬНОСТИ
    capturePerformance() {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const navEntry = performance.getEntriesByType('navigation')[0];
                const paintEntries = performance.getEntriesByType('paint');
                
                this.performanceMetrics = {
                    pageLoadTime: navEntry ? navEntry.loadEventEnd - navEntry.startTime : 0,
                    domInteractive: navEntry ? navEntry.domInteractive : 0,
                    fcp: paintEntries.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
                };

                this.track('performance_metrics', this.performanceMetrics);
            }, 0);
        });
    }

    // 3. ОТСЛЕЖИВАНИЕ RAGE CLICKS И DEAD CLICKS
    setupClickAndRageTracking() {
        document.addEventListener('click', (e) => {
            const target = e.target;
            const isInteractive = target.closest('a, button, input, select, textarea, .bento-card');
            
            const clickData = {
                element: target.tagName.toLowerCase(),
                classes: target.className,
                id: target.id,
                text: target.innerText?.substring(0, 30),
                x: Math.round((e.clientX / window.innerWidth) * 100), // В % для адаптивности тепловой карты
                y: Math.round((e.clientY / window.innerHeight) * 100)
            };

            // Dead Click Check (клик по тексту/фону)
            if (!isInteractive) {
                this.track('dead_click', clickData);
            } else {
                this.track('click', clickData);
            }

            // Rage Click Logic (Яростные клики)
            const now = Date.now();
            this.recentClicks.push({ x: e.clientX, y: e.clientY, time: now });
            this.recentClicks = this.recentClicks.filter(c => now - c.time < 1500); // Окно 1.5 сек

            if (this.recentClicks.length >= 3) {
                // Если 3 клика в радиусе 50px за 1.5 секунды
                const dx = Math.abs(this.recentClicks[0].x - this.recentClicks[2].x);
                const dy = Math.abs(this.recentClicks[0].y - this.recentClicks[2].y);
                
                if (dx < 50 && dy < 50) {
                    this.track('rage_click', clickData);
                    this.recentClicks = []; // Сброс
                }
            }
        }, true);
    }

    // 4. ДВИЖЕНИЕ МЫШИ (Для записи сессий)
    setupMouseTracking() {
        let lastMove = 0;
        document.addEventListener('mousemove', (e) => {
            const now = Date.now();
            if (now - lastMove > 250) { // Пишем координаты макс 4 раза в секунду
                this.mouseMovements.push({
                    x: Math.round((e.clientX / window.innerWidth) * 100),
                    y: Math.round((e.clientY / window.innerHeight) * 100),
                    t: now - this.sessionStart
                });
                lastMove = now;
            }
        });
    }

    // 5. РЕАЛЬНОЕ ВРЕМЯ НА САЙТЕ (Без учета свернутой вкладки)
    setupActivityTracking() {
        setInterval(() => {
            if (!document.hidden) {
                this.activeTimeOnPage += 5; // прибавляем 5 сек
            }
        }, 5000);
    }

    handleVisibilityChange() {
        if (document.hidden) {
            this.track('tab_hidden', { activeTime: this.activeTimeOnPage });
        } else {
            this.track('tab_visible');
        }
    }

    // 6. ВОРОНКА ЧАТА И ВЗАИМОДЕЙСТВИЯ С ИИ
    setupChatFunnelTracking() {
        const chatInput = document.getElementById('main-chat-input');
        
        if (chatInput) {
            // Трекаем "начал печатать, но стер"
            chatInput.addEventListener('input', () => {
                if (!this.chatFunnel.startedTyping) {
                    this.chatFunnel.startedTyping = true;
                    this.track('chat_funnel', { step: 'started_typing' });
                }
            });

            chatInput.addEventListener('focus', () => {
                this.chatFunnel.focusStart = Date.now();
            });

            chatInput.addEventListener('blur', () => {
                if (this.chatFunnel.focusStart) {
                    const timeSpent = Date.now() - this.chatFunnel.focusStart;
                    this.track('chat_input_focused', { durationMs: timeSpent });
                }
            });
        }

        // Перехват отправки сообщений (интеграция с вашим script.js)
        const originalSend = window.sendMainChatMessageImpl;
        if (originalSend) {
            window.sendMainChatMessageImpl = async (msg) => {
                this.chatFunnel.messagesSent++;
                this.track('chat_funnel', { step: 'message_sent', count: this.chatFunnel.messagesSent, textLength: msg.length });
                return originalSend(msg); // Вызов оригинальной функции
            };
        }
    }

    // 7. СБОР ОШИБОК (Frontend Monitoring)
    setupErrorTracking() {
        window.addEventListener('error', (e) => {
            this.track('js_error', { message: e.message, file: e.filename, line: e.lineno });
        });

        window.addEventListener('unhandledrejection', (e) => {
            this.track('promise_rejection', { reason: e.reason?.toString() || 'Unknown' });
        });
    }

    // 8. СКРОЛЛ С УЧЕТОМ СКОРОСТИ
    setupScrollTracking() {
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            if (scrollTimeout) clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const depth = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
                if (depth > this.maxScrollDepth) {
                    this.maxScrollDepth = depth;
                    // Шлем только значимые майлстоуны: 25, 50, 75, 100
                    if ([25, 50, 75, 90, 100].includes(Math.round(depth/5)*5)) {
                        this.track('scroll_milestone', { depth: depth });
                    }
                }
            }, 500);
        });
    }

    // ОТСЛЕЖИВАНИЕ ФОРМ (Классическая заявка)
    setupFormTracking() {
        const form = document.getElementById('traditional-form');
        if (form) {
            form.querySelectorAll('input, textarea').forEach(input => {
                input.addEventListener('change', () => {
                    this.track('form_field_filled', { fieldId: input.id });
                });
            });
        }
    }

    // === БАЗОВЫЕ МЕТОДЫ ОТПРАВКИ ===

    track(eventName, eventData = {}) {
        const event = {
            id: this.generateId('evt'),
            type: eventName,
            data: eventData,
            timestamp: Date.now(),
            url: window.location.pathname
        };

        this.events.push(event);
        if (this.events.length >= this.config.maxEvents) this.flush();
    }

    async flush(isUnload = false) {
        if (this.events.length === 0 && this.mouseMovements.length === 0) return;

        const payload = {
            sessionId: this.sessionId,
            userId: this.userId,
            device: this.deviceInfo,
            activeTime: this.activeTimeOnPage,
            events: [...this.events],
            mouseData: [...this.mouseMovements] // Данные для тепловой карты
        };

        // Очищаем буферы
        this.events = [];
        this.mouseMovements = [];

        if (isUnload && navigator.sendBeacon) {
            payload.events.push({ type: 'session_end', timestamp: Date.now() });
            navigator.sendBeacon(this.config.endpoint, new Blob([JSON.stringify(payload)], { type: 'application/json' }));
        } else {
            try {
                await fetch(this.config.endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } catch (err) {
                // Если нет сети, сохраняем локально, отправим потом
                this.storeOffline(payload);
            }
        }
    }

    storeOffline(payload) {
        let offline = JSON.parse(localStorage.getItem('nodum_offline_analytics') || '[]');
        if (offline.length < 50) { // Избегаем переполнения LocalStorage
            offline.push(payload);
            localStorage.setItem('nodum_offline_analytics', JSON.stringify(offline));
        }
    }
}

// Инициализация
const deepAnalytics = new DeepAnalyticsTracker();
window.nodumAnalytics = deepAnalytics;

// Интеграция с существующим кодом (для отслеживания ИИ-событий)
// Вызовите это в скрипте там, где бот получает информацию
const originalCheckCollectedInfo = window.checkCollectedInfoImpl;
if (originalCheckCollectedInfo) {
    window.checkCollectedInfoImpl = (botResponse) => {
        originalCheckCollectedInfo(botResponse);
        // Трекаем успешный сбор данных
        if (botResponse.toLowerCase().includes('сфер') || botResponse.toLowerCase().includes('бизнес')) {
            window.nodumAnalytics.track('ai_extracted_field', { text: botResponse.substring(0, 50) });
        }
        if (botResponse.toLowerCase().includes('телефон') || botResponse.toLowerCase().includes('телеграм')) {
            window.nodumAnalytics.track('ai_extracted_contact', { text: botResponse.substring(0, 50) });
        }
    };
}
