// ========================================
// RAG AGENT SIMULATOR
// ========================================
const RAGAgent = {
    questions: [
        { text: "Какая гарантия на насосы?", targetPara: 1, answer: "Согласно разделу о гарантийных обязательствах, гарантийный срок составляет 24 месяца с даты ввода в эксплуатацию." },
        { text: "Срок поставки в Сургут?", targetPara: 2, answer: "Согласно условиям поставки, логистика до ХМАО занимает 3-5 рабочих дней." },
        { text: "Характеристики насоса?", targetPara: 3, answer: "Мощность насоса: 15 кВт. Производительность: до 120 м³/час." },
        { text: "Как часто ТО?", targetPara: 4, answer: "Плановое техническое обслуживание проводится каждые 6 месяцев. Выезд специалиста бесплатный." }
    ],

    isScanning: false,

    askQuestion(idx) {
        if (this.isScanning) return;
        this.isScanning = true;

        const q = this.questions[idx];
        const chatFlow = document.getElementById('rag-chat-flow');
        const typing = document.getElementById('rag-typing');
        const status = document.getElementById('rag-status');
        const scanner = document.getElementById('rag-scanner');

        // Добавляем вопрос пользователя
        const userMsg = document.createElement('div');
        userMsg.className = 'rag-message rag-user';
        userMsg.innerHTML = `<div class="rag-msg-content">${q.text}</div>`;
        chatFlow.appendChild(userMsg);
        chatFlow.scrollTop = chatFlow.scrollHeight;

        // Показываем typing и меняем статус
        typing.style.display = 'flex';
        status.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i> AI сканирует документ...';
        status.classList.add('scanning');

        // Анимируем сканер к целевому параграфу
        const targetPara = document.getElementById(`para-${q.targetPara}`);
        if (scanner && targetPara) {
            scanner.style.display = 'block';
            const docRect = document.getElementById('rag-doc-content').getBoundingClientRect();
            const paraRect = targetPara.getBoundingClientRect();
            const relativeTop = paraRect.top - docRect.top + document.getElementById('rag-doc-content').scrollTop;

            scanner.style.top = `${relativeTop}px`;
            scanner.classList.add('active');

            // Подсвечиваем параграф
            setTimeout(() => {
                targetPara.classList.add('highlighted');
            }, 600);
        }

        // Ответ через 2 секунды (после сканирования)
        setTimeout(() => {
            typing.style.display = 'none';
            status.innerHTML = '<i class="fa-solid fa-check-circle"></i> Ответ найден';
            status.classList.remove('scanning');

            // Добавляем ответ бота
            const botMsg = document.createElement('div');
            botMsg.className = 'rag-message rag-bot';
            botMsg.innerHTML = `
                <div class="rag-msg-content">${q.answer}</div>
                <div class="rag-msg-source">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i>
                    Источник: Регламент_Поставки_2024.pdf, стр. ${q.targetPara}
                </div>
            `;
            chatFlow.appendChild(botMsg);
            chatFlow.scrollTop = chatFlow.scrollHeight;

            // Убираем подсветку через 3 секунды
            setTimeout(() => {
                targetPara?.classList.remove('highlighted');
                scanner?.classList.remove('active');
                this.isScanning = false;
            }, 3000);
        }, 2000);
    }
};

// Автоматически показываем первый вопрос с задержкой
setTimeout(() => {
    const firstBtn = document.querySelector('.rag-hint-btn[data-idx="0"]');
    if (firstBtn) firstBtn.classList.add('pulse-hint');
}, 2000);
