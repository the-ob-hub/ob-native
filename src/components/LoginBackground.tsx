/**
 * LoginBackground Component
 * Renders the login background SVG
 */
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, RadialGradient, Stop } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface LoginBackgroundProps {
  index?: number; // Para IDs únicos de gradientes si se necesita
}

export const LoginBackground: React.FC<LoginBackgroundProps> = ({ index = 0 }) => {
  const gradientId = `login_bg_${index}`;
  
  return (
    <View style={styles.backgroundContainer}>
      <Svg 
        width={SCREEN_WIDTH} 
        height={SCREEN_HEIGHT} 
        viewBox="0 0 390 782" 
        style={styles.backgroundSvg}
        preserveAspectRatio="xMidYMid slice"
      >
        <Defs>
          <LinearGradient id={`paint0_linear_${gradientId}`} x1="266" y1="313.5" x2="335.173" y2="41.7904" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#45002D" stopOpacity="0" />
            <Stop offset="1" stopColor="#AB006F" stopOpacity="0.34" />
          </LinearGradient>
          <RadialGradient id={`paint1_radial_${gradientId}`} cx="0" cy="0" r="1" gradientTransform="matrix(-369 -830.5 780.554 -340.303 369 706)" gradientUnits="userSpaceOnUse">
            <Stop offset="0.673912" stopColor="#C31E20" stopOpacity="0" />
            <Stop offset="1" stopColor="#DA7D03" />
          </RadialGradient>
          <LinearGradient id={`paint2_linear_${gradientId}`} x1="195" y1="914.5" x2="195" y2="428" gradientUnits="userSpaceOnUse">
            <Stop stopOpacity="0" />
            <Stop offset="1" stopColor="#000000" />
          </LinearGradient>
          <LinearGradient id={`paint3_linear_${gradientId}`} x1="195" y1="19.2904" x2="-114.101" y2="783.484" gradientUnits="userSpaceOnUse">
            <Stop offset="0.841346" stopColor="#45002D" stopOpacity="0" />
            <Stop offset="1" stopColor="#AB006F" stopOpacity="0.34" />
          </LinearGradient>
          <RadialGradient id={`paint4_radial_${gradientId}`} cx="0" cy="0" r="1" gradientTransform="matrix(12 670 -458.508 295.74 234 211.5)" gradientUnits="userSpaceOnUse">
            <Stop offset="0.649038" stopColor="#1E21C7" stopOpacity="0" />
            <Stop offset="1" stopColor="#009193" />
          </RadialGradient>
        </Defs>
        
        {/* Base shape with gradients */}
        <Path 
          d="M390 731.5C390 759.114 367.614 781.5 340 781.5L50 781.5C22.3858 781.5 1.95703e-06 759.114 4.37114e-06 731.5L6.39498e-05 50C6.63639e-05 22.3857 22.3858 -3.21379e-05 50.0001 -2.97237e-05L340 -4.37114e-06C367.614 -1.95703e-06 390 22.3858 390 50L390 731.5Z" 
          fill={`url(#paint0_linear_${gradientId})`}
        />
        <Path 
          d="M390 731.5C390 759.114 367.614 781.5 340 781.5L50 781.5C22.3858 781.5 1.95703e-06 759.114 4.37114e-06 731.5L6.39498e-05 50C6.63639e-05 22.3857 22.3858 -3.21379e-05 50.0001 -2.97237e-05L340 -4.37114e-06C367.614 -1.95703e-06 390 22.3858 390 50L390 731.5Z" 
          fill={`url(#paint1_radial_${gradientId})`}
        />
        <Path 
          d="M390 731.5C390 759.114 367.614 781.5 340 781.5L50 781.5C22.3858 781.5 1.95703e-06 759.114 4.37114e-06 731.5L6.39498e-05 50C6.63639e-05 22.3857 22.3858 -3.21379e-05 50.0001 -2.97237e-05L340 -4.37114e-06C367.614 -1.95703e-06 390 22.3858 390 50L390 731.5Z" 
          fill={`url(#paint2_linear_${gradientId})`}
          fillOpacity="0.2"
        />
        <Path 
          d="M0 51C0 23.3858 22.3858 1 50 1H340C367.614 1 390 23.3858 390 51V732C390 759.614 367.614 782 340 782H50C22.3858 782 0 759.614 0 732V51Z" 
          fill={`url(#paint3_linear_${gradientId})`}
        />
        <Path 
          d="M0 51C0 23.3858 22.3858 1 50 1H340C367.614 1 390 23.3858 390 51V732C390 759.614 367.614 782 340 782H50C22.3858 782 0 759.614 0 732V51Z" 
          fill={`url(#paint4_radial_${gradientId})`}
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  backgroundSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});



