// ============================================
// ARQUIVO PRINCIPAL - INICIALIZAÇÃO MODULAR
// ============================================

// Importa os módulos
import { SoundSystem } from './modules/sound.js';
import { PomodoroTimer } from './modules/pomodoro.js';
import { GoalsManager } from './modules/goals.js';
import { CalendarManager } from './modules/calendar.js';

// Log de inicialização
console.log('📦 Sistema modularizado carregado!');
console.log('✅ Módulos ES6 disponíveis:');
console.log('  🔊 SoundSystem');
console.log('  ⏱️  PomodoroTimer');
console.log('  🎯 GoalsManager');
console.log('  📅 CalendarManager');

// Exporta classes para uso global (compatibilidade com código existente)
window.SoundSystem = SoundSystem;
window.PomodoroTimer = PomodoroTimer;
window.GoalsManager = GoalsManager;
window.CalendarManager = CalendarManager;

// Aguarda o código legado inicializar primeiro, depois cria instâncias dos módulos
document.addEventListener('DOMContentLoaded', () => {
    // Aguarda um pouco para garantir que o index.js inicializou
    setTimeout(() => {
        // Verifica se as instâncias ainda não foram criadas pelo index.js
        if (!window.soundSystem) {
            window.soundSystem = new SoundSystem();
            console.log('🔊 SoundSystem inicializado via módulo');
        }

        if (!window.pomodoroTimer) {
            window.pomodoroTimer = new PomodoroTimer();
            console.log('⏱️  PomodoroTimer inicializado via módulo');
        }

        if (!window.goalsManager) {
            window.goalsManager = new GoalsManager();
            console.log('🎯 GoalsManager inicializado via módulo');
        }

        if (window.todoApp && !window.calendarManager) {
            window.calendarManager = new CalendarManager(window.todoApp);
            console.log('📅 CalendarManager inicializado via módulo');
        }

        console.log('✨ Todos os módulos inicializados!');
    }, 100);
});

