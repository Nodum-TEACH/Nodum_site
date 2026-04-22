
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

// Function to submit traditional form
async function submitTraditionalForm(event) {
    event.preventDefault();

    const field = document.getElementById('form-field').value;
    const contact = document.getElementById('form-contact').value;
    const message = document.getElementById('form-message').value;

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
                message
            })
        });

        const data = await response.json();

        if (data.success) {
            console.log('[traditional-form] Form submitted successfully:', { field, contact, message });
            
            // Close the modal
            closeTraditionalForm();

            // Reset form
            document.getElementById('traditional-form').reset();
        } else {
            console.error('[traditional-form] Error submitting form:', data.error);
            alert('Ошибка отправки');
        }
    } catch (error) {
        console.error('[traditional-form] Network error:', error);
        alert('Ошибка соединения');
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

    // 2. Магнитные кнопки
    const magneticButtons = document.querySelectorAll('.btn-magnetic');
    magneticButtons.forEach(btn => {
        btn.addEventListener('mousemove', function(e) {
            const position = btn.getBoundingClientRect();
            const x = e.pageX - position.left - position.width / 2;
            const y = e.pageY - position.top - position.height / 2;

            btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
            const span = btn.querySelector('span');
            if(span) span.style.transform = `translate(${x * 0.05}px, ${y * 0.05}px)`;
        });

        btn.addEventListener('mouseout', function() {
            btn.style.transform = 'translate(0px, 0px)';
            const span = btn.querySelector('span');
            if(span) span.style.transform = 'translate(0px, 0px)';
        });
    });

    // 3. Загрузка данных и рендер Bento
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            renderCards(data);
            initScrollAnimations();
        })
        .catch(err => console.error('Ошибка:', err));

    function renderCards(cards) {
        const container = document.getElementById('bento-container');

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

            const tagsHTML = card.tags.slice(0, 3).map(tag => `<span>${tag}</span>`).join('');

            cardEl.innerHTML = `
                <div>
                    <div class="card-icon-row">
                        <div class="card-icon"><i class="${card.icon}"></i></div>
                        ${tariffBadge}
                    </div>
                    <h3>${card.title}</h3>
                    <p>${card.description}</p>
                </div>
                <div class="card-tags">${tagsHTML}</div>
            `;

            cardEl.addEventListener('click', () => openModal(card));
            container.appendChild(cardEl);
        });
    }

    // 4. Модальное окно (логика)
    const modal = document.getElementById('bot-modal');

    function openModal(card) {
        modal.querySelector('.modal-icon i').className = card.icon;
        modal.querySelector('h2').textContent = card.title;
        modal.querySelector('.description').textContent = card.description;

        // Галерея
        const gallery = modal.querySelector('.image-gallery');
        gallery.innerHTML = card.images ? card.images.map(img => `
            <div class="gallery-item"><img src="${img}" alt="Preview" loading="lazy"></div>
        `).join('') : '<p style="color:var(--text-muted)">Нет скриншотов</p>';

        // Что получает бизнес
        modal.querySelector('.features ul').innerHTML = card.features.map(f => `<li>${f}</li>`).join('');

        // Как это работает
        modal.querySelector('.implementation-details').textContent = card.implementation;

        // Reset bot chat
        resetBotChat(card.title);

        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('visible'), 10);
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.classList.remove('visible');
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }, 300);
    }

    modal.querySelector('.close-modal').addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if(e.target === modal) closeModal(); });
    document.addEventListener('keydown', e => { if(e.key === 'Escape') closeModal(); });

    // Cabinet modal close on backdrop click
    const cabinetModal = document.getElementById('cabinet-modal');
    if (cabinetModal) {
        cabinetModal.addEventListener('click', e => { if (e.target === cabinetModal) closeCabinetModal(); });
    }

    // Bot Chat Functionality
    const botInput = document.getElementById('bot-message-input');
    const botSendBtn = document.getElementById('bot-send-btn');
    const botChatMessages = document.getElementById('bot-chat-messages');

    function sendBotMessage() {
        const text = botInput.value.trim();
        if (!text) return;

        // Add user message
        const userMsg = document.createElement('div');
        userMsg.className = 'user-message';
        userMsg.innerHTML = `<div class="message-content"><p>${text}</p></div>`;
        botChatMessages.appendChild(userMsg);

        botInput.value = '';
        botChatMessages.scrollTop = botChatMessages.scrollHeight;

        // Simulate bot response
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

        // Default responses
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

    function resetBotChat(moduleName) {
        botChatMessages.innerHTML = `
            <div class="bot-message">
                <div class="bot-avatar"><i class="fa-solid fa-robot"></i></div>
                <div class="message-content">
                    <p>Hi! I'm the demo bot for <strong>${moduleName}</strong>. Ask me anything about features, pricing, implementation, or how this can help your business!</p>
                </div>
            </div>
        `;
        botInput.value = '';
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

    // Хранение истории чата
    let chatHistory = [];

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

        // Защита от спама - не отправляем если уже идет обработка
        if (isProcessing) {
            console.log('[chat] Message blocked: already processing');
            return;
        }

        isProcessing = true;

        // Блокируем UI во время обработки
        mainChatInput.disabled = true;
        mainChatSendBtn.disabled = true;
        mainChatSendBtn.style.opacity = '0.5';
        mainChatSendBtn.style.cursor = 'not-allowed';

        // Добавляем сообщение пользователя в историю
        chatHistory.push({
            role: 'user',
            content: message
        });

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

            // Добавляем ответ бота в историю
            chatHistory.push({
                role: 'assistant',
                content: botResponse
            });

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
