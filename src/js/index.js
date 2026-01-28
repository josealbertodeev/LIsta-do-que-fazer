// ============================================
// SISTEMA DE SONS E NOTIFICAÇÕES
// ============================================
class SoundSystem {
    constructor() {
        this.audioContext = null;
        this.enabled = localStorage.getItem('soundEnabled') !== 'false';
        this.volume = parseFloat(localStorage.getItem('soundVolume')) || 0.3;
    }

    initAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this.audioContext;
    }

    playTone(frequency, duration, type = 'sine') {
        if (!this.enabled) return;

        const ctx = this.initAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = type;
        oscillator.frequency.value = frequency;

        gainNode.gain.setValueAtTime(this.volume, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + duration);
    }

    // Som de sucesso (conquista, tarefa completada)
    playSuccess() {
        this.playTone(523.25, 0.1); // C5
        setTimeout(() => this.playTone(659.25, 0.1), 100); // E5
        setTimeout(() => this.playTone(783.99, 0.2), 200); // G5
    }

    // Som de nível (level up)
    playLevelUp() {
        this.playTone(392, 0.1); // G4
        setTimeout(() => this.playTone(523.25, 0.1), 100); // C5
        setTimeout(() => this.playTone(659.25, 0.1), 200); // E5
        setTimeout(() => this.playTone(783.99, 0.3), 300); // G5
    }

    // Som de conquista desbloqueada
    playAchievement() {
        this.playTone(523.25, 0.15); // C5
        setTimeout(() => this.playTone(659.25, 0.15), 150); // E5
        setTimeout(() => this.playTone(783.99, 0.15), 300); // G5
        setTimeout(() => this.playTone(1046.50, 0.3), 450); // C6
    }

    // Som de erro/aviso
    playWarning() {
        this.playTone(220, 0.2); // A3
        setTimeout(() => this.playTone(196, 0.3), 200); // G3
    }

    // Som de notificação suave
    playNotification() {
        this.playTone(523.25, 0.15); // C5
        setTimeout(() => this.playTone(659.25, 0.15), 150); // E5
    }

    // Som de desafio completado
    playChallengeComplete() {
        this.playTone(440, 0.1); // A4
        setTimeout(() => this.playTone(554.37, 0.1), 100); // C#5
        setTimeout(() => this.playTone(659.25, 0.1), 200); // E5
        setTimeout(() => this.playTone(880, 0.3), 300); // A5
    }

    // Som de meta completada
    playGoalComplete() {
        this.playTone(392, 0.1); // G4
        setTimeout(() => this.playTone(493.88, 0.1), 100); // B4
        setTimeout(() => this.playTone(587.33, 0.1), 200); // D5
        setTimeout(() => this.playTone(783.99, 0.1), 300); // G5
        setTimeout(() => this.playTone(987.77, 0.3), 400); // B5
    }

    // Som do Pomodoro finalizado
    playPomodoroComplete() {
        this.playTone(523.25, 0.2); // C5
        setTimeout(() => this.playTone(523.25, 0.2), 250); // C5
        setTimeout(() => this.playTone(523.25, 0.4), 500); // C5
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        localStorage.setItem('soundEnabled', enabled);
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        localStorage.setItem('soundVolume', this.volume);
    }

    toggle() {
        this.enabled = !this.enabled;
        localStorage.setItem('soundEnabled', this.enabled);
        return this.enabled;
    }
}

// ============================================
// CLASSE DO CRONÔMETRO POMODORO
// ============================================
class PomodoroTimer {
    constructor() {
        // Tempos em segundos
        this.focusTime = 25 * 60; // 25 minutos de foco
        this.breakTime = 5 * 60;  // 5 minutos de pausa

        this.timeLeft = this.focusTime; // Tempo restante
        this.interval = null;
        this.isRunning = false;
        this.isFocusMode = true; // Se está em modo foco ou pausa
        this.originalTitle = document.title; // Guarda o título original

        // Contadores de tempo acumulado (em minutos)
        this.totalFocusMinutes = parseInt(localStorage.getItem('pomodoroTotalFocus')) || 0;
        this.totalBreakMinutes = parseInt(localStorage.getItem('pomodoroTotalBreak')) || 0;

        // Pega os elementos do HTML
        this.display = document.getElementById('pomodoroTimer');
        this.statusDisplay = document.getElementById('pomodoroStatus');
        this.startBtn = document.getElementById('pomodoroStart');
        this.pauseBtn = document.getElementById('pomodoroPause');
        this.resetBtn = document.getElementById('pomodoroReset');
        this.totalFocusDisplay = document.getElementById('totalFocusTime');
        this.totalBreakDisplay = document.getElementById('totalBreakTime');
        this.resetStatsBtn = document.getElementById('resetStatsBtn');

        // Configura os botões
        this.startBtn.addEventListener('click', () => {
            this.setActiveButton('start');
            this.start();
        });
        this.pauseBtn.addEventListener('click', () => {
            this.setActiveButton('pause');
            this.pause();
        });
        this.resetBtn.addEventListener('click', () => {
            this.setActiveButton('reset');
            this.reset();
        });

        if (this.resetStatsBtn) {
            this.resetStatsBtn.addEventListener('click', () => this.resetStats());
        }

        // Pede permissão para notificações
        this.requestNotificationPermission();

        this.updateDisplay();
        this.updateStatsDisplay();
    }

    // Pede permissão para mostrar notificações
    requestNotificationPermission() {
        if ("Notification" in window) {
            if (Notification.permission === "default") {
                Notification.requestPermission();
            }
        }
    }

    // Define qual botão está ativo
    setActiveButton(buttonType) {
        // Verifica se os elementos existem
        if (!this.startBtn || !this.pauseBtn || !this.resetBtn) {
            console.error('Elementos dos botões não encontrados');
            return;
        }

        // Remove active de todos os botões
        this.startBtn.classList.remove('active');
        this.pauseBtn.classList.remove('active');
        this.resetBtn.classList.remove('active');

        // Adiciona active no botão clicado
        switch (buttonType) {
            case 'start':
                this.startBtn.classList.add('active');
                break;
            case 'pause':
                this.pauseBtn.classList.add('active');
                break;
            case 'reset':
                this.resetBtn.classList.add('active');
                break;
        }

        // Remove o active após 200ms para simular o clique
        setTimeout(() => {
            this.startBtn.classList.remove('active');
            this.pauseBtn.classList.remove('active');
            this.resetBtn.classList.remove('active');
        }, 200);
    }

    // Mostra uma notificação no navegador
    showNotification(title, message) {
        if ("Notification" in window && Notification.permission === "granted") {
            const notification = new Notification(title, {
                body: message,
                icon: '⏱️',
                badge: '⏱️'
            });

            // Fecha a notificação depois de 5 segundos
            setTimeout(() => notification.close(), 5000);
        }
    }

    // Formata os segundos para MM:SS
    formatTime(totalSeconds) {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    // Atualiza o título da aba do navegador
    updateTabTitle() {
        if (this.isRunning) {
            const timeStr = this.formatTime(this.timeLeft);
            const mode = this.isFocusMode ? '🎯' : '☕';
            document.title = `${mode} ${timeStr} - Minhas Tarefas`;
        } else {
            document.title = this.originalTitle;
        }
    }

    // Atualiza o display e o status
    updateDisplay() {
        this.display.textContent = this.formatTime(this.timeLeft);

        if (this.isFocusMode) {
            this.statusDisplay.textContent = '🎯 Modo Foco - 25 minutos';
        } else {
            this.statusDisplay.textContent = '☕ Modo Pausa - 5 minutos';
        }

        // Atualiza o título da aba
        this.updateTabTitle();
    }

    // Atualiza o display das estatísticas
    updateStatsDisplay() {
        if (this.totalFocusDisplay) {
            const hours = Math.floor(this.totalFocusMinutes / 60);
            const mins = this.totalFocusMinutes % 60;

            if (hours > 0) {
                this.totalFocusDisplay.textContent = `${hours}h ${mins}min`;
            } else {
                this.totalFocusDisplay.textContent = `${mins} min`;
            }
        }

        if (this.totalBreakDisplay) {
            const hours = Math.floor(this.totalBreakMinutes / 60);
            const mins = this.totalBreakMinutes % 60;

            if (hours > 0) {
                this.totalBreakDisplay.textContent = `${hours}h ${mins}min`;
            } else {
                this.totalBreakDisplay.textContent = `${mins} min`;
            }
        }
    }

    // Anima a atualização de uma estatística
    animateStat(element) {
        if (element) {
            element.classList.add('updated');
            setTimeout(() => {
                element.classList.remove('updated');
            }, 600);
        }
    }

    // Inicia o cronômetro
    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        // A cada 1 segundo, diminui 1 segundo
        this.interval = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();

            // Quando chegar a zero
            if (this.timeLeft === 0) {
                this.playSound(); // Toca um som (simulado)
                this.switchMode(); // Troca de modo
            }
        }, 1000);
    }

    // Pausa o cronômetro
    pause() {
        this.isRunning = false;
        clearInterval(this.interval);
        this.updateTabTitle(); // Restaura o título original
    }

    // Zera o cronômetro
    reset() {
        this.pause();
        this.isFocusMode = true;
        this.timeLeft = this.focusTime;
        this.updateDisplay();
    }

    // Reseta as estatísticas de tempo acumulado
    resetStats() {
        this.showConfirmResetModal();
    }

    // Modal de confirmação para resetar estatísticas
    showConfirmResetModal() {
        const modal = document.getElementById('confirmDeleteModal');
        const modalTitle = document.getElementById('confirmDeleteTitle');
        const modalMessage = document.getElementById('confirmDeleteMessage');
        const cancelBtn = document.getElementById('confirmDeleteCancel');
        const confirmBtn = document.getElementById('confirmDeleteConfirm');

        modalTitle.textContent = 'Resetar Estatísticas do Pomodoro';
        modalMessage.textContent = 'Tem certeza que deseja resetar todas as estatísticas de tempo acumulado?';

        modal.style.display = 'flex';

        // Remove event listeners antigos
        const newCancelBtn = cancelBtn.cloneNode(true);
        const newConfirmBtn = confirmBtn.cloneNode(true);
        cancelBtn.replaceWith(newCancelBtn);
        confirmBtn.replaceWith(newConfirmBtn);

        // Adiciona novos event listeners
        newCancelBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        newConfirmBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            this.totalFocusMinutes = 0;
            this.totalBreakMinutes = 0;
            localStorage.setItem('pomodoroTotalFocus', 0);
            localStorage.setItem('pomodoroTotalBreak', 0);
            this.updateStatsDisplay();
        });

        // Fecha ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    // Troca entre modo foco e pausa
    switchMode() {
        this.pause();

        // Incrementa o contador do modo que acabou de completar
        if (this.isFocusMode) {
            // Acabou de completar um período de foco
            this.totalFocusMinutes += 25;
            localStorage.setItem('pomodoroTotalFocus', this.totalFocusMinutes);
            this.animateStat(this.totalFocusDisplay);
        } else {
            // Acabou de completar um período de descanso
            this.totalBreakMinutes += 5;
            localStorage.setItem('pomodoroTotalBreak', this.totalBreakMinutes);
            this.animateStat(this.totalBreakDisplay);
        }

        // Atualiza o display das estatísticas
        this.updateStatsDisplay();

        this.isFocusMode = !this.isFocusMode;
        this.timeLeft = this.isFocusMode ? this.focusTime : this.breakTime;
        this.updateDisplay();

        // Mostra notificação estilo novo (igual às de tarefas)
        if (this.isFocusMode) {
            this.showPomodoroNotification('Hora de focar novamente!', 'focus');
        } else {
            this.showPomodoroNotification('Hora de descansar! Você merece!', 'break');
        }
    }

    // Nova notificação no estilo das tarefas
    showPomodoroNotification(message, type) {
        // Tocar som do Pomodoro completado
        if (window.soundSystem) {
            window.soundSystem.playPomodoroComplete();
        }

        // Cria o overlay de fundo
        const overlay = document.createElement('div');
        overlay.className = 'notification-overlay';
        document.body.appendChild(overlay);

        // Cria a notificação
        const notification = document.createElement('div');
        notification.className = `notification-toast pomodoro-${type}`;

        // Define o conteúdo baseado no tipo
        let title = '';
        let icon = '';

        if (type === 'focus') {
            title = 'Foco! 🎯';
            icon = '🎯';
        } else if (type === 'break') {
            title = 'Pausa! ☕';
            icon = '☕';
        }

        notification.innerHTML = `
            <div class="notification-icon-wrapper">
                <div class="notification-icon-bg">
                    <span class="notification-emoji">${icon}</span>
                </div>
            </div>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
        `;

        document.body.appendChild(notification);

        // Cria partículas de pomodoro
        this.createPomodoroParticles(type);

        // Remove após 3 segundos
        setTimeout(() => {
            notification.remove();
            overlay.remove();
        }, 3000);
    }

    // Cria partículas para o pomodoro
    createPomodoroParticles(type) {
        const particles = type === 'focus' ? ['🎯', '⚡', '💪', '🔥'] : ['☕', '😌', '🌸', '💤'];
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        for (let i = 0; i < 10; i++) {
            const particle = document.createElement('div');
            particle.className = 'celebration-particle';
            particle.textContent = particles[Math.floor(Math.random() * particles.length)];

            const angle = (Math.PI * 2 * i) / 10;
            const radius = 90;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;

            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.animationDelay = (i * 0.05) + 's';

            document.body.appendChild(particle);

            setTimeout(() => particle.remove(), 1500);
        }
    }

    // Simula um som de alerta
    playSound() {
        console.log('🔔 Tempo finalizado!');
    }
}

// ============================================
// CLASSE DA LISTA DE TAREFAS (já existente)
// ============================================
class TodoApp {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.taskIdCounter = parseInt(localStorage.getItem('taskIdCounter')) || 1;
        this.editingTaskId = null; // ID da tarefa sendo editada

        // Definição de categorias com cores
        this.categories = {
            trabalho: { name: 'Trabalho', color: '#3b82f6', icon: '💼' },
            estudo: { name: 'Estudo', color: '#8b5cf6', icon: '📚' },
            pessoal: { name: 'Pessoal', color: '#10b981', icon: '🏠' },
            saude: { name: 'Saúde', color: '#ef4444', icon: '❤️' },
            compras: { name: 'Compras', color: '#f59e0b', icon: '🛒' },
            outros: { name: 'Outros', color: '#6b7280', icon: '📌' }
        };

        this.taskInput = document.getElementById('taskInput');
        this.priorityCheckbox = document.getElementById('priorityCheckbox');
        this.addBtn = document.getElementById('addBtn');
        this.pendingTasks = document.getElementById('pendingTasks');
        this.completedTasks = document.getElementById('completedTasks');
        this.currentDate = document.getElementById('currentDate');

        // Elementos do modal
        this.editModal = document.getElementById('editModal');
        this.modalInput = document.getElementById('modalInput');
        this.modalClose = document.getElementById('modalClose');
        this.modalCancel = document.getElementById('modalCancel');
        this.modalSave = document.getElementById('modalSave');

        // Elementos de tema e progresso
        this.themeToggle = document.getElementById('themeToggle');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.progressDetails = document.getElementById('progressDetails');
        this.totalEstimatedTime = document.getElementById('totalEstimatedTime');
        this.productivityScore = document.getElementById('productivityScore');

        // Sistema de debounce para otimização
        this.progressUpdateTimeout = null;
        this.lastProgressUpdate = 0;
        this.weatherDisplay = document.getElementById('weatherDisplay');
        this.motivationalQuote = document.getElementById('motivationalQuote');
        this.bibleVerse = document.getElementById('bibleVerse');
        this.greeting = document.getElementById('greeting');

        // Sistema de timers para tarefas
        this.taskTimers = {};
        this.timerIntervals = {};

        // Botões de apagar todas as tarefas
        this.clearPendingBtn = document.getElementById('clearPendingBtn');
        this.clearCompletedBtn = document.getElementById('clearCompletedBtn');

        this.initEventListeners();
        this.displayGreeting();
        this.displayCurrentDate();
        this.displayMotivationalQuote();
        this.displayBibleVerse();
        this.loadTheme();
        this.requestNotificationPermission();
        this.getWeather();
        this.renderTasks();
    }

    // Formata o tempo em MM:SS
    formatTimer(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // Inicia ou pausa o timer de uma tarefa
    toggleTimer(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task || !task.timeEstimate) return;

        if (task.timerRunning) {
            // Pausar
            this.pauseTimer(taskId);
        } else {
            // Iniciar
            this.startTimer(taskId);
        }
    }

    // Inicia o timer
    startTimer(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        // Inicializa o tempo restante se ainda não existe
        if (!task.timeRemaining) {
            task.timeRemaining = task.timeEstimate * 60; // Converte minutos para segundos
        }

        task.timerRunning = true;
        task.notified5min = false; // Reset da notificação de 5 minutos
        this.saveToStorage();
        this.renderTasks();

        // Cria o intervalo
        this.timerIntervals[taskId] = setInterval(() => {
            this.updateTimer(taskId);
        }, 1000);
    }

    // Pausa o timer
    pauseTimer(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        task.timerRunning = false;
        this.saveToStorage();
        this.renderTasks();

        // Limpa o intervalo
        if (this.timerIntervals[taskId]) {
            clearInterval(this.timerIntervals[taskId]);
            delete this.timerIntervals[taskId];
        }
    }

    // Atualiza o timer a cada segundo
    updateTimer(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task || !task.timerRunning) {
            this.pauseTimer(taskId);
            return;
        }

        task.timeRemaining--;
        this.saveToStorage();

        // Atualiza o display do tempo
        const timeDisplay = document.getElementById(`time-display-${taskId}`);
        if (timeDisplay) {
            timeDisplay.textContent = `⏱️ ${this.formatTimer(task.timeRemaining)}`;
        }

        // Notificação quando faltam 5 minutos
        if (task.timeRemaining === 300 && !task.notified5min) {
            task.notified5min = true;
            this.showTimerNotification(task, '5 minutos restantes!', 'warning');
        }

        // Timer acabou
        if (task.timeRemaining <= 0) {
            this.pauseTimer(taskId);
            this.showTimerEndModal(task);
        }
    }

    // Mostra notificação de timer
    showTimerNotification(task, message, type) {
        const overlay = document.createElement('div');
        overlay.className = 'notification-overlay';
        document.body.appendChild(overlay);

        const notification = document.createElement('div');
        notification.className = `notification-toast timer-${type}`;

        notification.innerHTML = `
            <div class="notification-icon-wrapper">
                <div class="notification-icon-bg" style="background: linear-gradient(135deg, ${type === 'warning' ? '#f59e0b, #d97706' : '#ef4444, #dc2626'});">
                    <span class="notification-emoji">${type === 'warning' ? '⏰' : '⏱️'}</span>
                </div>
            </div>
            <div class="notification-content">
                <div class="notification-title">${message}</div>
                <div class="notification-message">${task.text}</div>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
            overlay.remove();
        }, 3000);
    }

    // Modal quando o tempo acaba
    showTimerEndModal(task) {
        const overlay = document.createElement('div');
        overlay.className = 'notification-overlay';
        document.body.appendChild(overlay);

        const modal = document.createElement('div');
        modal.className = 'notification-toast timer-end-modal';

        modal.innerHTML = `
            <div class="notification-icon-wrapper">
                <div class="notification-icon-bg" style="background: linear-gradient(135deg, #ef4444, #dc2626);">
                    <span class="notification-emoji">⏱️</span>
                </div>
            </div>
            <div class="notification-content">
                <div class="notification-title">Tempo Esgotado!</div>
                <div class="notification-message">${task.text}</div>
                <div class="timer-end-actions">
                    <button class="timer-action-btn complete" onclick="todoApp.completeTaskFromTimer(${task.id})">✓</button>
                    <button class="timer-action-btn extend" onclick="todoApp.extendTimer(${task.id}, 5)">+5 min</button>
                    <button class="timer-action-btn extend" onclick="todoApp.extendTimer(${task.id}, 10)">+10 min</button>
                    <button class="timer-action-btn cancel" onclick="todoApp.cancelTimerModal()">✕</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Som de alerta
        this.playTimerEndSound();

        // Armazena referência para poder fechar depois
        this.currentTimerModal = { modal, overlay };
    }

    // Conclui a tarefa a partir do modal
    completeTaskFromTimer(taskId) {
        this.toggleTask(taskId);
        this.cancelTimerModal();
    }

    // Estende o tempo do timer
    extendTimer(taskId, minutes) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        task.timeRemaining = minutes * 60;
        task.timeEstimate += minutes;
        this.saveToStorage();
        this.cancelTimerModal();
        this.startTimer(taskId);
    }

    // Cancela o modal
    cancelTimerModal() {
        if (this.currentTimerModal) {
            this.currentTimerModal.modal.remove();
            this.currentTimerModal.overlay.remove();
            this.currentTimerModal = null;
        }
    }

    // Som de alerta do timer
    playTimerEndSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Toca 3 beeps
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.value = 800;
                oscillator.type = 'sine';

                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
            }, i * 400);
        }
    }

    displayGreeting() {
        const now = new Date();
        const hour = now.getHours();

        let greetingText = '';
        let emoji = '';

        if (hour >= 5 && hour < 12) {
            greetingText = 'Bom dia! ☀️ Que seu dia seja produtivo!';
            emoji = '🌅';
        } else if (hour >= 12 && hour < 18) {
            greetingText = 'Boa tarde! 🌞 Continue firme nas suas tarefas!';
            emoji = '☀️';
        } else {
            greetingText = 'Boa noite! 🌙 Hora de organizar o amanhã!';
            emoji = '🌙';
        }

        const greetingEmoji = this.greeting.querySelector('.greeting-emoji');
        const greetingTextElement = this.greeting.querySelector('.greeting-text');

        if (greetingEmoji) greetingEmoji.textContent = emoji;
        if (greetingTextElement) greetingTextElement.textContent = greetingText;
    }

    displayCurrentDate() {
        const now = new Date();
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };

        const dateStr = now.toLocaleDateString('pt-BR', options);
        this.currentDate.textContent = dateStr;
    }

    displayMotivationalQuote() {
        const quotes = [
            "A persistência é o caminho do êxito. 💪",
            "Pequenos passos todos os dias levam a grandes conquistas. 🚀",
            "Acredite em você e tudo será possível. ✨",
            "O sucesso é a soma de pequenos esforços repetidos dia após dia. 🌟",
            "Não espere por oportunidades, crie-as! 🎯",
            "Hoje é um ótimo dia para começar algo novo. 🌅",
            "Você é mais forte do que pensa. 💎",
            "O único lugar onde o sucesso vem antes do trabalho é no dicionário. 📚",
            "Grandes coisas nunca vêm de zonas de conforto. 🔥",
            "A disciplina é a ponte entre metas e conquistas. 🌉",
            "Foque no progresso, não na perfeição. 📈",
            "Cada dia é uma nova chance de melhorar. 🌈",
            "Transforme seus sonhos em planos e seus planos em realidade. 🎨",
            "O momento perfeito é agora. ⏰",
            "Seja a mudança que você quer ver no mundo. 🌍",
            "A jornada de mil milhas começa com um único passo. 👣",
            "Desafios são oportunidades disfarçadas. 🎭",
            "Você não precisa ser perfeito para começar. 🌱",
            "O fracasso é apenas um degrau para o sucesso. 🪜",
            "Sua única limitação é você mesmo. 🦅",
            "Faça hoje o que outros não querem, e amanhã terá o que outros não têm. 💫",
            "Sucesso é fazer o extraordinário de forma extraordinária. 👑",
            "Não conte os dias, faça os dias contarem. 📅",
            "A motivação te faz começar, o hábito te faz continuar. 🔄",
            "Seja grato pelo que você tem enquanto trabalha pelo que deseja. 🙏",
            "Comece de onde você está, use o que você tem, faça o que você pode. 🛠️",
            "O melhor momento para plantar uma árvore foi há 20 anos. O segundo melhor momento é agora. 🌳",
            "Você é capaz de coisas incríveis! 🌠",
            "A determinação de hoje é o sucesso de amanhã. 🏆",
            "Nunca desista de um sonho por causa do tempo. ⌛"
        ];

        // Usar o dia do ano para garantir que a mesma frase apareça o dia todo
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 0);
        const diff = now - startOfYear;
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);

        const quoteIndex = dayOfYear % quotes.length;
        const todayQuote = quotes[quoteIndex];

        const quoteText = this.motivationalQuote.querySelector('.quote-text');
        if (quoteText) {
            quoteText.textContent = todayQuote;
        }
    }

    displayBibleVerse() {
        const verses = [
            { text: "Tudo posso naquele que me fortalece.", ref: "Filipenses 4:13" },
            { text: "O Senhor é o meu pastor, nada me faltará.", ref: "Salmos 23:1" },
            { text: "Confie no Senhor de todo o seu coração e não se apoie em seu próprio entendimento.", ref: "Provérbios 3:5" },
            { text: "Porque para Deus nada é impossível.", ref: "Lucas 1:37" },
            { text: "O Senhor é a minha luz e a minha salvação; de quem terei temor?", ref: "Salmos 27:1" },
            { text: "Alegrem-se sempre no Senhor. Novamente direi: alegrem-se!", ref: "Filipenses 4:4" },
            { text: "Entregue o seu caminho ao Senhor; confie nele, e ele agirá.", ref: "Salmos 37:5" },
            { text: "Venham a mim, todos os que estão cansados e sobrecarregados, e eu lhes darei descanso.", ref: "Mateus 11:28" },
            { text: "Não temas, porque eu estou contigo; não te assombres, porque eu sou o teu Deus.", ref: "Isaías 41:10" },
            { text: "Posso todas as coisas em Cristo que me fortalece.", ref: "Filipenses 4:13" },
            { text: "O Senhor é bom, um refúgio em tempos de angústia. Ele protege os que nele confiam.", ref: "Naum 1:7" },
            { text: "E sabemos que Deus age em todas as coisas para o bem daqueles que o amam.", ref: "Romanos 8:28" },
            { text: "Seja forte e corajoso! Não se apavore, nem se desanime, pois o Senhor, o seu Deus, estará com você.", ref: "Josué 1:9" },
            { text: "Mas os que esperam no Senhor renovam as suas forças.", ref: "Isaías 40:31" },
            { text: "Buscai primeiro o Reino de Deus e a sua justiça, e todas as outras coisas vos serão acrescentadas.", ref: "Mateus 6:33" },
            { text: "Porque, se Deus é por nós, quem será contra nós?", ref: "Romanos 8:31" },
            { text: "Portanto, não se preocupem com o amanhã, pois o amanhã trará suas próprias preocupações.", ref: "Mateus 6:34" },
            { text: "A paz eu vos deixo, a minha paz vos dou; não vo-la dou como o mundo a dá.", ref: "João 14:27" },
            { text: "Lancem sobre ele toda a sua ansiedade, porque ele tem cuidado de vocês.", ref: "1 Pedro 5:7" },
            { text: "O Senhor abençoe você e o guarde; o Senhor faça resplandecer o seu rosto sobre você.", ref: "Números 6:24-25" },
            { text: "Aquietai-vos e sabei que eu sou Deus.", ref: "Salmos 46:10" },
            { text: "O amor é paciente, o amor é bondoso. Não inveja, não se vangloria, não se orgulha.", ref: "1 Coríntios 13:4" },
            { text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito.", ref: "João 3:16" },
            { text: "Eu lhes disse essas coisas para que em mim vocês tenham paz.", ref: "João 16:33" },
            { text: "O Senhor cumprirá o seu propósito para a minha vida.", ref: "Salmos 138:8" },
            { text: "Tudo tem o seu tempo determinado, e há tempo para todo propósito debaixo do céu.", ref: "Eclesiastes 3:1" },
            { text: "Pois onde estiver o seu tesouro, aí também estará o seu coração.", ref: "Mateus 6:21" },
            { text: "Alegrem-se na esperança, sejam pacientes na tribulação, perseverem na oração.", ref: "Romanos 12:12" },
            { text: "Guarda o meu coração, porque dele procedem as fontes da vida.", ref: "Provérbios 4:23" },
            { text: "Eu sou o caminho, a verdade e a vida.", ref: "João 14:6" }
        ];

        // Usar o dia do ano para garantir que o mesmo versículo apareça o dia todo
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 0);
        const diff = now - startOfYear;
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);

        const verseIndex = dayOfYear % verses.length;
        const todayVerse = verses[verseIndex];

        const verseText = this.bibleVerse.querySelector('.verse-text');
        const verseReference = this.bibleVerse.querySelector('.verse-reference');

        if (verseText) {
            verseText.textContent = `"${todayVerse.text}"`;
        }
        if (verseReference) {
            verseReference.textContent = todayVerse.ref;
        }
    }

    initEventListeners() {
        this.addBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // Eventos do modal
        this.modalClose.addEventListener('click', () => this.closeModal());
        this.modalCancel.addEventListener('click', () => this.closeModal());
        this.modalSave.addEventListener('click', () => this.saveEdit());

        // Fechar modal ao clicar fora dele
        this.editModal.addEventListener('click', (e) => {
            if (e.target === this.editModal) this.closeModal();
        });

        // Salvar com Enter no modal
        this.modalInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.saveEdit();
        });

        // Alternar tema
        this.themeToggle.addEventListener('click', () => this.toggleTheme());

        // Botões de apagar todas as tarefas
        this.clearPendingBtn.addEventListener('click', () => this.clearPendingTasks());
        this.clearCompletedBtn.addEventListener('click', () => this.clearCompletedTasks());
    }

    addTask() {
        const text = this.taskInput.value.trim();

        // Validação: verifica se o campo está vazio
        if (!text) {
            this.showEmptyTaskWarning();
            return;
        }

        const task = {
            id: this.taskIdCounter++,
            text: text,
            completed: false,
            priority: this.priorityCheckbox.checked,
            category: document.getElementById('categorySelect')?.value || 'pessoal',
            dueDate: document.getElementById('dueDateInput')?.value || null,
            notes: document.getElementById('notesInput')?.value.trim() || '',
            timeEstimate: parseInt(document.getElementById('timeEstimate')?.value) || null,
            goalId: document.getElementById('goalSelect')?.value || null,
            subtasks: [],
            createdAt: new Date().toISOString(),
            order: this.getNextOrderNumber()
        };

        this.tasks.push(task);
        this.saveToStorage();
        this.renderTasks();

        // Limpa os campos
        this.taskInput.value = '';
        this.priorityCheckbox.checked = false;
        if (document.getElementById('categorySelect')) document.getElementById('categorySelect').value = 'pessoal';
        if (document.getElementById('dueDateInput')) document.getElementById('dueDateInput').value = '';
        if (document.getElementById('notesInput')) document.getElementById('notesInput').value = '';
        if (document.getElementById('timeEstimate')) document.getElementById('timeEstimate').value = '';
        if (document.getElementById('goalSelect')) document.getElementById('goalSelect').value = '';

        // Notificação interativa
        this.showToast('Tarefa adicionada com sucesso!', 'success');

        // Validação suave: mostra dica se campos importantes estão vazios
        this.showSoftValidationTips(task);
    }

    getNextOrderNumber() {
        const maxOrder = this.tasks.reduce((max, task) => {
            return task.order > max ? task.order : max;
        }, 0);
        return maxOrder + 1;
    }

    deleteTask(id) {
        // Pega o texto da tarefa antes de deletar
        const task = this.tasks.find(t => t.id === id);
        const taskText = task ? task.text : 'Tarefa';

        // Toca o som de deletar
        this.playDeleteSound();

        this.tasks = this.tasks.filter(task => task.id !== id);
        this.saveToStorage();
        this.renderTasks();

        // Notificação interativa
        this.showToast('Tarefa removida com sucesso', 'delete');
    }

    // Apagar todas as tarefas pendentes
    clearPendingTasks() {
        const pendingTasks = this.tasks.filter(task => !task.completed);

        if (pendingTasks.length === 0) {
            this.showToast('Não há tarefas pendentes para apagar', 'warning', '⚠️');
            return;
        }

        // Mostra modal de confirmação
        this.showConfirmDeleteModal(
            'Apagar Tarefas Pendentes',
            `Tem certeza que deseja apagar todas as ${pendingTasks.length} tarefas pendentes?`,
            () => {
                this.tasks = this.tasks.filter(task => task.completed);
                this.saveToStorage();
                this.renderTasks();

                // Toca som de deletar
                this.playDeleteSound();

                this.showToast(`${pendingTasks.length} tarefas pendentes foram apagadas`, 'delete');
            }
        );
    }

    // Apagar todas as tarefas concluídas
    clearCompletedTasks() {
        const completedTasks = this.tasks.filter(task => task.completed);

        if (completedTasks.length === 0) {
            this.showToast('Não há tarefas concluídas para apagar', 'warning', '⚠️');
            return;
        }

        // Mostra modal de confirmação
        this.showConfirmDeleteModal(
            'Apagar Tarefas Concluídas',
            `Tem certeza que deseja apagar todas as ${completedTasks.length} tarefas concluídas?`,
            () => {
                this.tasks = this.tasks.filter(task => !task.completed);
                this.saveToStorage();
                this.renderTasks();

                // Toca som de deletar
                this.playDeleteSound();

                this.showToast(`${completedTasks.length} tarefas concluídas foram apagadas`, 'delete');
            }
        );
    }

    // Mostra modal de confirmação customizado
    showConfirmDeleteModal(title, message, onConfirm) {
        const modal = document.getElementById('confirmDeleteModal');
        const modalTitle = document.getElementById('confirmDeleteTitle');
        const modalMessage = document.getElementById('confirmDeleteMessage');
        const cancelBtn = document.getElementById('confirmDeleteCancel');
        const confirmBtn = document.getElementById('confirmDeleteConfirm');

        modalTitle.textContent = title;
        modalMessage.textContent = message;

        modal.style.display = 'flex';

        // Remove event listeners antigos
        const newCancelBtn = cancelBtn.cloneNode(true);
        const newConfirmBtn = confirmBtn.cloneNode(true);
        cancelBtn.replaceWith(newCancelBtn);
        confirmBtn.replaceWith(newConfirmBtn);

        // Adiciona novos event listeners
        newCancelBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        newConfirmBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            onConfirm();
        });

        // Fecha ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    // NOVIDADE: Animação de confete MELHORADA ao concluir
    createConfetti(element) {
        const colors = ['#667eea', '#764ba2', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#8b5cf6'];
        const shapes = ['circle', 'square', 'triangle'];
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Cria 30 confetes (mais que antes!)
        for (let i = 0; i < 30; i++) {
            const confetti = document.createElement('div');
            const shape = shapes[Math.floor(Math.random() * shapes.length)];
            confetti.className = `confetti ${shape}`;

            // Define a cor
            const color = colors[Math.floor(Math.random() * colors.length)];
            if (shape === 'triangle') {
                confetti.style.borderBottomColor = color;
            } else {
                confetti.style.background = color;
            }

            confetti.style.left = centerX + 'px';
            confetti.style.top = centerY + 'px';

            // Posição aleatória mais ampla
            const angle = (Math.random() * Math.PI * 2);
            const distance = 80 + Math.random() * 120; // Distância maior
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance - 50; // Sobe um pouco

            confetti.style.setProperty('--tx', tx + 'px');
            confetti.style.setProperty('--ty', ty + 'px');
            confetti.style.setProperty('--rotation', (Math.random() * 720 - 360) + 'deg');

            // Delay aleatório para efeito cascata
            confetti.style.animationDelay = (Math.random() * 0.1) + 's';

            document.body.appendChild(confetti);

            // Remove o confete depois da animação
            setTimeout(() => confetti.remove(), 1600);
        }
    }

    toggleTask(id) {
        const task = this.tasks.find(task => task.id === id);
        if (task) {
            // Se está concluindo a tarefa (não estava completa e agora está)
            if (!task.completed) {
                // Encontra o elemento da tarefa e o botão
                const taskElement = document.querySelector(`[data-task-id="${id}"]`);
                const completeBtn = taskElement?.querySelector('.complete-btn');

                if (taskElement && completeBtn) {
                    // Anima o botão primeiro
                    completeBtn.classList.add('success');

                    // Depois de um pequeno delay, anima a tarefa
                    setTimeout(() => {
                        // Adiciona animação de celebração
                        taskElement.classList.add('celebrating');
                        this.createConfetti(taskElement);

                        // Som de sucesso (se quiser adicionar)
                        this.playSuccessSound();

                        // Mostra notificação de conclusão
                        this.showToast('Tarefa concluída! Parabéns! 🎉', 'success');

                        // Remove a classe depois da animação
                        setTimeout(() => {
                            taskElement.classList.remove('celebrating');
                            completeBtn.classList.remove('success');
                        }, 800);
                    }, 200);
                }
            } else {
                // Se está desfazendo (estava completa e agora não está)
                // Toca o som de desfazer
                this.playUndoSound();

                // Mostra notificação de desfazer
                this.showToast('Tarefa reaberta', 'undo');
            }

            task.completed = !task.completed;
            this.saveToStorage();

            // Aguarda a animação completar antes de renderizar
            setTimeout(() => this.renderTasks(), 800);
        }
    }

    // Som de sucesso (simulado com beep)
    playSuccessSound() {
        // Cria um contexto de áudio
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Primeira nota (Mi)
        const oscillator1 = audioContext.createOscillator();
        const gainNode1 = audioContext.createGain();
        oscillator1.connect(gainNode1);
        gainNode1.connect(audioContext.destination);
        oscillator1.frequency.value = 659.25;
        gainNode1.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        oscillator1.start(audioContext.currentTime);
        oscillator1.stop(audioContext.currentTime + 0.1);

        // Segunda nota (Sol)
        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();
        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);
        oscillator2.frequency.value = 783.99;
        gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime + 0.1);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);
        oscillator2.start(audioContext.currentTime + 0.1);
        oscillator2.stop(audioContext.currentTime + 0.25);
    }

    // NOVIDADE: Som de deletar (som curto e satisfatório tipo "click")
    playDeleteSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Som de click único e limpo
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.05);

        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.05);
    }

    // NOVIDADE: Som de desfazer (som de "whoosh" reverso)
    playUndoSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Primeira nota curta
        const oscillator1 = audioContext.createOscillator();
        const gainNode1 = audioContext.createGain();
        oscillator1.connect(gainNode1);
        gainNode1.connect(audioContext.destination);

        oscillator1.type = 'sine';
        oscillator1.frequency.setValueAtTime(520, audioContext.currentTime);

        gainNode1.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);

        oscillator1.start(audioContext.currentTime);
        oscillator1.stop(audioContext.currentTime + 0.08);

        // Segunda nota (mais aguda)
        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();
        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);

        oscillator2.type = 'sine';
        oscillator2.frequency.setValueAtTime(720, audioContext.currentTime + 0.05);

        gainNode2.gain.setValueAtTime(0.15, audioContext.currentTime + 0.05);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

        oscillator2.start(audioContext.currentTime + 0.05);
        oscillator2.stop(audioContext.currentTime + 0.15);
    }

    // NOVIDADE: Abre o modal de edição
    openEditModal(id) {
        const task = this.tasks.find(task => task.id === id);
        if (task) {
            this.editingTaskId = id;
            this.modalInput.value = task.text;
            this.editModal.classList.add('active');
            this.modalInput.focus();
        }
    }

    // NOVIDADE: Fecha o modal
    closeModal() {
        this.editModal.classList.remove('active');
        this.editingTaskId = null;
        this.modalInput.value = '';
    }

    // NOVIDADE: Salva a edição
    saveEdit() {
        const newText = this.modalInput.value.trim();
        if (newText === '') {
            alert('A tarefa não pode estar vazia!');
            return;
        }

        const task = this.tasks.find(task => task.id === this.editingTaskId);
        if (task) {
            task.text = newText;
            this.saveToStorage();
            this.renderTasks();
            this.closeModal();

            // Mostra notificação de edição bem-sucedida
            this.showToast('Tarefa atualizada com sucesso!', 'edit');
        }
    }

    editTask(id) {
        this.openEditModal(id);
    }

    saveToStorage() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
        localStorage.setItem('taskIdCounter', this.taskIdCounter.toString());
    }

    createTaskElement(task) {
        const taskItem = document.createElement('div');
        taskItem.className = 'task-item';
        taskItem.setAttribute('data-task-id', task.id);

        // Calcular informações de prazo e status
        const deadlineInfo = this.calculateTaskDeadlineInfo(task);
        const statusInfo = this.getTaskStatusInfo(task, deadlineInfo);

        // Aplicar classes baseadas no status
        if (task.priority) taskItem.classList.add('priority');
        if (task.completed) taskItem.classList.add('completed');
        if (deadlineInfo.isOverdue) taskItem.classList.add('overdue');
        if (deadlineInfo.isDueToday) taskItem.classList.add('due-today');

        // CSS dinâmico baseado na categoria
        const dynamicCSS = this.getTaskDynamicCSS(task);

        taskItem.innerHTML = `
            <div class="task-header">
                <div class="task-header-left">
                    <div class="task-number">${task.order || 1}</div>
                    <div class="task-content-main">
                        <div class="task-text">${task.text}</div>
                        <div class="task-category-tag" style="${dynamicCSS}">
                            ${this.getCategoryEmoji(task.category)} ${this.getCategoryName(task.category)}
                        </div>
                    </div>
                </div>
                <div class="task-header-right">
                    <div class="task-status-badge ${statusInfo.status}">
                        ${statusInfo.label}
                    </div>
                    <div class="task-quick-actions">
                        <button class="task-quick-btn" onclick="todoApp.togglePriority(${task.id})" title="Prioridade">
                            ${task.priority ? '⭐' : '☆'}
                        </button>
                        <button class="task-quick-btn" onclick="todoApp.duplicateTask(${task.id})" title="Duplicar">
                            📋
                        </button>
                        <button class="task-quick-btn" onclick="todoApp.postponeTask(${task.id})" title="Adiar">
                            ⏰
                        </button>
                    </div>
                </div>
            </div>
            
            ${task.notes ? `
                <div class="task-notes-preview">
                    📝 ${task.notes.substring(0, 50)}${task.notes.length > 50 ? '...' : ''}
                </div>
            ` : ''}
            
            ${deadlineInfo.hasDeadline ? `
                <div class="task-deadline-info">
                    <span>📅 ${deadlineInfo.text}</span>
                    <div class="task-deadline-countdown ${deadlineInfo.urgency}">
                        ${deadlineInfo.countdownText}
                    </div>
                </div>
            ` : ''}
            
            <div class="task-actions-enhanced">
                <div class="task-actions-left">
                    ${!task.completed ? `
                        <button class="task-btn-enhanced priority-toggle" onclick="todoApp.togglePriority(${task.id})">
                            ${task.priority ? '🌟' : '⭐'}
                        </button>
                    ` : ''}
                    ${task.notes ? `
                        <button class="task-btn-enhanced view-notes" onclick="todoApp.showNotes(${task.id})">
                            📝
                        </button>
                    ` : ''}
                </div>
                <div class="task-actions-right">
                    ${task.completed
                ? `<button class="task-btn undo-btn" onclick="todoApp.toggleTask(${task.id})" title="Desfazer">↶</button>`
                : `<button class="task-btn complete-btn" onclick="todoApp.toggleTask(${task.id})" title="Concluir">✓</button>
                               <button class="task-btn edit-btn" onclick="todoApp.editTask(${task.id})" title="Editar">✎</button>`
            }
                    <button class="task-btn delete-btn" onclick="todoApp.deleteTask(${task.id})" title="Excluir">🗑</button>
                </div>
            </div>
        `;

        return taskItem;
    }

    // Funções auxiliares para melhorias das tarefas
    calculateTaskDeadlineInfo(task) {
        if (!task.dueDate) {
            return { hasDeadline: false, text: '', countdownText: '', urgency: 'normal' };
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [year, month, day] = task.dueDate.split('-').map(Number);
        const dueDate = new Date(year, month - 1, day);
        dueDate.setHours(0, 0, 0, 0);

        const diffTime = dueDate - today;
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let urgency = 'normal';
        let countdownText = '';

        if (daysLeft < 0) {
            urgency = 'urgent';
            countdownText = `${Math.abs(daysLeft)} dia(s) atrasada`;
        } else if (daysLeft === 0) {
            urgency = 'urgent';
            countdownText = 'Vence hoje!';
        } else if (daysLeft <= 2) {
            urgency = 'soon';
            countdownText = `${daysLeft} dia(s) restante(s)`;
        } else {
            urgency = 'normal';
            countdownText = `${daysLeft} dia(s) restante(s)`;
        }

        const text = this.formatDate(task.dueDate);

        return {
            hasDeadline: true,
            text,
            countdownText,
            urgency,
            daysLeft,
            isOverdue: daysLeft < 0,
            isDueToday: daysLeft === 0
        };
    }

    getTaskStatusInfo(task, deadlineInfo) {
        if (task.completed) {
            return { status: 'completed', label: '✅ Concluída' };
        }

        if (deadlineInfo.isOverdue) {
            return { status: 'urgent', label: '⚠️ Atrasada' };
        }

        if (deadlineInfo.isDueToday) {
            return { status: 'urgent', label: '🔥 Vence Hoje' };
        }

        if (task.priority) {
            return { status: 'priority', label: '⭐ Prioritária' };
        }

        return { status: 'normal', label: '📋 Normal' };
    }

    getTaskDynamicCSS(task) {
        const categoryColors = {
            'pessoal': { bg: 'rgba(76, 175, 80, 0.2)', text: '#4caf50', border: 'rgba(76, 175, 80, 0.3)' },
            'trabalho': { bg: 'rgba(102, 126, 234, 0.2)', text: '#667eea', border: 'rgba(102, 126, 234, 0.3)' },
            'estudo': { bg: 'rgba(255, 167, 38, 0.2)', text: '#ffa726', border: 'rgba(255, 167, 38, 0.3)' },
            'saude': { bg: 'rgba(255, 107, 107, 0.2)', text: '#ff6b6b', border: 'rgba(255, 107, 107, 0.3)' },
            'compras': { bg: 'rgba(156, 39, 176, 0.2)', text: '#9c27b0', border: 'rgba(156, 39, 176, 0.3)' },
            'outros': { bg: 'rgba(121, 134, 203, 0.2)', text: '#7986cb', border: 'rgba(121, 134, 203, 0.3)' }
        };

        const colors = categoryColors[task.category] || categoryColors['outros'];
        return `--category-gradient: ${colors.bg}; --category-text: ${colors.text}; --category-border: ${colors.border};`;
    }

    getCategoryName(category) {
        const names = {
            'pessoal': 'Pessoal',
            'trabalho': 'Trabalho',
            'estudo': 'Estudo',
            'saude': 'Saúde',
            'compras': 'Compras',
            'outros': 'Outros'
        };
        return names[category] || 'Outros';
    }

    getCategoryEmoji(category) {
        const emojis = {
            'pessoal': '🏠',
            'trabalho': '💼',
            'estudo': '📚',
            'saude': '❤️',
            'compras': '🛒',
            'outros': '📌'
        };
        return emojis[category] || '📌';
    }

    // Novas funcionalidades dos quick actions
    togglePriority(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        task.priority = !task.priority;

        // Animação e feedback
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        if (taskElement) {
            taskElement.classList.add('celebrating');
            setTimeout(() => taskElement.classList.remove('celebrating'), 600);
        }

        // Som de feedback
        this.playPrioritySound(task.priority);

        // Notificação
        const action = task.priority ? 'marcada como prioritária' : 'prioridade removida';
        this.showToast(`Tarefa ${action}!`, task.priority ? 'warning' : 'info');

        this.saveToStorage();
        this.renderTasks();
    }

    duplicateTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        const duplicatedTask = {
            ...task,
            id: this.taskIdCounter++,
            text: `${task.text} (cópia)`,
            completed: false,
            order: this.tasks.length + 1
        };

        this.tasks.push(duplicatedTask);
        this.playSuccessSound();
        this.showToast('Tarefa duplicada com sucesso!', 'success');

        this.saveToStorage();
        this.renderTasks();
    }

    postponeTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        // Se não tem data, definir para amanhã
        if (!task.dueDate) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            task.dueDate = tomorrow.toISOString().split('T')[0];
            this.showToast('Data de vencimento definida para amanhã!', 'success');
        } else {
            // Adiar por 1 dia
            const currentDate = new Date(task.dueDate);
            currentDate.setDate(currentDate.getDate() + 1);
            task.dueDate = currentDate.toISOString().split('T')[0];
            this.showToast('Tarefa adiada para amanhã!', 'info');
        }

        // Animação no card
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        if (taskElement) {
            taskElement.classList.add('celebrating');
            setTimeout(() => taskElement.classList.remove('celebrating'), 600);
        }

        this.playUndoSound();
        this.saveToStorage();
        this.renderTasks();
    }

    playPrioritySound(isPriority) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const frequency = isPriority ? 659 : 523; // E ou C

            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {
            console.log('Som não suportado');
        }
    }

    // Retorna badge da meta vinculada
    getGoalBadge(task) {
        if (!task.goalId || !window.goalsManager) return '';

        const goal = window.goalsManager.goals.find(g => g.id === parseInt(task.goalId));
        if (!goal) return '';

        return `<span class="task-goal" title="Vinculada à meta: ${goal.title}">🎯 ${goal.title}</span>`;
    }

    // Formata a data para exibição
    formatDate(dateString) {
        // Converte a string YYYY-MM-DD para data local (evita problemas de timezone)
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const compareDate = new Date(date);
        compareDate.setHours(0, 0, 0, 0);

        if (compareDate.getTime() === today.getTime()) {
            return 'Hoje';
        } else if (compareDate.getTime() === tomorrow.getTime()) {
            return 'Amanhã';
        } else {
            return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        }
    }

    // Mostra modal com as notas da tarefa
    showNotes(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task && task.notes) {
            const overlay = document.createElement('div');
            overlay.className = 'notification-overlay';
            document.body.appendChild(overlay);

            const notification = document.createElement('div');
            notification.className = 'notification-toast notes-modal';

            notification.innerHTML = `
                <div class="notification-icon-wrapper">
                    <div class="notification-icon-bg" style="background: linear-gradient(135deg, #3b82f6, #2563eb);">
                        <span class="notification-emoji">📝</span>
                    </div>
                </div>
                <div class="notification-content">
                    <div class="notification-title">Notas da Tarefa</div>
                    <div class="notification-message" style="text-align: left; white-space: pre-wrap; max-height: 200px; overflow-y: auto;">${task.notes}</div>
                </div>
                <button class="modal-close-btn" onclick="this.closest('.notification-toast').remove(); document.querySelector('.notification-overlay').remove();">×</button>
            `;

            document.body.appendChild(notification);

            // Remove o fechamento ao clicar no overlay
            // overlay.addEventListener('click', () => {
            //     notification.remove();
            //     overlay.remove();
            // });
        }
    }

    // Mostra modal para gerenciar subtarefas
    showSubtasks(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        if (!task.subtasks) task.subtasks = [];

        const overlay = document.createElement('div');
        overlay.className = 'notification-overlay';
        document.body.appendChild(overlay);

        const modal = document.createElement('div');
        modal.className = 'notification-toast subtasks-modal';

        const renderSubtasksList = () => {
            const subtasksList = task.subtasks.map((st, index) => `
                <div class="subtask-item ${st.completed ? 'completed' : ''}">
                    <input type="checkbox" ${st.completed ? 'checked' : ''} onchange="todoApp.toggleSubtask(${id}, ${index})">
                    <span>${st.text}</span>
                    <button class="delete-subtask-btn" onclick="todoApp.deleteSubtask(${id}, ${index})">×</button>
                </div>
            `).join('');

            const progress = task.subtasks.length > 0
                ? Math.round((task.subtasks.filter(st => st.completed).length / task.subtasks.length) * 100)
                : 0;

            modal.innerHTML = `
                <div class="notification-icon-wrapper">
                    <div class="notification-icon-bg" style="background: linear-gradient(135deg, #10b981, #059669);">
                        <span class="notification-emoji">☑️</span>
                    </div>
                </div>
                <div class="notification-content">
                    <div class="notification-title">Subtarefas</div>
                    <div class="subtask-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <span class="progress-text">${task.subtasks.filter(st => st.completed).length}/${task.subtasks.length} concluídas</span>
                    </div>
                    <div class="subtasks-list">
                        ${subtasksList || '<p style="text-align: center; color: #aaa;">Nenhuma subtarefa ainda</p>'}
                    </div>
                    <div class="add-subtask-form">
                        <input type="text" id="newSubtaskInput" placeholder="Nova subtarefa..." class="subtask-input">
                        <button onclick="todoApp.addSubtask(${id})" class="add-subtask-btn">+</button>
                    </div>
                </div>
                <button class="modal-close-btn" onclick="this.closest('.notification-toast').remove(); document.querySelector('.notification-overlay').remove();">×</button>
            `;
        };

        renderSubtasksList();
        document.body.appendChild(modal);

        // Remove o fechamento ao clicar no overlay
        // overlay.addEventListener('click', () => {
        //     modal.remove();
        //     overlay.remove();
        // });

        // Armazena referência ao modal para poder atualizar
        this.currentSubtaskModal = { modal, renderSubtasksList, taskId: id };
    }

    addSubtask(taskId) {
        const input = document.getElementById('newSubtaskInput');
        const text = input.value.trim();
        if (!text) return;

        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        if (!task.subtasks) task.subtasks = [];
        task.subtasks.push({ text, completed: false });

        this.saveToStorage();
        this.renderTasks();

        // Atualiza o modal
        if (this.currentSubtaskModal && this.currentSubtaskModal.taskId === taskId) {
            this.currentSubtaskModal.renderSubtasksList();
        }

        input.value = '';
    }

    toggleSubtask(taskId, subtaskIndex) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task || !task.subtasks[subtaskIndex]) return;

        task.subtasks[subtaskIndex].completed = !task.subtasks[subtaskIndex].completed;
        this.saveToStorage();
        this.renderTasks();

        // Atualiza o modal
        if (this.currentSubtaskModal && this.currentSubtaskModal.taskId === taskId) {
            this.currentSubtaskModal.renderSubtasksList();
        }
    }

    deleteSubtask(taskId, subtaskIndex) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task || !task.subtasks[subtaskIndex]) return;

        task.subtasks.splice(subtaskIndex, 1);
        this.saveToStorage();
        this.renderTasks();

        // Atualiza o modal
        if (this.currentSubtaskModal && this.currentSubtaskModal.taskId === taskId) {
            this.currentSubtaskModal.renderSubtasksList();
        }
    }

    renderTasks() {
        const pendingTasksList = this.tasks.filter(task => !task.completed);
        const completedTasksList = this.tasks.filter(task => task.completed);

        pendingTasksList.sort((a, b) => {
            if (a.priority && !b.priority) return -1;
            if (!a.priority && b.priority) return 1;
            return (a.order || 0) - (b.order || 0);
        });

        completedTasksList.sort((a, b) => (a.order || 0) - (b.order || 0));

        this.pendingTasks.innerHTML = '';
        if (pendingTasksList.length === 0) {
            this.pendingTasks.innerHTML = '<div class="empty-state">Nenhuma tarefa pendente</div>';
        } else {
            pendingTasksList.forEach(task => {
                this.pendingTasks.appendChild(this.createTaskElement(task));
            });
        }

        this.completedTasks.innerHTML = '';
        if (completedTasksList.length === 0) {
            this.completedTasks.innerHTML = '<div class="empty-state">Nenhuma tarefa concluída</div>';
        } else {
            completedTasksList.forEach(task => {
                this.completedTasks.appendChild(this.createTaskElement(task));
            });
        }

        // Mostrar/ocultar botões de apagar todas baseado no número de tarefas
        this.updateClearButtons(pendingTasksList.length, completedTasksList.length);

        // Atualizar barra de progresso
        this.updateProgress();
    }

    // Atualizar visibilidade dos botões de apagar todas
    updateClearButtons(pendingCount, completedCount) {
        // Mostrar botão de apagar pendentes apenas se houver mais de 1 tarefa
        if (pendingCount > 1) {
            this.clearPendingBtn.classList.remove('hidden');
        } else {
            this.clearPendingBtn.classList.add('hidden');
        }

        // Mostrar botão de apagar concluídas apenas se houver mais de 1 tarefa
        if (completedCount > 1) {
            this.clearCompletedBtn.classList.remove('hidden');
        } else {
            this.clearCompletedBtn.classList.add('hidden');
        }
    }

    // Atualizar barra de progresso (versão melhorada)
    updateProgress() {
        // Otimização: debounce para evitar recálculos desnecessários
        clearTimeout(this.progressUpdateTimeout);
        this.progressUpdateTimeout = setTimeout(() => {
            this.updateProgressInternal();
        }, 100);
    }

    updateProgressInternal() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        // Aplicar cores dinâmicas baseadas no progresso
        this.applyProgressColors(percentage);

        // Animação suave da barra
        this.progressFill.style.transition = 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s ease';
        this.progressFill.style.width = percentage + '%';

        // Atualizar texto principal
        this.progressText.textContent = `${percentage}% Concluído`;

        // Atualizar estatísticas
        this.updateProgressStats(completed, total);

        // Atualizar detalhes
        this.updateProgressDetails();

        // Atualizar progresso por categoria
        this.updateCategoryProgress();

        // Micro-interações para marcos importantes
        this.handleProgressMilestones(percentage, completed);
    }

    updateProgressStats(completed, total) {
        const progressStats = document.getElementById('progressStats');
        if (progressStats) {
            progressStats.textContent = `${completed} de ${total} tarefas`;
        }
    }

    updateProgressDetails() {
        // Tempo restante estimado
        const pendingTasks = this.tasks.filter(t => !t.completed);
        const totalEstimatedTime = pendingTasks.reduce((sum, task) => {
            return sum + (task.timeEstimate || 15); // Default 15 min se não especificado
        }, 0);

        const timeElement = document.getElementById('totalEstimatedTime');
        if (timeElement) {
            timeElement.textContent = totalEstimatedTime > 0
                ? `${totalEstimatedTime} min`
                : '0 min';
        }

        // Taxa de produtividade
        const productivityRate = this.calculateProductivityScore();

        const productivityElement = document.getElementById('productivityRate');
        if (productivityElement) {
            productivityElement.textContent = productivityRate;
        }

        // Meta do dia
        const dailyGoalElement = document.getElementById('dailyGoal');
        if (dailyGoalElement) {
            const goalProgress = this.calculateDailyGoalProgress();
            dailyGoalElement.textContent = goalProgress;
        }
    }

    updateCategoryProgress() {
        const categoryProgressList = document.getElementById('categoryProgressList');
        if (!categoryProgressList) return;

        const categories = ['pessoal', 'trabalho', 'estudo', 'saude', 'compras', 'outros'];
        const categoryEmojis = {
            'pessoal': '🏠',
            'trabalho': '💼',
            'estudo': '📚',
            'saude': '❤️',
            'compras': '🛒',
            'outros': '📌'
        };

        const categoryStats = categories.map(category => {
            const categoryTasks = this.tasks.filter(t => t.category === category);
            const completed = categoryTasks.filter(t => t.completed).length;
            const total = categoryTasks.length;
            const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

            return {
                name: category,
                emoji: categoryEmojis[category],
                completed,
                total,
                percentage
            };
        }).filter(cat => cat.total > 0);

        if (categoryStats.length === 0) {
            categoryProgressList.innerHTML = '<div class="category-progress-item">Nenhuma categoria encontrada</div>';
            return;
        }

        categoryProgressList.innerHTML = categoryStats.map(cat => {
            const color = this.getCategoryColor(cat.percentage);
            return `
                <div class="category-progress-item">
                    <span style="min-width: 80px; text-transform: capitalize;">${cat.emoji} ${cat.name}</span>
                    <div class="category-progress-bar">
                        <div class="category-progress-fill" 
                             style="width: ${cat.percentage}%; background: ${color};">
                        </div>
                    </div>
                    <span class="category-progress-text">${cat.percentage}%</span>
                </div>
            `;
        }).join('');
    }

    getCategoryColor(percentage) {
        if (percentage < 25) return '#ff6b6b';
        if (percentage < 50) return '#ffa726';
        if (percentage < 75) return '#66bb6a';
        return '#4caf50';
    }

    // Calcular score de produtividade
    calculateProductivityScore() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;

        if (total === 0) {
            return '--';
        }

        const completionRate = (completed / total) * 100;
        const tasksDueToday = this.getTasksDueToday();
        const tasksDueTodayCompleted = tasksDueToday.filter(t => t.completed).length;

        // Score base na taxa de conclusão
        let score = Math.round(completionRate);

        // Bônus para tarefas urgentes concluídas
        if (tasksDueToday.length > 0) {
            const urgencyBonus = Math.round((tasksDueTodayCompleted / tasksDueToday.length) * 20);
            score += urgencyBonus;
        }

        // Limitar entre 0 e 100
        score = Math.min(100, Math.max(0, score));

        // Retornar com emoji baseado no score
        if (score >= 90) return `${score}% 🔥`;
        if (score >= 70) return `${score}% 💪`;
        if (score >= 50) return `${score}% 👍`;
        return `${score}% 📈`;
    }

    // Calcular progresso da meta diária
    calculateDailyGoalProgress() {
        const targetPercentage = 80; // Meta: completar 80% das tarefas
        const completed = this.tasks.filter(t => t.completed).length;
        const total = this.tasks.length;

        if (total === 0) return '-';

        const currentPercentage = Math.round((completed / total) * 100);
        const goalProgress = Math.min(Math.round((currentPercentage / targetPercentage) * 100), 100);

        return `${goalProgress}%`;
    }

    // Obter tarefas que vencem hoje
    getTasksDueToday() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return this.tasks.filter(task => {
            if (!task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate.getTime() === today.getTime();
        });
    }

    // Micro-interações para marcos importantes
    handleProgressMilestones(percentage, completed) {
        const progressContainer = document.getElementById('progressContainer');

        // Celebração ao atingir 100%
        if (percentage === 100 && completed > 0) {
            this.celebrateCompletion(progressContainer);
        }

        // Animação em marcos importantes (25%, 50%, 75%)
        if (percentage === 25 || percentage === 50 || percentage === 75) {
            this.addMilestoneEffect(progressContainer, percentage);
        }
    }

    // Celebração ao completar todas as tarefas
    celebrateCompletion(container) {
        container.classList.add('celebrating');

        // Som de celebração
        this.playCompletionSound();

        // Confetti
        this.createProgressConfetti(container);

        // Notificação
        this.showToast('🎉 Parabéns! Todas as tarefas concluídas!', 'success');

        // Remove efeito depois de 2 segundos
        setTimeout(() => {
            container.classList.remove('celebrating');
        }, 2000);
    }

    // Efeito para marcos intermediários
    addMilestoneEffect(container, percentage) {
        const milestone = document.createElement('div');
        milestone.className = 'milestone-popup';
        milestone.textContent = `${percentage}% ✨`;
        milestone.style.cssText = `
            position: absolute;
            top: 50%;
            right: 1rem;
            background: rgba(255,255,255,0.9);
            color: #333;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-weight: bold;
            animation: milestone-popup 1.5s ease-out forwards;
            z-index: 100;
        `;

        container.appendChild(milestone);

        setTimeout(() => {
            milestone.remove();
        }, 1500);
    }

    // Som de celebração
    playCompletionSound() {
        if (window.soundSystem && window.soundSystem.playCompletionSound) {
            window.soundSystem.playCompletionSound();
        } else {
            // Fallback: criar som simples
            this.createSimpleSound([523, 659, 784], 200); // Acorde C maior
        }
    }

    // Criar som simples
    createSimpleSound(frequencies, duration) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();

            frequencies.forEach((freq, index) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.value = freq;
                oscillator.type = 'sine';

                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

                oscillator.start(audioContext.currentTime + index * 0.1);
                oscillator.stop(audioContext.currentTime + (index * 0.1) + duration / 1000);
            });
        } catch (e) {
            console.log('Som não suportado neste navegador');
        }
    }

    // Criar confetti para progresso
    createProgressConfetti(container) {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#f093fb'];

        for (let i = 0; i < 15; i++) {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: absolute;
                width: 8px;
                height: 8px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                border-radius: 50%;
                pointer-events: none;
                z-index: 1000;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 50}%;
                animation: confetti-fall 2s ease-out forwards;
            `;

            container.appendChild(confetti);

            setTimeout(() => {
                confetti.remove();
            }, 2000);
        }
    }

    // Aplicar cores dinâmicas baseadas no progresso
    applyProgressColors(percentage) {
        // Remover todas as classes de cor anteriores
        this.progressFill.classList.remove('progress-low', 'progress-medium', 'progress-high', 'progress-complete');

        // Aplicar cor baseada na porcentagem
        if (percentage === 100) {
            this.progressFill.classList.add('progress-complete');
        } else if (percentage >= 75) {
            this.progressFill.classList.add('progress-high');
        } else if (percentage >= 50) {
            this.progressFill.classList.add('progress-medium');
        } else if (percentage > 0) {
            this.progressFill.classList.add('progress-low');
        }
    }

    // Calcular score de produtividade
    calculateProductivityScore() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;

        if (total === 0) return '--';

        const completionRate = (completed / total) * 100;
        const tasksDueToday = this.getTasksDueToday();
        const tasksDueTodayCompleted = tasksDueToday.filter(t => t.completed).length;

        // Score base na taxa de conclusão
        let score = Math.round(completionRate);

        // Bônus para tarefas urgentes concluídas
        if (tasksDueToday.length > 0) {
            const urgencyBonus = Math.round((tasksDueTodayCompleted / tasksDueToday.length) * 20);
            score += urgencyBonus;
        }

        // Limitar entre 0 e 100
        score = Math.min(100, Math.max(0, score));

        // Retornar com emoji baseado no score
        if (score >= 90) return `${score}% 🔥`;
        if (score >= 70) return `${score}% 💪`;
        if (score >= 50) return `${score}% 👍`;
        return `${score}% 📈`;
    }

    // Obter tarefas que vencem hoje
    getTasksDueToday() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return this.tasks.filter(task => {
            if (!task.dueDate) return false;
            const taskDate = new Date(task.dueDate);
            taskDate.setHours(0, 0, 0, 0);
            return taskDate.getTime() === today.getTime();
        });
    }

    // Lidar com marcos de progresso (celebrações)
    handleProgressMilestones(percentage) {
        const previousPercentage = this.lastProgressUpdate;
        this.lastProgressUpdate = percentage;

        // Celebração ao atingir 100%
        if (percentage === 100 && previousPercentage < 100) {
            this.celebrateCompletion();
        }

        // Celebrar marcos de 25%
        const milestones = [25, 50, 75];
        milestones.forEach(milestone => {
            if (percentage >= milestone && previousPercentage < milestone) {
                this.celebrateMilestone(milestone);
            }
        });
    }

    // Celebração ao completar 100%
    celebrateCompletion() {
        // Animação de celebração
        this.progressText.classList.add('progress-complete');

        // Confetti effect (simulado com emoji)
        this.createProgressConfetti();

        // Notificação especial
        this.showToast('🎉 Todas as tarefas concluídas! Parabéns! 🎉', 'celebration');

        // Som de celebração
        this.playCelebrationSound();

        // Remover classes após animação
        setTimeout(() => {
            this.progressText.classList.remove('progress-complete');
        }, 2000);
    }

    // Celebração de marcos
    celebrateMilestone(milestone) {
        // Animação sutil
        this.progressFill.parentElement.classList.add('progress-celebration');

        // Notificação
        this.showToast(`🎯 ${milestone}% concluído! Continue assim!`, 'milestone');

        // Remover animação
        setTimeout(() => {
            this.progressFill.parentElement.classList.remove('progress-celebration');
        }, 600);
    }

    // Criar efeito confetti para progresso
    createProgressConfetti() {
        const container = this.progressFill.parentElement;
        const emojis = ['🎉', '🎊', '⭐', '✨', '🌟'];

        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.style.position = 'absolute';
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.fontSize = '1.2rem';
                confetti.style.animation = 'confettiFall 1s ease-out forwards';
                confetti.style.pointerEvents = 'none';
                confetti.style.zIndex = '1000';
                confetti.textContent = emojis[Math.floor(Math.random() * emojis.length)];

                container.style.position = 'relative';
                container.appendChild(confetti);

                setTimeout(() => {
                    if (confetti.parentNode) {
                        confetti.parentNode.removeChild(confetti);
                    }
                }, 1000);
            }, i * 100);
        }

        // Adicionar CSS para animação do confetti se não existir
        if (!document.querySelector('#confetti-animation-style')) {
            const style = document.createElement('style');
            style.id = 'confetti-animation-style';
            style.textContent = `
                @keyframes confettiFall {
                    0% {
                        transform: translateY(-20px) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(30px) rotate(360deg);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Som de celebração melhorado
    playCelebrationSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Sequência de notas para celebração
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

            notes.forEach((frequency, index) => {
                setTimeout(() => {
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();

                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);

                    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
                    oscillator.type = 'sine';

                    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);

                    oscillator.start();
                    oscillator.stop(audioContext.currentTime + 0.3);
                }, index * 150);
            });
        } catch (error) {
            console.log('Audio context not available');
        }
    }

    // Alternar tema
    toggleTheme() {
        document.body.classList.toggle('light-mode');
        const isLight = document.body.classList.contains('light-mode');
        this.themeToggle.textContent = isLight ? '☀️' : '🌙';
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    }

    // Carregar tema salvo
    loadTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            document.body.classList.add('light-mode');
            this.themeToggle.textContent = '☀️';
        }
    }

    // Pedir permissão para notificações
    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }

    // Mostrar notificação
    showNotification(title, message) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: message,
                icon: '📋',
                badge: '✅'
            });
        }
    }

    // Mostrar notificação interativa e agradável
    showToast(message, type = 'success', emoji = '✅') {
        // Cria o overlay de fundo
        const overlay = document.createElement('div');
        overlay.className = 'notification-overlay';
        document.body.appendChild(overlay);

        // Cria a notificação
        const notification = document.createElement('div');
        notification.className = `notification-toast ${type}`;

        // Define o conteúdo baseado no tipo
        let title = '';
        let icon = emoji;

        if (type === 'success') {
            title = 'Sucesso! 🎉';
            icon = '✨';
        } else if (type === 'delete') {
            title = 'Removido! 🗑️';
            icon = '👋';
        } else if (type === 'undo') {
            title = 'Desfeito! ↶';
            icon = '🔄';
        } else if (type === 'edit') {
            title = 'Atualizado! ✎';
            icon = '📝';
        }

        notification.innerHTML = `
            <div class="notification-icon-wrapper">
                <div class="notification-icon-bg">
                    <span class="notification-emoji">${icon}</span>
                </div>
            </div>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
        `;

        document.body.appendChild(notification);

        // Cria partículas de celebração
        if (type === 'success') {
            this.createCelebrationParticles();
        } else if (type === 'delete') {
            this.createDeleteParticles();
        } else if (type === 'undo') {
            this.createUndoParticles();
        } else if (type === 'edit') {
            this.createEditParticles();
        }

        // Remove após 3 segundos (animação completa)
        setTimeout(() => {
            notification.remove();
            overlay.remove();
        }, 3000);
    }

    // Cria partículas de celebração ao adicionar tarefa
    createCelebrationParticles() {
        const particles = ['⭐', '✨', '🎉', '🎊', '💫', '🌟'];
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            particle.className = 'celebration-particle';
            particle.textContent = particles[Math.floor(Math.random() * particles.length)];

            // Posição aleatória ao redor do centro
            const angle = (Math.PI * 2 * i) / 12;
            const radius = 100;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;

            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.animationDelay = (i * 0.05) + 's';

            document.body.appendChild(particle);

            setTimeout(() => particle.remove(), 1500);
        }
    }

    // Cria partículas ao deletar tarefa
    createDeleteParticles() {
        const particles = ['💨', '👋', '✨', '💨'];
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'celebration-particle';
            particle.textContent = particles[Math.floor(Math.random() * particles.length)];

            const angle = (Math.PI * 2 * i) / 8;
            const radius = 80;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;

            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.animationDelay = (i * 0.04) + 's';

            document.body.appendChild(particle);

            setTimeout(() => particle.remove(), 1500);
        }
    }

    // Cria partículas ao desfazer tarefa
    createUndoParticles() {
        const particles = ['🔄', '↶', '⏪', '🔙'];
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'celebration-particle';
            particle.textContent = particles[Math.floor(Math.random() * particles.length)];

            const angle = (Math.PI * 2 * i) / 8;
            const radius = 80;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;

            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.animationDelay = (i * 0.04) + 's';

            document.body.appendChild(particle);

            setTimeout(() => particle.remove(), 1500);
        }
    }

    // Cria partículas ao editar tarefa
    createEditParticles() {
        const particles = ['📝', '✎', '✏️', '📄', '✨', '💡'];
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        for (let i = 0; i < 10; i++) {
            const particle = document.createElement('div');
            particle.className = 'celebration-particle';
            particle.textContent = particles[Math.floor(Math.random() * particles.length)];

            const angle = (Math.PI * 2 * i) / 10;
            const radius = 90;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;

            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.animationDelay = (i * 0.05) + 's';

            document.body.appendChild(particle);

            setTimeout(() => particle.remove(), 1500);
        }
    }

    // Mostra aviso quando tentar adicionar tarefa vazia
    showEmptyTaskWarning() {
        // Cria o overlay de fundo
        const overlay = document.createElement('div');
        overlay.className = 'notification-overlay';
        document.body.appendChild(overlay);

        // Cria o modal de aviso
        const modal = document.createElement('div');
        modal.className = 'notification-toast warning';
        modal.innerHTML = `
            <div class="notification-icon-wrapper">
                <div class="notification-icon-bg warning-bg">
                    <span class="notification-emoji">⚠️</span>
                </div>
            </div>
            <div class="notification-content">
                <div class="notification-title">Atenção! ⚠️</div>
                <div class="notification-message">Por favor, digite uma tarefa antes de adicionar.</div>
            </div>
        `;

        document.body.appendChild(modal);

        // Foca no input após mostrar o aviso
        setTimeout(() => {
            this.taskInput.focus();
        }, 100);

        // Cria partículas de aviso
        this.createWarningParticles();

        // Remove após 3 segundos
        setTimeout(() => {
            modal.remove();
            overlay.remove();
        }, 3000);
    }

    // Cria partículas de aviso
    createWarningParticles() {
        const particles = ['⚠️', '❗', '⚡', '🚫', '❌'];
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'celebration-particle warning-particle';
            particle.textContent = particles[Math.floor(Math.random() * particles.length)];

            const angle = (Math.PI * 2 * i) / 8;
            const radius = 90;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;

            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.animationDelay = (i * 0.05) + 's';

            document.body.appendChild(particle);

            setTimeout(() => particle.remove(), 1500);
        }
    }

    // Validação suave: mostra dicas amigáveis (não bloqueia)
    showSoftValidationTips(task) {
        const tips = [];

        // Verifica se tem prioridade mas não tem data
        if (task.priority && !task.dueDate) {
            tips.push({
                icon: '📅',
                message: 'Tarefa prioritária! Que tal definir um prazo?',
                type: 'date'
            });
        }

        // Verifica se tem data mas não tem tempo estimado
        if (task.dueDate && !task.timeEstimate) {
            tips.push({
                icon: '⏱️',
                message: 'Adicione um tempo estimado para usar o cronômetro!',
                type: 'time'
            });
        }

        // Verifica se é uma tarefa simples sem detalhes
        if (!task.priority && !task.dueDate && !task.timeEstimate && !task.notes && task.category === 'pessoal') {
            // Apenas 30% de chance de mostrar dica (não ser chato)
            if (Math.random() < 0.3) {
                tips.push({
                    icon: '💡',
                    message: 'Dica: Use categorias, datas e notas para organizar melhor!',
                    type: 'general'
                });
            }
        }

        // Mostra apenas a primeira dica (não sobrecarrega o usuário)
        if (tips.length > 0) {
            setTimeout(() => {
                this.showTipBadge(tips[0]);
            }, 3500); // Mostra depois da notificação de sucesso
        }
    }

    // Mostra badge de dica sutil no canto
    showTipBadge(tip) {
        const badge = document.createElement('div');
        badge.className = 'tip-badge';
        badge.innerHTML = `
            <span class="tip-icon">${tip.icon}</span>
            <span class="tip-message">${tip.message}</span>
            <button class="tip-close" onclick="this.parentElement.remove()">✕</button>
        `;

        document.body.appendChild(badge);

        // Animação de entrada
        setTimeout(() => badge.classList.add('show'), 100);

        // Remove automaticamente após 6 segundos
        setTimeout(() => {
            badge.classList.remove('show');
            setTimeout(() => badge.remove(), 300);
        }, 6000);
    }

    // Obter previsão do tempo
    async getWeather() {
        try {
            // Primeiro, tentar obter localização
            if ('geolocation' in navigator) {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const { latitude, longitude } = position.coords;
                        await this.fetchWeatherByCoords(latitude, longitude);
                    },
                    async () => {
                        // Se negar permissão, usar localização padrão
                        await this.fetchWeatherByCity('Sao Paulo');
                    }
                );
            } else {
                // Navegador não suporta geolocalização
                await this.fetchWeatherByCity('Sao Paulo');
            }
        } catch (error) {
            console.error('Erro ao obter clima:', error);
            this.updateWeatherDisplay('--°C', '📍 Localização', '🌤️');
        }
    }

    // Buscar clima por coordenadas
    async fetchWeatherByCoords(lat, lon) {
        try {
            // Usando wttr.in - API gratuita sem necessidade de chave
            const response = await fetch(`https://wttr.in/?format=j1`);
            const data = await response.json();

            const temp = data.current_condition[0].temp_C;
            const weatherDesc = data.current_condition[0].lang_pt ?
                data.current_condition[0].lang_pt[0].value :
                data.current_condition[0].weatherDesc[0].value;
            const location = data.nearest_area[0].areaName[0].value;

            const weatherIcon = this.getWeatherIcon(data.current_condition[0].weatherCode);

            this.updateWeatherDisplay(`${temp}°C`, location, weatherIcon);
        } catch (error) {
            console.error('Erro ao buscar clima por coordenadas:', error);
            await this.fetchWeatherByCity('Sao Paulo');
        }
    }

    // Buscar clima por cidade
    async fetchWeatherByCity(city) {
        try {
            const response = await fetch(`https://wttr.in/${city}?format=j1&lang=pt`);
            const data = await response.json();

            const temp = data.current_condition[0].temp_C;
            const weatherDesc = data.current_condition[0].lang_pt ?
                data.current_condition[0].lang_pt[0].value :
                data.current_condition[0].weatherDesc[0].value;
            const location = data.nearest_area[0].areaName[0].value;

            const weatherIcon = this.getWeatherIcon(data.current_condition[0].weatherCode);

            this.updateWeatherDisplay(`${temp}°C`, location, weatherIcon);
        } catch (error) {
            console.error('Erro ao buscar clima:', error);
            this.updateWeatherDisplay('--°C', 'Sem dados', '🌤️');
        }
    }

    // Atualizar display do clima
    updateWeatherDisplay(temp, location, icon) {
        const iconElement = this.weatherDisplay.querySelector('.weather-icon');
        const tempElement = this.weatherDisplay.querySelector('.weather-temp');
        const locationElement = this.weatherDisplay.querySelector('.weather-location');

        if (iconElement) iconElement.textContent = icon;
        if (tempElement) tempElement.textContent = temp;
        if (locationElement) locationElement.textContent = location;
    }

    // Obter ícone do clima baseado no código
    getWeatherIcon(code) {
        const weatherIcons = {
            113: '☀️',  // Ensolarado
            116: '⛅',  // Parcialmente nublado
            119: '☁️',  // Nublado
            122: '☁️',  // Muito nublado
            143: '🌫️',  // Névoa
            176: '🌦️',  // Possibilidade de chuva
            179: '🌨️',  // Possibilidade de neve
            182: '🌧️',  // Chuva leve
            185: '🌧️',  // Garoa congelante
            200: '⛈️',  // Trovoada
            227: '🌨️',  // Nevando
            230: '❄️',  // Nevasca
            248: '🌫️',  // Nevoeiro
            260: '🌫️',  // Nevoeiro congelante
            263: '🌦️',  // Garoa
            266: '🌦️',  // Chuva leve
            281: '🌧️',  // Garoa congelante
            284: '🌧️',  // Garoa forte
            293: '🌧️',  // Chuva leve
            296: '🌧️',  // Chuva leve
            299: '🌧️',  // Chuva moderada
            302: '🌧️',  // Chuva moderada
            305: '🌧️',  // Chuva forte
            308: '⛈️',  // Chuva torrencial
            311: '🌧️',  // Chuva congelante
            314: '🌧️',  // Chuva congelante forte
            317: '🌨️',  // Neve leve
            320: '🌨️',  // Neve moderada
            323: '🌨️',  // Neve
            326: '🌨️',  // Neve moderada
            329: '❄️',  // Neve forte
            332: '❄️',  // Neve forte
            335: '❄️',  // Neve muito forte
            338: '❄️',  // Nevasca
            350: '🌧️',  // Granizo
            353: '🌦️',  // Chuva leve
            356: '🌧️',  // Chuva moderada/forte
            359: '⛈️',  // Chuva torrencial
            362: '🌨️',  // Neve leve
            365: '🌨️',  // Neve moderada/forte
            368: '🌨️',  // Neve leve
            371: '❄️',  // Neve moderada/forte
            374: '🌧️',  // Granizo leve
            377: '🌧️',  // Granizo moderado/forte
            386: '⛈️',  // Trovoada
            389: '⛈️',  // Trovoada com chuva moderada/forte
            392: '⛈️',  // Trovoada com neve leve
            395: '⛈️'   // Trovoada com neve moderada/forte
        };

        return weatherIcons[code] || '🌤️';
    }
}

// ============================================
// SISTEMA DE METAS E OBJETIVOS
// ============================================

class GoalsManager {
    constructor() {
        this.goals = this.loadGoals();
        this.currentGoalId = null;
        this.initElements();
        this.bindEvents();
        this.renderGoals();
    }

    initElements() {
        this.goalsList = document.getElementById('goalsList');
        this.addGoalBtn = document.getElementById('addGoalBtn');
        this.goalModal = document.getElementById('goalModal');
        this.goalModalClose = document.getElementById('goalModalClose');
        this.goalModalCancel = document.getElementById('goalModalCancel');
        this.goalModalSave = document.getElementById('goalModalSave');
        this.goalModalTitle = document.getElementById('goalModalTitle');
        this.goalTitle = document.getElementById('goalTitle');
        this.goalDescription = document.getElementById('goalDescription');
        this.goalCategory = document.getElementById('goalCategory');
        this.goalDeadline = document.getElementById('goalDeadline');
        this.goalTarget = document.getElementById('goalTarget');
    }

    bindEvents() {
        this.addGoalBtn.addEventListener('click', () => this.openModal());
        this.goalModalClose.addEventListener('click', () => this.closeModal());
        this.goalModalCancel.addEventListener('click', () => this.closeModal());
        this.goalModalSave.addEventListener('click', () => this.saveGoal());
        this.goalModal.addEventListener('click', (e) => {
            if (e.target === this.goalModal) this.closeModal();
        });
    }

    loadGoals() {
        return JSON.parse(localStorage.getItem('goals')) || [];
    }

    saveGoals() {
        localStorage.setItem('goals', JSON.stringify(this.goals));
    }

    openModal(goalId = null) {
        this.currentGoalId = goalId;

        if (goalId) {
            const goal = this.goals.find(g => g.id === goalId);
            if (goal) {
                this.goalModalTitle.textContent = 'Editar Meta';
                this.goalTitle.value = goal.title;
                this.goalDescription.value = goal.description || '';
                this.goalCategory.value = goal.category;
                // Converter data ISO para formato YYYY-MM-DD para o input
                if (goal.deadline) {
                    const date = new Date(goal.deadline);
                    const year = date.getUTCFullYear();
                    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                    const day = String(date.getUTCDate()).padStart(2, '0');
                    this.goalDeadline.value = `${year}-${month}-${day}`;
                } else {
                    this.goalDeadline.value = '';
                }
                this.goalTarget.value = goal.target || '';
            }
        } else {
            this.goalModalTitle.textContent = 'Nova Meta';
            this.goalTitle.value = '';
            this.goalDescription.value = '';
            this.goalCategory.value = 'pessoal';
            this.goalDeadline.value = '';
            this.goalTarget.value = '';
        }

        this.goalModal.classList.add('active');
    }

    closeModal() {
        this.goalModal.classList.remove('active');
        this.currentGoalId = null;
    }

    saveGoal() {
        const title = this.goalTitle.value.trim();
        const deadline = this.goalDeadline.value;

        if (!title) {
            this.showGoalMessage('Por favor, digite um título para a meta!', 'error');
            return;
        }

        if (!deadline) {
            this.showGoalMessage('Por favor, defina uma data de prazo para a meta!', 'error');
            return;
        }

        // Converter a data para o timezone local para evitar bug do dia anterior
        const deadlineDate = new Date(deadline + 'T00:00:00');

        const goalData = {
            title,
            description: this.goalDescription.value.trim(),
            category: this.goalCategory.value,
            deadline: deadlineDate.toISOString(),
            target: parseInt(this.goalTarget.value) || null,
            progress: 0,
            createdAt: new Date().toISOString()
        };

        if (this.currentGoalId) {
            // Editar meta existente
            const index = this.goals.findIndex(g => g.id === this.currentGoalId);
            if (index !== -1) {
                this.goals[index] = { ...this.goals[index], ...goalData };
                this.showGoalMessage('✅ Meta atualizada com sucesso!', 'success');
            }
        } else {
            // Nova meta
            goalData.id = Date.now();
            this.goals.push(goalData);
            this.showGoalMessage('🎯 Nova meta criada com sucesso!', 'success');

            // Notificar sistema de gamificação
            if (window.gamificationSystem) {
                window.gamificationSystem.onGoalCreated();
            }
        }

        this.saveGoals();
        this.renderGoals();
        this.closeModal();
    }

    deleteGoal(goalId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) return;

        this.showDeleteConfirmation(goal.title, () => {
            this.goals = this.goals.filter(g => g.id !== goalId);
            this.saveGoals();
            this.renderGoals();
            this.showGoalMessage('🗑️ Meta excluída com sucesso!', 'success');
        });
    }

    showGoalMessage(message, type = 'success') {
        // Criar elemento de notificação
        const notification = document.createElement('div');
        notification.className = `goal-notification ${type}`;
        notification.innerHTML = `
            <div class="goal-notification-content">
                <span class="goal-notification-message">${message}</span>
                <button class="goal-notification-close">&times;</button>
            </div>
        `;

        document.body.appendChild(notification);

        // Fechar ao clicar no X
        notification.querySelector('.goal-notification-close').addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });

        // Mostrar notificação
        setTimeout(() => notification.classList.add('show'), 10);

        // Auto fechar após 3 segundos
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    showDeleteConfirmation(goalTitle, onConfirm) {
        const modal = document.createElement('div');
        modal.className = 'confirmation-modal';
        modal.innerHTML = `
            <div class="confirmation-content">
                <div class="confirmation-header">
                    <span class="confirmation-icon">⚠️</span>
                    <h3>Confirmar Exclusão</h3>
                </div>
                <p class="confirmation-message">
                    Tem certeza que deseja excluir a meta<br>
                    <strong>"${goalTitle}"</strong>?
                </p>
                <p class="confirmation-warning">Esta ação não pode ser desfeita.</p>
                <div class="confirmation-buttons">
                    <button class="confirmation-btn cancel">✕</button>
                    <button class="confirmation-btn confirm">🗑️</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);

        const closeModal = () => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        };

        modal.querySelector('.cancel').addEventListener('click', closeModal);
        modal.querySelector('.confirm').addEventListener('click', () => {
            onConfirm();
            closeModal();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    updateGoalProgress(goalId, progress) {
        const goal = this.goals.find(g => g.id === goalId);
        if (goal) {
            goal.progress = Math.min(100, Math.max(0, progress));
            this.saveGoals();
            this.renderGoals();
        }
    }

    getCategoryEmoji(category) {
        const emojis = {
            'pessoal': '🏠',
            'trabalho': '💼',
            'estudo': '📚',
            'saude': '❤️',
            'outros': '📌'
        };
        return emojis[category] || '📌';
    }

    renderGoals() {
        if (this.goals.length === 0) {
            this.goalsList.innerHTML = '<div class="empty-state-goals">Nenhuma meta criada. Comece adicionando uma meta!</div>';
            return;
        }

        this.goalsList.innerHTML = this.goals.map(goal => {
            const progressPercentage = goal.target ?
                Math.round((goal.progress / goal.target) * 100) : goal.progress;

            // Calcular informações de prazo
            const deadlineInfo = this.calculateDeadlineInfo(goal.deadline);
            const statusInfo = this.getGoalStatusInfo(progressPercentage, deadlineInfo);

            // CSS dinâmico baseado no progresso
            const dynamicCSS = this.getGoalDynamicCSS(progressPercentage, statusInfo.isOverdue);

            return `
                <div class="goal-card ${statusInfo.className}" data-goal-id="${goal.id}" style="${dynamicCSS}">
                    <div class="goal-header">
                        <div class="goal-header-left">
                            <div class="goal-title">${goal.title}</div>
                            <div class="goal-category" style="${this.getCategoryStyle(goal.category)}">
                                ${this.getCategoryEmoji(goal.category)} ${goal.category}
                            </div>
                        </div>
                        <div class="goal-header-right">
                            <div class="goal-status-badge ${statusInfo.status}">
                                ${statusInfo.label}
                            </div>
                            <div class="goal-quick-actions">
                                <button class="goal-quick-btn" onclick="window.goalsManager.incrementProgress(${goal.id}, 1)" title="+ 1">
                                    +1
                                </button>
                                <button class="goal-quick-btn" onclick="window.goalsManager.incrementProgress(${goal.id}, 5)" title="+ 5">
                                    +5
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    ${goal.description ? `<div class="goal-description">${goal.description}</div>` : ''}
                    
                    <div class="goal-progress">
                        <div class="goal-progress-info">
                            <div class="goal-progress-percentage">${progressPercentage}%</div>
                            <div class="goal-progress-stats">
                                ${goal.target ? `
                                    <div class="goal-progress-stat">
                                        <span>🎯</span>
                                        <span>${goal.progress} / ${goal.target}</span>
                                    </div>
                                ` : ''}
                                <div class="goal-progress-stat">
                                    <span>⚡</span>
                                    <span>${this.getProgressStreak(goal)}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="goal-progress-bar" style="${this.getProgressBarStyle(progressPercentage)}">
                            <div class="goal-progress-fill" style="width: ${Math.min(progressPercentage, 100)}%"></div>
                        </div>
                        
                        <div class="goal-progress-text">
                            <span>${progressPercentage >= 100 ? '🎉 Meta Concluída!' : 'Em progresso...'}</span>
                            ${goal.target && progressPercentage < 100 ? `<span>Faltam: ${goal.target - goal.progress}</span>` : ''}
                        </div>
                        
                        ${goal.target && progressPercentage < 100 ? `
                            <div class="goal-progress-increment">
                                <button class="goal-increment-btn" onclick="window.goalsManager.incrementProgress(${goal.id}, 1)">
                                    +1
                                </button>
                                <button class="goal-increment-btn" onclick="window.goalsManager.incrementProgress(${goal.id}, 5)">
                                    +5
                                </button>
                                <button class="goal-increment-btn" onclick="window.goalsManager.incrementProgress(${goal.id}, 10)">
                                    +10
                                </button>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="goal-deadline">
                        <div class="goal-deadline-info">
                            <span>📅</span>
                            <span>${deadlineInfo.text}</span>
                        </div>
                        ${deadlineInfo.daysLeft !== null ? `
                            <div class="goal-days-left ${deadlineInfo.urgency}">
                                ${deadlineInfo.daysLeft > 0 ? `${deadlineInfo.daysLeft}d restantes` :
                        deadlineInfo.daysLeft === 0 ? 'Hoje!' : 'Vencida'}
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="goal-actions">
                        <button class="goal-btn edit" onclick="window.goalsManager.openModal(${goal.id})">
                            ✏️
                        </button>
                        ${progressPercentage < 100 ? `
                            <button class="goal-btn complete" onclick="window.goalsManager.completeGoal(${goal.id})" style="background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%);">
                                ✅
                            </button>
                        ` : ''}
                        <button class="goal-btn delete" onclick="window.goalsManager.deleteGoal(${goal.id})">
                            🗑️
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Adicionar event listeners para micro-interações
        this.addGoalMicroInteractions();
    }

    // Funções auxiliares para melhorias dos goals
    calculateDeadlineInfo(deadline) {
        if (!deadline) {
            return { text: 'Sem prazo', daysLeft: null, urgency: 'normal' };
        }

        const deadlineDate = new Date(deadline);
        const today = new Date();
        deadlineDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        const diffTime = deadlineDate - today;
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let urgency = 'normal';
        if (daysLeft < 0) urgency = 'urgent';
        else if (daysLeft <= 3) urgency = 'urgent';
        else if (daysLeft <= 7) urgency = 'soon';

        const text = deadlineDate.toLocaleDateString('pt-BR', { timeZone: 'UTC' });

        return { text, daysLeft, urgency };
    }

    getGoalStatusInfo(percentage, deadlineInfo) {
        let status, label, className = '';

        if (percentage >= 100) {
            status = 'completed';
            label = '✅ Completa';
            className = 'completed';
        } else if (deadlineInfo.daysLeft !== null && deadlineInfo.daysLeft < 0) {
            status = 'overdue';
            label = '⚠️ Atrasada';
            className = 'overdue';
        } else {
            status = 'in-progress';
            label = '🚀 Ativa';
            className = '';
        }

        return {
            status,
            label,
            className,
            isOverdue: deadlineInfo.daysLeft !== null && deadlineInfo.daysLeft < 0
        };
    }

    getGoalDynamicCSS(percentage, isOverdue) {
        let gradient, glowColor;

        if (percentage >= 100) {
            gradient = 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)';
            glowColor = 'rgba(76, 175, 80, 0.4)';
        } else if (isOverdue) {
            gradient = 'linear-gradient(135deg, #ff6b6b 0%, #ff8a80 100%)';
            glowColor = 'rgba(255, 107, 107, 0.4)';
        } else if (percentage >= 75) {
            gradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            glowColor = 'rgba(102, 126, 234, 0.4)';
        } else if (percentage >= 50) {
            gradient = 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
            glowColor = 'rgba(79, 172, 254, 0.4)';
        } else {
            gradient = 'linear-gradient(135deg, #ffa726 0%, #ffcc02 100%)';
            glowColor = 'rgba(255, 167, 38, 0.4)';
        }

        return `--goal-progress-gradient: ${gradient}; --goal-glow-color: ${glowColor};`;
    }

    getCategoryStyle(category) {
        const categoryColors = {
            'pessoal': { bg: 'rgba(76, 175, 80, 0.2)', text: '#4caf50', border: 'rgba(76, 175, 80, 0.3)' },
            'trabalho': { bg: 'rgba(102, 126, 234, 0.2)', text: '#667eea', border: 'rgba(102, 126, 234, 0.3)' },
            'estudo': { bg: 'rgba(255, 167, 38, 0.2)', text: '#ffa726', border: 'rgba(255, 167, 38, 0.3)' },
            'saude': { bg: 'rgba(255, 107, 107, 0.2)', text: '#ff6b6b', border: 'rgba(255, 107, 107, 0.3)' },
            'compras': { bg: 'rgba(156, 39, 176, 0.2)', text: '#9c27b0', border: 'rgba(156, 39, 176, 0.3)' },
            'outros': { bg: 'rgba(121, 134, 203, 0.2)', text: '#7986cb', border: 'rgba(121, 134, 203, 0.3)' }
        };

        const colors = categoryColors[category] || categoryColors['outros'];
        return `--category-gradient: ${colors.bg}; --category-text: ${colors.text}; --category-border: ${colors.border};`;
    }

    getProgressStreak(goal) {
        // Simular streak baseado no progresso
        const streak = Math.floor((goal.progress || 0) / 5);
        return streak > 0 ? `${streak} dias` : 'Iniciando';
    }

    getProgressBarStyle(percentage) {
        const opacity = Math.min(percentage / 100 * 0.8 + 0.2, 1);
        return `--goal-glow-opacity: ${opacity};`;
    }

    incrementProgress(goalId, amount) {
        console.log('incrementProgress chamado:', { goalId, amount });

        const goal = this.goals.find(g => g.id === goalId);
        console.log('Goal encontrada:', goal);

        if (!goal) {
            console.error('Goal não encontrada com ID:', goalId);
            return;
        }

        if (!goal.target) {
            console.warn('Goal sem target definida:', goal);
            return;
        }

        const oldProgress = goal.progress;
        goal.progress = Math.min(goal.progress + amount, goal.target);

        console.log('Progresso atualizado:', { oldProgress, newProgress: goal.progress, target: goal.target });

        // Animação de incremento
        const goalCard = document.querySelector(`[data-goal-id="${goalId}"]`);
        if (goalCard) {
            goalCard.classList.add('celebrating');
            setTimeout(() => goalCard.classList.remove('celebrating'), 600);

            // Som de progresso
            this.playProgressSound(amount);

            // Notificação de progresso
            const percentage = Math.round((goal.progress / goal.target) * 100);
            this.showProgressNotification(goal.title, oldProgress, goal.progress, goal.target, percentage);
        }

        this.saveGoals();
        this.renderGoals();
    }

    completeGoal(goalId) {
        console.log('completeGoal chamado:', goalId);

        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) {
            console.error('Goal não encontrada:', goalId);
            return;
        }

        // Completar a meta
        if (goal.target) {
            goal.progress = goal.target;
        } else {
            // Para metas sem target específico, marcar como 100%
            goal.progress = 100;
        }

        // Animação de conclusão
        const goalCard = document.querySelector(`[data-goal-id="${goalId}"]`);
        if (goalCard) {
            goalCard.classList.add('celebrating');
            setTimeout(() => goalCard.classList.remove('celebrating'), 1000);
        }

        // Som de conclusão
        this.playCompletionSound();

        // Notificação de conclusão
        this.showCompletionNotification(goal.title);

        this.saveGoals();
        this.renderGoals();
    }

    playCompletionSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            // Acorde de conclusão: C-E-G
            const frequencies = [523, 659, 784];

            frequencies.forEach((freq, index) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.value = freq;
                oscillator.type = 'sine';

                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime + index * 0.1);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + index * 0.1 + 0.5);

                oscillator.start(audioContext.currentTime + index * 0.1);
                oscillator.stop(audioContext.currentTime + index * 0.1 + 0.5);
            });
        } catch (e) {
            console.log('Som de conclusão não suportado');
        }
    }

    showCompletionNotification(title) {
        const message = `🎉 Parabéns! Meta "${title}" concluída!`;

        // Usar o sistema de toast se existir
        if (window.todoApp && window.todoApp.showToast) {
            window.todoApp.showToast(message, 'success');
        } else {
            // Fallback: alerta simples
            alert(message);
        }
    }

    playProgressSound(amount) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const frequency = amount === 1 ? 523 : amount === 5 ? 659 : 784;

            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {
            console.log('Som não suportado');
        }
    }

    showProgressNotification(title, oldProgress, newProgress, target, percentage) {
        const increment = newProgress - oldProgress;
        let message = `+${increment} em "${title}"`;

        if (percentage >= 100) {
            message = `🎉 Meta "${title}" concluída!`;
        } else if (percentage >= 75) {
            message += ` (${percentage}% - Quase lá!)`;
        } else if (percentage >= 50) {
            message += ` (${percentage}% - Na metade!)`;
        } else if (percentage >= 25) {
            message += ` (${percentage}% - Bom progresso!)`;
        }

        // Usar o sistema de toast se existir
        if (window.todoApp && window.todoApp.showToast) {
            const type = percentage >= 100 ? 'success' : 'info';
            window.todoApp.showToast(message, type);
        }
    }

    addGoalMicroInteractions() {
        // Adicionar efeitos hover e click personalizados
        document.querySelectorAll('.goal-card').forEach(card => {
            card.addEventListener('mouseenter', (e) => {
                this.handleGoalHover(e.target, true);
            });

            card.addEventListener('mouseleave', (e) => {
                this.handleGoalHover(e.target, false);
            });
        });
    }

    handleGoalHover(card, isEntering) {
        const progressBar = card.querySelector('.goal-progress-bar');
        const quickActions = card.querySelector('.goal-quick-actions');

        if (isEntering) {
            if (progressBar) {
                progressBar.style.transform = 'scaleY(1.1)';
                progressBar.style.transition = 'transform 0.2s ease';
            }
            if (quickActions) {
                quickActions.style.opacity = '1';
            }
        } else {
            if (progressBar) {
                progressBar.style.transform = 'scaleY(1)';
            }
            if (quickActions) {
                quickActions.style.opacity = '0';
            }
        }
    }
}

// ============================================
// SISTEMA DE COMPROMISSOS E AGENDAMENTOS
// ============================================

class AppointmentsManager {
    constructor() {
        this.appointments = this.loadAppointments();
        this.currentAppointmentId = null;
        this.notificationCheckInterval = null;

        // Elementos do DOM
        this.appointmentModal = document.getElementById('appointmentModal');
        this.appointmentModalTitle = document.getElementById('appointmentModalTitle');
        this.appointmentTitle = document.getElementById('appointmentTitle');
        this.appointmentDate = document.getElementById('appointmentDate');
        this.appointmentTime = document.getElementById('appointmentTime');
        this.appointmentLocation = document.getElementById('appointmentLocation');
        this.appointmentDescription = document.getElementById('appointmentDescription');
        this.appointmentReminder = document.getElementById('appointmentReminder');
        this.appointmentCategory = document.getElementById('appointmentCategory');
        this.appointmentRecurrence = document.getElementById('appointmentRecurrence');
        this.recurrenceEnd = document.getElementById('recurrenceEnd');
        this.appointmentPriority = document.getElementById('appointmentPriority');
        this.appointmentDuration = document.getElementById('appointmentDuration');
        this.appointmentParticipants = document.getElementById('appointmentParticipants');
        this.appointmentsList = document.getElementById('appointmentsList');
        this.todayAppointments = document.getElementById('todayAppointments');
        this.nextCountdown = document.getElementById('nextCountdown');
        this.countdownTime = document.getElementById('countdownTime');

        // Novos elementos do calendário
        this.monthViewBtn = document.getElementById('monthView');
        this.weekViewBtn = document.getElementById('weekView');
        this.goToTodayBtn = document.getElementById('goToToday');
        this.monthViewContainer = document.getElementById('monthViewContainer');
        this.weekViewContainer = document.getElementById('weekViewContainer');

        this.currentView = 'month';
        this.currentDate = new Date();

        this.initEventListeners();
        this.renderAppointments();
        this.startNotificationChecker();
        this.updateTodayView();
        this.startCountdownTimer();
        this.initCalendarView();

        // Solicitar permissão para notificações
        this.requestNotificationPermission();
    }

    initEventListeners() {
        // Botão adicionar compromisso
        document.getElementById('addAppointmentBtn')?.addEventListener('click', () => this.openModal());

        // Botões do modal
        document.getElementById('appointmentModalClose')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeModal();
        });
        document.getElementById('appointmentModalCancel')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeModal();
        });
        document.getElementById('appointmentModalSave')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.saveAppointment();
        });

        // Fechar modal ao clicar fora
        this.appointmentModal?.addEventListener('click', (e) => {
            if (e.target === this.appointmentModal) {
                this.closeModal();
            }
        });

        // Event listener para mostrar/ocultar campo de fim de recorrência
        this.appointmentRecurrence?.addEventListener('change', (e) => {
            this.toggleRecurrenceEndField(e.target.value);
        });

        // Event listeners para detecção de conflitos
        this.appointmentDate?.addEventListener('change', () => this.checkTimeConflicts());
        this.appointmentTime?.addEventListener('change', () => this.checkTimeConflicts());

        // Event listeners para novos controles do calendário
        this.monthViewBtn?.addEventListener('click', () => this.switchCalendarView('month'));
        this.weekViewBtn?.addEventListener('click', () => this.switchCalendarView('week'));
        this.goToTodayBtn?.addEventListener('click', () => this.goToToday());

        // Event listener para preview em tempo real
        ['appointmentTitle', 'appointmentDate', 'appointmentTime', 'appointmentLocation', 'appointmentCategory', 'appointmentPriority'].forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('input', () => this.updateAppointmentPreview());
                field.addEventListener('change', () => this.updateAppointmentPreview());
            }
        });
    }

    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }

    // Métodos para novas funcionalidades
    toggleRecurrenceEndField(recurrenceValue) {
        const endGroup = document.getElementById('recurrenceEndGroup');
        if (endGroup) {
            if (recurrenceValue && recurrenceValue !== 'none') {
                endGroup.style.display = 'flex';
            } else {
                endGroup.style.display = 'none';
            }
        }
    }

    checkTimeConflicts() {
        const date = this.appointmentDate?.value;
        const time = this.appointmentTime?.value;

        if (!date || !time) return;

        const appointmentDateTime = new Date(`${date}T${time}`);
        const conflicts = this.appointments.filter(apt => {
            if (this.currentAppointmentId && apt.id === this.currentAppointmentId) {
                return false;
            }

            const aptDateTime = new Date(apt.dateTime);
            const timeDiff = Math.abs(appointmentDateTime - aptDateTime);
            return timeDiff < 60 * 60 * 1000;
        });

        this.displayConflictWarning(conflicts, appointmentDateTime);
    }

    displayConflictWarning(conflicts, selectedTime) {
        const existingWarning = document.querySelector('.conflict-warning');
        if (existingWarning) {
            existingWarning.remove();
        }

        if (conflicts.length === 0) return;

        const warningDiv = document.createElement('div');
        warningDiv.className = 'conflict-warning';

        const conflictList = conflicts.map(c => `${c.title} às ${new Date(c.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`).join(', ');

        warningDiv.innerHTML = `
            <div>
                <span class="conflict-icon">⚠️</span>
                <p>Conflito detectado com: ${conflictList}</p>
            </div>
        `;

        if (this.appointmentTime?.parentNode) {
            this.appointmentTime.parentNode.appendChild(warningDiv);
        }
    }

    updateTodayView() {
        if (!this.todayAppointments) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayAppts = this.appointments.filter(apt => {
            const aptDate = new Date(apt.dateTime);
            return aptDate >= today && aptDate < tomorrow;
        }).sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

        if (todayAppts.length === 0) {
            this.todayAppointments.innerHTML = `
                <div class="no-appointments">
                    <span class="no-appointments-icon">✨</span>
                    <p>Nenhum compromisso para hoje</p>
                </div>
            `;
            return;
        }

        this.todayAppointments.innerHTML = todayAppts.slice(0, 3).map(apt => {
            const aptDate = new Date(apt.dateTime);
            const timeStr = aptDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return `
                <div class="appointment-preview ${apt.category}">
                    <div class="appointment-info">
                        <h4>${apt.title}</h4>
                        <p>⏰ ${timeStr} ${apt.location ? `📍 ${apt.location}` : ''}</p>
                    </div>
                    <div class="appointment-status">
                        <span class="appointment-time">${timeStr}</span>
                        <span class="appointment-priority ${apt.priority || 'medium'}">${this.getPriorityLabel(apt.priority)}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    startCountdownTimer() {
        setInterval(() => {
            this.updateNextAppointmentCountdown();
        }, 1000);
    }

    updateNextAppointmentCountdown() {
        const now = new Date();
        const nextAppt = this.appointments
            .filter(apt => new Date(apt.dateTime) > now)
            .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))[0];

        if (!nextAppt || !this.nextCountdown || !this.countdownTime) {
            if (this.nextCountdown) this.nextCountdown.style.display = 'none';
            return;
        }

        const timeDiff = new Date(nextAppt.dateTime) - now;
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours < 4) {
            this.nextCountdown.style.display = 'block';
            this.countdownTime.textContent = `${hours}h ${minutes}m`;
        } else {
            this.nextCountdown.style.display = 'none';
        }
    }

    getPriorityLabel(priority) {
        const labels = {
            low: 'Baixa',
            medium: 'Média',
            high: 'Alta',
            urgent: 'Urgente'
        };
        return labels[priority] || labels.medium;
    }

    generateRecurrentAppointments(appointment, recurrence, endDate) {
        const appointments = [];
        const startDate = new Date(appointment.dateTime);
        const finalDate = endDate ? new Date(endDate) : new Date(startDate.getTime() + (365 * 24 * 60 * 60 * 1000));

        let currentDate = new Date(startDate);

        while (currentDate <= finalDate && appointments.length < 50) {
            switch (recurrence) {
                case 'daily':
                    currentDate.setDate(currentDate.getDate() + 1);
                    break;
                case 'weekly':
                    currentDate.setDate(currentDate.getDate() + 7);
                    break;
                case 'monthly':
                    currentDate.setMonth(currentDate.getMonth() + 1);
                    break;
                case 'yearly':
                    currentDate.setFullYear(currentDate.getFullYear() + 1);
                    break;
                default:
                    return appointments;
            }

            if (currentDate <= finalDate) {
                const newAppointment = {
                    ...appointment,
                    id: Date.now() + Math.random() + appointments.length,
                    dateTime: currentDate.toISOString(),
                    recurrenceParent: appointment.id
                };
                appointments.push(newAppointment);
            }
        }

        return appointments;
    }

    // Inicializar visualização do calendário
    initCalendarView() {
        this.currentDate = new Date(); // Garantir que inicia no mês atual
        this.switchCalendarView('month');

        // Fazer scroll para o dia atual após inicializar
        setTimeout(() => {
            this.scrollToToday();
        }, 200);
    }

    // Alternar entre vista mensal e semanal
    switchCalendarView(view) {
        this.currentView = view;

        // Atualizar botões
        this.monthViewBtn?.classList.toggle('active', view === 'month');
        this.weekViewBtn?.classList.toggle('active', view === 'week');

        // Mostrar/ocultar containers
        if (this.monthViewContainer && this.weekViewContainer) {
            this.monthViewContainer.style.display = view === 'month' ? 'block' : 'none';
            this.weekViewContainer.style.display = view === 'week' ? 'block' : 'none';
        }

        if (view === 'month') {
            this.renderMonthView();
        } else {
            this.renderWeekView();
        }
    }

    // Ir para hoje
    goToToday() {
        this.currentDate = new Date();
        if (this.currentView === 'month') {
            this.renderMonthView();
        } else {
            this.renderWeekView();
        }
        this.updateCalendarHeader();

        // Scroll suave para o dia atual após renderizar
        setTimeout(() => {
            this.scrollToToday();
        }, 100);
    }

    // Fazer scroll suave para o dia atual
    scrollToToday() {
        const todayElement = document.querySelector('.calendar-day.today');
        if (todayElement) {
            todayElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });

            // Adicionar um efeito de destaque temporário
            todayElement.style.animation = 'none';
            setTimeout(() => {
                todayElement.style.animation = 'todayPulse 2s infinite';
            }, 10);
        }
    }

    // Renderizar vista mensal aprimorada
    renderMonthView() {
        const calendarGrid = document.getElementById('calendarGrid');
        if (!calendarGrid) return;

        const today = new Date();
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        // Primeiro dia do mês
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        let html = '';
        let currentDate = new Date(startDate);

        // Gerar 6 semanas (42 dias)
        for (let i = 0; i < 42; i++) {
            const isToday = currentDate.toDateString() === today.toDateString();
            const isCurrentMonth = currentDate.getMonth() === month;
            const dayAppointments = this.getAppointmentsForDate(currentDate);

            html += `
                <div class="calendar-day ${isToday ? 'today' : ''} ${!isCurrentMonth ? 'other-month' : ''}" 
                     data-date="${currentDate.toISOString().split('T')[0]}"
                     onclick="appointmentsManager.openDayModal('${currentDate.toISOString().split('T')[0]}')">
                    <div class="day-number">${currentDate.getDate()}</div>
                    <div class="day-appointments">
                        ${dayAppointments.slice(0, 3).map(apt => `
                            <div class="day-appointment-indicator ${apt.category}" 
                                 title="${apt.title} - ${new Date(apt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}">
                            </div>
                        `).join('')}
                        ${dayAppointments.length > 3 ? `<div class="day-more-appointments">+${dayAppointments.length - 3} mais</div>` : ''}
                    </div>
                </div>
            `;

            currentDate.setDate(currentDate.getDate() + 1);
        }

        calendarGrid.innerHTML = html;
        this.updateCalendarHeader();
    }

    // Renderizar vista semanal
    renderWeekView() {
        const weekContainer = this.weekViewContainer;
        if (!weekContainer) return;

        // Obter primeira data da semana (domingo)
        const startOfWeek = new Date(this.currentDate);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

        // Gerar cabeçalho da semana
        this.renderWeekHeader(startOfWeek);
        this.renderWeekTimeLabels();
        this.renderWeekGrid(startOfWeek);

        // Atualizar linha de tempo atual
        setTimeout(() => this.updateCurrentTimeLine(), 100);
    }

    // Renderizar cabeçalho da semana
    renderWeekHeader(startOfWeek) {
        const weekHeader = document.getElementById('weekHeader');
        if (!weekHeader) return;

        const today = new Date();
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

        let html = '<div class="week-time-slot"></div>'; // Coluna vazia para alinhamento

        for (let i = 0; i < 7; i++) {
            const currentDay = new Date(startOfWeek);
            currentDay.setDate(currentDay.getDate() + i);
            const isToday = currentDay.toDateString() === today.toDateString();

            html += `
                <div class="week-day-header ${isToday ? 'today' : ''}">
                    <div class="day-name">${days[i]}</div>
                    <div class="day-date">${currentDay.getDate()}</div>
                </div>
            `;
        }

        weekHeader.innerHTML = html;
    }

    // Renderizar labels de horário
    renderWeekTimeLabels() {
        const timeLabels = document.getElementById('timeLabels');
        if (!timeLabels) return;

        let html = '';
        for (let hour = 8; hour <= 17; hour++) {
            const timeString = `${hour.toString().padStart(2, '0')}:00`;
            html += `<div class="time-slot">${timeString}</div>`;
        }

        timeLabels.innerHTML = html;
    }

    // Renderizar grid semanal
    renderWeekGrid(startOfWeek) {
        const weekGrid = document.getElementById('weekGrid');
        if (!weekGrid) return;

        let html = '';

        // Criar colunas para cada dia da semana
        for (let day = 0; day < 7; day++) {
            const currentDate = new Date(startOfWeek);
            currentDate.setDate(currentDate.getDate() + day);

            html += '<div class="week-day-column">';

            // Criar slots de hora para cada dia
            for (let hour = 8; hour <= 17; hour++) {
                html += `
                    <div class="week-hour-slot" 
                         data-date="${currentDate.toISOString().split('T')[0]}" 
                         data-hour="${hour}"
                         onclick="appointmentsManager.createQuickAppointment('${currentDate.toISOString().split('T')[0]}', ${hour})">
                    </div>
                `;
            }

            // Adicionar compromissos do dia
            const dayAppointments = this.getAppointmentsForDate(currentDate);
            dayAppointments.forEach(apt => {
                const aptDate = new Date(apt.dateTime);
                const startHour = aptDate.getHours();
                const minutes = aptDate.getMinutes();
                const duration = apt.duration || 60; // duração padrão 1 hora

                const topPosition = ((startHour - 8) * 60 + minutes) / 60 * 60; // 60px por hora, ajustado para início às 8h
                const height = (duration / 60) * 60; // altura baseada na duração

                html += `
                    <div class="week-appointment ${apt.category}" 
                         style="top: ${topPosition}px; height: ${height}px;"
                         onclick="appointmentsManager.openModal(${apt.id})"
                         title="${apt.title}">
                        <div class="apt-time">${aptDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        <div class="apt-title">${apt.title}</div>
                        ${apt.location ? `<div class="apt-location">📍 ${apt.location}</div>` : ''}
                    </div>
                `;
            });

            html += '</div>';
        }

        weekGrid.innerHTML = html;
    }

    // Criar compromisso rápido na vista semanal
    createQuickAppointment(dateStr, hour) {
        this.appointmentDate.value = dateStr;
        this.appointmentTime.value = `${hour.toString().padStart(2, '0')}:00`;
        this.openModal();
    }

    // Atualizar linha de tempo atual na vista semanal
    updateCurrentTimeLine() {
        if (this.currentView !== 'week') return;

        const now = new Date();
        const currentHour = now.getHours();
        const currentMinutes = now.getMinutes();
        const topPosition = (currentHour * 60 + currentMinutes) / 60 * 60; // 60px por hora

        // Remover linha anterior se existir
        const existingLine = document.querySelector('.current-time-line');
        if (existingLine) existingLine.remove();

        // Verificar se é hoje na semana atual
        const weekGrid = document.getElementById('weekGrid');
        if (!weekGrid) return;

        const currentDayColumn = this.getCurrentDayColumnIndex();
        if (currentDayColumn >= 0) {
            const timeLine = document.createElement('div');
            timeLine.className = 'current-time-line';
            timeLine.style.top = `${topPosition}px`;
            timeLine.style.left = `${currentDayColumn * (100 / 7)}%`;
            timeLine.style.width = `${100 / 7}%`;
            weekGrid.appendChild(timeLine);
        }
    }

    // Obter índice da coluna do dia atual
    getCurrentDayColumnIndex() {
        const today = new Date();
        const startOfWeek = this.getStartOfWeek(this.currentDate);

        for (let i = 0; i < 7; i++) {
            const dayCheck = new Date(startOfWeek);
            dayCheck.setDate(dayCheck.getDate() + i);
            if (dayCheck.toDateString() === today.toDateString()) {
                return i;
            }
        }
        return -1;
    }

    // Obter compromissos para uma data específica
    getAppointmentsForDate(date) {
        const dateStr = date.toISOString().split('T')[0];
        return this.appointments.filter(apt => {
            const aptDate = new Date(apt.dateTime).toISOString().split('T')[0];
            return aptDate === dateStr;
        }).sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
    }

    // Atualizar preview do compromisso em tempo real
    updateAppointmentPreview() {
        const previewCard = document.getElementById('appointmentPreviewCard');
        if (!previewCard) return;

        const title = this.appointmentTitle?.value || 'Novo Compromisso';
        const date = this.appointmentDate?.value;
        const time = this.appointmentTime?.value;
        const location = this.appointmentLocation?.value || '';
        const category = this.appointmentCategory?.value || 'outros';
        const priority = this.appointmentPriority?.value || 'medium';

        if (!date || !time) {
            previewCard.innerHTML = '<p style="color: #888; text-align: center;">Preencha data e horário para ver o preview</p>';
            return;
        }

        const dateTime = new Date(`${date}T${time}`);
        const categoryIcons = {
            trabalho: '💼',
            pessoal: '🏠',
            estudo: '📚',
            saude: '❤️',
            outros: '📌'
        };

        const priorityColors = {
            low: '#22c55e',
            medium: '#fbbf24',
            high: '#f97316',
            urgent: '#ef4444'
        };

        previewCard.innerHTML = `
            <div class="preview-title">${categoryIcons[category]} ${title}</div>
            <div class="preview-details">
                <div class="preview-item">
                    <span>📅</span>
                    <span>${dateTime.toLocaleDateString('pt-BR')}</span>
                </div>
                <div class="preview-item">
                    <span>⏰</span>
                    <span>${dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                ${location ? `
                <div class="preview-item">
                    <span>📍</span>
                    <span>${location}</span>
                </div>` : ''}
                <div class="preview-item">
                    <span>⭐</span>
                    <span style="color: ${priorityColors[priority]}">${this.getPriorityLabel(priority)}</span>
                </div>
            </div>
        `;
    }

    // Atualizar cabeçalho do calendário
    updateCalendarHeader() {
        const monthYearElement = document.getElementById('calendarMonthYear');
        if (!monthYearElement) return;

        const months = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];

        if (this.currentView === 'month') {
            monthYearElement.textContent = `${months[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
        } else {
            const startOfWeek = new Date(this.currentDate);
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(endOfWeek.getDate() + 6);

            monthYearElement.textContent = `${startOfWeek.getDate()} - ${endOfWeek.getDate()} de ${months[startOfWeek.getMonth()]} ${startOfWeek.getFullYear()}`;
        }
    }

    // Abrir modal de tarefas do dia
    openDayModal(dateStr) {
        const appointments = this.getAppointmentsForDate(new Date(dateStr + 'T00:00:00'));
        const date = new Date(dateStr + 'T00:00:00');

        // Aqui você pode implementar um modal específico para mostrar os compromissos do dia
        // Por enquanto, vou apenas mostrar um alert
        if (appointments.length > 0) {
            const appointmentsList = appointments.map(apt =>
                `• ${apt.title} às ${new Date(apt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            ).join('\n');

            alert(`Compromissos de ${date.toLocaleDateString('pt-BR')}:\n\n${appointmentsList}`);
        } else {
            // Abrir modal para criar novo compromisso nesta data
            this.appointmentDate.value = dateStr;
            this.openModal();
        }
    }

    loadAppointments() {
        const stored = localStorage.getItem('appointments');
        return stored ? JSON.parse(stored) : [];
    }

    saveToStorage() {
        localStorage.setItem('appointments', JSON.stringify(this.appointments));
    }

    openModal(appointmentId = null) {
        this.currentAppointmentId = appointmentId;

        if (appointmentId) {
            const appointment = this.appointments.find(a => a.id === appointmentId);
            if (appointment) {
                this.appointmentModalTitle.textContent = 'Editar Compromisso';
                this.appointmentTitle.value = appointment.title;

                // Converter data ISO para formato YYYY-MM-DD
                const date = new Date(appointment.dateTime);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                this.appointmentDate.value = `${year}-${month}-${day}`;

                // Extrair horário
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                this.appointmentTime.value = `${hours}:${minutes}`;

                this.appointmentLocation.value = appointment.location || '';
                this.appointmentDescription.value = appointment.description || '';
                this.appointmentReminder.value = appointment.reminder || '1hour';
                this.appointmentCategory.value = appointment.category || 'pessoal';
                if (this.appointmentRecurrence) this.appointmentRecurrence.value = appointment.recurrence || 'none';
                if (this.appointmentPriority) this.appointmentPriority.value = appointment.priority || 'medium';
                if (this.recurrenceEnd) this.recurrenceEnd.value = appointment.recurrenceEnd || '';
                if (this.appointmentDuration) this.appointmentDuration.value = appointment.duration || '60';
                if (this.appointmentParticipants) this.appointmentParticipants.value = appointment.participants || '';

                // Mostrar/ocultar campo de fim de recorrência
                this.toggleRecurrenceEndField(appointment.recurrence || 'none');
            }
        } else {
            this.appointmentModalTitle.textContent = 'Novo Compromisso';
            this.appointmentTitle.value = '';
            this.appointmentDate.value = '';
            this.appointmentTime.value = '';
            this.appointmentLocation.value = '';
            this.appointmentDescription.value = '';
            this.appointmentReminder.value = '1hour';
            this.appointmentCategory.value = 'trabalho';
            if (this.appointmentRecurrence) this.appointmentRecurrence.value = 'none';
            if (this.appointmentPriority) this.appointmentPriority.value = 'medium';
            if (this.recurrenceEnd) this.recurrenceEnd.value = '';
            if (this.appointmentDuration) this.appointmentDuration.value = '60';
            if (this.appointmentParticipants) this.appointmentParticipants.value = '';

            // Ocultar campo de fim de recorrência
            this.toggleRecurrenceEndField('none');
        }

        this.appointmentModal.classList.add('active');

        // Atualizar preview após pequeno delay para garantir que os campos estejam carregados
        setTimeout(() => {
            this.updateAppointmentPreview();
        }, 100);
    }

    closeModal() {
        const modal = document.getElementById('appointmentModal');
        if (modal) {
            modal.classList.remove('active');
        }

        this.currentAppointmentId = null;

        // Limpar o formulário
        this.appointmentTitle.value = '';
        this.appointmentDate.value = '';
        this.appointmentTime.value = '';
        this.appointmentLocation.value = '';
        this.appointmentDescription.value = '';
        this.appointmentReminder.value = 'none';
        this.appointmentCategory.value = 'work';
    }

    saveAppointment() {
        const title = this.appointmentTitle.value.trim();
        const date = this.appointmentDate.value;
        const time = this.appointmentTime.value;

        if (!title) {
            this.showAppointmentMessage('Por favor, digite um título para o compromisso!', 'error');
            return;
        }

        if (!date) {
            this.showAppointmentMessage('Por favor, selecione uma data!', 'error');
            return;
        }

        if (!time) {
            this.showAppointmentMessage('Por favor, selecione um horário!', 'error');
            return;
        }

        // Combinar data e hora (garantir timezone local)
        const [hours, minutes] = time.split(':');
        const dateTime = new Date(date + 'T00:00:00');
        dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        const appointmentData = {
            title,
            dateTime: dateTime.toISOString(),
            location: this.appointmentLocation.value.trim(),
            description: this.appointmentDescription.value.trim(),
            reminder: this.appointmentReminder.value,
            category: this.appointmentCategory.value,
            recurrence: this.appointmentRecurrence ? this.appointmentRecurrence.value : 'none',
            recurrenceEnd: this.recurrenceEnd ? this.recurrenceEnd.value : '',
            priority: this.appointmentPriority ? this.appointmentPriority.value : 'medium',
            duration: this.appointmentDuration ? parseInt(this.appointmentDuration.value) : 60,
            participants: this.appointmentParticipants ? this.appointmentParticipants.value.trim() : '',
            notified: false,
            createdAt: new Date().toISOString()
        };

        if (this.currentAppointmentId) {
            // Editar compromisso existente
            const index = this.appointments.findIndex(a => a.id === this.currentAppointmentId);
            if (index !== -1) {
                this.appointments[index] = { ...this.appointments[index], ...appointmentData };
                this.showAppointmentMessage('✅ Compromisso atualizado com sucesso!', 'success');
            }
        } else {
            // Novo compromisso
            appointmentData.id = Date.now();
            this.appointments.push(appointmentData);

            // Gerar compromissos recorrentes se necessário
            if (appointmentData.recurrence && appointmentData.recurrence !== 'none') {
                const recurrentAppointments = this.generateRecurrentAppointments(
                    appointmentData,
                    appointmentData.recurrence,
                    appointmentData.recurrenceEnd
                );
                this.appointments.push(...recurrentAppointments);

                this.showAppointmentMessage(`📅 Compromisso recorrente agendado! ${recurrentAppointments.length + 1} ocorrências criadas.`, 'success');
            } else {
                this.showAppointmentMessage('📅 Compromisso agendado com sucesso!', 'success');
            }

            // Tocar som de sucesso (verificar se existe o método)
            if (window.soundSystem && typeof window.soundSystem.playSound === 'function') {
                window.soundSystem.playSound('complete');
            }
        }

        this.saveToStorage();
        this.renderAppointments();
        this.updateTodayView(); // Atualizar vista de hoje

        // Fechar modal usando método closeModal para garantir
        this.closeModal();

        // Atualizar calendário FORÇADAMENTE após salvar
        if (window.calendarManager) {
            // Usar setTimeout para garantir que a atualização aconteça após o modal fechar
            setTimeout(() => {
                window.calendarManager.currentDate = new Date(window.calendarManager.currentDate);
                window.calendarManager.render();
            }, 50);
        }
    }

    deleteAppointment(appointmentId) {
        const appointment = this.appointments.find(a => a.id === appointmentId);
        if (!appointment) return;

        // Mostrar modal de confirmação personalizado
        this.showDeleteConfirmation(appointment, () => {
            this.appointments = this.appointments.filter(a => a.id !== appointmentId);
            this.saveToStorage();
            this.renderAppointments();
            this.showAppointmentMessage('🗑️ Compromisso excluído com sucesso!', 'success');

            // Fechar o modal do dia (agenda)
            const dayModal = document.getElementById('dayTasksModal');
            if (dayModal) {
                dayModal.classList.remove('show');
            }

            // Atualizar calendário imediatamente
            if (window.calendarManager) {
                window.calendarManager.render();
            }
        });
    }

    showDeleteConfirmation(appointment, onConfirm) {
        const modal = document.getElementById('deleteAppointmentModal');
        const message = document.getElementById('deleteAppointmentMessage');
        const cancelBtn = document.getElementById('deleteAppointmentCancel');
        const confirmBtn = document.getElementById('deleteAppointmentConfirm');

        message.textContent = `Tem certeza que deseja excluir "${appointment.title}"?`;

        const closeModal = () => {
            modal.classList.remove('show');
        };

        cancelBtn.onclick = closeModal;

        confirmBtn.onclick = () => {
            closeModal();
            if (onConfirm) onConfirm();
        };

        modal.onclick = (e) => {
            if (e.target === modal) {
                closeModal();
            }
        };

        modal.classList.add('show');
    }

    renderAppointments() {
        // Não renderizar cards - compromissos aparecem apenas no calendário
        this.appointmentsList.innerHTML = '';
    }

    showAppointmentMessage(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `appointment-notification ${type}`;
        notification.innerHTML = `
            <div class="appointment-notification-content">
                <span class="appointment-notification-message">${message}</span>
                <button class="appointment-notification-close">&times;</button>
            </div>
        `;

        document.body.appendChild(notification);

        const closeBtn = notification.querySelector('.appointment-notification-close');
        closeBtn.addEventListener('click', () => notification.remove());

        setTimeout(() => notification.classList.add('show'), 10);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    startNotificationChecker() {
        // Verificar a cada minuto
        this.notificationCheckInterval = setInterval(() => {
            this.checkNotifications();
        }, 60000); // 60 segundos

        // Verificar imediatamente ao iniciar
        this.checkNotifications();
    }

    checkNotifications() {
        const now = new Date();

        this.appointments.forEach(appointment => {
            if (appointment.notified) return;

            const appointmentDate = new Date(appointment.dateTime);
            const diffMs = appointmentDate - now;
            const diffMinutes = Math.floor(diffMs / 60000);

            let shouldNotify = false;
            let notificationTitle = '';
            let notificationBody = '';

            // Verificar tipo de lembrete
            switch (appointment.reminder) {
                case 'moment':
                    if (diffMinutes <= 0 && diffMinutes > -5) {
                        shouldNotify = true;
                        notificationTitle = '🔔 Compromisso Agora!';
                        notificationBody = `${appointment.title} está acontecendo agora!`;
                    }
                    break;
                case '15min':
                    if (diffMinutes <= 15 && diffMinutes > 10) {
                        shouldNotify = true;
                        notificationTitle = '⏰ Compromisso em 15 minutos';
                        notificationBody = appointment.title;
                    }
                    break;
                case '30min':
                    if (diffMinutes <= 30 && diffMinutes > 25) {
                        shouldNotify = true;
                        notificationTitle = '⏰ Compromisso em 30 minutos';
                        notificationBody = appointment.title;
                    }
                    break;
                case '1hour':
                    if (diffMinutes <= 60 && diffMinutes > 55) {
                        shouldNotify = true;
                        notificationTitle = '⏰ Compromisso em 1 hora';
                        notificationBody = appointment.title;
                    }
                    break;
                case '2hours':
                    if (diffMinutes <= 120 && diffMinutes > 115) {
                        shouldNotify = true;
                        notificationTitle = '⏰ Compromisso em 2 horas';
                        notificationBody = appointment.title;
                    }
                    break;
                case '1day':
                    if (diffMinutes <= 1440 && diffMinutes > 1435) {
                        shouldNotify = true;
                        notificationTitle = '📅 Compromisso amanhã';
                        notificationBody = appointment.title;
                    }
                    break;
            }

            if (shouldNotify) {
                this.sendNotification(notificationTitle, notificationBody, appointment);
                appointment.notified = true;
                this.saveToStorage();
            }
        });
    }

    sendNotification(title, body, appointment) {
        // Notificação do navegador
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(title, {
                body: body,
                icon: '📅',
                badge: '📅',
                tag: `appointment-${appointment.id}`,
                requireInteraction: true
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        }

        // Notificação visual no app
        this.showAppointmentMessage(`${title}: ${body}`, 'warning');

        // Tocar som de notificação
        if (window.soundSystem) {
            window.soundSystem.playSound('notification');
        }
    }

    getAppointmentsByDate(date) {
        // Normalizar a data para comparação (ignorar horário)
        const searchDate = new Date(date);
        searchDate.setHours(0, 0, 0, 0);
        const dateStr = searchDate.toISOString().split('T')[0];

        return this.appointments.filter(appointment => {
            const appointmentDate = new Date(appointment.dateTime);
            appointmentDate.setHours(0, 0, 0, 0);
            const appointmentDateStr = appointmentDate.toISOString().split('T')[0];
            return appointmentDateStr === dateStr;
        });
    }

    showAppointmentDetail(appointmentId) {
        const appointment = this.appointments.find(a => a.id === appointmentId);
        if (!appointment) return;

        const modal = document.getElementById('appointmentDetailModal');
        const body = document.getElementById('appointmentDetailBody');

        const appointmentDate = new Date(appointment.dateTime);
        const dateText = appointmentDate.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
        const timeText = appointmentDate.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const categoryEmojis = {
            pessoal: '🏠',
            trabalho: '💼',
            estudo: '📚',
            saude: '❤️',
            outros: '📌'
        };

        const reminderTexts = {
            none: 'Sem lembrete',
            moment: 'No momento',
            '15min': '15 minutos antes',
            '30min': '30 minutos antes',
            '1hour': '1 hora antes',
            '2hours': '2 horas antes',
            '1day': '1 dia antes'
        };

        body.innerHTML = `
            <div class="appointment-detail-info">
                <div class="appointment-detail-title">📅 ${appointment.title}</div>
                <div class="appointment-detail-item">
                    <span class="detail-label">📅 Data:</span>
                    <span class="detail-value">${dateText}</span>
                </div>
                <div class="appointment-detail-item">
                    <span class="detail-label">⏰ Horário:</span>
                    <span class="detail-value">${timeText}</span>
                </div>
                ${appointment.location ? `
                    <div class="appointment-detail-item">
                        <span class="detail-label">📍 Local:</span>
                        <span class="detail-value">${appointment.location}</span>
                    </div>
                ` : ''}
                <div class="appointment-detail-item">
                    <span class="detail-label">📁 Categoria:</span>
                    <span class="detail-value">${categoryEmojis[appointment.category]} ${appointment.category}</span>
                </div>
                <div class="appointment-detail-item">
                    <span class="detail-label">🔔 Lembrete:</span>
                    <span class="detail-value">${reminderTexts[appointment.reminder]}</span>
                </div>
                ${appointment.description ? `
                    <div class="appointment-detail-item description">
                        <span class="detail-label">📄 Descrição:</span>
                        <div class="detail-value-block">${appointment.description}</div>
                    </div>
                ` : ''}
            </div>
        `;

        // Event listeners para botões
        const editBtn = document.getElementById('appointmentDetailEdit');
        const deleteBtn = document.getElementById('appointmentDetailDelete');
        const closeBtn = document.getElementById('appointmentDetailClose');

        editBtn.onclick = () => {
            modal.classList.remove('show');
            // Fechar também o modal do dia se estiver aberto
            const dayModal = document.getElementById('dayTasksModal');
            if (dayModal) {
                dayModal.classList.remove('show');
            }
            this.openModal(appointmentId);
        };

        deleteBtn.onclick = () => {
            modal.classList.remove('show');
            this.deleteAppointment(appointmentId);
        };

        closeBtn.onclick = () => {
            modal.classList.remove('show');
        };

        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        };

        modal.classList.add('show');
    }
}

// ============================================
// SISTEMA DE GAMIFICAÇÃO E CONQUISTAS
// ============================================

class GamificationSystem {
    constructor() {
        this.achievements = this.initAchievements();
        this.userStats = this.loadUserStats();
        this.initElements();
        this.generateDailyChallenge();
        this.resetDailyStats();
        this.renderStats();
        this.renderAchievements();
        this.renderDailyChallenge();
        this.checkDailyStreak();
    }

    initElements() {
        this.userLevel = document.getElementById('userLevel');
        this.userPoints = document.getElementById('userPoints');
        this.userStreak = document.getElementById('userStreak');
        this.totalCompleted = document.getElementById('totalCompleted');
        this.currentLevel = document.getElementById('currentLevel');
        this.currentXP = document.getElementById('currentXP');
        this.nextLevelXP = document.getElementById('nextLevelXP');
        this.levelFill = document.getElementById('levelFill');
        this.achievementsGrid = document.getElementById('achievementsGrid');
        this.achievementNotification = document.getElementById('achievementNotification');
        this.achievementName = document.getElementById('achievementName');
        this.achievementXP = document.getElementById('achievementXP');
    }

    initAchievements() {
        return [
            // Conquistas de Tarefas Básicas
            { id: 'first_task', name: 'Primeira Tarefa', description: 'Complete sua primeira tarefa', icon: '🌟', xp: 10, tier: 'bronze', unlocked: false, condition: (stats) => stats.totalCompleted >= 1 },
            { id: 'task_5', name: 'Produtivo', description: 'Complete 5 tarefas', icon: '⭐', xp: 25, tier: 'bronze', unlocked: false, condition: (stats) => stats.totalCompleted >= 5 },
            { id: 'task_10', name: 'Dedicado', description: 'Complete 10 tarefas', icon: '🏅', xp: 50, tier: 'bronze', unlocked: false, condition: (stats) => stats.totalCompleted >= 10 },
            { id: 'task_25', name: 'Comprometido', description: 'Complete 25 tarefas', icon: '🎖️', xp: 100, tier: 'prata', unlocked: false, condition: (stats) => stats.totalCompleted >= 25 },
            { id: 'task_50', name: 'Expert', description: 'Complete 50 tarefas', icon: '🏆', xp: 200, tier: 'ouro', unlocked: false, condition: (stats) => stats.totalCompleted >= 50 },
            { id: 'task_100', name: 'Mestre', description: 'Complete 100 tarefas', icon: '👑', xp: 500, tier: 'diamante', unlocked: false, condition: (stats) => stats.totalCompleted >= 100 },
            { id: 'task_250', name: 'Lendário', description: 'Complete 250 tarefas', icon: '💎', xp: 1000, tier: 'lendario', unlocked: false, condition: (stats) => stats.totalCompleted >= 250 },

            // Conquistas de Sequência (Streak)
            { id: 'streak_3', name: 'Consistente', description: '3 dias de sequência', icon: '🔥', xp: 50, tier: 'bronze', unlocked: false, condition: (stats) => stats.streak >= 3 },
            { id: 'streak_7', name: 'Persistente', description: '7 dias de sequência', icon: '💪', xp: 100, tier: 'prata', unlocked: false, condition: (stats) => stats.streak >= 7 },
            { id: 'streak_15', name: 'Determinado', description: '15 dias de sequência', icon: '⚡', xp: 250, tier: 'ouro', unlocked: false, condition: (stats) => stats.streak >= 15 },
            { id: 'streak_30', name: 'Imparável', description: '30 dias de sequência', icon: '🚀', xp: 500, tier: 'diamante', unlocked: false, condition: (stats) => stats.streak >= 30 },
            { id: 'streak_60', name: 'Titã', description: '60 dias de sequência', icon: '🦸', xp: 1500, tier: 'lendario', unlocked: false, condition: (stats) => stats.streak >= 60 },

            // Conquistas de Metas
            { id: 'first_goal', name: 'Planejador', description: 'Crie sua primeira meta', icon: '🎯', xp: 25, tier: 'bronze', unlocked: false, condition: (stats) => stats.goalsCreated >= 1 },
            { id: 'goal_complete', name: 'Realizador', description: 'Complete uma meta', icon: '✨', xp: 100, tier: 'prata', unlocked: false, condition: (stats) => stats.goalsCompleted >= 1 },
            { id: 'goal_5', name: 'Visionário', description: 'Complete 5 metas', icon: '🌠', xp: 300, tier: 'ouro', unlocked: false, condition: (stats) => stats.goalsCompleted >= 5 },
            { id: 'goal_10', name: 'Conquistador', description: 'Complete 10 metas', icon: '🏰', xp: 750, tier: 'diamante', unlocked: false, condition: (stats) => stats.goalsCompleted >= 10 },

            // Conquistas de Prioridade
            { id: 'priority_master', name: 'Focado', description: 'Complete 10 tarefas prioritárias', icon: '🎪', xp: 150, tier: 'prata', unlocked: false, condition: (stats) => stats.priorityCompleted >= 10 },
            { id: 'priority_25', name: 'Estrategista', description: 'Complete 25 tarefas prioritárias', icon: '🎯', xp: 300, tier: 'ouro', unlocked: false, condition: (stats) => stats.priorityCompleted >= 25 },
            { id: 'priority_50', name: 'Maestro', description: 'Complete 50 tarefas prioritárias', icon: '🎼', xp: 600, tier: 'diamante', unlocked: false, condition: (stats) => stats.priorityCompleted >= 50 },

            // Conquistas Especiais
            { id: 'early_bird', name: 'Madrugador', description: 'Complete uma tarefa antes das 7h', icon: '🌅', xp: 100, tier: 'especial', unlocked: false, condition: (stats) => stats.earlyBirdTasks >= 1 },
            { id: 'night_owl', name: 'Coruja Noturna', description: 'Complete uma tarefa depois das 23h', icon: '🦉', xp: 100, tier: 'especial', unlocked: false, condition: (stats) => stats.nightOwlTasks >= 1 },
            { id: 'speed_demon', name: 'Veloz', description: 'Complete 10 tarefas em um dia', icon: '⚡', xp: 200, tier: 'especial', unlocked: false, condition: (stats) => stats.maxTasksOneDay >= 10 },
            { id: 'perfectionist', name: 'Perfeccionista', description: 'Complete todas as tarefas do dia 7 dias seguidos', icon: '💯', xp: 500, tier: 'especial', unlocked: false, condition: (stats) => stats.perfectDays >= 7 },
            { id: 'pomodoro_master', name: 'Mestre Pomodoro', description: 'Use o Pomodoro 25 vezes', icon: '🍅', xp: 250, tier: 'especial', unlocked: false, condition: (stats) => stats.pomodoroSessions >= 25 },
        ];
    }

    loadUserStats() {
        const defaultStats = {
            level: 1,
            xp: 0,
            totalCompleted: 0,
            streak: 0,
            lastActiveDate: null,
            goalsCreated: 0,
            goalsCompleted: 0,
            priorityCompleted: 0,
            earlyBirdTasks: 0,
            nightOwlTasks: 0,
            maxTasksOneDay: 0,
            tasksToday: 0,
            perfectDays: 0,
            pomodoroSessions: 0,
            currentTitle: 'Novato',
            unlockedAchievements: [],
            dailyChallenge: null,
            dailyChallengeCompleted: false
        };
        return JSON.parse(localStorage.getItem('userStats')) || defaultStats;
    }

    saveUserStats() {
        localStorage.setItem('userStats', JSON.stringify(this.userStats));
    }

    addXP(amount, reason = '') {
        this.userStats.xp += amount;

        // Calcular nível baseado em XP
        const xpForNextLevel = this.getXPForLevel(this.userStats.level + 1);

        if (this.userStats.xp >= xpForNextLevel) {
            this.levelUp();
        }

        this.saveUserStats();
        this.renderStats();
    }

    levelUp() {
        // Tocar som de level up
        if (window.soundSystem) {
            window.soundSystem.playLevelUp();
        }

        this.userStats.level++;
        this.showLevelUpNotification();
        this.saveUserStats();
    }

    getXPForLevel(level) {
        return Math.floor(100 * Math.pow(1.5, level - 1));
    }

    showLevelUpNotification() {
        // Pode adicionar notificação de level up aqui
        console.log(`🎉 Parabéns! Você subiu para o nível ${this.userStats.level}!`);
    }

    onTaskCompleted(taskData = {}) {
        // Tocar som de sucesso
        if (window.soundSystem) {
            window.soundSystem.playSuccess();
        }

        this.userStats.totalCompleted++;
        this.userStats.tasksToday++;
        console.log('✅ Tarefa concluída! Total:', this.userStats.totalCompleted);
        this.addXP(10, 'Tarefa concluída');

        // Verificar hora da conclusão
        const hour = new Date().getHours();
        if (hour < 7) {
            this.userStats.earlyBirdTasks++;
        } else if (hour >= 23) {
            this.userStats.nightOwlTasks++;
        }

        // Atualizar máximo de tarefas em um dia
        if (this.userStats.tasksToday > this.userStats.maxTasksOneDay) {
            this.userStats.maxTasksOneDay = this.userStats.tasksToday;
        }

        if (taskData.priority) {
            this.userStats.priorityCompleted++;
            this.addXP(5, 'Tarefa prioritária');
        }

        this.updateDailyStreak();
        this.checkDailyChallenge();
        this.checkAchievements();
        this.updateTitle();
        this.saveUserStats();
        this.renderStats();
    }

    onGoalCreated() {
        this.userStats.goalsCreated++;
        this.addXP(15, 'Meta criada');
        this.checkAchievements();
        this.saveUserStats();
    }

    onGoalCompleted() {
        // Tocar som de meta completada
        if (window.soundSystem) {
            window.soundSystem.playGoalComplete();
        }

        this.userStats.goalsCompleted++;
        this.addXP(50, 'Meta completada');
        this.checkAchievements();
        this.saveUserStats();
    }

    updateDailyStreak() {
        const today = new Date().toDateString();
        const lastActive = this.userStats.lastActiveDate;

        if (!lastActive) {
            this.userStats.streak = 1;
        } else {
            const lastDate = new Date(lastActive).toDateString();
            const yesterday = new Date(Date.now() - 86400000).toDateString();

            if (lastDate === yesterday) {
                this.userStats.streak++;
            } else if (lastDate !== today) {
                this.userStats.streak = 1;
            }
        }

        this.userStats.lastActiveDate = today;
        this.saveUserStats();
    }

    resetDailyStats() {
        const today = new Date().toDateString();
        const lastDate = this.userStats.lastActiveDate;

        if (lastDate !== today) {
            this.userStats.tasksToday = 0;
            this.saveUserStats();
        }
    }

    checkDailyStreak() {
        const today = new Date().toDateString();
        const lastActive = this.userStats.lastActiveDate;

        if (lastActive) {
            const lastDate = new Date(lastActive).toDateString();
            const yesterday = new Date(Date.now() - 86400000).toDateString();

            if (lastDate !== today && lastDate !== yesterday) {
                this.userStats.streak = 0;
                this.saveUserStats();
            }
        }
    }

    checkAchievements() {
        console.log('🔍 Verificando conquistas... Total concluídas:', this.userStats.totalCompleted);
        this.achievements.forEach(achievement => {
            if (!this.userStats.unlockedAchievements.includes(achievement.id)) {
                if (achievement.condition(this.userStats)) {
                    console.log('🎉 Conquista desbloqueada!', achievement.name);
                    this.unlockAchievement(achievement);
                }
            }
        });
    }

    unlockAchievement(achievement) {
        this.userStats.unlockedAchievements.push(achievement.id);
        achievement.unlocked = true;
        this.addXP(achievement.xp, `Conquista: ${achievement.name}`);
        this.showAchievementNotification(achievement);
        this.saveUserStats();
        this.renderAchievements();
    }

    showAchievementNotification(achievement) {
        // Tocar som de conquista
        if (window.soundSystem) {
            window.soundSystem.playAchievement();
        }

        this.achievementName.textContent = achievement.name;
        this.achievementXP.textContent = achievement.xp;

        this.achievementNotification.classList.add('show');

        setTimeout(() => {
            this.achievementNotification.classList.remove('show');
        }, 4000);
    }

    renderStats() {
        this.userLevel.textContent = this.userStats.level;
        this.userPoints.textContent = this.userStats.xp;
        this.userStreak.textContent = `${this.userStats.streak} dias`;
        this.totalCompleted.textContent = this.userStats.totalCompleted;

        this.currentLevel.textContent = this.userStats.level;
        this.currentXP.textContent = this.userStats.xp;

        const nextLevelXP = this.getXPForLevel(this.userStats.level + 1);
        const currentLevelXP = this.getXPForLevel(this.userStats.level);
        const xpProgress = this.userStats.xp - currentLevelXP;
        const xpNeeded = nextLevelXP - currentLevelXP;
        const percentage = Math.min(100, (xpProgress / xpNeeded) * 100);

        this.nextLevelXP.textContent = nextLevelXP;
        this.levelFill.style.width = `${percentage}%`;

        // Renderizar título atual
        this.renderUserTitle();
    }

    renderUserTitle() {
        const titles = [
            { minXP: 0, title: 'Novato', icon: '🌱' },
            { minXP: 100, title: 'Aprendiz', icon: '📚' },
            { minXP: 300, title: 'Praticante', icon: '⚙️' },
            { minXP: 600, title: 'Competente', icon: '💼' },
            { minXP: 1000, title: 'Experiente', icon: '🎯' },
            { minXP: 1500, title: 'Veterano', icon: '🛡️' },
            { minXP: 2500, title: 'Expert', icon: '🏆' },
            { minXP: 4000, title: 'Mestre', icon: '👑' },
            { minXP: 6000, title: 'Grão-Mestre', icon: '💎' },
            { minXP: 10000, title: 'Lenda', icon: '🌟' },
        ];

        const titleIcon = document.getElementById('titleIcon');
        const titleName = document.getElementById('titleName');

        if (!titleIcon || !titleName) return;

        let currentTitle = titles[0];
        for (let i = titles.length - 1; i >= 0; i--) {
            if (this.userStats.xp >= titles[i].minXP) {
                currentTitle = titles[i];
                break;
            }
        }

        titleIcon.textContent = currentTitle.icon;
        titleName.textContent = currentTitle.title;
    }

    renderAchievements() {
        const tierColors = {
            bronze: '#cd7f32',
            prata: '#c0c0c0',
            ouro: '#ffd700',
            diamante: '#b9f2ff',
            lendario: '#ff1493',
            especial: '#9370db'
        };

        this.achievementsGrid.innerHTML = this.achievements.map(achievement => {
            const isUnlocked = this.userStats.unlockedAchievements.includes(achievement.id);
            const tierColor = tierColors[achievement.tier] || '#fff';

            return `
                <div class="achievement-item ${isUnlocked ? 'unlocked' : 'locked'}" data-tier="${achievement.tier}">
                    <div class="achievement-badge">${achievement.icon}</div>
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-description">${achievement.description}</div>
                    <div class="achievement-tier" style="color: ${tierColor}; text-transform: uppercase;">${achievement.tier}</div>
                    <div class="achievement-xp">+${achievement.xp} XP</div>
                </div>
            `;
        }).join('');
    }

    // Renderizar Desafio Diário
    renderDailyChallenge() {
        const challenge = this.userStats.dailyChallenge;
        if (!challenge) return;

        const challengeCard = document.getElementById('dailyChallengeCard');
        const challengeDescription = document.getElementById('challengeDescription');
        const challengeProgressFill = document.getElementById('challengeProgressFill');
        const challengeProgressText = document.getElementById('challengeProgressText');

        if (!challengeCard || !challengeProgressFill || !challengeProgressText) return;

        const progressPercent = Math.min((challenge.progress / challenge.target) * 100, 100);
        const isComplete = this.userStats.dailyChallengeCompleted;

        console.log('🎨 Renderizando desafio:', progressPercent.toFixed(1) + '%', `(${challenge.progress}/${challenge.target})`);

        challengeDescription.textContent = challenge.description;
        challengeProgressFill.style.width = `${progressPercent}%`;
        // Atualiza apenas o texto do progresso
        challengeProgressText.textContent = `${challenge.progress} / ${challenge.target}`;
        // Atualiza a recompensa (se existir)
        const rewardSpan = challengeProgressText.nextElementSibling;
        if (rewardSpan && rewardSpan.classList.contains('challenge-reward')) {
            rewardSpan.textContent = `+${challenge.reward} XP 💎`;
        }

        if (isComplete) {
            challengeCard.style.opacity = '0.7';
            challengeCard.style.borderColor = 'rgba(46, 213, 115, 0.6)';
        } else {
            challengeCard.style.opacity = '1';
            challengeCard.style.borderColor = 'rgba(102, 126, 234, 0.4)';
        }
    }

    // Sistema de Títulos
    updateTitle() {
        const titles = [
            { minXP: 0, title: 'Novato', icon: '🌱' },
            { minXP: 100, title: 'Aprendiz', icon: '📚' },
            { minXP: 300, title: 'Praticante', icon: '⚙️' },
            { minXP: 600, title: 'Competente', icon: '💼' },
            { minXP: 1000, title: 'Experiente', icon: '🎯' },
            { minXP: 1500, title: 'Veterano', icon: '🛡️' },
            { minXP: 2500, title: 'Expert', icon: '🏆' },
            { minXP: 4000, title: 'Mestre', icon: '👑' },
            { minXP: 6000, title: 'Grão-Mestre', icon: '💎' },
            { minXP: 10000, title: 'Lenda', icon: '🌟' },
        ];

        for (let i = titles.length - 1; i >= 0; i--) {
            if (this.userStats.xp >= titles[i].minXP) {
                if (this.userStats.currentTitle !== titles[i].title) {
                    this.userStats.currentTitle = titles[i].title;
                    this.showTitleUpdate(titles[i]);
                }
                break;
            }
        }
    }

    showTitleUpdate(title) {
        const notification = document.createElement('div');
        notification.className = 'title-notification';
        notification.innerHTML = `
            <div class="title-notification-content">
                <div class="title-badge">${title.icon}</div>
                <div class="title-info">
                    <div class="title-message">Novo Título Desbloqueado!</div>
                    <div class="title-name">${title.title}</div>
                </div>
            </div>
        `;

        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    // Sistema de Desafios Diários
    generateDailyChallenge() {
        const challenges = [
            { type: 'complete_tasks', target: 5, description: 'Complete 5 tarefas hoje', reward: 50, icon: '✅' },
            { type: 'complete_tasks', target: 10, description: 'Complete 10 tarefas hoje', reward: 100, icon: '💪' },
            { type: 'priority_tasks', target: 3, description: 'Complete 3 tarefas prioritárias', reward: 75, icon: '⭐' },
            { type: 'early_tasks', target: 2, description: 'Complete 2 tarefas antes das 10h', reward: 80, icon: '🌅' },
            { type: 'pomodoro', target: 3, description: 'Use o Pomodoro 3 vezes', reward: 60, icon: '🍅' },
            { type: 'create_goal', target: 1, description: 'Crie uma nova meta', reward: 50, icon: '🎯' },
        ];

        const today = new Date().toDateString();
        if (!this.userStats.dailyChallenge || this.userStats.dailyChallenge.date !== today) {
            const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)];
            this.userStats.dailyChallenge = {
                ...randomChallenge,
                date: today,
                progress: 0,
                completed: false
            };
            this.userStats.dailyChallengeCompleted = false;
            this.saveUserStats();
        }
    }

    checkDailyChallenge() {
        if (!this.userStats.dailyChallenge || this.userStats.dailyChallengeCompleted) return;

        const challenge = this.userStats.dailyChallenge;
        const today = new Date().toDateString();

        // Se mudou de dia, gerar novo desafio
        if (challenge.date !== today) {
            this.generateDailyChallenge();
            return;
        }

        // Atualizar progresso baseado no tipo
        if (challenge.type === 'complete_tasks') {
            challenge.progress = this.userStats.tasksToday;
            console.log('📊 Desafio diário:', challenge.progress, '/', challenge.target, 'tarefas');
        } else if (challenge.type === 'priority_tasks') {
            // Contar tarefas prioritárias de hoje (precisaria implementar tracking)
            challenge.progress = Math.min(challenge.progress + 1, challenge.target);
        }

        // Verificar se completou
        if (challenge.progress >= challenge.target && !challenge.completed) {
            challenge.completed = true;
            this.userStats.dailyChallengeCompleted = true;
            this.addXP(challenge.reward, 'Desafio Diário Completado!');
            console.log('🎯 Desafio diário completado!');
            this.showChallengeComplete(challenge);
        }

        this.saveUserStats();
        this.renderDailyChallenge();
    }

    showChallengeComplete(challenge) {
        // Tocar som de desafio completado
        if (window.soundSystem) {
            window.soundSystem.playChallengeComplete();
        }

        const notification = document.createElement('div');
        notification.className = 'challenge-notification';
        notification.innerHTML = `
            <div class="challenge-notification-content">
                <div class="challenge-badge">${challenge.icon}</div>
                <div class="challenge-info">
                    <div class="challenge-title">Desafio Diário Completado!</div>
                    <div class="challenge-description">${challenge.description}</div>
                    <div class="challenge-reward">+${challenge.reward} XP</div>
                </div>
            </div>
        `;

        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }
}

// ============================================
// SISTEMA DE ATALHOS DE TECLADO E UX
// ============================================
class KeyboardShortcuts {
    constructor() {
        this.initShortcuts();
    }

    initShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Enter - Adicionar tarefa
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                const addBtn = document.getElementById('addBtn');
                if (addBtn) addBtn.click();
            }

            // Esc - Fechar modais
            if (e.key === 'Escape') {
                const modals = document.querySelectorAll('.modal-overlay.active');
                modals.forEach(modal => modal.classList.remove('active'));

                const confirmModals = document.querySelectorAll('.confirmation-modal.show');
                confirmModals.forEach(modal => modal.classList.remove('show'));
            }

            // Ctrl/Cmd + K - Focar no input de busca/tarefa
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const taskInput = document.getElementById('taskInput');
                if (taskInput) {
                    taskInput.focus();
                    taskInput.select();
                }
            }

            // Ctrl/Cmd + M - Abrir modal de nova meta
            if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
                e.preventDefault();
                const addGoalBtn = document.getElementById('addGoalBtn');
                if (addGoalBtn) addGoalBtn.click();
            }

            // Ctrl/Cmd + P - Alternar prioridade
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                const priorityCheckbox = document.getElementById('priorityCheckbox');
                if (priorityCheckbox) {
                    priorityCheckbox.checked = !priorityCheckbox.checked();
                }
            }
        });

        // Enter no input de tarefa - Adicionar
        const taskInput = document.getElementById('taskInput');
        if (taskInput) {
            taskInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const addBtn = document.getElementById('addBtn');
                    if (addBtn) addBtn.click();
                }
            });
        }
    }

    showShortcutsHelp() {
        const shortcuts = [
            { keys: 'Ctrl/Cmd + Enter', description: 'Adicionar tarefa' },
            { keys: 'Enter', description: 'Adicionar tarefa (no input)' },
            { keys: 'Esc', description: 'Fechar modais' },
            { keys: 'Ctrl/Cmd + K', description: 'Focar no input' },
            { keys: 'Ctrl/Cmd + M', description: 'Nova meta' },
            { keys: 'Ctrl/Cmd + P', description: 'Alternar prioridade' }
        ];

        alert('⌨️ Atalhos de Teclado:\n\n' +
            shortcuts.map(s => `${s.keys} → ${s.description}`).join('\n'));
    }
}

// ============================================
// INICIALIZAÇÃO - Quando a página carregar
// ============================================
if (!window.appInitialized) {
    window.appInitialized = true;

    document.addEventListener('DOMContentLoaded', () => {
        // Cria o sistema de sons
        window.soundSystem = new SoundSystem();

        // Cria o cronômetro Pomodoro
        window.pomodoroTimer = new PomodoroTimer();

        // Cria a lista de tarefas
        window.todoApp = new TodoApp();

        // Cria o gerenciador de metas
        window.goalsManager = new GoalsManager();

        // Cria o gerenciador de compromissos
        window.appointmentsManager = new AppointmentsManager();

        // Cria o sistema de gamificação
        window.gamificationSystem = new GamificationSystem();

        // Cria sistema de atalhos
        window.keyboardShortcuts = new KeyboardShortcuts();

        // Cria o calendário
        window.calendarManager = new CalendarManager(window.todoApp);

        // Configurar botão de som
        const soundToggle = document.getElementById('soundToggle');
        if (soundToggle && window.soundSystem) {
            // Atualizar ícone inicial
            soundToggle.textContent = window.soundSystem.enabled ? '🔊' : '🔇';
            if (!window.soundSystem.enabled) {
                soundToggle.classList.add('muted');
            }

            soundToggle.addEventListener('click', () => {
                const enabled = window.soundSystem.toggle();
                soundToggle.textContent = enabled ? '🔊' : '🔇';
                soundToggle.classList.toggle('muted', !enabled);

                // Feedback sonoro ao ativar
                if (enabled && window.soundSystem) {
                    window.soundSystem.playNotification();
                }
            });
        }

        // Atualizar lista de metas no select quando renderizar
        const originalRenderGoals = window.goalsManager.renderGoals.bind(window.goalsManager);
        window.goalsManager.renderGoals = function () {
            originalRenderGoals();
            updateGoalSelect();
        };

        // Função para atualizar o select de metas
        function updateGoalSelect() {
            const goalSelect = document.getElementById('goalSelect');
            if (!goalSelect) return;

            const goals = window.goalsManager.goals || [];
            goalSelect.innerHTML = '<option value="">Nenhuma meta</option>';

            goals.forEach(goal => {
                const option = document.createElement('option');
                option.value = goal.id;
                option.textContent = `🎯 ${goal.title}`;
                goalSelect.appendChild(option);
            });
        }

        // Atualizar lista inicial
        setTimeout(() => updateGoalSelect(), 100);

        // Integração: quando uma tarefa for concluída
        if (window.todoApp && window.todoApp.toggleTask) {
            const originalToggleTask = window.todoApp.toggleTask.bind(window.todoApp);
            window.todoApp.toggleTask = function (id) {
                const task = this.tasks.find(t => t.id === id);
                const wasCompleted = task ? task.completed : false;

                originalToggleTask(id);

                // Se a tarefa foi concluída (não estava completa antes)
                if (task && !wasCompleted && task.completed) {
                    window.gamificationSystem.onTaskCompleted({
                        priority: task.priority
                    });

                    // Atualizar progresso da meta vinculada
                    if (task.goalId && window.goalsManager) {
                        const goal = window.goalsManager.goals.find(g => g.id === parseInt(task.goalId));
                        if (goal) {
                            goal.progress = (goal.progress || 0) + 1;
                            window.goalsManager.saveGoals();
                            window.goalsManager.renderGoals();

                            // Verificar se completou a meta
                            if (goal.target && goal.progress >= goal.target) {
                                window.gamificationSystem.onGoalCompleted();
                                window.goalsManager.showGoalMessage(
                                    `🎉 Parabéns! Você completou a meta "${goal.title}"!`,
                                    'success'
                                );
                            }
                        }
                    }
                }

                // Atualizar calendário
                if (window.calendarManager) {
                    window.calendarManager.refresh();
                }
            };
        }

        // Sobrescrever addTask para atualizar calendário
        const originalAddTask = window.todoApp.addTask.bind(window.todoApp);
        window.todoApp.addTask = function (text, category, priority, dueDate, timeEstimate, notes, goalId) {
            originalAddTask(text, category, priority, dueDate, timeEstimate, notes, goalId);

            // Atualizar calendário
            if (window.calendarManager) {
                window.calendarManager.refresh();
            }
        };

        // Sobrescrever deleteTask para atualizar calendário
        const originalDeleteTask = window.todoApp.deleteTask.bind(window.todoApp);
        window.todoApp.deleteTask = function (id) {
            originalDeleteTask(id);

            // Atualizar calendário
            if (window.calendarManager) {
                window.calendarManager.refresh();
            }
        };
    });
}

// ========================================
// CLASSE: CALENDAR MANAGER
// ========================================
class CalendarManager {
    constructor(todoApp) {
        this.todoApp = todoApp;
        this.currentDate = new Date();
        this.initElements();
        this.initEventListeners();
        this.render();
    }

    initElements() {
        this.calendarGrid = document.getElementById('calendarGrid');
        this.calendarMonthYear = document.getElementById('calendarMonthYear');
        this.prevMonthBtn = document.getElementById('prevMonth');
        this.nextMonthBtn = document.getElementById('nextMonth');
        this.dayTasksModal = document.getElementById('dayTasksModal');
        this.dayTasksTitle = document.getElementById('dayTasksTitle');
        this.dayTasksList = document.getElementById('dayTasksList');
        this.dayTasksClose = document.getElementById('dayTasksClose');
    }

    initEventListeners() {
        this.prevMonthBtn?.addEventListener('click', () => this.previousMonth());
        this.nextMonthBtn?.addEventListener('click', () => this.nextMonth());
        this.dayTasksClose?.addEventListener('click', () => this.closeDayModal());
        this.dayTasksModal?.addEventListener('click', (e) => {
            if (e.target === this.dayTasksModal) {
                this.closeDayModal();
            }
        });
    }

    // Feriados brasileiros fixos e móveis
    getHolidays(year) {
        const holidays = {
            // Feriados fixos
            [`${year}-01-01`]: '🎉 Ano Novo',
            [`${year}-04-21`]: '🇧🇷 Tiradentes',
            [`${year}-05-01`]: '👷 Dia do Trabalho',
            [`${year}-09-07`]: '🇧🇷 Independência',
            [`${year}-10-12`]: '🙏 Nossa Sra. Aparecida',
            [`${year}-11-02`]: '🕯️ Finados',
            [`${year}-11-15`]: '🇧🇷 Proclamação República',
            [`${year}-11-20`]: '✊ Consciência Negra',
            [`${year}-12-25`]: '🎄 Natal'
        };

        // Calcular Páscoa (algoritmo de Meeus/Jones/Butcher)
        const a = year % 19;
        const b = Math.floor(year / 100);
        const c = year % 100;
        const d = Math.floor(b / 4);
        const e = b % 4;
        const f = Math.floor((b + 8) / 25);
        const g = Math.floor((b - f + 1) / 3);
        const h = (19 * a + b - d - g + 15) % 30;
        const i = Math.floor(c / 4);
        const k = c % 4;
        const l = (32 + 2 * e + 2 * i - h - k) % 7;
        const m = Math.floor((a + 11 * h + 22 * l) / 451);
        const month = Math.floor((h + l - 7 * m + 114) / 31);
        const day = ((h + l - 7 * m + 114) % 31) + 1;

        const easter = new Date(year, month - 1, day);

        // Carnaval (47 dias antes da Páscoa)
        const carnaval = new Date(easter);
        carnaval.setDate(easter.getDate() - 47);
        holidays[this.formatDate(carnaval)] = '🎭 Carnaval';

        // Sexta-feira Santa (2 dias antes da Páscoa)
        const sextaSanta = new Date(easter);
        sextaSanta.setDate(easter.getDate() - 2);
        holidays[this.formatDate(sextaSanta)] = '✝️ Sexta-feira Santa';

        // Corpus Christi (60 dias depois da Páscoa)
        const corpusChristi = new Date(easter);
        corpusChristi.setDate(easter.getDate() + 60);
        holidays[this.formatDate(corpusChristi)] = '✝️ Corpus Christi';

        return holidays;
    }

    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.render();
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.render();
    }

    render() {
        this.renderMonthYear();
        this.renderDays();
    }

    renderMonthYear() {
        const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

        const month = months[this.currentDate.getMonth()];
        const year = this.currentDate.getFullYear();

        this.calendarMonthYear.textContent = `${month} ${year}`;
    }

    renderDays() {
        if (!this.calendarGrid) return;

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        // Primeiro dia do mês
        const firstDay = new Date(year, month, 1);
        const firstDayWeek = firstDay.getDay();

        // Último dia do mês
        const lastDay = new Date(year, month + 1, 0);
        const lastDate = lastDay.getDate();

        // Último dia do mês anterior
        const prevLastDay = new Date(year, month, 0);
        const prevLastDate = prevLastDay.getDate();

        // Data atual
        const today = new Date();
        const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;

        let daysHTML = '';

        // Dias do mês anterior
        for (let i = firstDayWeek - 1; i >= 0; i--) {
            const dayNum = prevLastDate - i;
            daysHTML += this.createDayHTML(dayNum, year, month - 1, true, false);
        }

        // Dias do mês atual
        for (let day = 1; day <= lastDate; day++) {
            const isToday = isCurrentMonth && day === today.getDate();
            daysHTML += this.createDayHTML(day, year, month, false, isToday);
        }

        // Dias do próximo mês
        const remainingDays = 42 - (firstDayWeek + lastDate);
        for (let day = 1; day <= remainingDays; day++) {
            daysHTML += this.createDayHTML(day, year, month + 1, true, false);
        }

        this.calendarGrid.innerHTML = daysHTML;

        // Adicionar event listeners
        this.calendarGrid.querySelectorAll('.calendar-day').forEach(dayEl => {
            dayEl.addEventListener('click', () => {
                const date = dayEl.dataset.date;
                if (date) this.showDayTasks(date);
            });
        });
    }

    createDayHTML(day, year, month, isOtherMonth, isToday) {
        const date = new Date(year, month, day);
        const dateStr = this.formatDate(date);
        // Remover tarefas do calendário - mostrar apenas compromissos
        const appointments = this.getAppointmentsForDate(date);
        const totalItems = appointments.length;

        // Verificar se é feriado
        const holidays = this.getHolidays(year);
        const holiday = holidays[dateStr];

        let classes = 'calendar-day';
        if (isOtherMonth) classes += ' other-month';
        if (isToday) classes += ' today';
        if (totalItems > 0) classes += ' has-items';
        if (holiday) classes += ' holiday';

        let itemsHTML = '';
        if (holiday) {
            itemsHTML += `
                <div class="day-item-badge holiday-label">
                    <span class="badge-text">Feriado</span>
                </div>
                <div class="day-item-badge holiday-badge">
                    <span class="badge-text">${holiday}</span>
                </div>
            `;
        }
        if (appointments.length > 0) {
            const appointmentText = appointments.length === 1
                ? 'compromisso'
                : 'compromissos';
            itemsHTML += `
                <div class="day-item-badge appointments">
                    <span class="badge-icon">📅</span>
                    <span class="badge-text">${appointments.length} ${appointmentText}</span>
                </div>
            `;
        }

        return `
            <div class="${classes}" data-date="${dateStr}">
                <div class="day-number">${day}</div>
                <div class="day-items">${itemsHTML}</div>
            </div>
        `;
    }

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    getTasksForDate(dateStr) {
        if (!this.todoApp || !this.todoApp.tasks) return [];

        return this.todoApp.tasks.filter(task => {
            if (!task.dueDate) return false;
            return task.dueDate === dateStr;
        });
    }

    getAppointmentsForDate(date) {
        if (!window.appointmentsManager) return [];
        return window.appointmentsManager.getAppointmentsByDate(date);
    }

    showDayTasks(dateStr) {
        // Remover tarefas - mostrar apenas compromissos
        const date = new Date(dateStr + 'T00:00:00');
        const appointments = this.getAppointmentsForDate(date);

        // Formatar data para exibição
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const formattedDate = `${day}/${month}/${year}`;

        this.dayTasksTitle.textContent = `Compromissos de ${formattedDate}`;

        let html = '';

        // Mostrar apenas compromissos
        if (appointments.length > 0) {
            html += appointments.map(appointment => {
                const appointmentDate = new Date(appointment.dateTime);
                const timeText = appointmentDate.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                });

                return `
                    <div class="day-appointment-item clickable" onclick="window.appointmentsManager.showAppointmentDetail(${appointment.id})" style="cursor: pointer;">
                        <div class="day-appointment-time">⏰ ${timeText}</div>
                        <div class="day-appointment-title">${appointment.title}</div>
                        ${appointment.location ? `<div class="day-appointment-location">📍 ${appointment.location}</div>` : ''}
                        <div class="day-appointment-hint">👆 Clique para ver detalhes</div>
                    </div>
                `;
            }).join('');
        }

        // Mensagem vazia
        if (appointments.length === 0) {
            html = '<div class="empty-state">Nenhum compromisso para este dia</div>';
        }

        this.dayTasksList.innerHTML = html;
        this.dayTasksModal.classList.add('show');
    }

    closeDayModal() {
        this.dayTasksModal?.classList.remove('show');
    }

    refresh() {
        this.render();
    }
}