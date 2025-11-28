/**
 * Servicio para Health Check
 */
import { apiClient } from './base';
import { logger } from '../../utils/logger';

export interface HealthResponse {
  status: string;
  database?: string;
  service?: string;
  timestamp?: string;
}

export interface ConnectionDiagnostics {
  baseURL: string;
  endpoint: string;
  fullURL: string;
  timestamp: string;
  success: boolean;
  responseTime?: number;
  status?: string;
  error?: string;
  healthData?: HealthResponse;
}

export const healthService = {
  /**
   * Health Check - Verifica estado del backend y DB
   * GET /health
   */
  async checkHealth(): Promise<HealthResponse> {
    try {
      logger.log('🏥 HealthService - Verificando salud del backend...');
      const health = await apiClient.get<HealthResponse>('/health');
      logger.log('🏥 HealthService - Health check exitoso:', health);
      return health;
    } catch (error) {
      logger.error('❌ HealthService - Error en health check:', error);
      throw error;
    }
  },

  /**
   * Diagnóstico completo de conexión - Verifica conexión con detalles
   * Incluye tiempo de respuesta y información detallada
   */
  async diagnoseConnection(): Promise<ConnectionDiagnostics> {
    const baseURL = apiClient.getBaseURL();
    const endpoint = '/health';
    const fullURL = `${baseURL}${endpoint}`;
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    const diagnostics: ConnectionDiagnostics = {
      baseURL,
      endpoint,
      fullURL,
      timestamp,
      success: false,
    };

    try {
      logger.log(`🔍 ConnectionDiagnostics - Iniciando diagnóstico`);
      logger.log(`📍 Base URL: ${baseURL}`);
      logger.log(`📍 Endpoint: ${endpoint}`);
      logger.log(`📍 URL Completa: ${fullURL}`);

      const health = await this.checkHealth();
      const responseTime = Date.now() - startTime;

      diagnostics.success = true;
      diagnostics.responseTime = responseTime;
      diagnostics.status = health.status;
      diagnostics.healthData = health;

      logger.log(`✅ ConnectionDiagnostics - Conexión exitosa`);
      logger.log(`⏱️ Tiempo de respuesta: ${responseTime}ms`);
      logger.log(`📊 Status: ${health.status}`);

      return diagnostics;
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      diagnostics.responseTime = responseTime;
      diagnostics.error = error.message || String(error);

      logger.error(`❌ ConnectionDiagnostics - Error de conexión`);
      logger.error(`⏱️ Tiempo hasta error: ${responseTime}ms`);
      logger.error(`❌ Error: ${diagnostics.error}`);

      // Detectar tipo de error común
      if (error.message?.includes('Network request failed')) {
        diagnostics.error = `Error de red: No se pudo conectar a ${baseURL}. Verifica que el servidor esté corriendo y accesible.`;
      } else if (error.message?.includes('timeout') || error.message?.includes('aborted')) {
        diagnostics.error = `Timeout: El servidor no respondió en 30 segundos. Verifica que ${baseURL} esté accesible.`;
      }

      return diagnostics;
    }
  },
};

