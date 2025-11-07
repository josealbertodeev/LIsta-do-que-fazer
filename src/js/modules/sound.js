// ============================================
// SISTEMA DE SONS E NOTIFICAÇÕES
// ============================================
export class SoundSystem {
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

    // Método auxiliar para reproduzir sons por nome
    playSound(soundName) {
        const soundMap = {
            'success': () => this.playSuccess(),
            'levelup': () => this.playLevelUp(),
            'achievement': () => this.playAchievement(),
            'warning': () => this.playWarning(),
            'notification': () => this.playNotification(),
            'challenge': () => this.playChallengeComplete(),
            'goal': () => this.playGoalComplete(),
            'pomodoro': () => this.playPomodoroComplete()
        };

        const soundFn = soundMap[soundName.toLowerCase()];
        if (soundFn) {
            soundFn();
        }
    }
}
