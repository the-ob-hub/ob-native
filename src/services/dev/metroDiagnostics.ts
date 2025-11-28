/**
 * Servicio de diagnóstico para Metro Bundler
 * Verifica la conexión entre el dispositivo físico, Xcode y Metro
 */
import { logger } from '../../utils/logger';
import { Platform } from 'react-native';

export interface MetroConnectionInfo {
  isDevMode: boolean;
  metroURL?: string;
  metroAccessible: boolean;
  responseTime?: number;
  error?: string;
  suggestions?: string[];
}

export interface DeviceConnectionDiagnostics {
  platform: string;
  isDevMode: boolean;
  metroConnection: MetroConnectionInfo;
  timestamp: string;
}

/**
 * Intenta detectar la URL de Metro desde diferentes fuentes posibles
 */
async function detectMetroURL(): Promise<string[]> {
  const possibleURLs: string[] = [];

  // En desarrollo, Metro normalmente corre en localhost:8081
  // Pero desde un dispositivo físico, necesita la IP de la computadora
  // Intentamos detectar desde el entorno o usar valores comunes

  // URLs comunes para Metro en desarrollo
  if (__DEV__) {
    // Para iOS Simulator (usa localhost)
    possibleURLs.push('http://localhost:8081');
    possibleURLs.push('http://127.0.0.1:8081');
    
    // Para dispositivo físico (necesita IP de la computadora)
    // Intentamos algunas IPs comunes, pero el usuario deberá configurar la correcta
    // Nota: Estas son solo ejemplos, la IP real debe obtenerse de la computadora
    if (Platform.OS === 'ios') {
      // Para iOS físico, normalmente necesita la IP local de la Mac
      // El usuario debe configurarla manualmente desde el menú de desarrollo
      possibleURLs.push('http://192.168.1.100:8081'); // Ejemplo común
      possibleURLs.push('http://192.168.0.100:8081'); // Ejemplo común
    } else if (Platform.OS === 'android') {
      // Para Android emulator
      possibleURLs.push('http://10.0.2.2:8081');
      // Para Android físico
      possibleURLs.push('http://192.168.1.100:8081');
      possibleURLs.push('http://192.168.0.100:8081');
    }
  }

  return possibleURLs;
}

/**
 * Verifica si Metro está accesible en una URL específica
 */
async function checkMetroAccessibility(url: string, timeout: number = 3000): Promise<{ accessible: boolean; responseTime?: number; error?: string }> {
  const startTime = Date.now();
  
  try {
    // Intentar hacer un fetch a la URL de Metro
    // Metro expone un endpoint /status que podemos usar
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(`${url}/status`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    if (response.ok) {
      return {
        accessible: true,
        responseTime,
      };
    } else {
      return {
        accessible: false,
        responseTime,
        error: `HTTP ${response.status}`,
      };
    }
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    
    if (error.name === 'AbortError') {
      return {
        accessible: false,
        responseTime,
        error: 'Timeout - Metro no respondió',
      };
    }

    return {
      accessible: false,
      responseTime,
      error: error.message || 'Error de conexión',
    };
  }
}

/**
 * Genera sugerencias basadas en el diagnóstico
 */
function generateSuggestions(metroInfo: MetroConnectionInfo): string[] {
  const suggestions: string[] = [];

  if (!metroInfo.isDevMode) {
    suggestions.push('⚠️ No estás en modo desarrollo. Metro solo funciona en modo DEBUG.');
    return suggestions;
  }

  if (!metroInfo.metroAccessible) {
    suggestions.push('❌ Metro no está accesible desde el dispositivo');
    suggestions.push('');
    suggestions.push('📋 Pasos para solucionar:');
    suggestions.push('');
    suggestions.push('1️⃣ Verifica que Metro esté corriendo:');
    suggestions.push('   Terminal: npm start');
    suggestions.push('   Deberías ver: "Metro waiting on port 8081"');
    suggestions.push('');
    suggestions.push('2️⃣ La IP se detecta AUTOMÁTICAMENTE durante el build');
    suggestions.push('   - No necesitas configurar nada manualmente');
    suggestions.push('   - El script de build detecta tu IP automáticamente');
    suggestions.push('   - Solo asegúrate de que el celular y la Mac estén en la misma WiFi');
    suggestions.push('');
    suggestions.push('3️⃣ Si aún no funciona:');
    suggestions.push('   - Reconstruye la app desde Xcode (Cmd+B)');
    suggestions.push('   - Esto ejecutará el script de detección automática de IP');
    suggestions.push('   - Verifica en los logs de Xcode: "IP de Metro detectada automáticamente"');
    suggestions.push('');
    suggestions.push('4️⃣ Si usas SIMULADOR:');
    suggestions.push('   - Debería funcionar automáticamente con localhost');
    suggestions.push('   - Si no funciona, reinicia Metro: npm start -- --reset-cache');
    suggestions.push('');
    suggestions.push('5️⃣ Verifica en Xcode:');
    suggestions.push('   - Product → Scheme → Edit Scheme');
    suggestions.push('   - Build Configuration debe ser "Debug"');
    suggestions.push('   - El dispositivo debe aparecer en la lista de dispositivos');
  } else {
    suggestions.push('✅ Metro está accesible y funcionando correctamente');
    if (metroInfo.responseTime) {
      suggestions.push(`⏱️ Tiempo de respuesta: ${metroInfo.responseTime}ms`);
    }
    suggestions.push('');
    suggestions.push('💡 Si aún tienes problemas:');
    suggestions.push('   - Reinicia Metro: npm start -- --reset-cache');
    suggestions.push('   - En Xcode: Product → Clean Build Folder (Shift+Cmd+K)');
    suggestions.push('   - Reconstruye la app desde Xcode');
  }

  return suggestions;
}

export const metroDiagnostics = {
  /**
   * Diagnóstico completo de la conexión con Metro
   */
  async diagnoseConnection(): Promise<DeviceConnectionDiagnostics> {
    const timestamp = new Date().toISOString();
    const isDevMode = __DEV__;

    logger.log('🔍 MetroDiagnostics - Iniciando diagnóstico de conexión...');
    logger.log(`📱 Plataforma: ${Platform.OS}`);
    logger.log(`🔧 Modo desarrollo: ${isDevMode ? 'Sí' : 'No'}`);

    const metroInfo: MetroConnectionInfo = {
      isDevMode,
      metroAccessible: false,
    };

    if (!isDevMode) {
      logger.log('⚠️ No estás en modo desarrollo. Metro solo funciona en modo DEBUG.');
      metroInfo.suggestions = generateSuggestions(metroInfo);
      
      return {
        platform: Platform.OS,
        isDevMode,
        metroConnection: metroInfo,
        timestamp,
      };
    }

    // Intentar detectar y verificar URLs de Metro
    const possibleURLs = await detectMetroURL();
    logger.log(`🔍 Intentando conectar a ${possibleURLs.length} URLs posibles de Metro...`);

    for (const url of possibleURLs) {
      logger.log(`🔗 Probando: ${url}`);
      const result = await checkMetroAccessibility(url, 2000); // 2 segundos timeout

      if (result.accessible) {
        metroInfo.metroURL = url;
        metroInfo.metroAccessible = true;
        metroInfo.responseTime = result.responseTime;
        logger.log(`✅ Metro accesible en: ${url}`);
        logger.log(`⏱️ Tiempo de respuesta: ${result.responseTime}ms`);
        break;
      } else {
        logger.log(`❌ ${url} - ${result.error || 'No accesible'}`);
      }
    }

    if (!metroInfo.metroAccessible) {
      logger.log('❌ No se pudo conectar a Metro en ninguna URL probada');
      metroInfo.error = 'Metro no está accesible desde el dispositivo';
    }

    metroInfo.suggestions = generateSuggestions(metroInfo);

    return {
      platform: Platform.OS,
      isDevMode,
      metroConnection: metroInfo,
      timestamp,
    };
  },

  /**
   * Verificación rápida de Metro
   */
  async quickCheck(): Promise<boolean> {
    if (!__DEV__) {
      return false;
    }

    const possibleURLs = await detectMetroURL();
    
    for (const url of possibleURLs) {
      const result = await checkMetroAccessibility(url, 1000);
      if (result.accessible) {
        return true;
      }
    }

    return false;
  },
};

