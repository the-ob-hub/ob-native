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
  ActivityIndicator,
} from 'react-native';
import { COLORS, SPACING, FONTS } from '../constants';
import { useLogs } from '../contexts/LogContext';
import { userService } from '../services/api/userService';
import { contactsService } from '../services/api/contactsService';
import { User } from '../models';

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

  const [phone, setPhone] = useState('');
  const [nickname, setNickname] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundUser, setFoundUser] = useState<User | null>(null);
  const [cvu, setCvu] = useState('');
  const [alias, setAlias] = useState('');
  const [fullName, setFullName] = useState('');

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
      setPhone('');
      setNickname('');
      setIsSearching(false);
      setFoundUser(null);
      setCvu('');
      setAlias('');
      setFullName('');
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

  // Buscar usuario por teléfono cuando se ingresa
  useEffect(() => {
    const searchUser = async () => {
      if (!phone || phone.length < 8) {
        setFoundUser(null);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        addLog(`🔍 AddContactSheet - Buscando usuario por teléfono: ${phone}`);
        const user = await userService.getUserByPhone(phone);
        
        if (user) {
          addLog(`✅ AddContactSheet - Usuario encontrado: ${user.fullName}`);
          setFoundUser(user);
          setFullName(user.fullName || '');
          setCvu(user.id || ''); // Usar ID como CVU temporalmente
          // No establecer alias automáticamente, dejar que el usuario lo ingrese como nickname
        } else {
          addLog(`⚠️ AddContactSheet - Usuario no encontrado por teléfono`);
          setFoundUser(null);
        }
      } catch (error: any) {
        addLog(`❌ AddContactSheet - Error buscando usuario: ${error.message}`);
        setFoundUser(null);
      } finally {
        setIsSearching(false);
      }
    };

    // Debounce de 800ms para evitar búsquedas excesivas
    const timeoutId = setTimeout(searchUser, 800);
    return () => clearTimeout(timeoutId);
  }, [phone]);

  const handleAdd = async () => {
    if (!phone || phone.length < 8) {
      Alert.alert('Error', 'Debes ingresar un teléfono válido');
      return;
    }

    if (!foundUser && !nickname) {
      Alert.alert('Error', 'Si el usuario no existe, debes ingresar un nombre');
      return;
    }

    try {
      addLog(`➕ AddContactSheet - Agregando contacto: ${nickname || fullName || 'Sin nombre'} (Tel: ${phone})`);
      
      // Si encontramos un usuario, guardarlo como contacto con nickname
      if (foundUser) {
        const contactData = {
          contactId: foundUser.id,
          alias: nickname || undefined,
          cvu: foundUser.id, // Usar ID como CVU
        };

        // Guardar en el servicio de contactos
        const result = await contactsService.addContact(contactData);
        
        if (result.success) {
          addLog(`✅ AddContactSheet - Contacto guardado exitosamente`);
          
          // Llamar al callback con los datos completos
          onAddContact({
            contactId: foundUser.id,
            cvu: foundUser.id,
            alias: nickname || undefined,
            fullName: nickname || foundUser.fullName || '',
            phone: phone,
          });
          
          handleClose();
        } else {
          Alert.alert('Error', 'No se pudo guardar el contacto');
        }
      } else {
        // Usuario no encontrado, agregar como contacto externo con nombre manual
        onAddContact({
          fullName: nickname || 'Contacto sin nombre',
          phone: phone,
        });
        
        handleClose();
      }
    } catch (error: any) {
      addLog(`❌ AddContactSheet - Error agregando contacto: ${error.message}`);
      Alert.alert('Error', 'No se pudo agregar el contacto');
    }
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
            <Text style={styles.subtitle}>Ingresa el teléfono para buscar y agregar un contacto</Text>

            {/* Campo Teléfono - Principal */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Teléfono *</Text>
              <View style={styles.phoneInputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: +59812345678"
                  placeholderTextColor={COLORS.textSecondary}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  autoFocus
                />
                {isSearching && (
                  <ActivityIndicator size="small" color={COLORS.primary} style={styles.searchIndicator} />
                )}
              </View>
              {foundUser && (
                <View style={styles.userFoundContainer}>
                  <Text style={styles.userFoundText}>✓ Usuario encontrado: {foundUser.fullName}</Text>
                  {foundUser.email && (
                    <Text style={styles.userFoundEmail}>{foundUser.email}</Text>
                  )}
                </View>
              )}
            </View>

            {/* Campo Nickname - Solo si se encontró usuario */}
            {foundUser && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Nickname (opcional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Juan"
                  placeholderTextColor={COLORS.textSecondary}
                  value={nickname}
                  onChangeText={setNickname}
                  autoCapitalize="words"
                />
                <Text style={styles.helperText}>Este nombre aparecerá en tus contactos</Text>
              </View>
            )}

            {/* Campo Nombre - Solo si NO se encontró usuario */}
            {!foundUser && phone.length >= 8 && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Nombre completo *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Juan Pérez"
                  placeholderTextColor={COLORS.textSecondary}
                  value={nickname}
                  onChangeText={setNickname}
                  autoCapitalize="words"
                />
                <Text style={styles.helperText}>El usuario no está registrado en la app</Text>
              </View>
            )}

            {/* Botón Agregar */}
            <TouchableOpacity
              style={[
                styles.addButton,
                (!phone || phone.length < 8 || (!foundUser && !nickname)) && styles.addButtonDisabled
              ]}
              onPress={handleAdd}
              activeOpacity={0.8}
              disabled={!phone || phone.length < 8 || (!foundUser && !nickname)}
            >
              <Text style={styles.addButtonText}>
                {foundUser ? 'Agregar contacto' : 'Agregar como externo'}
              </Text>
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
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
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
  searchIndicator: {
    marginLeft: SPACING.sm,
  },
  userFoundContainer: {
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 0, 0.3)',
  },
  userFoundText: {
    fontSize: 14,
    fontFamily: FONTS.inter.bold,
    color: '#00FF00',
  },
  userFoundEmail: {
    fontSize: 12,
    fontFamily: FONTS.inter.regular,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  helperText: {
    fontSize: 12,
    fontFamily: FONTS.inter.regular,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  addButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    opacity: 0.5,
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

