import React from 'react';
import { StyleSheet, Dimensions, Image, View } from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import { useBackgroundColor } from '../contexts/BackgroundColorContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const SharedBackground: React.FC = () => {
  const { selectedGradient, getGradient } = useBackgroundColor();
  const gradient = getGradient(selectedGradient);

  return (
    <>
      <Image
        source={require('../../assets/background-zero.png')}
        style={[
          styles.image,
          {
            width: SCREEN_WIDTH * 4,
            height: SCREEN_HEIGHT,
          },
        ]}
        resizeMode="cover"
      />
      {/* Overlay con degradé si no es original */}
      {gradient && selectedGradient !== 'original' && (
        <LinearGradient
          colors={gradient.colors}
          start={gradient.start || { x: 0, y: 0 }}
          end={gradient.end || { x: 0, y: 1 }}
          style={[
            styles.gradientOverlay,
            {
              opacity: 0.7, // Opacidad del degradé
            },
          ]}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH * 4,
    height: SCREEN_HEIGHT,
  },
});
