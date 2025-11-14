import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONTS } from '../constants';
import { UserContact } from '../models/contacts';
import { useLogs } from '../contexts/LogContext';

interface ContactAvatarProps {
  contact: UserContact;
  size?: number;
  showBadge?: boolean; // Badge de "Dolar App"
  onPress?: () => void;
}

export const ContactAvatar: React.FC<ContactAvatarProps> = ({
  contact,
  size = 50,
  showBadge = false,
  onPress,
}) => {
  const { addLog } = useLogs();

  // Obtener iniciales del nombre
  const getInitials = () => {
    if (!contact.fullName) return 'U';
    const names = contact.fullName.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  // Generar color basado en el nombre (para consistencia)
  const getColor = () => {
    const colors = [
      '#0066FF', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
      '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739',
    ];
    const index = (contact.fullName?.charCodeAt(0) || 0) % colors.length;
    return colors[index];
  };

  const Component = onPress ? TouchableOpacity : View;

  const handlePress = () => {
    if (onPress) {
      addLog(`👆 ContactAvatar - Avatar presionado: ${contact.fullName}`);
      onPress();
    }
  };

  return (
    <Component
      onPress={handlePress}
      activeOpacity={0.7}
      style={[styles.container, { width: size, height: size }]}
    >
      <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: getColor() }]}>
        {contact.avatar ? (
          // TODO: Implementar imagen cuando esté disponible
          <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{getInitials()}</Text>
        ) : (
          <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{getInitials()}</Text>
        )}
      </View>
      {showBadge && contact.hasDolarApp && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>DA</Text>
        </View>
      )}
    </Component>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: {
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: FONTS.inter.semiBold,
  },
  badge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: '#000000',
  },
  badgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: FONTS.inter.bold,
  },
});

