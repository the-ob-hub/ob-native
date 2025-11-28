import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
  Alert,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { useLogs } from '../contexts/LogContext';
import { healthService } from '../services/api/healthService';
import { metroDiagnostics } from '../services/dev/metroDiagnostics';

interface LogViewerProps {
  visible: boolean;
  onClose: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const LogViewer: React.FC<LogViewerProps> = ({ visible, onClose }) => {
  const { logs, clearLogs, addLog } = useLogs();
  const [isChecksOpen, setIsChecksOpen] = useState(false);

  const copyLogs = async () => {
    if (logs.length === 0) {
      Alert.alert('Sin logs', 'No hay logs para copiar');
      return;
    }

    try {
      const logsText = logs.map(log => {
        const timestamp = formatTimestamp(log.timestamp);
        return `[${timestamp}] ${log.message}`;
      }).join('\n');
      await Clipboard.setString(logsText);
      Alert.alert('Copiado', 'Logs copiados al portapapeles');
    } catch (error) {
      Alert.alert('Error', 'No se pudieron copiar los logs');
    }
  };

  const checkHealth = async () => {
    try {
      addLog('🏥 GET /health - Verificando estado del servidor...');
      
      const result = await healthService.checkHealth();
      
      addLog(`✅ Health Check OK`);
      addLog(`📊 Status: ${result.status || 'N/A'}`);
      if (result.database) addLog(`💾 Database: ${result.database}`);
      if (result.service) addLog(`⚙️ Service: ${result.service}`);
      if (result.timestamp) addLog(`🕐 Timestamp: ${result.timestamp}`);
      addLog(`📦 Response: ${JSON.stringify(result)}`);
    } catch (error) {
      const errorMsg = `❌ Health Check Error: ${error instanceof Error ? error.message : String(error)}`;
      addLog(errorMsg);
    }
  };

  const diagnoseConnection = async () => {
    try {
      addLog('🔍 Iniciando diagnóstico de conexión API...');
      
      const diagnostics = await healthService.diagnoseConnection();
      
      addLog(`📍 Base URL: ${diagnostics.baseURL}`);
      addLog(`📍 Endpoint: ${diagnostics.endpoint}`);
      addLog(`📍 URL Completa: ${diagnostics.fullURL}`);
      addLog(`🕐 Timestamp: ${diagnostics.timestamp}`);
      
      if (diagnostics.success) {
        addLog(`✅ Conexión exitosa`);
        addLog(`⏱️ Tiempo de respuesta: ${diagnostics.responseTime}ms`);
        if (diagnostics.status) addLog(`📊 Status: ${diagnostics.status}`);
        if (diagnostics.healthData) {
          addLog(`📦 Health Data: ${JSON.stringify(diagnostics.healthData)}`);
        }
      } else {
        addLog(`❌ Conexión fallida`);
        addLog(`⏱️ Tiempo hasta error: ${diagnostics.responseTime}ms`);
        if (diagnostics.error) addLog(`❌ Error: ${diagnostics.error}`);
      }
    } catch (error) {
      const errorMsg = `❌ Error en diagnóstico: ${error instanceof Error ? error.message : String(error)}`;
      addLog(errorMsg);
    }
  };

  const diagnoseMetro = async () => {
    try {
      addLog('🔍 Iniciando diagnóstico de Metro Bundler...');
      addLog('📱 Verificando conexión dispositivo ↔ Xcode ↔ Metro...');
      
      const diagnostics = await metroDiagnostics.diagnoseConnection();
      
      addLog(`📱 Plataforma: ${diagnostics.platform}`);
      addLog(`🔧 Modo desarrollo: ${diagnostics.isDevMode ? 'Sí' : 'No'}`);
      addLog(`🕐 Timestamp: ${diagnostics.timestamp}`);
      addLog('');
      
      const metro = diagnostics.metroConnection;
      
      if (metro.metroURL) {
        addLog(`📍 Metro URL: ${metro.metroURL}`);
      }
      
      if (metro.metroAccessible) {
        addLog(`✅ Metro está accesible`);
        if (metro.responseTime) {
          addLog(`⏱️ Tiempo de respuesta: ${metro.responseTime}ms`);
        }
      } else {
        addLog(`❌ Metro NO está accesible`);
        if (metro.error) {
          addLog(`❌ Error: ${metro.error}`);
        }
      }
      
      addLog('');
      if (metro.suggestions && metro.suggestions.length > 0) {
        addLog('💡 Sugerencias:');
        metro.suggestions.forEach(suggestion => {
          addLog(suggestion);
        });
      }
    } catch (error) {
      const errorMsg = `❌ Error en diagnóstico Metro: ${error instanceof Error ? error.message : String(error)}`;
      addLog(errorMsg);
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={() => setIsChecksOpen(false)}
        />
        <View style={styles.container} pointerEvents="box-none">
          <View style={styles.containerInner} pointerEvents="auto">
          <View style={styles.header}>
            <Text style={styles.title}>Logs de Consola</Text>
            <View style={styles.headerButtons}>
              {/* Botón Checks con dropdown */}
              <View style={styles.checksContainer}>
                <TouchableOpacity 
                  onPress={() => setIsChecksOpen(!isChecksOpen)} 
                  style={styles.checksButton}
                >
                  <Text style={styles.checksButtonText}>Checks</Text>
                  <Text style={styles.checksArrow}>{isChecksOpen ? '▲' : '▼'}</Text>
                </TouchableOpacity>
                {isChecksOpen && (
                  <View style={styles.checksDropdown}>
                    <TouchableOpacity 
                      onPress={() => {
                        checkHealth();
                        setIsChecksOpen(false);
                      }} 
                      style={styles.healthButton}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.healthButtonText}>Health API</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => {
                        diagnoseConnection();
                        setIsChecksOpen(false);
                      }} 
                      style={styles.healthButton}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.healthButtonText}>Diagnóstico API</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => {
                        diagnoseMetro();
                        setIsChecksOpen(false);
                      }} 
                      style={styles.healthButton}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.healthButtonText}>Metro</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={copyLogs} style={styles.copyButton}>
                <Text style={styles.copyButtonText}>Copiar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={clearLogs} style={styles.clearButton}>
                <Text style={styles.clearButtonText}>Limpiar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
          <ScrollView
            style={styles.logsContainer}
            contentContainerStyle={styles.logsContent}
            showsVerticalScrollIndicator={true}
          >
            {logs.length === 0 ? (
              <Text style={styles.emptyText}>No hay logs disponibles</Text>
            ) : (
              logs.map((log) => (
                <View key={log.id} style={styles.logEntry}>
                  <Text style={styles.timestamp}>{formatTimestamp(log.timestamp)}</Text>
                  <Text style={styles.logText}>{log.message}</Text>
                </View>
              ))
            )}
          </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    height: SCREEN_HEIGHT * 0.8,
    backgroundColor: 'transparent',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    zIndex: 1000,
  },
  containerInner: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: '#1a1a1a', // Fondo sólido para que los logs no pasen por encima
    zIndex: 10002, // Mayor que el dropdown y el ScrollView
    position: 'relative',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    zIndex: 10003, // Aún mayor para los botones
    position: 'relative',
  },
  checksContainer: {
    position: 'relative',
    zIndex: 10004, // Mayor z-index para estar sobre todo el contenido
  },
  checksButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#10B981',
    borderRadius: 8,
    gap: 4,
  },
  checksButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  checksArrow: {
    color: '#FFFFFF',
    fontSize: 10,
  },
  checksDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: 4,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    minWidth: 150,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 10000, // Muy alto para estar sobre todo
    zIndex: 10005, // Mayor que todo para estar siempre por encima
  },
  healthButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#10B981',
    borderRadius: 8,
    marginBottom: 4,
    marginHorizontal: 4,
    marginTop: 4,
  },
  healthButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  copyButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#2563EB',
    borderRadius: 6,
  },
  copyButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  clearButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#333',
    borderRadius: 6,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  logsContainer: {
    flex: 1,
    zIndex: 1, // Menor que el header para que quede debajo
  },
  logsContent: {
    padding: 16,
  },
  logEntry: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  timestamp: {
    fontSize: 11,
    color: '#888',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  logText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 40,
  },
});

