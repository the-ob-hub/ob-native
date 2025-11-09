/**
 * Servicio para Health Check
 */
import { apiClient } from './base';

export interface HealthResponse {
  status: string;
  database?: string;
  service?: string;
  timestamp?: string;
}

export const healthService = {
  /**
   * Health Check - Verifica estado del backend y DB
   * GET /health
   */
  async checkHealth(): Promise<HealthResponse> {
    try {
      console.log('🏥 HealthService - Verificando salud del backend...');
      const health = await apiClient.get<HealthResponse>('/health');
      console.log('🏥 HealthService - Health check exitoso:', health);
      return health;
    } catch (error) {
      console.error('❌ HealthService - Error en health check:', error);
      throw error;
    }
  },
};

