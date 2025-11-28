/**
 * Configuración base para llamadas API
 */
import { logger } from '../../utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL del backend real
// Usar HTTP sin puerto (puerto automático)
const BASE_URL = 'http://oobnk.com';

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
    options: RequestInit = {},
    externalSignal?: AbortSignal
  ): Promise<T> {
    // Codificar el endpoint para manejar caracteres especiales como # en IDs compuestos
    const encodedEndpoint = endpoint.split('/').map(segment => {
      // Codificar cada segmento del path, pero preservar los separadores
      return segment.includes('#') ? segment.replace(/#/g, '%23') : segment;
    }).join('/');
    const url = `${this.baseURL}${encodedEndpoint}`;
    const method = options.method || 'GET';
    
    // Obtener JWT token y agregarlo a los headers
    const jwtToken = await this.getJwtToken();
    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      ...(options.headers as Record<string, string> || {}),
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
      logger.log(`🌐 ApiClient.request() - Iniciando fetch a: ${url}`);
      logger.log(`🌐 ApiClient.request() - Método: ${method}`);
      logger.log(`🌐 ApiClient.request() - Headers: ${JSON.stringify(headers)}`);
      
      // Crear AbortController para timeout (compatible con React Native)
      const timeoutController = new AbortController();
      const timeoutId = setTimeout(() => timeoutController.abort(), 30000); // 30 segundos timeout
      
      // Combinar signal externo (si existe) con el timeout signal
      // Si hay un signal externo, crear un nuevo controller que escuche ambos
      let finalSignal: AbortSignal;
      if (externalSignal) {
        // Crear un nuevo controller que se cancela si cualquiera de los dos se cancela
        const combinedController = new AbortController();
        
        // Escuchar el signal externo
        externalSignal.addEventListener('abort', () => {
          combinedController.abort();
        });
        
        // Escuchar el timeout signal
        timeoutController.signal.addEventListener('abort', () => {
          combinedController.abort();
        });
        
        finalSignal = combinedController.signal;
      } else {
        finalSignal = timeoutController.signal;
      }
      
      const response = await fetch(url, {
        ...options,
        headers,
        signal: finalSignal,
      });
      
      clearTimeout(timeoutId);

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
    } catch (error: any) {
      // Log detallado del error
      const errorName = error?.name || 'Unknown';
      const errorMessage = error?.message || String(error);
      const errorStack = error?.stack || 'N/A';
      
      logger.error(`❌ API Request Failed ${method} ${endpoint}`);
      logger.error(`❌ Error Name: ${errorName}`);
      logger.error(`❌ Error Message: ${errorMessage}`);
      logger.error(`❌ Error Stack: ${errorStack}`);
      logger.error(`❌ URL intentada: ${url}`);
      
      // Si es un error de red, dar más contexto
      if (errorMessage.includes('Network request failed') || errorName === 'TypeError') {
        logger.error(`⚠️ Posibles causas del error de red:`);
        logger.error(`   1. El backend puede estar caído o inaccesible`);
        logger.error(`   2. El dispositivo no tiene conexión a internet`);
        logger.error(`   3. El dispositivo no puede alcanzar la IP del backend (firewall/red)`);
        logger.error(`   4. El backend cambió de IP o puerto`);
        logger.error(`   URL del backend: ${this.baseURL}`);
      }
      
      // Si es AbortError, no loggear como error (fue cancelado intencionalmente)
      if (errorName === 'AbortError') {
        // No loggear como error, solo como info si es necesario
        // throw error; // Relanzar para que el caller pueda manejarlo
        throw error; // Relanzar silenciosamente
      }
      
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: RequestInit, signal?: AbortSignal): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' }, signal);
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body?: any, options?: RequestInit, signal?: AbortSignal): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }, signal);
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

  /**
   * Obtiene la URL base actual del cliente API
   */
  getBaseURL(): string {
    return this.baseURL;
  }
}

// Instancia singleton del cliente API
export const apiClient = new ApiClient();

