import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

interface SiriOrbAgentProps {
  size?: number;
  isActive?: boolean;
}

export const SiriOrbAgent: React.FC<SiriOrbAgentProps> = ({ 
  size = 24, 
  isActive = false 
}) => {
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    if (isActive) {
      animationRef.current?.play();
    } else {
      animationRef.current?.reset();
    }
  }, [isActive]);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <LottieView
        ref={animationRef}
        source={require('../../assets/animations/siri-orb.json')}
        autoPlay={isActive}
        loop={isActive}
        style={styles.animation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  animation: {
    width: '100%',
    height: '100%',
  },
});

