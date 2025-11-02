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

        // Pega os elementos do HTML
        this.display = document.getElementById('pomodoroTimer');
        this.statusDisplay = document.getElementById('pomodoroStatus');
        this.startBtn = document.getElementById('pomodoroStart');
        this.pauseBtn = document.getElementById('pomodoroPause');
        this.resetBtn = document.getElementById('pomodoroReset');

        // Configura os botões
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset());

        // Pede permissão para notificações
        this.requestNotificationPermission();

        this.updateDisplay();
    }

    // Pede permissão para mostrar notificações
    requestNotificationPermission() {
        if ("Notification" in window) {
            if (Notification.permission === "default") {
                Notification.requestPermission();
            }
        }
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

    // Troca entre modo foco e pausa
    switchMode() {
        this.pause();
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
        this.weatherDisplay = document.getElementById('weatherDisplay');
        this.motivationalQuote = document.getElementById('motivationalQuote');
        this.bibleVerse = document.getElementById('bibleVerse');
        this.greeting = document.getElementById('greeting');

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
    }

    addTask() {
        const text = this.taskInput.value.trim();
        if (!text) return;

        const task = {
            id: this.taskIdCounter++,
            text: text,
            completed: false,
            priority: this.priorityCheckbox.checked,
            createdAt: new Date().toISOString(),
            order: this.getNextOrderNumber()
        };

        this.tasks.push(task);
        this.saveToStorage();
        this.renderTasks();

        this.taskInput.value = '';
        this.priorityCheckbox.checked = false;

        // Notificação interativa
        this.showToast('Tarefa adicionada com sucesso!', 'success');
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
        taskItem.setAttribute('data-task-id', task.id); // NOVIDADE: adiciona ID ao elemento
        taskItem.innerHTML = `
                    <div class="task-number">${task.order || 1}</div>
                    <div class="task-content">
                        <div class="task-text">${task.text}</div>
                        ${task.priority ? '<div class="task-priority">Prioridade</div>' : ''}
                    </div>
                    <div class="task-actions">
                        ${task.completed
                ? `<button class="task-btn undo-btn" onclick="todoApp.toggleTask(${task.id})" title="Desfazer">↶</button>`
                : `<button class="task-btn complete-btn" onclick="todoApp.toggleTask(${task.id})" title="Concluir">✓</button>
                               <button class="task-btn edit-btn" onclick="todoApp.editTask(${task.id})" title="Editar">✎</button>`
            }
                        <button class="task-btn delete-btn" onclick="todoApp.deleteTask(${task.id})" title="Excluir">🗑</button>
                    </div>
                `;
        return taskItem;
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

        // Atualizar barra de progresso
        this.updateProgress();
    }

    // Atualizar barra de progresso
    updateProgress() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        this.progressFill.style.width = percentage + '%';
        this.progressText.textContent = `${percentage}% Concluído (${completed}/${total})`;
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
// INICIALIZAÇÃO - Quando a página carregar
// ============================================
if (!window.appInitialized) {
    window.appInitialized = true;

    document.addEventListener('DOMContentLoaded', () => {
        // Cria o cronômetro Pomodoro
        window.pomodoroTimer = new PomodoroTimer();

        // Cria a lista de tarefas
        window.todoApp = new TodoApp();
    });
}