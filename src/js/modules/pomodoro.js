// ============================================
// CLASSE DO CRONÔMETRO POMODORO
// ============================================
export class PomodoroTimer {
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
                console.log('Botão start ativo adicionado');
                break;
            case 'pause':
                this.pauseBtn.classList.add('active');
                console.log('Botão pause ativo adicionado');
                break;
            case 'reset':
                this.resetBtn.classList.add('active');
                console.log('Botão reset ativo adicionado');
                break;
        }

        // Remove o active após 200ms para simular o clique
        setTimeout(() => {
            this.startBtn.classList.remove('active');
            this.pauseBtn.classList.remove('active');
            this.resetBtn.classList.remove('active');
            console.log('Estados ativos removidos');
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

        // Feedback visual de que está rodando
        this.startBtn.style.opacity = '0.7';

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

        // Restaura opacidade do botão start
        this.startBtn.style.opacity = '1';
    }

    // Zera o cronômetro
    reset() {
        this.pause();
        this.isFocusMode = true;
        this.timeLeft = this.focusTime;
        this.updateDisplay();

        // Restaura opacidade do botão start
        this.startBtn.style.opacity = '1';
    }

    // Reseta as estatísticas de tempo acumulado
    resetStats() {
        if (confirm('Tem certeza que deseja resetar todas as estatísticas do Pomodoro?')) {
            this.totalFocusMinutes = 0;
            this.totalBreakMinutes = 0;
            localStorage.setItem('pomodoroTotalFocus', 0);
            localStorage.setItem('pomodoroTotalBreak', 0);
            this.updateStatsDisplay();
        }
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
