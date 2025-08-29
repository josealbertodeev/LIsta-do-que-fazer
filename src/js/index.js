class TodoApp {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.taskIdCounter = parseInt(localStorage.getItem('taskIdCounter')) || 1;
        
        this.taskInput = document.getElementById('taskInput');
        this.priorityCheckbox = document.getElementById('priorityCheckbox');
        this.addBtn = document.getElementById('addBtn');
        this.pendingTasks = document.getElementById('pendingTasks');
        this.completedTasks = document.getElementById('completedTasks');
        this.currentDate = document.getElementById('currentDate');
        
        this.initEventListeners();
        this.displayCurrentDate();
        this.renderTasks();
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
    
    initEventListeners() {
        this.addBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });
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
        
        // Limpar inputs
        this.taskInput.value = '';
        this.priorityCheckbox.checked = false;
    }
    
    getNextOrderNumber() {
        // Pega o maior número de ordem e adiciona 1
        const maxOrder = this.tasks.reduce((max, task) => {
            return task.order > max ? task.order : max;
        }, 0);
        return maxOrder + 1;
    }
    
    deleteTask(id) {
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.saveToStorage();
        this.renderTasks();
    }
    
    toggleTask(id) {
        const task = this.tasks.find(task => task.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveToStorage();
            this.renderTasks();
        }
    }
    
    editTask(id) {
        const task = this.tasks.find(task => task.id === id);
        if (task) {
            const newText = prompt('Editar tarefa:', task.text);
            if (newText !== null && newText.trim() !== '') {
                task.text = newText.trim();
                this.saveToStorage();
                this.renderTasks();
            }
        }
    }
    
    saveToStorage() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
        localStorage.setItem('taskIdCounter', this.taskIdCounter.toString());
    }
    
    createTaskElement(task) {
        const taskItem = document.createElement('div');
        taskItem.className = 'task-item';
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
        // Separar tarefas pendentes e concluídas
        const pendingTasksList = this.tasks.filter(task => !task.completed);
        const completedTasksList = this.tasks.filter(task => task.completed);
        
        // Ordenar tarefas pendentes (prioridade primeiro, depois por ordem de criação)
        pendingTasksList.sort((a, b) => {
            if (a.priority && !b.priority) return -1;
            if (!a.priority && b.priority) return 1;
            // Se ambas têm a mesma prioridade, ordenar por número de ordem
            return (a.order || 0) - (b.order || 0);
        });
        
        // Ordenar tarefas concluídas por ordem de criação
        completedTasksList.sort((a, b) => (a.order || 0) - (b.order || 0));
        
        // Renderizar tarefas pendentes
        this.pendingTasks.innerHTML = '';
        if (pendingTasksList.length === 0) {
            this.pendingTasks.innerHTML = '<div class="empty-state">Nenhuma tarefa pendente</div>';
        } else {
            pendingTasksList.forEach(task => {
                this.pendingTasks.appendChild(this.createTaskElement(task));
            });
        }
        
        // Renderizar tarefas concluídas
        this.completedTasks.innerHTML = '';
        if (completedTasksList.length === 0) {
            this.completedTasks.innerHTML = '<div class="empty-state">Nenhuma tarefa concluída</div>';
        } else {
            completedTasksList.forEach(task => {
                this.completedTasks.appendChild(this.createTaskElement(task));
            });
        }
    }
}

// Inicializar a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.todoApp = new TodoApp();
});

// Adicionar algumas tarefas de exemplo na primeira visita
if (!localStorage.getItem('tasks')) {
    const exampleTasks = [
        {
            id: 1,
            text: 'Estudar Programação Node.JS',
            completed: false,
            priority: false,
            createdAt: new Date().toISOString()
        },
        {
            id: 2,
            text: 'Estudar Inglês',
            completed: true,
            priority: false,
            createdAt: new Date(Date.now() - 86400000).toISOString() // 1 dia atrás
        }
    ];
    
    localStorage.setItem('tasks', JSON.stringify(exampleTasks));
    localStorage.setItem('taskIdCounter', '3');
}