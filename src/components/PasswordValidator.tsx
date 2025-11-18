import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONTS } from '../constants';

interface PasswordValidatorProps {
  password: string;
}

interface Requirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: Requirement[] = [
  {
    label: 'Al menos 8 caracteres',
    test: (pwd) => pwd.length >= 8,
  },
  {
    label: 'Una letra mayúscula',
    test: (pwd) => /[A-Z]/.test(pwd),
  },
  {
    label: 'Una letra minúscula',
    test: (pwd) => /[a-z]/.test(pwd),
  },
  {
    label: 'Un número',
    test: (pwd) => /[0-9]/.test(pwd),
  },
  {
    label: 'Un carácter especial',
    test: (pwd) => /[^A-Za-z0-9]/.test(pwd),
  },
];

export const PasswordValidator: React.FC<PasswordValidatorProps> = ({
  password,
}) => {
  return (
    <View style={styles.container}>
      {requirements.map((req, index) => {
        const isValid = req.test(password);
        return (
          <View key={index} style={styles.requirementRow}>
            <View style={[styles.checkbox, isValid && styles.checkboxValid]}>
              {isValid && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text
              style={[
                styles.requirementText,
                isValid && styles.requirementTextValid,
              ]}
            >
              {req.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.white + '60',
    marginRight: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxValid: {
    backgroundColor: '#4CAF50', // Verde
    borderColor: '#4CAF50',
  },
  checkmark: {
    color: COLORS.white,
    fontSize: 12,
    fontFamily: FONTS.inter.bold,
  },
  requirementText: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.7,
    fontFamily: FONTS.inter.regular,
  },
  requirementTextValid: {
    color: '#4CAF50', // Verde
    opacity: 1,
    fontFamily: FONTS.inter.bold,
  },
});

