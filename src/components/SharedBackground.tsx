import React from 'react';
import { StyleSheet, Dimensions, Image, View } from 'react-native';
import { useBackgroundColor, BACKGROUND_COLORS } from '../contexts/BackgroundColorContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const SharedBackground: React.FC = () => {
  const { backgroundColor } = useBackgroundColor();

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
      {/* Overlay de color si no es transparente */}
      {backgroundColor !== BACKGROUND_COLORS.default && (
        <View
          style={[
            styles.colorOverlay,
            {
              backgroundColor: backgroundColor,
              opacity: 0.6, // Ajusta la opacidad del overlay
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
  colorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH * 4,
    height: SCREEN_HEIGHT,
  },
});
