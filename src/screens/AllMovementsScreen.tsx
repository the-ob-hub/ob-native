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
} from 'react-native';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MovementCard } from '../components/MovementCard';
import { Movement } from '../models';
import { movementsService } from '../services/api/movementsService';
import { logger } from '../utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, FONTS } from '../constants';

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
  // Usar valores por defecto en lugar de useSafeAreaInsets para evitar error si no hay SafeAreaProvider
  const insets = { top: 44, bottom: 34, left: 0, right: 0 }; // Valores por defecto para iPhone

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

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Movimientos</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Buscador */}
      <View style={styles.searchContainer}>
        <View style={styles.searchIconContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>✕</Text>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#1e1e1e',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '300',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: FONTS.poppins.bold,
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  searchIconContainer: {
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIcon: {
    fontSize: 18,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 12,
    fontFamily: FONTS.poppins.regular,
  },
  clearButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#888',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  movementsList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
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

