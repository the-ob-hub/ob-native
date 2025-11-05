import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../constants';

export const TarjetasScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tarjetas</Text>
      <Text style={styles.subtitle}>Próximamente</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.textSecondary,
  },
});

