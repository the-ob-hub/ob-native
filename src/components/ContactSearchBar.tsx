import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../constants';
import { useLogs } from '../contexts/LogContext';

interface ContactSearchBarProps {
  onSearchChange: (query: string) => void;
  placeholder?: string;
}

const SearchIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
    <Path
      d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z"
      stroke={COLORS.textSecondary}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M19 19L14.65 14.65"
      stroke={COLORS.textSecondary}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ClearIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
    <Path
      d="M12 4L4 12M4 4L12 12"
      stroke={COLORS.textSecondary}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ContactSearchBar: React.FC<ContactSearchBarProps> = ({
  onSearchChange,
  placeholder = 'Alias, nombre, celular, CVU',
}) => {
  const [query, setQuery] = useState('');
  const { addLog } = useLogs();

  const handleClear = () => {
    addLog('🧹 ContactSearchBar - Limpiando búsqueda');
    setQuery('');
    onSearchChange('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.iconContainer}>
          <SearchIcon />
        </View>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textSecondary}
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            // Llamar inmediatamente sin debounce para búsqueda en tiempo real
            onSearchChange(text);
          }}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <ClearIcon />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
    width: '100%',
    alignItems: 'center', // Centrar el buscador
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: Math.round(SPACING.sm * 1.46), // 46% más alto (10% + 10% + 10% + 10% adicional)
    width: '88%', // 88% de ancho (aumentado 10% desde 80%)
  },
  iconContainer: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.inter.regular,
    color: COLORS.white,
    padding: 0,
  },
  clearButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.xs,
  },
});

