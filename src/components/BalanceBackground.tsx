/**
 * BalanceBackground Component
 * Renders different background SVGs based on currency
 */
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, RadialGradient, Stop } from 'react-native-svg';
import { Currency } from '../models';
import { BORDER_RADIUS } from '../constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface BalanceBackgroundProps {
  currency: Currency;
  index: number; // Para IDs únicos de gradientes
}

export const BalanceBackground: React.FC<BalanceBackgroundProps> = ({ currency, index }) => {
  // Renderizar fondo según moneda
  switch (currency) {
    case 'USD':
      return <USDBackground index={index} />;
    case 'UYU':
      return <UYUBackground index={index} />;
    case 'USDc':
    default:
      return <USDcBackground index={index} />;
  }
};

// Fondo para USDc (original)
const USDcBackground: React.FC<{ index: number }> = ({ index }) => {
  const calculatedHeight = (SCREEN_WIDTH / 390) * 782;
  return (
    <View style={styles.backgroundContainer}>
      <Svg 
        width={SCREEN_WIDTH} 
        height={calculatedHeight} 
        viewBox="0 0 390 782" 
        style={styles.backgroundSvg}
        preserveAspectRatio="xMidYMin slice"
      >
      <Defs>
        <LinearGradient id={`paint0_linear_usdc_${index}`} x1="124" y1="468" x2="54.8275" y2="739.71" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#45002D" stopOpacity="0" />
          <Stop offset="1" stopColor="#AB006F" stopOpacity="0.34" />
        </LinearGradient>
        <RadialGradient id={`paint1_radial_usdc_${index}`} cx="0" cy="0" r="1" gradientTransform="matrix(369 830.5 -780.554 340.303 21 75.5)" gradientUnits="userSpaceOnUse">
          <Stop offset="0.673912" stopColor="#C31E20" stopOpacity="0" />
          <Stop offset="1" stopColor="#DA7D03" />
        </RadialGradient>
      </Defs>
      <Path
        d="M0 50C0 22.3857 22.3858 0 50 0H340C367.614 0 390 22.3858 390 50V731.5C390 759.114 367.614 781.5 340 781.5H50C22.3858 781.5 0 759.114 0 731.5V50Z"
        fill="#000000"
        fillOpacity="1"
      />
      <Path
        d="M0 50C0 22.3857 22.3858 0 50 0H340C367.614 0 390 22.3858 390 50V731.5C390 759.114 367.614 781.5 340 781.5H50C22.3858 781.5 0 759.114 0 731.5V50Z"
        fill={`url(#paint0_linear_usdc_${index})`}
      />
      <Path
        d="M0 50C0 22.3857 22.3858 0 50 0H340C367.614 0 390 22.3858 390 50V731.5C390 759.114 367.614 781.5 340 781.5H50C22.3858 781.5 0 759.114 0 731.5V50Z"
        fill={`url(#paint1_radial_usdc_${index})`}
      />
      </Svg>
    </View>
  );
};

// Fondo para USD (dólar - verde)
const USDBackground: React.FC<{ index: number }> = ({ index }) => {
  const calculatedHeight = (SCREEN_WIDTH / 390) * 781;
  return (
    <View style={styles.backgroundContainer}>
      <Svg 
        width={SCREEN_WIDTH} 
        height={calculatedHeight} 
        viewBox="0 0 390 781" 
        style={styles.backgroundSvg}
        preserveAspectRatio="xMidYMin slice"
      >
      <Defs>
        <LinearGradient id={`paint0_linear_usd_${index}`} x1="195" y1="-5.35078e-06" x2="-126.907" y2="777.216" gradientUnits="userSpaceOnUse">
          <Stop offset="0.841346" stopColor="#45002D" stopOpacity="0" />
          <Stop offset="1" stopColor="#AB006F" stopOpacity="0.34" />
        </LinearGradient>
        <RadialGradient id={`paint1_radial_usd_${index}`} cx="0" cy="0" r="1" gradientTransform="matrix(8.50002 735.5 -496.811 329.808 222 194)" gradientUnits="userSpaceOnUse">
          <Stop offset="0.649038" stopColor="#1EC748" stopOpacity="0" />
          <Stop offset="1" stopColor="#009193" />
        </RadialGradient>
      </Defs>
      {/* Fondo negro base */}
      <Path
        d="M0 0H390V731C390 758.614 367.614 781 340 781H50C22.3858 781 0 758.614 0 731V0Z"
        fill="#000000"
        fillOpacity="1"
      />
      <Path
        d="M0 0H390V731C390 758.614 367.614 781 340 781H50C22.3858 781 0 758.614 0 731V0Z"
        fill={`url(#paint0_linear_usd_${index})`}
      />
      <Path
        d="M0 0H390V731C390 758.614 367.614 781 340 781H50C22.3858 781 0 758.614 0 731V0Z"
        fill={`url(#paint1_radial_usd_${index})`}
      />
      </Svg>
    </View>
  );
};

// Fondo para UYU (pesos - azul)
const UYUBackground: React.FC<{ index: number }> = ({ index }) => {
  const calculatedHeight = (SCREEN_WIDTH / 390) * 781;
  return (
    <View style={styles.backgroundContainer}>
      <Svg 
        width={SCREEN_WIDTH} 
        height={calculatedHeight} 
        viewBox="0 0 390 781" 
        style={styles.backgroundSvg}
        preserveAspectRatio="xMidYMin slice"
      >
      <Defs>
        <LinearGradient id={`paint0_linear_uyu_${index}`} x1="195" y1="18.2904" x2="-114.101" y2="782.484" gradientUnits="userSpaceOnUse">
          <Stop offset="0.841346" stopColor="#45002D" stopOpacity="0" />
          <Stop offset="1" stopColor="#AB006F" stopOpacity="0.34" />
        </LinearGradient>
        <RadialGradient id={`paint1_radial_uyu_${index}`} cx="0" cy="0" r="1" gradientTransform="matrix(12 670 -458.508 295.74 234 210.5)" gradientUnits="userSpaceOnUse">
          <Stop offset="0.649038" stopColor="#1E21C7" stopOpacity="0" />
          <Stop offset="1" stopColor="#009193" />
        </RadialGradient>
      </Defs>
      {/* Fondo negro base */}
      <Path
        d="M0 50C0 22.3858 22.3858 0 50 0H340C367.614 0 390 22.3858 390 50V731C390 758.614 367.614 781 340 781H50C22.3858 781 0 758.614 0 731V50Z"
        fill="#000000"
        fillOpacity="1"
      />
      <Path
        d="M0 50C0 22.3858 22.3858 0 50 0H340C367.614 0 390 22.3858 390 50V731C390 758.614 367.614 781 340 781H50C22.3858 781 0 758.614 0 731V50Z"
        fill={`url(#paint0_linear_uyu_${index})`}
      />
      <Path
        d="M0 50C0 22.3858 22.3858 0 50 0H340C367.614 0 390 22.3858 390 50V731C390 758.614 367.614 781 340 781H50C22.3858 781 0 758.614 0 731V50Z"
        fill={`url(#paint1_radial_uyu_${index})`}
      />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: SCREEN_WIDTH,
    zIndex: 0,
    overflow: 'hidden',
    borderBottomLeftRadius: BORDER_RADIUS.xl,
    borderBottomRightRadius: BORDER_RADIUS.xl,
  },
  backgroundSvg: {
    position: 'absolute',
    bottom: 0,
  },
});

