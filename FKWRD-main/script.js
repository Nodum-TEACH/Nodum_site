document.addEventListener('DOMContentLoaded', () => {
    
    // Плавный скролл
    window.scrollToPortfolio = function() {
        document.getElementById('portfolio').scrollIntoView({ behavior: 'smooth' });
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
        
        cards.forEach((card, index) => {
            const cardEl = document.createElement('div');
            // Применяем классы сетки
            cardEl.className = `bento-card card-${index} fade-in-up`;
            // Задержка анимации для каскадного появления
            cardEl.style.transitionDelay = `${index * 0.1}s`;
            
            const tagsHTML = card.tags.slice(0, 3).map(tag => `<span>${tag}</span>`).join('');

            cardEl.innerHTML = `
                <div>
                    <div class="card-icon"><i class="${card.icon}"></i></div>
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
        
        // Функции
        modal.querySelector('.features ul').innerHTML = card.features.map(f => `<li>${f}</li>`).join('');
        
        // Теги и детали
        modal.querySelector('.tech-tags').innerHTML = card.tags.map(t => `<span style="background:var(--card-bg); border:1px solid var(--card-border); padding:5px 12px; border-radius:100px; font-size:0.8rem; margin-right:5px; display:inline-block; margin-bottom:5px;">${t}</span>`).join('');
        modal.querySelector('.implementation-details').textContent = card.implementation;
        
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
    }

    // 6. Минималистичный чат
    const chatBtn = document.getElementById('chat-button');
    const chatWin = document.getElementById('chat-window');
    const chatClose = document.getElementById('chat-close');
    const chatInput = document.getElementById('message-input');
    const chatSend = document.getElementById('send-button');
    const chatMsgs = document.getElementById('chat-messages');

    chatBtn.addEventListener('click', () => {
        chatWin.classList.toggle('active');
        if(chatWin.classList.contains('active')) chatInput.focus();
    });
    chatClose.addEventListener('click', () => chatWin.classList.remove('active'));

    function sendMsg() {
        const text = chatInput.value.trim();
        if(!text) return;
        
        chatMsgs.innerHTML += `<div class="message user-message"><div class="message-content"><p>${text}</p></div></div>`;
        chatInput.value = '';
        chatMsgs.scrollTop = chatMsgs.scrollHeight;
        
        setTimeout(() => {
            chatMsgs.innerHTML += `<div class="message bot-message"><div class="message-content"><p>Отличный вопрос! Чтобы я смог дать точный ответ, свяжитесь со мной через форму на сайте.</p></div></div>`;
            chatMsgs.scrollTop = chatMsgs.scrollHeight;
        }, 1000);
    }

    chatSend.addEventListener('click', sendMsg);
    chatInput.addEventListener('keypress', e => { if(e.key === 'Enter') sendMsg(); });
});