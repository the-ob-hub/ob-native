import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  Alert,
  Clipboard,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { User } from '../models';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.8;

interface ProfileSheetProps {
  visible: boolean;
  onClose: () => void;
  user: User | null;
  onLogout?: () => void;
}

// Icono de copiar minimalista similar al navbar
const CopyIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M8 4v12a2 2 0 002 2h8a2 2 0 002-2V7.242a2 2 0 00-.602-1.43L16.083 2.57A2 2 0 0014.685 2H10a2 2 0 00-2 2z"
      stroke="#0066FF"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M16 18v2a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2h2"
      stroke="#0066FF"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ProfileSheet: React.FC<ProfileSheetProps> = ({ visible, onClose, user, onLogout }) => {
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

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
    }
  }, [visible]);

  const handleClose = () => {
    // Animación de cierre fluida
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

  const handleCopy = async (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert('¡Copiado!', `${label} copiado al portapapeles`);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getInitials = () => {
    if (!user?.fullName) return 'U';
    const names = user.fullName.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  // TODO: Obtener alias y CBU/CVU del backend cuando esté disponible
  // PROPUESTA BACKEND: Agregar campos 'alias' y 'cbu' o 'cvu' al modelo User
  // Por ahora están hardcodeados como valores de ejemplo
  const cbu = '0000003100010000000001';
  const alias = 'onda.user.bank';

  if (!user) return null;

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
            {/* Avatar grande */}
            <View style={styles.avatarSection}>
              <View style={styles.largeAvatar}>
                <Text style={styles.largeInitials}>{getInitials()}</Text>
              </View>
            </View>

            {/* Nombre */}
            <Text style={styles.fullName} numberOfLines={2}>
              {user.fullName}
            </Text>

            {/* Alias y CBU/CVU */}
            <View style={styles.bankInfoSection}>
              <View style={styles.bankInfoRow}>
                <View style={styles.bankInfoLeft}>
                  <Text style={styles.bankInfoLabel}>Alias</Text>
                  <Text style={styles.bankInfoValue}>{alias}</Text>
                </View>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => handleCopy(alias, 'Alias')}
                >
                  <CopyIcon />
                </TouchableOpacity>
              </View>

              <View style={styles.separator} />

              <View style={styles.bankInfoRow}>
                <View style={styles.bankInfoLeft}>
                  <Text style={styles.bankInfoLabel}>CBU/CVU</Text>
                  <Text style={styles.bankInfoValue}>{cbu}</Text>
                </View>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => handleCopy(cbu, 'CBU/CVU')}
                >
                  <CopyIcon />
                </TouchableOpacity>
              </View>
            </View>

            {/* Botones de acción */}
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => Alert.alert('Soporte', 'Función de soporte próximamente')}
            >
              <Text style={styles.actionButtonText}>Soporte</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => Alert.alert('Seguridad', 'Configuración de seguridad próximamente')}
            >
              <Text style={styles.actionButtonText}>Seguridad</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => Alert.alert('Invita amigos', 'Programa de referidos próximamente')}
            >
              <Text style={styles.actionButtonText}>Invita amigos</Text>
            </TouchableOpacity>

            {/* Separador antes del logout */}
            <View style={styles.separator} />

            {/* Botón de Logout */}
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={() => {
                Alert.alert(
                  'Cerrar sesión',
                  '¿Estás seguro de que quieres cerrar sesión? Se borrarán todos los datos locales.',
                  [
                    {
                      text: 'Cancelar',
                      style: 'cancel',
                    },
                    {
                      text: 'Cerrar sesión',
                      style: 'destructive',
                      onPress: () => {
                        onClose();
                        if (onLogout) {
                          onLogout();
                        }
                      },
                    },
                  ]
                );
              }}
            >
              <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
            </TouchableOpacity>

            {/* Datos personales */}
            <View style={styles.dataSection}>
              <Text style={styles.sectionTitle}>Datos personales</Text>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Email</Text>
                <Text style={styles.dataValue}>{user.email || 'N/A'}</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Teléfono</Text>
                <Text style={styles.dataValue}>{user.phone || 'N/A'}</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Tipo de documento</Text>
                <Text style={styles.dataValue}>{user.documentType || 'N/A'}</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Número de documento</Text>
                <Text style={styles.dataValue}>{user.documentNumber || 'N/A'}</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Fecha de nacimiento</Text>
                <Text style={styles.dataValue}>{formatDate(user.birthDate)}</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Nacionalidad</Text>
                <Text style={styles.dataValue}>{user.nationality || 'N/A'}</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Dirección</Text>
                <Text style={styles.dataValue}>{user.address || 'N/A'}</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>País de residencia</Text>
                <Text style={styles.dataValue}>{user.countryOfResidence || 'N/A'}</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>País de origen de fondos</Text>
                <Text style={styles.dataValue}>{user.countryOfFundsOrigin || 'N/A'}</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Persona Expuesta Políticamente</Text>
                <Text style={styles.dataValue}>{user.isPEP ? 'Sí' : 'No'}</Text>
              </View>
            </View>

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
    backgroundColor: '#FFFFFF',
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
    paddingHorizontal: 24,
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  largeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0066FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeInitials: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  fullName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 24,
  },
  bankInfoSection: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  bankInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankInfoLeft: {
    flex: 1,
  },
  bankInfoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  bankInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  copyButton: {
    padding: 8,
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  actionButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  dataSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  dataRow: {
    marginBottom: 16,
  },
  dataLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  dataValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  logoutButton: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
});

