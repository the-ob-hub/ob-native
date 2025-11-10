import React from 'react';
import { StyleSheet, Dimensions, Image } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const SharedBackground: React.FC = () => {
  return (
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
  );
};

const styles = StyleSheet.create({
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
