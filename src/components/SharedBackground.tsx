import React from 'react';
import { StyleSheet, Dimensions, Image, View } from 'react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';
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
      {/* Overlay con degradé SVG si no es original */}
      {gradient && selectedGradient !== 'original' && (
        <Svg
          width={SCREEN_WIDTH * 4}
          height={SCREEN_HEIGHT}
          style={styles.gradientOverlay}
        >
          <Defs>
            <SvgLinearGradient id="gradientOverlay" x1="0%" y1="0%" x2="0%" y2="100%">
              {gradient.colors.map((color, index) => (
                <Stop
                  key={index}
                  offset={`${(index / (gradient.colors.length - 1)) * 100}%`}
                  stopColor={color}
                  stopOpacity="0.7"
                />
              ))}
            </SvgLinearGradient>
          </Defs>
          <Rect
            x="0"
            y="0"
            width={SCREEN_WIDTH * 4}
            height={SCREEN_HEIGHT}
            fill="url(#gradientOverlay)"
          />
        </Svg>
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
  },
});
