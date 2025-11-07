// ============================================
// GERENCIADOR DE CALENDÁRIO
// ============================================
export class CalendarManager {
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

        if (this.calendarMonthYear) {
            this.calendarMonthYear.textContent = `${month} ${year}`;
        }
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
        const tasks = this.getTasksForDate(dateStr);
        const taskCount = tasks.length;

        let classes = 'calendar-day';
        if (isOtherMonth) classes += ' other-month';
        if (isToday) classes += ' today';
        if (taskCount > 0) classes += ' has-tasks';

        return `
            <div class="${classes}" data-date="${dateStr}">
                <div class="day-number">${day}</div>
                ${taskCount > 0 ? `<div class="day-task-count">${taskCount} ${taskCount === 1 ? 'tarefa' : 'tarefas'}</div>` : ''}
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

    showDayTasks(dateStr) {
        const tasks = this.getTasksForDate(dateStr);
        const date = new Date(dateStr + 'T00:00:00');

        // Formatar data para exibição
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const formattedDate = `${day}/${month}/${year}`;

        if (this.dayTasksTitle) {
            this.dayTasksTitle.textContent = `Tarefas de ${formattedDate}`;
        }

        if (!this.dayTasksList) return;

        if (tasks.length === 0) {
            this.dayTasksList.innerHTML = '<div class="empty-state">Nenhuma tarefa para este dia</div>';
        } else {
            this.dayTasksList.innerHTML = tasks.map(task => {
                const categoryEmojis = {
                    pessoal: '🏠',
                    trabalho: '💼',
                    estudo: '📚',
                    saude: '❤️',
                    compras: '🛒',
                    outros: '📌'
                };

                return `
                    <div class="day-task-item ${task.completed ? 'completed' : ''}">
                        <div class="day-task-text">
                            ${task.completed ? '✓' : '○'} ${task.text}
                        </div>
                        <div class="day-task-meta">
                            <span class="day-task-badge">${categoryEmojis[task.category] || '📌'} ${task.category}</span>
                            ${task.priority ? '<span class="day-task-badge">⭐ Prioritária</span>' : ''}
                            ${task.timeEstimate ? `<span class="day-task-badge">⏱️ ${task.timeEstimate} min</span>` : ''}
                            ${task.completed ? '<span class="day-task-badge">✅ Concluída</span>' : '<span class="day-task-badge">⏳ Pendente</span>'}
                        </div>
                    </div>
                `;
            }).join('');
        }

        this.dayTasksModal?.classList.add('show');
    }

    closeDayModal() {
        this.dayTasksModal?.classList.remove('show');
    }

    refresh() {
        this.render();
    }
}
