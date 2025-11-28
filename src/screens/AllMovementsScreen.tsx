/**
 * AllMovementsScreen
 * Pantalla completa para ver todos los movimientos con buscador
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { MovementCard } from '../components/MovementCard';
import { Movement } from '../models';
import { movementsService } from '../services/api/movementsService';
import { logger } from '../utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, FONTS, BORDER_RADIUS } from '../constants';
import { SharedBackground } from '../components/SharedBackground';

interface AllMovementsScreenProps {
  visible: boolean;
  onClose: () => void;
}

export const AllMovementsScreen: React.FC<AllMovementsScreenProps> = ({ visible, onClose }) => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<Movement[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadMovements = useCallback(async (isRefresh: boolean = false) => {
    try {
      if (!isRefresh) {
        setIsLoading(true);
      }

      const userId = await AsyncStorage.getItem('currentUserId');
      if (!userId) {
        logger.error('❌ AllMovementsScreen - No userId encontrado');
        setIsLoading(false);
        return;
      }

      logger.log(`📊 AllMovementsScreen - Cargando movimientos para userId: ${userId}`);
      const allMovements = await movementsService.getMovementsByUser(userId);
      setMovements(allMovements);
      setFilteredMovements(allMovements);
      logger.log(`✅ AllMovementsScreen - Movimientos cargados: ${allMovements.length}`);
    } catch (error: any) {
      logger.error(`❌ AllMovementsScreen - Error cargando movimientos: ${error.message}`);
      // Fallback a datos mock si el backend falla
      setMovements([]);
      setFilteredMovements([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      loadMovements();
    }
  }, [visible, loadMovements]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredMovements(movements);
    } else {
      const filtered = movements.filter(
        (mov) =>
          (mov.title || mov.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          mov.currency.toLowerCase().includes(searchQuery.toLowerCase()) ||
          mov.amount.toString().includes(searchQuery)
      );
      setFilteredMovements(filtered);
    }
  }, [searchQuery, movements]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMovements(true);
    setRefreshing(false);
  }, [loadMovements]);

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

  const BackIcon = () => (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M5 12L12 19M5 12L12 5"
        stroke={COLORS.white}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <SharedBackground />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Movimientos Unificados</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Buscador */}
        <View style={styles.searchContainer}>
          <View style={styles.searchIconContainer}>
            <SearchIcon />
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar movimientos..."
            placeholderTextColor={COLORS.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <ClearIcon />
            </TouchableOpacity>
          )}
        </View>

      {/* Lista de movimientos */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando movimientos...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {filteredMovements.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>
                {searchQuery ? '🔍' : '📋'}
              </Text>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? 'No se encontraron movimientos'
                  : 'No hay movimientos registrados'}
              </Text>
              {!searchQuery && (
                <Text style={styles.emptySubtext}>
                  Tus transacciones aparecerán aquí cuando realices operaciones
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.movementsList}>
              {filteredMovements.map((movement) => (
                <MovementCard key={movement.id} movement={movement} />
              ))}
            </View>
          )}
        </ScrollView>
      )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: 'transparent',
  },
  backButton: {
    padding: SPACING.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FONTS.inter.bold,
    color: COLORS.white,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  searchIconContainer: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    color: COLORS.white,
    fontSize: 14,
    fontFamily: FONTS.inter.regular,
    paddingVertical: SPACING.sm,
  },
  clearButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  scrollView: {
    flex: 1,
  },
  movementsList: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: FONTS.poppins.semiBold,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: FONTS.poppins.regular,
    color: '#888',
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    fontSize: 14,
    marginTop: 16,
    fontFamily: FONTS.poppins.regular,
  },
});

