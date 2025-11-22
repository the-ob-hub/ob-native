/**
 * Configuración base para llamadas API
 */
import { logger } from '../../utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL del backend real
const BASE_URL = 'http://ec2-34-224-57-79.compute-1.amazonaws.com:3000';

export interface ApiConfig {
  baseURL?: string;
  headers?: Record<string, string>;
  timeout?: number;
}

class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(config: ApiConfig = {}) {
    this.baseURL = config.baseURL || BASE_URL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...config.headers,
    };
  }

  /**
   * Obtiene el JWT token de AsyncStorage
   */
  private async getJwtToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem('jwt_token');
      if (token) {
        logger.log(`🔑 ApiClient.getJwtToken() - JWT obtenido de AsyncStorage (length: ${token.length})`);
        // Log preview del token para debugging
        const tokenPreview = token.substring(0, 30);
        logger.log(`🔍 ApiClient.getJwtToken() - JWT preview: ${tokenPreview}...`);
      } else {
        logger.log(`⚠️ ApiClient.getJwtToken() - No hay JWT disponible en AsyncStorage`);
      }
      return token;
    } catch (error: any) {
      logger.error(`❌ ApiClient.getJwtToken() - Error obteniendo JWT: ${error.message}`);
      logger.error(`❌ ApiClient.getJwtToken() - Error stack: ${error.stack || 'N/A'}`);
      return null;
    }
  }

  /**
   * Realiza una petición HTTP
   */
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const method = options.method || 'GET';
    
    // Obtener JWT token y agregarlo a los headers
    const jwtToken = await this.getJwtToken();
    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      ...options.headers,
    };
    
    // Agregar Authorization header si hay JWT
    if (jwtToken) {
      headers['Authorization'] = `Bearer ${jwtToken}`;
      logger.log(`🔐 ApiClient.request() - Authorization header agregado con JWT`);
      logger.log(`🔍 ApiClient.request() - Header Authorization: Bearer ${jwtToken.substring(0, 30)}...`);
    } else {
      logger.log(`⚠️ ApiClient.request() - No se agregó Authorization header (no hay JWT disponible)`);
    }
    
    // Log de request
    const logRequest = `🌐 API ${method} ${endpoint}`;
    const logUrl = `URL: ${url}`;
    logger.log(logRequest);
    logger.log(logUrl);
    if (options.body) {
      const bodyStr = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      const bodyPreview = bodyStr.length > 300 ? bodyStr.substring(0, 300) + '...' : bodyStr;
      logger.log(`Body: ${bodyPreview}`);
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Log de response
      const logResponse = `✅ API ${method} ${endpoint} - ${response.status} ${response.statusText}`;
      logger.log(logResponse);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorLog = `❌ API Error ${method} ${endpoint} - ${response.status}: ${JSON.stringify(errorData)}`;
        logger.error(errorLog);
        throw new Error(`API Error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      const dataPreview = JSON.stringify(data).substring(0, 200);
      logger.log(`Response: ${dataPreview}${JSON.stringify(data).length > 200 ? '...' : ''}`);
      
      return data as T;
    } catch (error) {
      const errorLog = `❌ API Request Failed ${method} ${endpoint}: ${error instanceof Error ? error.message : String(error)}`;
      logger.error(errorLog);
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Instancia singleton del cliente API
export const apiClient = new ApiClient();

