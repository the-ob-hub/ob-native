import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { COLORS, SPACING, FONTS } from '../constants';
import { useLogs } from '../contexts/LogContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.8;

interface AddContactSheetProps {
  visible: boolean;
  onClose: () => void;
  onAddContact: (contact: {
    cvu?: string;
    alias?: string;
    fullName?: string;
    phone?: string;
  }) => void;
}

export const AddContactSheet: React.FC<AddContactSheetProps> = ({
  visible,
  onClose,
  onAddContact,
}) => {
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const { addLog } = useLogs();

  const [cvu, setCvu] = useState('');
  const [alias, setAlias] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: SHEET_HEIGHT,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      // Limpiar campos al cerrar
      setCvu('');
      setAlias('');
      setFullName('');
      setPhone('');
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: SHEET_HEIGHT,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleAdd = () => {
    if (!cvu && !alias) {
      Alert.alert('Error', 'Debes ingresar al menos un CVU o un Alias');
      return;
    }

    addLog(`➕ AddContactSheet - Agregando contacto: ${fullName || 'Sin nombre'} (CVU: ${cvu || 'N/A'}, Alias: ${alias || 'N/A'})`);
    
    onAddContact({
      cvu: cvu || undefined,
      alias: alias || undefined,
      fullName: fullName || undefined,
      phone: phone || undefined,
    });

    handleClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.modalContainer}>
        {/* Backdrop */}
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: backdropAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleClose}
          />
        </Animated.View>

        {/* Sheet */}
        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Handle */}
          <TouchableOpacity onPress={handleClose} activeOpacity={0.7}>
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>
          </TouchableOpacity>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>Agregar contacto</Text>
            <Text style={styles.subtitle}>Ingresa los datos para crear un nuevo contacto</Text>

            {/* Campo CVU */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>CVU</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 0288818238126387137691"
                placeholderTextColor={COLORS.textSecondary}
                value={cvu}
                onChangeText={setCvu}
                keyboardType="numeric"
                autoCapitalize="none"
              />
            </View>

            {/* Campo Alias */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Alias</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: juan.perez"
                placeholderTextColor={COLORS.textSecondary}
                value={alias}
                onChangeText={setAlias}
                autoCapitalize="none"
              />
            </View>

            {/* Campo Nombre completo */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nombre completo</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Juan Pérez"
                placeholderTextColor={COLORS.textSecondary}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>

            {/* Campo Teléfono */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Teléfono (opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: +59812345678"
                placeholderTextColor={COLORS.textSecondary}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            {/* Botón Agregar */}
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAdd}
              activeOpacity={0.8}
            >
              <Text style={styles.addButtonText}>Agregar contacto</Text>
            </TouchableOpacity>

            {/* Botón Cancelar */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            {/* Espacio al final */}
            <View style={{ height: 40 }} />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    height: SHEET_HEIGHT,
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  title: {
    fontSize: 24,
    fontFamily: FONTS.inter.bold,
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FONTS.inter.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: 14,
    fontFamily: FONTS.inter.bold,
    color: COLORS.white,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 16,
    fontFamily: FONTS.inter.regular,
    color: COLORS.white,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  addButtonText: {
    fontSize: 16,
    fontFamily: FONTS.inter.bold,
    color: COLORS.white,
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: FONTS.inter.regular,
    color: COLORS.white,
  },
});

