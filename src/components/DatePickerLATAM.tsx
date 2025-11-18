import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  TextInput,
  Modal,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../constants';
import { useLogs } from '../contexts/LogContext';

// Intentar importar DateTimePicker, pero manejar el error si no está disponible
let DateTimePicker: any = null;
let DateTimePickerAvailable = false;

try {
  const pickerModule = require('@react-native-community/datetimepicker');
  DateTimePicker = pickerModule.default || pickerModule;
  DateTimePickerAvailable = true;
  console.log('✅ DateTimePicker cargado correctamente');
} catch (error) {
  console.warn('⚠️ DateTimePicker no disponible, usando fallback:', error);
  DateTimePickerAvailable = false;
}

interface DatePickerLATAMProps {
  value: Date | null;
  onChange: (date: Date) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Formatea una fecha al formato LATAM (DD/MM/YYYY)
 */
const formatDateLATAM = (date: Date | null): string => {
  if (!date) return '';
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Convierte una fecha del formato YYYY-MM-DD a Date
 */
const parseDateFromString = (dateString: string): Date | null => {
  if (!dateString) return null;
  const parts = dateString.split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Los meses en JS son 0-indexed
  const day = parseInt(parts[2], 10);
  return new Date(year, month, day);
};

/**
 * Convierte una Date a formato YYYY-MM-DD para el servicio
 */
export const formatDateForService = (date: Date | null): string => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parsea una fecha del formato DD/MM/YYYY
 */
const parseDateLATAM = (dateString: string): Date | null => {
  if (!dateString) return null;
  const parts = dateString.split('/');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Los meses en JS son 0-indexed
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  return new Date(year, month, day);
};

export const DatePickerLATAM: React.FC<DatePickerLATAMProps> = ({
  value,
  onChange,
  placeholder = 'DD/MM/AAAA',
  disabled = false,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [internalDate, setInternalDate] = useState<Date>(
    value || new Date(2000, 0, 1) // Fecha por defecto: 01/01/2000
  );
  const [textInput, setTextInput] = useState('');
  const { addLog } = useLogs();

  // Sincronizar fecha interna cuando cambia el valor desde fuera
  useEffect(() => {
    if (value) {
      setInternalDate(value);
      setTextInput(formatDateLATAM(value));
    } else {
      setTextInput('');
    }
  }, [value]);

  // Loggear cuando showPicker cambia
  useEffect(() => {
    if (showPicker) {
      addLog(`📅 DatePickerLATAM - DateTimePicker renderizado. Platform: ${Platform.OS}, showPicker: ${showPicker}, fecha interna: ${formatDateLATAM(internalDate)}`);
    }
  }, [showPicker]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    addLog(`📅 DatePickerLATAM - handleDateChange llamado. Platform: ${Platform.OS}, event.type: ${event?.type}, selectedDate: ${selectedDate?.toISOString() || 'null'}`);
    
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (event.type === 'set' && selectedDate) {
        addLog(`✅ DatePickerLATAM - Fecha seleccionada en Android: ${formatDateLATAM(selectedDate)}`);
        setInternalDate(selectedDate);
        onChange(selectedDate);
      } else if (event.type === 'dismissed') {
        addLog(`❌ DatePickerLATAM - Usuario canceló en Android`);
      }
    } else {
      // iOS: actualizar fecha interna pero no cerrar hasta confirmar
      if (selectedDate) {
        addLog(`📅 DatePickerLATAM - Fecha actualizada en iOS: ${formatDateLATAM(selectedDate)}`);
        setInternalDate(selectedDate);
      }
    }
  };

  const handlePress = () => {
    if (disabled) {
      addLog(`⚠️ DatePickerLATAM - Intento de abrir date picker pero está deshabilitado`);
      return;
    }
    addLog(`📅 DatePickerLATAM - Usuario hizo tap en el campo de fecha. showPicker actual: ${showPicker}, Platform: ${Platform.OS}`);
    addLog(`📅 DatePickerLATAM - DateTimePicker disponible: ${DateTimePickerAvailable}`);
    addLog(`📅 DatePickerLATAM - Fecha actual: ${value ? formatDateLATAM(value) : 'null'}, Fecha interna: ${formatDateLATAM(internalDate)}`);
    
    // Siempre mostrar el picker (modal o nativo)
    setShowPicker(true);
    addLog(`✅ DatePickerLATAM - showPicker establecido a true`);
    
    if (!DateTimePickerAvailable) {
      addLog(`⚠️ DatePickerLATAM - Usando modal de texto como fallback`);
    }
  };

  const handleCancel = () => {
    addLog(`❌ DatePickerLATAM - Usuario canceló en iOS`);
    setShowPicker(false);
  };

  const handleConfirm = () => {
    addLog(`✅ DatePickerLATAM - Usuario confirmó fecha en iOS: ${formatDateLATAM(internalDate)}`);
    onChange(internalDate);
    setShowPicker(false);
  };

  const handleTextInputChange = (text: string) => {
    // Permitir solo números y barras
    let cleaned = text.replace(/[^0-9/]/g, '');
    
    // Auto-formatear mientras escribe: DD/MM/YYYY
    if (cleaned.length > 0) {
      // Remover barras existentes para reformatear
      const numbers = cleaned.replace(/\//g, '');
      let formatted = '';
      
      if (numbers.length > 0) {
        formatted += numbers.substring(0, 2);
      }
      if (numbers.length > 2) {
        formatted += '/' + numbers.substring(2, 4);
      }
      if (numbers.length > 4) {
        formatted += '/' + numbers.substring(4, 8);
      }
      
      cleaned = formatted;
    }
    
    setTextInput(cleaned);
    
    // Intentar parsear cuando tenga formato completo DD/MM/YYYY
    if (cleaned.length === 10 && cleaned.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const parsed = parseDateLATAM(cleaned);
      if (parsed && !isNaN(parsed.getTime())) {
        addLog(`✅ DatePickerLATAM - Fecha parseada desde texto: ${formatDateLATAM(parsed)}`);
        setInternalDate(parsed);
        // No llamar onChange aquí, solo cuando se confirme
      }
    }
  };

  const displayValue = value ? formatDateLATAM(value) : '';

  // Si DateTimePicker no está disponible, usar input de texto con modal
  if (!DateTimePickerAvailable || !DateTimePicker) {
    return (
      <View>
        <TouchableOpacity
          style={[styles.container, disabled && styles.containerDisabled]}
          onPress={handlePress}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.text,
              !displayValue && styles.placeholder,
            ]}
          >
            {displayValue || placeholder}
          </Text>
        </TouchableOpacity>
        {showPicker && (
          <Modal
            visible={showPicker}
            transparent={true}
            animationType="slide"
            onRequestClose={handleCancel}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={handleCancel}
            >
              <TouchableOpacity
                style={styles.modalContent}
                activeOpacity={1}
                onPress={(e) => e.stopPropagation()}
              >
                <Text style={styles.modalTitle}>Ingresa tu fecha de nacimiento</Text>
                <Text style={styles.modalSubtitle}>Formato: DD/MM/AAAA</Text>
                <TextInput
                  style={styles.modalInput}
                  value={textInput}
                  onChangeText={handleTextInputChange}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="numeric"
                  maxLength={10}
                  autoFocus
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonCancel]}
                    onPress={handleCancel}
                  >
                    <Text style={styles.modalButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonConfirm]}
                    onPress={() => {
                      if (textInput && textInput.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                        const parsed = parseDateLATAM(textInput);
                        if (parsed && !isNaN(parsed.getTime())) {
                          addLog(`✅ DatePickerLATAM - Fecha confirmada desde texto: ${formatDateLATAM(parsed)}`);
                          onChange(parsed);
                          setShowPicker(false);
                        } else {
                          addLog(`❌ DatePickerLATAM - Fecha inválida: ${textInput}`);
                        }
                      } else {
                        addLog(`❌ DatePickerLATAM - Formato inválido: ${textInput}`);
                      }
                    }}
                  >
                    <Text style={[styles.modalButtonText, styles.modalButtonTextConfirm]}>
                      Confirmar
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>
        )}
      </View>
    );
  }

  // Usar DateTimePicker nativo si está disponible
  return (
    <View>
      <TouchableOpacity
        style={[styles.container, disabled && styles.containerDisabled]}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.text,
            !displayValue && styles.placeholder,
          ]}
        >
          {displayValue || placeholder}
        </Text>
      </TouchableOpacity>

      {showPicker && (
        <>
          {Platform.OS === 'android' && DateTimePicker && (
            <DateTimePicker
              value={internalDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()} // No permitir fechas futuras
              minimumDate={new Date(1900, 0, 1)} // Fecha mínima razonable
            />
          )}
          {Platform.OS === 'ios' && DateTimePicker && (
            <>
              <DateTimePicker
                value={internalDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                maximumDate={new Date()} // No permitir fechas futuras
                minimumDate={new Date(1900, 0, 1)} // Fecha mínima razonable
                locale="es-ES" // Configurar para español
              />
              <View style={styles.iosPickerActions}>
                <TouchableOpacity
                  style={styles.iosPickerButton}
                  onPress={handleCancel}
                >
                  <Text style={styles.iosPickerButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.iosPickerButton, styles.iosPickerButtonConfirm]}
                  onPress={handleConfirm}
                >
                  <Text style={[styles.iosPickerButtonText, styles.iosPickerButtonTextConfirm]}>
                    Confirmar
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    minHeight: 48,
    justifyContent: 'center',
  },
  containerDisabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontFamily: FONTS.inter.regular,
    color: COLORS.text,
  },
  textInput: {
    fontSize: 16,
    fontFamily: FONTS.inter.regular,
    color: COLORS.text,
    padding: 0,
  },
  placeholder: {
    color: COLORS.textSecondary,
  },
  iosPickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.textSecondary + '20',
  },
  iosPickerButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  iosPickerButtonConfirm: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
  },
  iosPickerButtonText: {
    fontSize: 16,
    fontFamily: FONTS.inter.regular,
    color: COLORS.text,
  },
  iosPickerButtonTextConfirm: {
    color: COLORS.white,
    fontFamily: FONTS.inter.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: FONTS.inter.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: FONTS.inter.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 18,
    fontFamily: FONTS.inter.regular,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalButtonConfirm: {
    backgroundColor: COLORS.primary,
  },
  modalButtonText: {
    fontSize: 16,
    fontFamily: FONTS.inter.bold,
    color: COLORS.text,
  },
  modalButtonTextConfirm: {
    color: COLORS.white,
  },
});
