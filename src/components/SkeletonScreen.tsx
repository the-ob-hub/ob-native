import React from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { COLORS } from '../constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const SkeletonScreen: React.FC = () => {
  const shimmerAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.container}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <View style={[styles.skeletonBox, { width: 150, height: 28 }]} />
      </View>

      {/* Horizontal Menu Skeleton */}
      <View style={styles.horizontalMenu}>
        {[1, 2, 3, 4].map(i => (
          <View key={i} style={styles.menuItem}>
            <Animated.View style={[styles.skeletonCircle, { opacity }]} />
          </View>
        ))}
      </View>

      {/* Cards Horizontal Skeleton */}
      <View style={styles.cardsSection}>
        <View style={styles.cardRow}>
          {[1, 2].map(i => (
            <View key={i} style={styles.cardSkeleton}>
              <View style={styles.skeletonBox} />
            </View>
          ))}
        </View>
      </View>

      {/* Transactions List Skeleton */}
      <View style={styles.transactionsSection}>
        {[1, 2, 3, 4, 5].map(i => (
          <View key={i} style={styles.transactionItem}>
            <View style={styles.transactionLeft}>
              <Animated.View style={[styles.skeletonCircle, { width: 40, height: 40, opacity }]} />
              <View style={styles.transactionInfo}>
                <View style={[styles.skeletonBox, { width: 120, height: 16 }]} />
                <View style={[styles.skeletonBox, { width: 80, height: 12 }]} />
              </View>
            </View>
            <View style={[styles.skeletonBox, { width: 60, height: 16 }]} />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'flex-start',
  },
  horizontalMenu: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    marginBottom: 20,
  },
  menuItem: {
    alignItems: 'center',
  },
  skeletonCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E0E0E0',
  },
  cardsSection: {
    marginBottom: 20,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cardSkeleton: {
    width: (SCREEN_WIDTH - 52) / 2,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
  },
  transactionsSection: {
    flex: 1,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionInfo: {
    marginLeft: 12,
    flex: 1,
    gap: 8,
  },
  skeletonBox: {
    width: '100%',
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
  },
});

