// ============================================
// GERENCIADOR DE METAS E OBJETIVOS
// ============================================
export class GoalsManager {
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
                this.goalDeadline.value = goal.deadline || '';
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

        const goalData = {
            title,
            description: this.goalDescription.value.trim(),
            category: this.goalCategory.value,
            deadline: deadline,
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

            // Tocar som
            if (window.soundSystem) {
                window.soundSystem.playSuccess();
            }
        }

        this.saveGoals();
        this.renderGoals();
        this.closeModal();

        // Atualizar select de metas no formulário de tarefas
        this.updateGoalSelect();
    }

    deleteGoal(goalId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) return;

        this.showDeleteConfirmation(goal.title, () => {
            this.goals = this.goals.filter(g => g.id !== goalId);
            this.saveGoals();
            this.renderGoals();
            this.showGoalMessage('🗑️ Meta excluída com sucesso!', 'success');
            this.updateGoalSelect();
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
                    <button class="confirmation-btn cancel">Cancelar</button>
                    <button class="confirmation-btn confirm">Excluir</button>
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

            // Check if goal completed
            if (goal.progress === 100 || (goal.target && goal.progress >= goal.target)) {
                if (window.soundSystem) {
                    window.soundSystem.playGoalComplete();
                }
                if (window.gamificationSystem) {
                    window.gamificationSystem.onGoalCompleted();
                }
            }

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

    updateGoalSelect() {
        const goalSelect = document.getElementById('goalSelect');
        if (!goalSelect) return;

        const currentValue = goalSelect.value;
        goalSelect.innerHTML = '<option value="">Nenhuma meta</option>';

        this.goals.forEach(goal => {
            const option = document.createElement('option');
            option.value = goal.id;
            option.textContent = goal.title;
            goalSelect.appendChild(option);
        });

        if (currentValue) {
            goalSelect.value = currentValue;
        }
    }

    getGoals() {
        return this.goals;
    }

    renderGoals() {
        if (this.goals.length === 0) {
            this.goalsList.innerHTML = '<div class="empty-state-goals">Nenhuma meta criada. Comece adicionando uma meta!</div>';
            return;
        }

        this.goalsList.innerHTML = this.goals.map(goal => {
            const progressPercentage = goal.target ?
                Math.round((goal.progress / goal.target) * 100) : goal.progress;

            const deadlineText = goal.deadline ?
                new Date(goal.deadline).toLocaleDateString('pt-BR') : 'Sem prazo';

            const isOverdue = goal.deadline && new Date(goal.deadline) < new Date();

            return `
                <div class="goal-card" data-goal-id="${goal.id}">
                    <div class="goal-header">
                        <div>
                            <div class="goal-title">${goal.title}</div>
                            <div class="goal-category">${this.getCategoryEmoji(goal.category)} ${goal.category}</div>
                        </div>
                    </div>
                    
                    ${goal.description ? `<div class="goal-description">${goal.description}</div>` : ''}
                    
                    <div class="goal-progress">
                        <div class="goal-progress-bar">
                            <div class="goal-progress-fill" style="width: ${progressPercentage}%"></div>
                        </div>
                        <div class="goal-progress-text">
                            <span>${progressPercentage}% concluído</span>
                            ${goal.target ? `<span>${goal.progress} / ${goal.target}</span>` : ''}
                        </div>
                    </div>
                    
                    <div class="goal-deadline" style="color: ${isOverdue ? '#ff6b6b' : 'var(--text-secondary)'}">
                        📅 ${deadlineText}
                        ${isOverdue ? ' (Vencida)' : ''}
                    </div>
                    
                    <div class="goal-actions">
                        <button class="goal-btn edit" onclick="window.goalsManager.openModal(${goal.id})">
                            ✏️ Editar
                        </button>
                        <button class="goal-btn delete" onclick="window.goalsManager.deleteGoal(${goal.id})">
                            🗑️ Excluir
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
}
