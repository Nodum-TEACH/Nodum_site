
// ============================================
// GLOBAL VARIABLES
// ============================================

// Текущий активный тип демо для метаданных формы и модалки
let currentDemoType = null;

// ============================================
// Toast Notification System
function showNotification(title, message, type = 'info', duration = 5000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = {
        success: '<i class="fa-solid fa-check"></i>',
        error: '<i class="fa-solid fa-xmark"></i>',
        warning: '<i class="fa-solid fa-exclamation"></i>',
        info: '<i class="fa-solid fa-info"></i>'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    // XSS-safe construction using DOM API
    const iconDiv = document.createElement('div');
    iconDiv.className = 'toast-icon';
    iconDiv.innerHTML = icons[type] || icons.info; // Safe: predefined icons only

    const contentDiv = document.createElement('div');
    contentDiv.className = 'toast-content';

    const titleDiv = document.createElement('div');
    titleDiv.className = 'toast-title';
    titleDiv.textContent = title; // XSS-safe: textContent escapes HTML

    const messageDiv = document.createElement('div');
    messageDiv.className = 'toast-message';
    messageDiv.textContent = message; // XSS-safe: textContent escapes HTML

    contentDiv.appendChild(titleDiv);
    contentDiv.appendChild(messageDiv);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>'; // Safe: predefined
    closeBtn.onclick = () => toast.remove();

    toast.appendChild(iconDiv);
    toast.appendChild(contentDiv);
    toast.appendChild(closeBtn);

    // Лимитируем количество уведомлений (максимум 3)
    while (container.children.length >= 3) {
        container.firstChild.remove();
    }

    container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Auto remove after duration
    setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Use currentModel from config.js if available, otherwise default to lmstudio
// Global completion detection function
function checkForCompletion(botResponse) {
    // This will be defined later in DOMContentLoaded
    if (typeof window.checkForCompletionImpl === 'function') {
        window.checkForCompletionImpl(botResponse);
    }
}

// Global collected info check function
function checkCollectedInfo(botResponse) {
    // This will be defined later in DOMContentLoaded
    if (typeof window.checkCollectedInfoImpl === 'function') {
        window.checkCollectedInfoImpl(botResponse);
    }
}

// Function to handle hero CTA button click
function startProjectChat(event) {
    event.preventDefault();

    const chatSection = document.getElementById('chat');
    if (chatSection) {
        chatSection.scrollIntoView({ behavior: 'smooth' });

        setTimeout(() => {
            const mainChatInput = document.getElementById('main-chat-input');
            if (mainChatInput && typeof window.sendMainChatMessageImpl === 'function') {
                window.sendMainChatMessageImpl('Хочу получить бесплатный разбор');
            }
        }, 500);
    }
}

// Function to handle pricing button clicks
function selectTariff(event, tariffName) {
    event.preventDefault();

    // Smooth scroll to chat section
    const chatSection = document.getElementById('chat');
    if (chatSection) {
        chatSection.scrollIntoView({ behavior: 'smooth' });

        // Wait for scroll to complete, then send message
        setTimeout(() => {
            const mainChatInput = document.getElementById('main-chat-input');
            if (mainChatInput && typeof window.sendMainChatMessageImpl === 'function') {
                window.sendMainChatMessageImpl(`Я выбрал тариф ${tariffName}`);
            }
        }, 500);
    }
}

// Functions for "Личный кабинет" modal
function openCabinetModal() {
    const modal = document.getElementById('cabinet-modal');
    if (!modal) return;
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('visible'), 10);
    document.body.style.overflow = 'hidden';
}

function closeCabinetModal() {
    const modal = document.getElementById('cabinet-modal');
    if (!modal) return;
    modal.classList.remove('visible');
    setTimeout(() => { modal.style.display = 'none'; document.body.style.overflow = ''; }, 300);
}

function submitCabinetForm(event) {
    event.preventDefault();
    const email = document.getElementById('cabinet-email').value;
    console.log('[cabinet] Email submitted:', email);
    closeCabinetModal();
    document.getElementById('cabinet-form').reset();
}

// Function to open traditional form modal
function openTraditionalForm(event) {
    event.preventDefault();
    const modal = document.getElementById('traditional-form-modal');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('visible'), 10);
    document.body.style.overflow = 'hidden';
}

// Function to close traditional form modal
function closeTraditionalForm() {
    const modal = document.getElementById('traditional-form-modal');
    modal.classList.remove('visible');
    setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }, 300);
}

// Флаг защиты от дублирования отправки
let isFormSubmitting = false;

// Function to submit traditional form
async function submitTraditionalForm(event) {
    event.preventDefault();

    // Защита от двойного клика
    if (isFormSubmitting) {
        console.log('[form] Submit blocked: already submitting');
        return;
    }
    isFormSubmitting = true;

    const field = document.getElementById('form-field').value;
    const contact = document.getElementById('form-contact').value.trim();
    const message = document.getElementById('form-message').value;
    const demoType = document.getElementById('form-demo-type').value;

    // Validate contact format
    const phoneRegex = /(\+7|8)[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/;
    const telegramRegex = /^@[a-zA-Z0-9_]{3,32}$/;
    const isPhone = phoneRegex.test(contact);
    const isTelegram = telegramRegex.test(contact);

    if (!isPhone && !isTelegram) {
        showNotification('Ошибка', 'Неверный формат контакта. Укажите номер телефона в формате +7 XXX XXX XX XX или Telegram username с @', 'error');
        return;
    }

    try {
        // Send the data to backend endpoint
        const response = await fetch('https://nhost.weebx.duckdns.org/v1/lead-submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                field,
                contact,
                message,
                formType: 'traditional',
                demoType: demoType || 'general',
                subject: demoType ? `Интерес к ${demoType}` : 'Заявка с сайта'
            })
        });

        const data = await response.json();

        if (data.success) {
            console.log('[traditional-form] Form submitted successfully:', { field, contact, message, demoType });
            
            showNotification('Успешно', 'Заявка отправлена! Мы свяжемся с вами в ближайшее время.', 'success');
            
            // Close the modal
            closeTraditionalForm();

            // Reset form
            document.getElementById('traditional-form').reset();
        } else {
            console.error('[traditional-form] Error submitting form:', data.error);
            showNotification('Ошибка', 'Не удалось отправить заявку. Попробуйте позже.', 'error');
        }
    } catch (error) {
        console.error('[traditional-form] Network error:', error);
        showNotification('Ошибка', 'Ошибка соединения. Проверьте интернет и попробуйте снова.', 'error');
    } finally {
        isFormSubmitting = false;
    }
}



// Новая и единственная функция для общения с Витей
async function llmstudo(input, systemPrompt = null, chatHistory = []) {
    try {
        // Traefik strips /v1 and forwards to the functions service
        const response = await fetch('https://nhost.weebx.duckdns.org/v1/chat-proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: input,
                chatHistory: chatHistory
            })
        });

        if (!response.ok) {
            throw new Error(`Ошибка сервера`);
        }

        const data = await response.json();
        return data.reply || 'Витя не смог ответить...';
    } catch (error) {
        console.error('Ошибка бэкенда:', error);
        return "Проблема с соединением";
    }
}

function scrollToHashTarget(hash) {
    const targetId = hash.startsWith('#') ? hash.slice(1) : hash;
    if (!targetId) return false;

    const targetElement = document.getElementById(targetId);
    if (!targetElement) return false;

    targetElement.scrollIntoView({ behavior: 'smooth' });
    targetElement.style.transition = 'box-shadow 0.3s ease';
    targetElement.style.boxShadow = '0 0 30px rgba(102, 126, 234, 0.3)';

    setTimeout(() => {
        targetElement.style.boxShadow = '';
    }, 2000);

    return true;
}

document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;

    const href = link.getAttribute('href') || '';
    if (href === '#') return;

    event.preventDefault();
    scrollToHashTarget(href);
});

// ============================================
// CLINIC SYNC SIMULATOR - Telegram ↔ CRM
// Global object for modal simulator integration
// ============================================

window.ClinicSync = {
    // Данные сессии
    session: {
        leadId: null,
        service: null,
        step: 'welcome'
    },

    // Флаг защиты от race condition
    isTransitioning: false,

    leadCounter: 2000,

    // Состояния диалога (Finite State Machine)
    states: {
        welcome: {
            message: `👋 Добро пожаловать в клинику "Здоровье Плюс"!<br><br>Я — автоматизированный ассистент. Помогу записаться на приём без ожидания.`,
            buttons: [
                { text: '📋 Записаться', action: 'booking', icon: 'fa-calendar-check' },
                { text: '💰 Узнать цены', action: 'prices', icon: 'fa-tag' }
            ]
        },
        booking: {
            message: `Выберите услугу:`,
            buttons: [
                { text: '🩺 Консультация терапевта<br>2 500 ₽ • 30 мин', action: 'service_therapy', icon: 'fa-stethoscope' },
                { text: '🧪 Сдача анализов<br>от 1 200 ₽ • 15 мин', action: 'service_analysis', icon: 'fa-flask' },
                { text: '🔬 МРТ-диагностика<br>8 500 ₽ • 45 мин', action: 'service_mri', icon: 'fa-x-ray' }
            ],
            onEnter: function() {
                ClinicSync.createLead('Выбор услуги...');
            }
        },
        therapy: {
            message: `✅ Консультация терапевта<br><br>Выберите врача:`,
            buttons: [
                { text: 'Др. Смирнов А.В.<br>⭐ 4.9', action: 'doctor_selected', icon: 'fa-user-md' },
                { text: 'Др. Козлова Е.М.<br>⭐ 4.8', action: 'doctor_selected', icon: 'fa-user-md' }
            ],
            onEnter: function() {
                ClinicSync.updateLead('Консультация терапевта');
                ClinicSync.moveLead('progress');
            }
        },
        datetime: {
            message: function() {
                return `✅ ${ClinicSync.session.service}<br>👨‍⚕️ Выбран врач<br><br>Выберите время:`;
            },
            buttons: [
                { text: '🕐 Сегодня, 10:00', action: 'confirm', icon: 'fa-clock' },
                { text: '🕒 Сегодня, 14:30', action: 'confirm', icon: 'fa-clock' },
                { text: '🕕 Завтра, 09:00', action: 'confirm', icon: 'fa-clock' }
            ]
        },
        confirm: {
            message: function() {
                return `📝 Проверьте данные:<br><br>📋 ${ClinicSync.session.service}<br>⏰ Сегодня, 14:30<br>💰 2 500 ₽<br><br>Всё верно?`;
            },
            buttons: [
                { text: '✅ Подтвердить', action: 'success', icon: 'fa-check', primary: true },
                { text: '🔄 Изменить', action: 'booking', icon: 'fa-rotate-left' }
            ]
        },
        success: {
            message: function() {
                return `✅ Запись подтверждена!<br><br>📋 ${ClinicSync.session.service}<br>⏰ Сегодня, 14:30<br>📍 ул. Медицинская, 15<br><br>🔔 Напомним за 2 часа`;
            },
            buttons: [
                { text: '📋 Новая запись', action: 'reset', icon: 'fa-plus' }
            ],
            onEnter: function() {
                ClinicSync.moveLead('closed');
                if (typeof showFinalCTAModal === 'function') {
                    showFinalCTAModal('clinic_sync');
                }
            }
        },
        prices: {
            message: `💰 Прайс-лист:<br><br>• Консультация: 2 500 ₽<br>• Анализы: от 1 200 ₽<br>• МРТ: 8 500 ₽<br>• УЗИ: 3 200 ₽<br><br>📞 +7 (999) 123-45-67`,
            buttons: [
                { text: '📋 Записаться', action: 'booking', icon: 'fa-calendar-check' },
                { text: '🔙 Назад', action: 'welcome', icon: 'fa-arrow-left' }
            ]
        }
    },

    // Инициализация симулятора
    init: function() {
        // Начальное состояние
        this.session = { leadId: null, service: null, step: 'welcome' };
        this.renderState();
    },

    // Обработка действий
    handleAction: function(action) {
        // Защита от одновременных кликов
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        const chat = document.getElementById('sync-chat');
        const controls = document.getElementById('sync-controls');

        if (!chat || !controls) {
            this.isTransitioning = false;
            return;
        }

        // Добавляем сообщение пользователя
        let userText = action;
        const state = this.states[this.session.step];
        if (state && state.buttons) {
            const btn = state.buttons.find(b => b.action === action);
            if (btn) {
                userText = btn.text.replace(/[📋💰🩺🧪🔬✅👨‍⚕️🕐🕒🕕📝📍🔔⭐🔄🔙]/g, '').trim().split('\n')[0];
            }
        }

        // Добавляем сообщение пользователя
        const userMsg = document.createElement('div');
        userMsg.className = 'sync-message user';
        userMsg.textContent = userText;
        chat.appendChild(userMsg);
        chat.scrollTop = chat.scrollHeight;

        // Очищаем кнопки
        controls.innerHTML = '';

        // Обрабатываем переход
        setTimeout(() => {
            this.transition(action);
            // Сбрасываем флаг после завершения перехода
            setTimeout(() => {
                this.isTransitioning = false;
            }, 500);
        }, 400);
    },

    // Переход между состояниями
    transition: function(action) {
        // Определяем следующее состояние
        let nextState = this.session.step;

        switch(action) {
            case 'booking': nextState = 'booking'; break;
            case 'prices': nextState = 'prices'; break;
            case 'welcome': nextState = 'welcome'; break;
            case 'reset':
                this.reset();
                nextState = 'welcome';
                break;
            case 'service_therapy':
                this.session.service = 'Консультация терапевта';
                nextState = 'therapy';
                break;
            case 'service_analysis':
                this.session.service = 'Сдача анализов';
                nextState = 'datetime';
                this.createLead('Сдача анализов');
                break;
            case 'service_mri':
                this.session.service = 'МРТ-диагностика';
                nextState = 'datetime';
                this.createLead('МРТ-диагностика');
                break;
            case 'doctor_selected':
                nextState = 'datetime';
                break;
            case 'confirm':
                nextState = 'confirm';
                break;
            case 'success':
                nextState = 'success';
                break;
        }

        this.session.step = nextState;
        this.renderState();
    },

    // Рендер текущего состояния (XSS-safe)
    renderState: function() {
        const state = this.states[this.session.step];
        const chat = document.getElementById('sync-chat');
        const controls = document.getElementById('sync-controls');

        if (!chat || !controls) return;

        // Вызываем onEnter если есть
        if (state.onEnter) state.onEnter();

        // Добавляем сообщение бота - БЕЗОПАСНО через textContent + разрешенные br
        const message = typeof state.message === 'function' ? state.message() : state.message;
        const botMsg = document.createElement('div');
        botMsg.className = 'sync-message bot';
        // Безопасно вставляем текст с поддержкой переносов строк
        this.setSafeHtml(botMsg, message);
        chat.appendChild(botMsg);

        // Показываем tooltip при ключевых этапах
        this.showStepTooltip();

        // Прокрутка вниз
        chat.scrollTop = chat.scrollHeight;

        // Рендерим кнопки - БЕЗОПАСНО
        setTimeout(() => {
            state.buttons.forEach(btn => {
                const button = document.createElement('button');
                button.className = 'sync-btn' + (btn.primary ? ' primary' : '');
                // Иконка через className (безопасно)
                const icon = document.createElement('i');
                icon.className = 'fa-solid ' + btn.icon;
                button.appendChild(icon);
                // Текст через textContent (XSS-safe)
                const textSpan = document.createElement('span');
                textSpan.textContent = ' ' + btn.text.replace(/<[^>]*>/g, ''); // Убираем HTML из текста кнопки
                button.appendChild(textSpan);
                button.onclick = () => this.handleAction(btn.action);
                controls.appendChild(button);
            });
        }, 100);
    },

    // Безопасная вставка HTML с разрешенными тегами
    setSafeHtml: function(element, html) {
        if (!html) return;
        // Разрешаем только br теги, остальное экранируем
        const parts = html.split(/<br\s*\/?>/gi);
        parts.forEach((part, index) => {
            if (index > 0) {
                element.appendChild(document.createElement('br'));
            }
            if (part) {
                element.appendChild(document.createTextNode(part));
            }
        });
    },

    // Показать tooltip на ключевом этапе
    showStepTooltip: function() {
        const tooltips = {
            'booking': 'Бот сам создаст сделку в CRM',
            'datetime': 'ИИ только что сэкономил вам 15 минут',
            'success': 'Запись подтверждена автоматически!'
        };

        const tooltipText = tooltips[this.session.step];
        if (tooltipText && typeof showDemoTooltip === 'function') {
            const chat = document.getElementById('sync-chat');
            if (chat) {
                showDemoTooltip(chat, tooltipText, 3000);
            }
        }
    },

    // CRM функции
    createLead: function(service) {
        this.leadCounter++;
        this.session.leadId = this.leadCounter;

        const leadCard = document.createElement('div');
        leadCard.className = 'sync-lead-card';
        leadCard.id = `lead-${this.leadCounter}`;
        leadCard.innerHTML = `
            <div class="sync-lead-header">#${this.leadCounter}</div>
            <div class="sync-lead-service">${service}</div>
            <div class="sync-lead-client"><i class="fa-solid fa-user"></i> Клиент</div>
            <div class="sync-lead-tags">
                <span class="sync-tag">бот</span>
                <span class="sync-tag sync-tag-new">new</span>
            </div>
        `;

        const container = document.getElementById('crm-leads-new');
        if (container) {
            container.appendChild(leadCard);
            this.updateCounts();
        }
    },

    updateLead: function(service) {
        if (!this.session.leadId) return;
        const card = document.getElementById(`lead-${this.session.leadId}`);
        if (card) {
            const serviceEl = card.querySelector('.sync-lead-service');
            if (serviceEl) serviceEl.textContent = service;
        }
    },

    moveLead: function(toColumn) {
        if (!this.session.leadId) return;
        const card = document.getElementById(`lead-${this.session.leadId}`);
        if (!card) return;

        const targetContainer = document.getElementById(`crm-leads-${toColumn}`);
        if (!targetContainer) return;

        // Анимация перемещения
        card.style.transform = 'scale(1.05)';
        card.style.boxShadow = '0 20px 40px rgba(59, 130, 246, 0.3)';

        setTimeout(() => {
            targetContainer.appendChild(card);
            card.style.transform = 'scale(1)';
            card.style.boxShadow = '';

            // Обновляем стили
            const tags = card.querySelector('.sync-lead-tags');
            if (tags) {
                if (toColumn === 'progress') {
                    tags.innerHTML = '<span class="sync-tag">бот</span><span class="sync-tag sync-tag-progress">в работе</span>';
                } else if (toColumn === 'closed') {
                    tags.innerHTML = '<span class="sync-tag">бот</span><span class="sync-tag sync-tag-closed">завершено</span>';
                    // Добавляем AI вероятность
                    const aiProb = document.createElement('div');
                    aiProb.className = 'sync-ai-prob';
                    aiProb.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> ИИ вероятность сделки: 97%';
                    card.appendChild(aiProb);
                }
            }

            this.updateCounts();
        }, 300);
    },

    updateCounts: function() {
        ['new', 'progress', 'closed'].forEach(status => {
            const container = document.getElementById(`crm-leads-${status}`);
            const countEl = document.getElementById(`crm-count-${status}`);
            if (container && countEl) {
                countEl.textContent = container.children.length;
            }
        });
    },

    reset: function() {
        this.session = { leadId: null, service: null, step: 'welcome' };
        // Очищаем CRM
        ['new', 'progress', 'closed'].forEach(status => {
            const container = document.getElementById(`crm-leads-${status}`);
            if (container) container.innerHTML = '';
        });
        this.updateCounts();
        // Очищаем чат
        const chat = document.getElementById('sync-chat');
        const controls = document.getElementById('sync-controls');
        if (chat) chat.innerHTML = '';
        if (controls) controls.innerHTML = '';
    }
};

// ============================================
// DOMContentLoaded - Event Listeners & Initialization
// ============================================

document.addEventListener('DOMContentLoaded', () => {

    // Burger Menu Toggle
    const burgerMenu = document.querySelector('.burger-menu');
    const navLinks = document.querySelector('.nav-links');

    if (burgerMenu && navLinks) {
        burgerMenu.addEventListener('click', () => {
            burgerMenu.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        // Close menu when clicking a link
        navLinks.querySelectorAll('.nav-link, .btn').forEach(link => {
            link.addEventListener('click', () => {
                burgerMenu.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });

        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navLinks.classList.contains('active')) {
                burgerMenu.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!burgerMenu.contains(e.target) && !navLinks.contains(e.target)) {
                burgerMenu.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });
    }

    // Плавный скролл
    window.scrollToPortfolio = function() {
        scrollToHashTarget('#portfolio');
    };

    // Throttle helper для оптимизации производительности
    function throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // 2. Магнитные кнопки с throttle (60fps max)
    const magneticButtons = document.querySelectorAll('.btn-magnetic');
    magneticButtons.forEach(btn => {
        const handleMouseMove = throttle(function(e) {
            const position = btn.getBoundingClientRect();
            const x = e.pageX - position.left - position.width / 2;
            const y = e.pageY - position.top - position.height / 2;

            btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
            const span = btn.querySelector('span');
            if(span) span.style.transform = `translate(${x * 0.05}px, ${y * 0.05}px)`;
        }, 16); // ~60fps

        btn.addEventListener('mousemove', handleMouseMove);

        btn.addEventListener('mouseout', function() {
            btn.style.transform = 'translate(0px, 0px)';
            const span = btn.querySelector('span');
            if(span) span.style.transform = 'translate(0px, 0px)';
        });
    });

    // 3. Загрузка данных и рендер карточек сценариев
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            renderCards(data);
            initScrollAnimations();
        })
        .catch(err => console.error('Ошибка:', err));

    function renderCards(cards) {
        const container = document.getElementById('bento-container');
        if (!container) return;

        const tariffColors = {
            'Нейрон': 'tariff-neuron',
            'Синапс': 'tariff-synapse',
            'Разум': 'tariff-razum'
        };

        cards.forEach((card, index) => {
            const cardEl = document.createElement('div');
            cardEl.className = `bento-card card-${index} fade-in-up`;
            cardEl.style.transitionDelay = `${index * 0.1}s`;

            const tariffClass = tariffColors[card.tariff] || '';
            const tariffBadge = card.tariff
                ? `<span class="card-tariff-badge ${tariffClass}">${card.tariff}</span>`
                : '';

            // Benefit badge по типу выгоды
            const benefitBadge = card.benefitType && card.benefit
                ? `<span class="benefit-badge ${card.benefitType}"><i class="fa-solid fa-bolt"></i> ${card.benefit}</span>`
                : '';

            const tagsHTML = card.tags.slice(0, 3).map(tag => `<span>${escapeHtml(tag)}</span>`).join('');

            // Используем demoType из data.json напрямую
            const demoType = card.demoType || 'ai_agent';

            cardEl.innerHTML = `
                <div>
                    <div class="card-icon-row">
                        <div class="card-icon"><i class="${escapeHtml(card.icon)}"></i></div>
                        ${tariffBadge}
                    </div>
                    ${benefitBadge}
                    <h3>${escapeHtml(card.title)}</h3>
                    <p>${escapeHtml(card.description)}</p>
                    <button class="card-demo-btn" data-demo="${escapeHtml(demoType)}">
                        Попробовать демо <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </div>
                <div class="card-tags">${tagsHTML}</div>
            `;

            // При клике на карточку или кнопку открываем модалку
            const demoBtn = cardEl.querySelector('.card-demo-btn');
            if (demoBtn) {
                demoBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openScenarioModal(card, demoType);
                });
            }
            cardEl.addEventListener('click', () => openScenarioModal(card, demoType));
            container.appendChild(cardEl);
        });
    }

    // XSS-защита: экранирование HTML
    function escapeHtml(text) {
        if (!text || typeof text !== 'string') return text || '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // 4. Модальное окно сценария с интерактивной песочницей
    const modal = document.getElementById('bot-modal');
    let currentCardTitle = '';

    function openScenarioModal(card, demoType) {
        currentDemoType = demoType;
        currentCardTitle = card.title;

        // Заполняем заголовок и иконку
        modal.querySelector('.modal-icon i').className = card.icon;
        modal.querySelector('h2').textContent = card.title;
        modal.querySelector('.scenario-description').textContent = card.description;

        // Показываем модалку
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('visible'), 10);
        document.body.style.overflow = 'hidden';

        // Загружаем демо в симулятор модалки
        setTimeout(() => {
            loadDemoInModal(demoType);
        }, 300);
    }

    function closeScenarioModal() {
        // Очищаем симулятор
        const content = document.getElementById('modal-simulator-content');
        const frameTitle = document.getElementById('modal-frame-title');
        const frame = document.getElementById('modal-device-frame');

        if (content) content.innerHTML = '';
        if (frameTitle) frameTitle.textContent = '';
        if (frame) frame.className = 'simulator-frame macbook';

        // Удаляем CTA и ROI-toast если есть
        const existingCTA = modal.querySelector('.demo-final-cta');
        const existingROI = document.querySelector('.roi-toast');
        if (existingCTA) existingCTA.remove();
        if (existingROI) existingROI.remove();

        // Очищаем ClinicSync симулятор если активен
        if (typeof ClinicSync !== 'undefined' && ClinicSync.reset) {
            ClinicSync.reset();
        }

        // Удаляем глобальные обработчики модального симулятора
        delete window.askAiModal;
        delete window.addCrmLeadModal;
        delete window.tgConfirmModal;

        modal.classList.remove('visible');
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }, 300);
    }

    // Глобальная функция для CTA в модалке
    window.handleScenarioCTA = function() {
        const demoTypeLabels = {
            'ai_agent': 'AI-Агент',
            'crm': 'CRM автоматизация',
            'tg_bot': 'Telegram бот'
        };

        const demoTypeField = document.getElementById('form-demo-type');
        if (demoTypeField) {
            demoTypeField.value = `${demoTypeLabels[currentDemoType] || currentDemoType} — ${currentCardTitle}`;
        }
        closeScenarioModal();
        openTraditionalForm({ preventDefault: () => {} });
    };

    // Закрытие по клику на фон и Escape
    modal.addEventListener('click', e => { if(e.target === modal) closeScenarioModal(); });

    // Функция загрузки демо в модальный симулятор
    function loadDemoInModal(type) {
        const frame = document.getElementById('modal-device-frame');
        const content = document.getElementById('modal-simulator-content');
        const title = document.getElementById('modal-frame-title');

        if (!frame || !content || !title) return;

        const demoData = {
            ai_agent: {
                title: "Анализ документа: Регламент_Тюмень.pdf",
                frameClass: "macbook",
                render: () => `
                    <div class="ai-chat-demo">
                        <div class="chat-messages-sim" id="modal-chat-flow">
                            <div class="msg-sim bot">Привет! Я ИИ-ассистент Nodum. Я изучил ваш регламент. Задайте любой вопрос.</div>
                        </div>
                        <div id="modal-typing-indicator" class="typing-sim">AI ищет ответ в документе...</div>
                        <div class="chat-hints">
                            <button class="hint-btn-sim" onclick="askAiModal('Какая гарантия на насосы?', 'Согласно разделу 4.2, гарантийный срок составляет 24 месяца с даты ввода в эксплуатацию.')">Какая гарантия?</button>
                            <button class="hint-btn-sim" onclick="askAiModal('Срок поставки в Сургут?', 'В приложении №3 указано: логистика до ХМАО занимает 3-5 рабочих дней.')">Срок поставки?</button>
                        </div>
                    </div>
                `
            },
            crm: {
                title: "Nodum CRM — Автоматизация отдела продаж",
                frameClass: "macbook",
                render: () => `
                    <div style="height:100%">
                        <button class="hint-btn-sim" style="margin-bottom:15px; width:100%" onclick="addCrmLeadModal()">➕ Добавить лид из Telegram</button>
                        <div class="crm-board">
                            <div class="crm-col"><h4>Новые</h4><div id="modal-col-new"></div></div>
                            <div class="crm-col"><h4>В работе (AI)</h4><div id="modal-col-progress"></div></div>
                        </div>
                    </div>
                `
            },
            tg_bot: {
                title: "Telegram — @Nodum_Booking_Bot",
                frameClass: "iphone",
                render: () => `
                    <div class="tg-webapp">
                        <div class="tg-header"><i class="fa-brands fa-telegram"></i> Nodum Service</div>
                        <div class="tg-content">
                            <div class="tg-avatar"><i class="fa-solid fa-wrench"></i></div>
                            <h3>Запись на сервис</h3>
                            <p>Выберите удобное время</p>
                            <div class="tg-slots">
                                <button class="hint-btn-sim" onclick="tgConfirmModal(this)">10:00</button>
                                <button class="hint-btn-sim" onclick="tgConfirmModal(this)">14:30</button>
                            </div>
                        </div>
                        <div id="modal-tg-success" class="tg-success">
                            <i class="fa-solid fa-check-circle"></i> Запись подтверждена!
                        </div>
                    </div>
                `
            },
            clinic_sync: {
                title: "Nodum Sync — Telegram ↔ CRM",
                frameClass: "macbook",
                render: () => `
                    <div class="clinic-sync-demo" id="clinic-sync-container">
                        <!-- Toggle для мобильных -->
                        <div class="simulator-view-toggle mobile-only" style="display:none;">
                            <span class="client-label active">Вид клиента</span>
                            <div class="toggle-switch" id="viewToggle" onclick="toggleSimulatorView()"></div>
                            <span class="director-label">Вид директора</span>
                        </div>
                        <div class="sync-simulator" id="syncSimulator">
                            <div class="sync-phone">
                                <div class="sync-phone-header">
                                    <i class="fa-brands fa-telegram"></i>
                                    <span>Nodum Clinic Bot</span>
                                </div>
                                <div class="sync-phone-chat" id="sync-chat">
                                    <div class="sync-message bot">
                                        👋 Добро пожаловать в клинику! Я помогу записаться на приём.
                                    </div>
                                </div>
                                <div class="sync-phone-controls" id="sync-controls">
                                    <button class="sync-btn" onclick="ClinicSync.handleAction('booking')">
                                        <i class="fa-solid fa-calendar-check"></i> Записаться
                                    </button>
                                    <button class="sync-btn" onclick="ClinicSync.handleAction('prices')">
                                        <i class="fa-solid fa-tag"></i> Узнать цены
                                    </button>
                                </div>
                            </div>
                            <div class="sync-arrow">
                                <i class="fa-solid fa-arrow-right"></i>
                                <div class="sync-pulse-dot"></div>
                            </div>
                            <div class="sync-crm">
                                <div class="sync-crm-header">
                                    <i class="fa-solid fa-database"></i>
                                    <span>Nodum CRM</span>
                                    <span class="sync-crm-badge">AI Powered</span>
                                </div>
                                <div class="sync-crm-columns">
                                    <div class="sync-crm-col" data-status="new">
                                        <div class="sync-crm-col-header">
                                            <i class="fa-solid fa-inbox"></i> Новые
                                            <span class="sync-count" id="crm-count-new">0</span>
                                        </div>
                                        <div class="sync-crm-leads" id="crm-leads-new"></div>
                                    </div>
                                    <div class="sync-crm-col" data-status="progress">
                                        <div class="sync-crm-col-header">
                                            <i class="fa-solid fa-clock"></i> В работе
                                            <span class="sync-count" id="crm-count-progress">0</span>
                                        </div>
                                        <div class="sync-crm-leads" id="crm-leads-progress"></div>
                                    </div>
                                    <div class="sync-crm-col" data-status="closed">
                                        <div class="sync-crm-col-header">
                                            <i class="fa-solid fa-check-circle"></i> Завершено
                                            <span class="sync-count" id="crm-count-closed">0</span>
                                        </div>
                                        <div class="sync-crm-leads" id="crm-leads-closed"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `
            },
            calculator: {
                title: "Бизнес-Калькулятор",
                frameClass: "iphone",
                render: () => `
                    <div class="calculator-demo">
                        <div class="calculator-header">
                            <h4>Калькулятор рейсов</h4>
                            <p>Манипулятор 5 тонн</p>
                        </div>
                        <div class="calculator-display">
                            <div class="calculator-total" id="calcTotal">0 ₽</div>
                            <div class="calculator-label">Итоговая стоимость</div>
                        </div>
                        <div class="calculator-controls">
                            <div class="calc-row">
                                <div class="calc-row-info">
                                    <span class="calc-row-label">Рейс в черте города</span>
                                    <span class="calc-row-price">5 000 ₽ / рейс</span>
                                </div>
                                <div class="calc-row-controls">
                                    <button class="calc-btn" onclick="updateCalc(-1, 5000, 'city')">−</button>
                                    <span class="calc-count" id="countCity">0</span>
                                    <button class="calc-btn" onclick="updateCalc(1, 5000, 'city')">+</button>
                                </div>
                            </div>
                            <div class="calc-row">
                                <div class="calc-row-info">
                                    <span class="calc-row-label">Рейс за город (до 20 км)</span>
                                    <span class="calc-row-price">7 000 ₽ / рейс</span>
                                </div>
                                <div class="calc-row-controls">
                                    <button class="calc-btn" onclick="updateCalc(-1, 7000, 'suburb')">−</button>
                                    <span class="calc-count" id="countSuburb">0</span>
                                    <button class="calc-btn" onclick="updateCalc(1, 7000, 'suburb')">+</button>
                                </div>
                            </div>
                            <div class="calc-row">
                                <div class="calc-row-info">
                                    <span class="calc-row-label">Погрузка/разгрузка</span>
                                    <span class="calc-row-price">1 500 ₽ / час</span>
                                </div>
                                <div class="calc-row-controls">
                                    <button class="calc-btn" onclick="updateCalc(-1, 1500, 'loading')">−</button>
                                    <span class="calc-count" id="countLoading">0</span>
                                    <button class="calc-btn" onclick="updateCalc(1, 1500, 'loading')">+</button>
                                </div>
                            </div>
                        </div>
                        <div class="calculator-actions">
                            <button class="calc-btn-primary" onclick="submitCalculator()">Заказать расчёт</button>
                            <button class="calc-btn-secondary" onclick="resetCalculator()">Сбросить</button>
                        </div>
                    </div>
                `
            }
        };

        const demo = demoData[type];
        if (!demo) return;

        frame.className = `simulator-frame ${demo.frameClass}`;
        title.innerText = demo.title;

        content.style.opacity = 0;
        setTimeout(() => {
            content.innerHTML = demo.render();
            content.style.opacity = 1;

            // Показываем toggle на мобильных для clinic_sync
            if (type === 'clinic_sync' && window.innerWidth <= 768) {
                const toggle = content.querySelector('.simulator-view-toggle');
                if (toggle) toggle.style.display = 'flex';
                const simulator = content.querySelector('.sync-simulator');
                if (simulator) simulator.classList.add('mobile-client-view');
            }

            // Инициализируем калькулятор
            if (type === 'calculator') {
                window.calcState = { city: 0, suburb: 0, loading: 0, total: 0 };
            }

            // Инициализируем ClinicSync
            if (type === 'clinic_sync' && typeof ClinicSync !== 'undefined') {
                ClinicSync.init();
            }
        }, 200);
    }

    // Toggle для симулятора (мобильный вид)
    window.toggleSimulatorView = function() {
        const toggle = document.getElementById('viewToggle');
        const simulator = document.getElementById('syncSimulator');
        const clientLabel = document.querySelector('.client-label');
        const directorLabel = document.querySelector('.director-label');

        if (!toggle || !simulator) return;

        toggle.classList.toggle('active');

        if (toggle.classList.contains('active')) {
            // Вид директора (CRM)
            simulator.classList.remove('mobile-client-view');
            simulator.classList.add('mobile-crm-view');
            if (clientLabel) clientLabel.classList.remove('active');
            if (directorLabel) directorLabel.classList.add('active');
        } else {
            // Вид клиента (Telegram)
            simulator.classList.remove('mobile-crm-view');
            simulator.classList.add('mobile-client-view');
            if (clientLabel) clientLabel.classList.add('active');
            if (directorLabel) directorLabel.classList.remove('active');
        }
    };

    // Функции калькулятора
    window.updateCalc = function(delta, price, type) {
        if (!window.calcState) window.calcState = { city: 0, suburb: 0, loading: 0, total: 0 };

        const current = window.calcState[type] || 0;
        const newValue = Math.max(0, current + delta);
        window.calcState[type] = newValue;

        // Обновляем счетчик
        const countEl = document.getElementById(`count${type.charAt(0).toUpperCase() + type.slice(1)}`);
        if (countEl) countEl.textContent = newValue;

        // Пересчитываем итог
        window.calcState.total = (window.calcState.city * 5000) +
                                  (window.calcState.suburb * 7000) +
                                  (window.calcState.loading * 1500);

        // Анимируем итог
        const totalEl = document.getElementById('calcTotal');
        if (totalEl) {
            totalEl.classList.add('updating');
            totalEl.textContent = window.calcState.total.toLocaleString('ru-RU') + ' ₽';
            setTimeout(() => totalEl.classList.remove('updating'), 300);
        }
    };

    window.resetCalculator = function() {
        window.calcState = { city: 0, suburb: 0, loading: 0, total: 0 };
        ['city', 'suburb', 'loading'].forEach(type => {
            const countEl = document.getElementById(`count${type.charAt(0).toUpperCase() + type.slice(1)}`);
            if (countEl) countEl.textContent = '0';
        });
        const totalEl = document.getElementById('calcTotal');
        if (totalEl) totalEl.textContent = '0 ₽';
    };

    window.submitCalculator = function() {
        const total = window.calcState?.total || 0;
        showNotification('Заявка отправлена', `Мы свяжемся с вами для подтверждения заказа на ${total.toLocaleString('ru-RU')} ₽`, 'success');
        showFinalCTAModal('calculator');
    };

    // Глобальная функция для показа помощи при Rage Click
    window.showHelpPrompt = function() {
        // Удаляем существующий prompt если есть
        const existing = document.querySelector('.help-prompt-overlay');
        if (existing) return; // Уже показан

        const overlay = document.createElement('div');
        overlay.className = 'help-prompt-overlay';
        overlay.innerHTML = `
            <div class="help-prompt-modal">
                <div class="help-prompt-icon"><i class="fa-solid fa-hand-holding-heart"></i></div>
                <div class="help-prompt-title">Похоже, возникли трудности?</div>
                <div class="help-prompt-text">
                    Давайте я просто пришлю вам видео-обзор этой системы или перезвоню лично
                </div>
                <div class="help-prompt-actions">
                    <button class="help-btn-video" onclick="handleHelpVideo()">
                        <i class="fa-solid fa-play"></i> Получить видео-обзор
                    </button>
                    <button class="help-btn-call" onclick="handleHelpCall()">
                        <i class="fa-solid fa-phone"></i> Заказать звонок
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Закрытие по клику на фон
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('show');
                setTimeout(() => overlay.remove(), 300);
            }
        });

        // Показываем с анимацией
        requestAnimationFrame(() => {
            overlay.classList.add('show');
        });

        // Трекаем событие
        if (window.nodumAnalytics) {
            window.nodumAnalytics.track('help_prompt_shown', { trigger: 'rage_click' });
        }
    };

    // Обработчики кнопок помощи
    window.handleHelpVideo = function() {
        const overlay = document.querySelector('.help-prompt-overlay');
        if (overlay) {
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 300);
        }
        showNotification('Видео отправлено', 'Ссылка на видео-обзор отправлена вам в Telegram/email', 'success');
        // Открываем форму с предзаполненным типом
        openTraditionalForm({ preventDefault: () => {} });
    };

    window.handleHelpCall = function() {
        const overlay = document.querySelector('.help-prompt-overlay');
        if (overlay) {
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 300);
        }
        // Открываем форму с фокусом на контакт
        openTraditionalForm({ preventDefault: () => {} });
        const contactField = document.getElementById('form-contact');
        if (contactField) {
            setTimeout(() => contactField.focus(), 100);
        }
    };

    // Глобальная функция для показа tooltip'ов в демо
    window.showDemoTooltip = function(targetElement, text, duration = 3000) {
        // Удаляем существующие tooltip'ы
        const existing = document.querySelectorAll('.demo-tooltip');
        existing.forEach(t => t.remove());

        const tooltip = document.createElement('div');
        tooltip.className = 'demo-tooltip';
        tooltip.textContent = text;
        document.body.appendChild(tooltip);

        // Позиционируем
        const rect = targetElement.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();

        let top = rect.top - tooltipRect.height - 10;
        let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);

        // Если выходит за верх, показываем снизу
        if (top < 10) {
            top = rect.bottom + 10;
            tooltip.classList.add('top');
        }

        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;

        // Показываем
        requestAnimationFrame(() => {
            tooltip.classList.add('show');
        });

        // Авто-скрытие
        setTimeout(() => {
            tooltip.classList.remove('show');
            setTimeout(() => tooltip.remove(), 300);
        }, duration);
    };

    // XSS-защита: экранирование HTML для модальных функций
    function escapeHtmlModal(text) {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Функции взаимодействия для модального симулятора
    window.askAiModal = function(question, answer) {
        const flow = document.getElementById('modal-chat-flow');
        const typing = document.getElementById('modal-typing-indicator');
        if (!flow || !typing) return;

        const userDiv = document.createElement('div');
        userDiv.className = 'msg-sim user';
        userDiv.textContent = question;
        flow.appendChild(userDiv);

        typing.style.display = 'block';

        setTimeout(() => {
            typing.style.display = 'none';
            const botDiv = document.createElement('div');
            botDiv.className = 'msg-sim bot';
            botDiv.textContent = answer;
            botDiv.innerHTML += ' <br><br><small style="opacity:0.5">Источник: регламент_2024.pdf (стр. 12)</small>';
            flow.appendChild(botDiv);
            flow.scrollTop = flow.scrollHeight;
            showFinalCTAModal('ai_agent');
        }, 1500);
    };

    window.addCrmLeadModal = function() {
        const colNew = document.getElementById('modal-col-new');
        const colProgress = document.getElementById('modal-col-progress');
        if (!colNew) return;

        const cardId = Math.floor(Math.random() * 1000);
        const card = document.createElement('div');
        card.className = 'crm-card';
        card.innerHTML = `<span class="score-badge">AI: 98%</span> <b>Лид #${cardId}</b><br><small>Запрос: Насос НД</small>`;

        colNew.appendChild(card);

        setTimeout(() => {
            card.style.transform = 'translateY(10px)';
            setTimeout(() => {
                if (colProgress) colProgress.appendChild(card);
                card.style.borderColor = '#27c93f';
                card.style.borderLeftColor = '#27c93f';

                const frameBody = card.closest('.frame-body');
                if (frameBody) {
                    const toast = document.createElement('div');
                    toast.className = 'sim-toast';
                    toast.innerHTML = '<i class="fa-solid fa-bolt"></i> AI переместил лид и отправил уведомление в TG';
                    frameBody.appendChild(toast);
                    setTimeout(() => toast.remove(), 2500);
                }

                showROIToastModal();
                showFinalCTAModal('crm');
            }, 500);
        }, 1000);
    };

    window.tgConfirmModal = function(btn) {
        btn.style.background = '#27c93f';
        btn.style.color = '#fff';
        btn.style.borderColor = '#27c93f';
        btn.innerHTML = '<i class="fa-solid fa-check"></i> ' + btn.innerText;
        setTimeout(() => {
            const successMsg = document.getElementById('modal-tg-success');
            if (successMsg) successMsg.style.display = 'block';
            showFinalCTAModal('tg_bot');
        }, 500);
    };

    // ROI Toast для модалки
    function showROIToastModal() {
        const existingToast = document.querySelector('.roi-toast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = 'roi-toast';
        toast.innerHTML = `
            <div class="roi-toast-content">
                <div class="roi-toast-icon"><i class="fa-solid fa-bolt"></i></div>
                <div class="roi-toast-text">
                    Экономия: <span class="highlight-time">15 минут</span> работы менеджера.<br>
                    <span class="highlight-ai">ИИ сделал это за 1 секунду</span>
                </div>
            </div>
        `;
        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 500);
        }, 4000);
    }

    // Final CTA для модалки
    function showFinalCTAModal(demoType) {
        const container = modal.querySelector('.modal-simulator-container');
        if (!container) return;

        const existingCTA = container.querySelector('.demo-final-cta');
        if (existingCTA) existingCTA.remove();

        const cta = document.createElement('div');
        cta.className = 'demo-final-cta';
        cta.innerHTML = `
            <button class="btn-cta-final pulse-glow" onclick="handleScenarioCTA()">
                <i class="fa-solid fa-rocket"></i>
                Хочу такое решение
            </button>
        `;
        container.appendChild(cta);

        requestAnimationFrame(() => {
            cta.classList.add('show');
        });
    }

    // Cabinet modal close on backdrop click
    const cabinetModal = document.getElementById('cabinet-modal');
    if (cabinetModal) {
        cabinetModal.addEventListener('click', e => { if (e.target === cabinetModal) closeCabinetModal(); });
    }

    // [Устаревший код демо-диалога в модалке - заменён на интерактивный симулятор]
    // Bot Chat Functionality - оставлен для совместимости если элементы существуют
    const botInput = document.getElementById('bot-message-input');
    const botSendBtn = document.getElementById('bot-send-btn');
    const botChatMessages = document.getElementById('bot-chat-messages');

    if (botInput && botSendBtn && botChatMessages) {
        function sendBotMessage() {
            const text = botInput.value.trim();
            if (!text) return;

            const userMsg = document.createElement('div');
            userMsg.className = 'user-message';
            userMsg.innerHTML = `<div class="message-content"><p>${text}</p></div>`;
            botChatMessages.appendChild(userMsg);

            botInput.value = '';
            botChatMessages.scrollTop = botChatMessages.scrollHeight;

            setTimeout(() => {
                const botMsg = document.createElement('div');
                botMsg.className = 'bot-message';
                botMsg.innerHTML = `
                    <div class="bot-avatar"><i class="fa-solid fa-robot"></i></div>
                    <div class="message-content">
                        <p>${generateBotResponse(text)}</p>
                    </div>
                `;
                botChatMessages.appendChild(botMsg);
                botChatMessages.scrollTop = botChatMessages.scrollHeight;
            }, 800 + Math.random() * 800);
        }

        function generateBotResponse(userMessage) {
            const responses = {
                'price': 'The pricing depends on your specific requirements. Contact me for a personalized quote! Starting from $299 for basic modules.',
                'cost': 'Pricing varies by complexity and features. Basic bots start at $299, advanced solutions with AI integration start at $999.',
                'features': 'This module includes automated responses, user management, analytics dashboard, and seamless integration with your existing systems.',
                'implementation': 'Implementation typically takes 2-4 weeks. We handle everything from setup to deployment and training.',
                'integration': 'Yes! I can integrate with CRM systems, payment gateways, calendars, and most popular business tools.',
                'support': '24/7 technical support included with all packages. Plus regular updates and maintenance.',
                'custom': 'Custom features can be developed based on your specific business needs. Let\'s discuss your requirements!',
                'demo': 'This is a demo interface. The actual bot would be deployed to Telegram with full functionality.',
                'how': 'The bot works through Telegram\'s API, providing a seamless experience for your users right in their favorite messenger.',
                'security': 'All data is encrypted and stored securely. We comply with GDPR and other privacy regulations.'
            };

            const lowerMessage = userMessage.toLowerCase();

            for (const [key, response] of Object.entries(responses)) {
                if (lowerMessage.includes(key)) {
                    return response;
                }
            }

            const defaultResponses = [
                'That\'s a great question! The best way to get detailed information is to schedule a consultation with me.',
                'I can help with that! Each solution is tailored to specific business needs. What industry are you in?',
                'Excellent question! This module is designed to streamline your operations. What specific features interest you most?',
                'Thanks for asking! I offer various solutions depending on your requirements. Would you like to know about pricing or implementation timeline?'
            ];

            return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
        }

        botSendBtn.addEventListener('click', sendBotMessage);
        botInput.addEventListener('keypress', e => { if (e.key === 'Enter') sendBotMessage(); });

        window.resetBotChat = function(moduleName) {
            botChatMessages.innerHTML = `
                <div class="bot-message">
                    <div class="bot-avatar"><i class="fa-solid fa-robot"></i></div>
                    <div class="message-content">
                        <p>Hi! I'm the demo bot for <strong>${moduleName}</strong>. Ask me anything about features, pricing, implementation, or how this can help your business!</p>
                    </div>
                </div>
            `;
            botInput.value = '';
        };
    }

    // 5. Scroll Анимации (Intersection Observer)
    function initScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.fade-in-up, .fade-in-top').forEach(el => observer.observe(el));

        // Анимация счетчиков статистики
        initStatCounters();
    }

    // Анимация счетчиков статистики
    function initStatCounters() {
        const statNumbers = document.querySelectorAll('.stat-number');

        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = parseInt(entry.target.getAttribute('data-target'));
                    animateCounter(entry.target, target);

                    // Добавляем класс для анимации появления
                    entry.target.closest('.stat-item').classList.add('animate');

                    counterObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        statNumbers.forEach(stat => counterObserver.observe(stat));
    }

    // Функция анимации счетчика
    function animateCounter(element, target) {
        const duration = 1500; // 1.5 секунды
        const startTime = performance.now();
        const startValue = 0;

        function updateCounter(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function - easeOutExpo
            const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

            const currentValue = Math.floor(startValue + (target - startValue) * easeProgress);
            element.textContent = currentValue;

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = target;
            }
        }

        requestAnimationFrame(updateCounter);
    }

    // Main Chat Section Functionality
    const mainChatInput = document.getElementById('main-chat-input');
    const mainChatSendBtn = document.getElementById('main-chat-send');
    const mainChatMessages = document.getElementById('main-chat-messages');
    const quickActionBtns = document.querySelectorAll('.quick-action-btn');

    // Хранение истории чата (максимум 20 сообщений)
    let chatHistory = [];
    const MAX_CHAT_HISTORY = 20;

    // Отслеживание собранной информации
    let collectedInfo = {
        field: false,
        contact: false,
        time: false
    };

    // Флаг отключения чата
    let chatDisabled = false;

    // Флаг обработки сообщения
    let isProcessing = false;

    // Rate limiting для отправки сообщений (1 сообщение в 2 секунды)
    let lastMessageTime = 0;
    const MESSAGE_RATE_LIMIT = 2000; // ms

    // Функция очистки истории чата
    function resetMainChatHistory() {
        chatHistory = [];
        // Сбрасываем отслеживание информации
        collectedInfo = {
            field: false,
            contact: false,
            time: false
        };
        chatDisabled = false;

        // Включаем обратно элементы управления
        mainChatInput.disabled = false;
        mainChatInput.placeholder = 'Введите ваше сообщение...';
        mainChatSendBtn.disabled = false;
        mainChatSendBtn.style.opacity = '1';
        mainChatSendBtn.style.cursor = 'pointer';

        quickActionBtns.forEach(btn => {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        });

        // Удаляем класс отключения
        document.querySelector('.chat-main').classList.remove('chat-disabled');
    }

    // Bot responses
    const botResponses = {
        'pricing': 'Наши цены начинаются от $500 для базовых ботов и доходят до $5000+ для сложных корпоративных решений. Точная стоимость зависит от функций, интеграций и сложности. Хотите получить подробный расчет под ваши требования?',
        'technologies': 'Мы работаем с: Python (Telebot, aiogram), Node.js, Web технологии (React, Vue), AI/ML (OpenAI, GPT), Базы данных (PostgreSQL, MongoDB), и различные платежные системы. Все решения готовы для облака с правильной DevOps настройкой.',
        'timeline': 'Сроки разработки варьируются: Простые боты (2-3 недели), Средней сложности (4-6 недель), Корпоративные решения (8-12 недель). Также предлагаем быстрое прототипирование за 1 неделю для проверки MVP.',
        'default': 'Спасибо за ваше сообщение! Я здесь, чтобы помочь вам с разработкой Telegram ботов. Вы можете спросить о ценах, технологиях, сроках или любых других вопросах о наших услугах. Чем я могу вам помочь сегодня?'
    };

    // Send message function
    async function sendMainChatMessage(message) {
        if (!message || !message.trim()) return;

        // Защита от спама - rate limiting
        const now = Date.now();
        if (now - lastMessageTime < MESSAGE_RATE_LIMIT) {
            showNotification('Подождите', 'Слишком быстро. Подождите секунду...', 'warning', 2000);
            return;
        }

        // Защита от спама - не отправляем если уже идет обработка
        if (isProcessing) {
            console.log('[chat] Message blocked: already processing');
            return;
        }

        isProcessing = true;
        lastMessageTime = now;

        // Блокируем UI во время обработки
        mainChatInput.disabled = true;
        mainChatSendBtn.disabled = true;
        mainChatSendBtn.style.opacity = '0.5';
        mainChatSendBtn.style.cursor = 'not-allowed';

        // Добавляем сообщение пользователя в историю (с ограничением размера)
        chatHistory.push({
            role: 'user',
            content: message.substring(0, 1000) // Limit message size
        });
        if (chatHistory.length > MAX_CHAT_HISTORY) {
            chatHistory = chatHistory.slice(-MAX_CHAT_HISTORY); // Keep last N messages
        }

        // Add user message
        const userMsgDiv = document.createElement('div');
        userMsgDiv.className = 'message user-message';
        userMsgDiv.innerHTML = `
            <div class="message-avatar" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                <i class="fa-solid fa-user"></i>
            </div>
            <div class="message-content">
                <p>${message}</p>
            </div>
        `;
        mainChatMessages.appendChild(userMsgDiv);

        // Clear input
        mainChatInput.value = '';

        // Scroll to bottom
        mainChatMessages.scrollTop = mainChatMessages.scrollHeight;

        // Show typing indicator
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing-indicator';
        typingDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fa-solid fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        mainChatMessages.appendChild(typingDiv);
        mainChatMessages.scrollTop = mainChatMessages.scrollHeight;

        try {
            // Вызываем llmstudo с историей сообщений
            botResponse = await llmstudo(message, undefined, chatHistory);

            // Добавляем ответ бота в историю (с ограничением размера)
            chatHistory.push({
                role: 'assistant',
                content: botResponse.substring(0, 2000) // Limit response size
            });
            if (chatHistory.length > MAX_CHAT_HISTORY) {
                chatHistory = chatHistory.slice(-MAX_CHAT_HISTORY);
            }

            // Проверяем, была ли собрана информация
            checkCollectedInfo(botResponse);

            // Remove typing indicator
            typingDiv.remove();

            // Add bot response
            const botMsgDiv = document.createElement('div');
            botMsgDiv.className = 'message bot-message';
            botMsgDiv.innerHTML = `
                <div class="message-avatar">
                    <i class="fa-solid fa-robot"></i>
                </div>
                <div class="message-content">
                    <p>${botResponse.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/\n/g, '<br>')}</p>
                </div>
            `;
            mainChatMessages.appendChild(botMsgDiv);
            mainChatMessages.scrollTop = mainChatMessages.scrollHeight;

        } catch (error) {
            console.error('Error calling LM Studio API:', error);

            // Remove typing indicator
            typingDiv.remove();

            // Fallback response
            const fallbackResponse = getBotResponse(message);
            const botMsgDiv = document.createElement('div');
            botMsgDiv.className = 'message bot-message';
            botMsgDiv.innerHTML = `
                <div class="message-avatar">
                    <i class="fa-solid fa-robot"></i>
                </div>
                <div class="message-content">
                    <p>${fallbackResponse}</p>
                    <small style="color: #6b7280; font-size: 0.85em;">*Резервный режим</small>
                </div>
            `;
            mainChatMessages.appendChild(botMsgDiv);
            mainChatMessages.scrollTop = mainChatMessages.scrollHeight;
        } finally {
            // Разблокируем UI после завершения запроса
            isProcessing = false;
            if (!chatDisabled) {
                mainChatInput.disabled = false;
                mainChatSendBtn.disabled = false;
                mainChatSendBtn.style.opacity = '1';
                mainChatSendBtn.style.cursor = 'pointer';
            }
        }
    }

    // Get bot response based on message content
    function getBotResponse(message) {
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('pricing')) {
            return botResponses.pricing;
        } else if (lowerMessage.includes('technology') || lowerMessage.includes('tech') || lowerMessage.includes('stack')) {
            return botResponses.technologies;
        } else if (lowerMessage.includes('time') || lowerMessage.includes('timeline') || lowerMessage.includes('how long')) {
            return botResponses.timeline;
        } else {
            return botResponses.default;
        }
    }

    // Event listeners
    if (mainChatSendBtn) {
        mainChatSendBtn.addEventListener('click', () => {
            sendMainChatMessage(mainChatInput.value);
        });
    }

    if (mainChatInput) {
        mainChatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMainChatMessage(mainChatInput.value);
            }
        });
    }

    // Quick action buttons
    quickActionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const message = btn.getAttribute('data-message');
            sendMainChatMessage(message);
        });
    });

    // Add manual trigger for testing (remove in production)
    window.testDisableChat = function() {
        disableChat();
    };

    // Function to check collected information
    function checkCollectedInfoImpl(botResponse) {
        if (chatDisabled) return;

        const response = botResponse.toLowerCase();

        // Отслеживаем, спросил ли бот сферу или контакт
        if (response.includes('сфер') || response.includes('бизнес') || response.includes('чем занимаетесь')) {
            collectedInfo.field = true;
        }
        if (response.includes('телефон') || response.includes('telegram') || response.includes('телеграм') || response.includes('связаться')) {
            collectedInfo.contact = true;
        }
        if (response.includes('время') || response.includes('день') || response.includes('удобнее всего') || response.includes('когда')) {
            collectedInfo.time = true;
        }
    }

    // Function to check if application is completed
    function checkForCompletionImpl(botResponse) {
        if (chatDisabled) return;

        const response = botResponse.toLowerCase();

        // Триггеры успешного завершения (слова, которые бот говорит В КОНЦЕ)
        const completionKeywords =[
            'всё записал',
            'до связи',
            'до скорого',
            'спасибо за информацию',
            'передал информацию',
            'передам специалисту',
            'рад был пообщаться'
        ];

        const isCompletion = completionKeywords.some(keyword => response.includes(keyword));

        // Отключаем чат когда бот подтвердил запись и собраны все данные (контакт, время, сфера)
        if (isCompletion && collectedInfo.contact && collectedInfo.time && collectedInfo.field) {
            setTimeout(() => {
                disableChat();
            }, 1500);
        }
    }

    // Assign to window for global access
    window.checkForCompletionImpl = checkForCompletionImpl;

    // Assign to window for global access
    window.checkCollectedInfoImpl = checkCollectedInfoImpl;
    window.sendMainChatMessageImpl = sendMainChatMessage;

    console.log('Chat disable system loaded. Use testDisableChat() to test manually.');

    // Функция отключения чата
    function disableChat() {
        chatDisabled = true;

        // Отключаем поле ввода
        mainChatInput.disabled = true;
        mainChatInput.placeholder = 'Чат завершен';

        // Отключаем кнопку отправки
        mainChatSendBtn.disabled = true;
        mainChatSendBtn.style.opacity = '0.5';
        mainChatSendBtn.style.cursor = 'not-allowed';

        // Отключаем быстрые кнопки
        quickActionBtns.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        });

        // Добавляем сообщение о завершении
        const completionMsg = document.createElement('div');
        completionMsg.className = 'message bot-message completion-message';
        completionMsg.innerHTML = `
            <div class="message-avatar">
                <i class="fa-solid fa-check-circle"></i>
            </div>
            <div class="message-content">
                <div class="completion-card">
                    <h3><i class="fa-solid fa-clipboard-check"></i> Заявка принята!</h3>
                    <p>Спасибо! Заявка передана нашей команде. Свяжемся с вами в ближайшее время, чтобы обсудить детали автоматизации вашего бизнеса.</p>
                    <div class="completion-stats">
                        <div class="stat-item">
                            <i class="fa-solid fa-briefcase"></i>
                            <span>Сфера бизнеса: ✓</span>
                        </div>
                        <div class="stat-item">
                            <i class="fa-solid fa-address-card"></i>
                            <span>Контакты: ✓</span>
                        </div>
                    </div>
                    <div class="next-steps">
                        <h4>Что дальше?</h4>
                        <ul>
                            <li>Специалист изучит вашу нишу</li>
                            <li>Подготовит концепт бота</li>
                            <li>Напишет вам для обсуждения</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
        mainChatMessages.appendChild(completionMsg);
        mainChatMessages.scrollTop = mainChatMessages.scrollHeight;

        // Добавляем класс для стилизации
        document.querySelector('.chat-main').classList.add('chat-disabled');
    }

    // Reviews Card Flip Animation
    function initReviewsFlip() {
        const cards = document.querySelectorAll('.review-card');
        const dots = document.querySelectorAll('.review-dot');
        let currentIndex = 0;
        let autoFlipInterval;
        const flipDelay = 5000; // 5 seconds between flips

        function updateCards(newIndex, direction = 'next') {
            const total = cards.length;

            cards.forEach((card, index) => {
                card.classList.remove('active', 'prev', 'next');

                if (index === newIndex) {
                    card.classList.add('active');
                } else if (direction === 'next') {
                    // When going forward, previous cards go to 'prev' position
                    card.classList.add(index < newIndex ? 'prev' : 'next');
                } else {
                    // When going backward
                    card.classList.add(index > newIndex ? 'next' : 'prev');
                }
            });

            // Update dots
            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === newIndex);
            });

            currentIndex = newIndex;
        }

        function flipNext() {
            const nextIndex = (currentIndex + 1) % cards.length;
            updateCards(nextIndex, 'next');
        }

        function flipTo(index) {
            if (index === currentIndex) return;
            const direction = index > currentIndex ? 'next' : 'prev';
            updateCards(index, direction);
            resetAutoFlip();
        }

        function startAutoFlip() {
            autoFlipInterval = setInterval(flipNext, flipDelay);
        }

        function stopAutoFlip() {
            clearInterval(autoFlipInterval);
        }

        function resetAutoFlip() {
            stopAutoFlip();
            startAutoFlip();
        }

        // Click on dots to navigate
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => flipTo(index));
        });

        // Click on cards to navigate
        cards.forEach((card) => {
            card.addEventListener('click', () => {
                const index = parseInt(card.dataset.index);
                if (index !== currentIndex) {
                    flipTo(index);
                } else {
                    // Click on active card goes to next
                    flipNext();
                    resetAutoFlip();
                }
            });
        });

        // Pause on hover
        const container = document.getElementById('reviews-container');
        if (container) {
            container.addEventListener('mouseenter', stopAutoFlip);
            container.addEventListener('mouseleave', startAutoFlip);
        }

        // Touch/Swipe support for mobile
        let touchStartX = 0;
        let touchEndX = 0;
        const minSwipeDistance = 50;

        if (container) {
            container.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
                stopAutoFlip();
            }, { passive: true });

            container.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                handleSwipe();
                startAutoFlip();
            }, { passive: true });

            // Pause auto-flip when user touches the container
            container.addEventListener('touchstart', () => {
                stopAutoFlip();
            }, { passive: true });
        }

        function handleSwipe() {
            const swipeDistance = touchEndX - touchStartX;

            if (Math.abs(swipeDistance) > minSwipeDistance) {
                if (swipeDistance > 0) {
                    // Swiped right - go to previous
                    const prevIndex = (currentIndex - 1 + cards.length) % cards.length;
                    updateCards(prevIndex, 'prev');
                } else {
                    // Swiped left - go to next
                    flipNext();
                }
                resetAutoFlip();
            }
        }

        // Start auto-flip
        startAutoFlip();
    }

    // Initialize reviews flip when DOM is ready
    initReviewsFlip();

    // ============================================
    // ПЕСОЧНИЦА РЕШЕНИЙ - ИНТЕРАКТИВНЫЙ ДЕМО-БЛОК
    // ============================================
    
    const demoData = {
        ai_agent: {
            title: "Анализ документа: Регламент_Тюмень.pdf",
            frameClass: "macbook",
            render: () => `
                <div class="ai-chat-demo">
                    <div class="chat-messages-sim" id="chat-flow">
                        <div class="msg-sim bot">Привет! Я ИИ-ассистент Nodum. Я изучил ваш регламент. Задайте любой вопрос.</div>
                    </div>
                    <div id="typing-indicator" class="typing-sim">AI ищет ответ в документе...</div>
                    <div class="chat-hints">
                        <button class="hint-btn-sim" onclick="askAi('Какая гарантия на насосы?', 'Согласно разделу 4.2, гарантийный срок составляет 24 месяца с даты ввода в эксплуатацию.')">Какая гарантия?</button>
                        <button class="hint-btn-sim" onclick="askAi('Срок поставки в Сургут?', 'В приложении №3 указано: логистика до ХМАО занимает 3-5 рабочих дней.')">Срок поставки?</button>
                    </div>
                </div>
            `
        },
        crm: {
            title: "Nodum CRM — Автоматизация отдела продаж",
            frameClass: "macbook",
            render: () => `
                <div style="height:100%">
                    <button class="hint-btn-sim" style="margin-bottom:15px; width:100%" onclick="addCrmLead()">➕ Добавить лид из Telegram</button>
                    <div class="crm-board">
                        <div class="crm-col"><h4>Новые</h4><div id="col-new"></div></div>
                        <div class="crm-col"><h4>В работе (AI)</h4><div id="col-progress"></div></div>
                    </div>
                </div>
            `
        },
        tg_bot: {
            title: "Telegram — @Nodum_Booking_Bot",
            frameClass: "iphone",
            render: () => `
                <div class="tg-webapp">
                    <div class="tg-header"><i class="fa-brands fa-telegram"></i> Nodum Service</div>
                    <div class="tg-content">
                        <div class="tg-avatar"><i class="fa-solid fa-wrench"></i></div>
                        <h3>Запись на сервис</h3>
                        <p>Выберите удобное время</p>
                        <div class="tg-slots">
                            <button class="hint-btn-sim" onclick="tgConfirm(this)">10:00</button>
                            <button class="hint-btn-sim" onclick="tgConfirm(this)">14:30</button>
                        </div>
                    </div>
                    <div id="tg-success" class="tg-success">
                        <i class="fa-solid fa-check-circle"></i> Запись подтверждена!
                    </div>
                </div>
            `
        }
    };

    // Make loadDemo available globally
    window.loadDemo = function(type, btn) {
        // Смена активной кнопки
        document.querySelectorAll('.control-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const frame = document.getElementById('device-frame');
        const content = document.getElementById('simulator-content');
        const title = document.getElementById('frame-title');

        // Смена класса фрейма (MacBook/iPhone)
        frame.className = `simulator-frame ${demoData[type].frameClass}`;
        title.innerText = demoData[type].title;
        
        // Плавная подмена контента
        content.style.opacity = 0;
        setTimeout(() => {
            content.innerHTML = demoData[type].render();
            content.style.opacity = 1;
        }, 200);
    };

    // Логика AI чата с XSS-защитой
    window.askAi = function(question, answer) {
        const flow = document.getElementById('chat-flow');
        const typing = document.getElementById('typing-indicator');

        if (!flow || !typing) return;

        // XSS-защита через textContent
        const userMsgDiv = document.createElement('div');
        userMsgDiv.className = 'msg-sim user';
        userMsgDiv.textContent = question;
        flow.appendChild(userMsgDiv);

        typing.style.display = 'block';

        setTimeout(() => {
            typing.style.display = 'none';
            const botMsgDiv = document.createElement('div');
            botMsgDiv.className = 'msg-sim bot';
            botMsgDiv.textContent = answer;
            botMsgDiv.innerHTML += ' <br><br><small style="opacity:0.5">Источник: регламент_2024.pdf (стр. 12)</small>';
            flow.appendChild(botMsgDiv);
            flow.scrollTop = flow.scrollHeight;
            // Показываем финальную CTA после AI-ответа
            showFinalCTA('ai_agent');
        }, 1500);
    };

    // Логика CRM
    window.addCrmLead = function() {
        const colNew = document.getElementById('col-new');
        const colProgress = document.getElementById('col-progress');
        if (!colNew) return;

        const cardId = Math.floor(Math.random() * 1000);

        const card = document.createElement('div');
        card.className = 'crm-card';
        card.innerHTML = `<span class="score-badge">AI: 98%</span> <b>Лид #${cardId}</b><br><small>Запрос: Насос НД</small>`;

        colNew.appendChild(card);

        setTimeout(() => {
            card.style.transform = 'translateY(10px)';
            setTimeout(() => {
                if (colProgress) colProgress.appendChild(card);
                card.style.borderColor = '#27c93f';
                card.style.borderLeftColor = '#27c93f';
                // Всплывашка
                const frameBody = card.closest('.frame-body');
                if (frameBody) {
                    const toast = document.createElement('div');
                    toast.className = 'sim-toast';
                    toast.innerHTML = '<i class="fa-solid fa-bolt"></i> AI переместил лид и отправил уведомление в TG';
                    frameBody.appendChild(toast);
                    setTimeout(() => toast.remove(), 2500);
                }
                // ROI Toast - показываем экономию времени
                showROIToast();
                // Показываем финальную CTA
                showFinalCTA('crm');
            }, 500);
        }, 1000);
    };

    // Логика TG WebApp
    window.tgConfirm = function(btn) {
        btn.style.background = '#27c93f';
        btn.style.color = '#fff';
        btn.style.borderColor = '#27c93f';
        btn.innerHTML = '<i class="fa-solid fa-check"></i> ' + btn.innerText;
        setTimeout(() => {
            const successMsg = document.getElementById('tg-success');
            if (successMsg) successMsg.style.display = 'block';
            // Показываем финальную CTA после подтверждения записи
            showFinalCTA('tg_bot');
        }, 500);
    };

    // Инициализация первого демо при загрузке
    const firstDemoBtn = document.querySelector('.control-btn');
    if (firstDemoBtn && demoData.ai_agent) {
        setTimeout(() => {
            window.loadDemo('ai_agent', firstDemoBtn);
        }, 100);
    }

    // ============================================
    // МАРКЕТИНГОВЫЕ ТРИГГЕРЫ - ROI & CTA
    // ============================================

    // Текущий активный тип демо для метаданных формы (инициализация значением по умолчанию)
    currentDemoType = currentDemoType || 'ai_agent';

    // ROI Toast - показывает экономию времени
    function showROIToast() {
        // Удаляем существующий ROI toast если есть
        const existingToast = document.querySelector('.roi-toast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = 'roi-toast';
        toast.innerHTML = `
            <div class="roi-toast-content">
                <div class="roi-toast-icon"><i class="fa-solid fa-bolt"></i></div>
                <div class="roi-toast-text">
                    Экономия: <span class="highlight-time">15 минут</span> работы менеджера.<br>
                    <span class="highlight-ai">ИИ сделал это за 1 секунду</span>
                </div>
            </div>
        `;
        document.body.appendChild(toast);

        // Анимация появления
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Авто-скрытие через 4 секунды
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 500);
        }, 4000);
    }

    // Словарь для перевода типов демо в читаемые названия
    const demoTypeLabels = {
        'ai_agent': 'AI-Агент',
        'crm': 'CRM автоматизация',
        'tg_bot': 'Telegram бот'
    };

    // Final CTA - показывает кнопку в конце сценария
    function showFinalCTA(demoType) {
        // Сохраняем текущий тип демо
        currentDemoType = demoType;

        const simulator = document.querySelector('.demo-display');
        if (!simulator) return;

        // Удаляем существующую CTA если есть
        const existingCTA = simulator.querySelector('.demo-final-cta');
        if (existingCTA) existingCTA.remove();

        const ctaContainer = document.createElement('div');
        ctaContainer.className = 'demo-final-cta';
        ctaContainer.innerHTML = `
            <button class="btn-cta-final pulse-glow" onclick="handleDemoCTA('${demoType}')">
                <i class="fa-solid fa-rocket"></i>
                Хочу такое решение для своего бизнеса
            </button>
        `;
        simulator.appendChild(ctaContainer);

        // Плавное появление
        requestAnimationFrame(() => {
            ctaContainer.classList.add('show');
        });
    }

    // Обработчик клика на CTA кнопку
    window.handleDemoCTA = function(demoType) {
        // Устанавливаем значение скрытого поля
        const demoTypeField = document.getElementById('form-demo-type');
        if (demoTypeField) {
            demoTypeField.value = demoTypeLabels[demoType] || demoType;
        }

        // Открываем форму заявки
        openTraditionalForm({ preventDefault: () => {} });
    };

    // Делаем функции доступными глобально
    window.showROIToast = showROIToast;
    window.showFinalCTA = showFinalCTA;

});
