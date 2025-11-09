/**
 * Logger singleton para loggear desde servicios API y otros lugares no-React
 * Permite que los servicios API loggeen en LogViewer a través de LogContext
 */

type LogFunction = (message: string) => void;

class Logger {
  private logFunction: LogFunction | null = null;

  /**
   * Configura la función de logging (debe ser llamada desde LogProvider o App)
   */
  setLogFunction(fn: LogFunction) {
    this.logFunction = fn;
  }

  /**
   * Loggea un mensaje
   * Si no hay función configurada, solo usa console.log
   */
  log(message: string) {
    // Siempre loggear en console
    console.log(message);
    
    // Si hay función de logging configurada, también loggear ahí
    if (this.logFunction) {
      this.logFunction(message);
    }
  }

  /**
   * Loggea un error
   */
  error(message: string) {
    // Siempre loggear en console.error
    console.error(message);
    
    // Si hay función de logging configurada, también loggear ahí
    if (this.logFunction) {
      this.logFunction(message);
    }
  }
}

// Instancia singleton
export const logger = new Logger();

