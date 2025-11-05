import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';

interface UserAvatarProps {
  imageUrl?: string;
  fullName?: string;
  onPress: () => void;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ imageUrl, fullName, onPress }) => {
  // Obtener iniciales del nombre
  const getInitials = () => {
    if (!fullName) return 'U';
    const names = fullName.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={styles.avatarContainer}>
        {imageUrl ? (
          <View style={styles.avatar}>
            {/* TODO: Implementar imagen cuando el usuario suba una foto */}
            <Text style={styles.initials}>{getInitials()}</Text>
          </View>
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.initials}>{getInitials()}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0066FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

