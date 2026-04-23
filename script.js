
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
// GLOBAL FUNCTIONS FOR INLINE HANDLERS
// ============================================

// Global closeScenarioModal function
window.closeScenarioModal = function() {
    const modal = document.getElementById('bot-modal');
    if (!modal) return;

    // Очищаем симулятор
    const content = document.getElementById('modal-simulator-content');
    const frameTitle = document.getElementById('modal-frame-title');
    const frame = document.getElementById('modal-device-frame');

    if (content) content.innerHTML = '';
    if (frameTitle) frameTitle.textContent = '';
    if (frame) frame.className = 'simulator-frame macbook';

    // Очищаем features и implementation
    const featuresList = modal.querySelector('.features-list');
    const implementationText = modal.querySelector('.implementation-text');
    if (featuresList) featuresList.innerHTML = '';
    if (implementationText) implementationText.textContent = '';

    // Очищаем modal-card-content
    const modalCardContent = document.getElementById('modal-card-content');
    if (modalCardContent) modalCardContent.innerHTML = '';

    // Удаляем CTA и ROI-toast если есть
    const existingCTA = modal.querySelector('.demo-final-cta');
    const existingROI = document.querySelector('.roi-toast');
    if (existingCTA) existingCTA.remove();
    if (existingROI) existingROI.remove();

    modal.classList.remove('visible');
    setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }, 300);
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
                </div>
                <div class="card-tags">${tagsHTML}</div>
            `;

            // При клике на карточку открываем модалку
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

    async function openScenarioModal(card, demoType) {
        currentDemoType = demoType;
        currentCardTitle = card.title;

        // Заполняем заголовок и иконку
        modal.querySelector('.modal-icon i').className = card.icon;
        modal.querySelector('h2').textContent = card.title;
        modal.querySelector('.scenario-description').textContent = card.description;

        // Заполняем features
        const featuresList = modal.querySelector('.features-list');
        if (featuresList && card.features) {
            featuresList.innerHTML = card.features.map(feature => `<li>${escapeHtml(feature)}</li>`).join('');
        }

        // Заполняем implementation
        const implementationText = modal.querySelector('.implementation-text');
        if (implementationText && card.implementation) {
            implementationText.textContent = card.implementation;
        }

        // Build and insert the glass card with mermaid diagram
        const modalCardContent = document.getElementById('modal-card-content');
        if (modalCardContent && card.mermaid) {
            // Render mermaid SVG before inserting
            let mermaidSvg = '';
            if (window.mermaid) {
                try {
                    const { svg } = await window.mermaid.render('mermaid-' + Date.now(), card.mermaid);
                    mermaidSvg = svg;
                } catch (err) {
                    console.error('Mermaid render error:', err);
                    mermaidSvg = `<pre style="color: #666;">${escapeHtml(card.mermaid)}</pre>`;
                }
            }

            modalCardContent.innerHTML = `
                <div class="mermaid-container">
                    ${mermaidSvg}
                </div>
            `;

            // Apply animation to arrow paths
            setTimeout(() => {
                const svg = modalCardContent.querySelector('svg');
                console.log('SVG found:', !!svg);
                if (svg) {
                    const allPaths = svg.querySelectorAll('path');
                    console.log('Paths found:', allPaths.length);
                    allPaths.forEach((path, index) => {
                        path.style.strokeDasharray = '10, 5';
                        path.style.animation = 'flowAnimation 1s linear infinite';
                        console.log(`Applied animation to path ${index}`);
                    });
                }
            }, 300);
        }

        // Проверяем, мобильное ли устройство
        const isMobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);


        // Показываем модалку
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('visible'), 10);
        document.body.style.overflow = 'hidden';
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
        window.closeScenarioModal();
        openTraditionalForm({ preventDefault: () => {} });
    };

    // Закрытие по клику на фон и Escape
    modal.addEventListener('click', e => { if(e.target === modal) window.closeScenarioModal(); });

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

    // Cabinet modal close on backdrop click
    const cabinetModal = document.getElementById('cabinet-modal');
    if (cabinetModal) {
        cabinetModal.addEventListener('click', e => { if (e.target === cabinetModal) closeCabinetModal(); });
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


});
