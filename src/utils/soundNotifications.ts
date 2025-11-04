// Utilidad para generar y reproducir sonidos de notificación
export class SoundNotifications {
  private audioContext: AudioContext | null = null;
  private isEnabled: boolean = true;

  constructor() {
    // Inicializar AudioContext solo cuando sea necesario
    this.initAudioContext();
  }

  private initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('AudioContext no soportado:', error);
      this.audioContext = null;
    }
  }

  // Generar un tono simple
  private createTone(frequency: number, duration: number, type: OscillatorType = 'sine'): Promise<void> {
    return new Promise((resolve) => {
      if (!this.audioContext || !this.isEnabled) {
        resolve();
        return;
      }

      // Reanudar el contexto si está suspendido
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      oscillator.type = type;

      // Envelope para evitar clicks
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);

      oscillator.onended = () => resolve();
    });
  }

  // Sonido para nuevo pedido - melodía alegre
  async playNewOrderSound(): Promise<void> {
    if (!this.isEnabled) return;

    try {
      // Melodía simple: Do - Mi - Sol - Do (octava superior)
      await this.createTone(523.25, 0.2); // Do
      await new Promise(resolve => setTimeout(resolve, 50));
      await this.createTone(659.25, 0.2); // Mi
      await new Promise(resolve => setTimeout(resolve, 50));
      await this.createTone(783.99, 0.2); // Sol
      await new Promise(resolve => setTimeout(resolve, 50));
      await this.createTone(1046.50, 0.3); // Do (octava superior)
    } catch (error) {
      console.warn('Error reproduciendo sonido de nuevo pedido:', error);
    }
  }

  // Sonido para pedido urgente - más intenso
  async playUrgentOrderSound(): Promise<void> {
    if (!this.isEnabled) return;

    try {
      // Sonido más urgente con frecuencias más altas
      for (let i = 0; i < 3; i++) {
        await this.createTone(800, 0.15, 'square');
        await new Promise(resolve => setTimeout(resolve, 100));
        await this.createTone(1000, 0.15, 'square');
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.warn('Error reproduciendo sonido urgente:', error);
    }
  }

  // Sonido para pedido completado - sonido de éxito
  async playOrderCompletedSound(): Promise<void> {
    if (!this.isEnabled) return;

    try {
      // Acorde mayor ascendente
      await this.createTone(523.25, 0.4); // Do
      await new Promise(resolve => setTimeout(resolve, 100));
      await this.createTone(659.25, 0.4); // Mi
      await new Promise(resolve => setTimeout(resolve, 100));
      await this.createTone(783.99, 0.6); // Sol
    } catch (error) {
      console.warn('Error reproduciendo sonido de pedido completado:', error);
    }
  }

  // Sonido de error - tono descendente
  async playErrorSound(): Promise<void> {
    if (!this.isEnabled) return;

    try {
      await this.createTone(400, 0.3, 'sawtooth');
      await this.createTone(300, 0.3, 'sawtooth');
      await this.createTone(200, 0.4, 'sawtooth');
    } catch (error) {
      console.warn('Error reproduciendo sonido de error:', error);
    }
  }

  // Habilitar/deshabilitar sonidos
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    
    // Guardar preferencia en localStorage
    localStorage.setItem('soundNotificationsEnabled', enabled.toString());
  }

  // Obtener estado actual
  isEnabledState(): boolean {
    return this.isEnabled;
  }

  // Cargar preferencia desde localStorage
  loadPreferences(): void {
    const saved = localStorage.getItem('soundNotificationsEnabled');
    if (saved !== null) {
      this.isEnabled = saved === 'true';
    }
  }

  // Probar sonido
  async testSound(): Promise<void> {
    await this.playNewOrderSound();
  }
}

// Instancia singleton
export const soundNotifications = new SoundNotifications();

// Cargar preferencias al inicializar
soundNotifications.loadPreferences();