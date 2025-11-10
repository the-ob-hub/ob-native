import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, Dimensions, Text } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { useLogs } from '../contexts/LogContext';
import { SiriOrbAgent } from './SiriOrbAgent';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = SCREEN_WIDTH / 4;

interface BottomNavProps {
  activeIndex: number;
  onItemPress: (index: number) => void;
}

// Iconos SVG con stroke round
const HomeIcon = ({ isActive }: { isActive: boolean }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
      stroke={isActive ? '#FFFFFF' : '#888888'}
      strokeWidth={isActive ? 2.5 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={isActive ? '#0066FF' : 'none'}
    />
    <Path
      d="M9 22V12h6v10"
      stroke={isActive ? '#FFFFFF' : '#888888'}
      strokeWidth={isActive ? 2.5 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

const CardIcon = ({ isActive }: { isActive: boolean }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Rect
      x="1"
      y="4"
      width="22"
      height="16"
      rx="2"
      ry="2"
      stroke={isActive ? '#FFFFFF' : '#888888'}
      strokeWidth={isActive ? 2.5 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={isActive ? '#0066FF' : 'none'}
    />
    <Path
      d="M1 10h22"
      stroke={isActive ? '#FFFFFF' : '#888888'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const InvestmentIcon = ({ isActive }: { isActive: boolean }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 20V10M12 20V4M6 20v-6"
      stroke={isActive ? '#FFFFFF' : '#888888'}
      strokeWidth={isActive ? 2.5 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

const AgentIcon = ({ isActive }: { isActive: boolean }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
      stroke={isActive ? '#FFFFFF' : '#888888'}
      strokeWidth={isActive ? 2.5 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={isActive ? '#0066FF' : 'none'}
    />
    <Path
      d="M8 10h.01M12 10h.01M16 10h.01"
      stroke={isActive ? '#FFFFFF' : '#888888'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

// Componente de forma blanca con curva
const WhiteCurveShape = () => (
  <Svg width={105.3} height={35.75} viewBox="0 0 162 55" fill="none">
    <Path
      d="M162 0.000218391C126.5 2.00098 113.085 55.001 80.5 55.001C47.9152 55.001 37.5 9.50098 0 0C35 0 47.9152 0 80.5 0C113.085 0 132.5 0.00119495 162 0.000218391Z"
      fill="#000000"
    />
  </Svg>
);

export const BottomNav: React.FC<BottomNavProps> = ({ activeIndex, onItemPress }) => {
  const bubblePosition = useRef(new Animated.Value(0)).current;
  const bubbleScale = useRef(new Animated.Value(1)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;
  const containerTranslateY = useRef(new Animated.Value(100)).current;
  const iconsOpacity = useRef(new Animated.Value(0)).current;
  const backgroundTranslateY = useRef(new Animated.Value(0)).current;
  const { addLog } = useLogs();

  // Animación de entrada del navbar
  useEffect(() => {
    // Navbar entra desde abajo
    Animated.spring(containerTranslateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 60,
      friction: 8,
    }).start();

    // Íconos aparecen después de 300ms
    Animated.sequence([
      Animated.delay(300),
      Animated.timing(iconsOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    // Calcular la posición
    let targetX = activeIndex * ITEM_WIDTH + (ITEM_WIDTH / 2) - 22; // Ajuste por ancho del círculo
    
    // Si es Home (index 0) o Agent (index 3), mover 15% más al centro
    if (activeIndex === 0 || activeIndex === 3) {
      const centerOfScreen = SCREEN_WIDTH / 2;
      const distanceToCenter = centerOfScreen - targetX;
      const offset = distanceToCenter * 0.15; // 15% hacia el centro
      targetX = targetX + offset;
    }
    
    // Animación de burbuja con efecto elástico
    Animated.parallel([
      Animated.spring(bubblePosition, {
        toValue: targetX,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }),
      Animated.sequence([
        Animated.spring(bubbleScale, {
          toValue: 1.2,
          useNativeDriver: true,
          tension: 180,
          friction: 7,
        }),
        Animated.spring(bubbleScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 180,
          friction: 7,
        }),
      ]),
      // Animación del background: baja 1px durante la transición
      Animated.sequence([
        Animated.spring(backgroundTranslateY, {
          toValue: 1,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.spring(backgroundTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
      ]),
    ]).start();

    // Animación de fade para el texto
    textOpacity.setValue(0);
    Animated.timing(textOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [activeIndex]);

  const tabs = [
    { name: 'Home', component: HomeIcon },
    { name: 'Tarjetas', component: CardIcon },
    { name: 'Inversiones', component: InvestmentIcon },
    { name: 'Agent', component: AgentIcon },
  ];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: containerTranslateY }],
        },
      ]}
    >
      {/* Forma blanca con curva (fondo) */}
      <Animated.View
        style={[
          styles.whiteCurveContainer,
          {
            transform: [
              { translateX: bubblePosition },
              { translateY: backgroundTranslateY },
              { scale: bubbleScale }
            ],
          },
        ]}
        pointerEvents="none"
      >
        <WhiteCurveShape />
      </Animated.View>
      {/* Círculo oscuro - transparente cuando Agent está activo */}
      <Animated.View
        style={[
          styles.bubble,
          {
            transform: [
              { translateX: bubblePosition },
              { scale: bubbleScale }
            ],
            opacity: activeIndex === 3 ? 0 : 1, // Transparente para Agent
          },
        ]}
        pointerEvents="none"
      />

      {/* Navigation items con íconos inactivos */}
      <Animated.View style={[styles.itemsContainer, { opacity: iconsOpacity }]}>
        {tabs.map((tab, index) => {
          const isActive = activeIndex === index;
          const IconComponent = tab.component;
          
          return (
            <TouchableOpacity
              key={index}
              style={styles.item}
              onPress={() => {
                const msg1 = `🔵 BottomNav - Botón presionado: { index: ${index}, tabName: '${tab.name}', activeIndex: ${activeIndex} }`;
                const msg2 = `🔵 BottomNav - Llamando onItemPress con índice: ${index}`;
                console.log(msg1);
                console.log(msg2);
                addLog(msg1);
                addLog(msg2);
                onItemPress(index);
                const msg3 = '🔵 BottomNav - onItemPress ejecutado';
                console.log(msg3);
                addLog(msg3);
              }}
              activeOpacity={0.8}
            >
              {/* Solo mostrar íconos inactivos (grises) */}
              {!isActive && <IconComponent isActive={false} />}
            </TouchableOpacity>
          );
        })}
      </Animated.View>

      {/* Ícono activo sobre el círculo azul */}
      <Animated.View
        style={[
          styles.activeIconContainer,
          {
            transform: [{ translateX: bubblePosition }],
          },
        ]}
      >
        {(() => {
          // Si es Agent (index 3), usar SiriOrbAgent en lugar del ícono SVG
          if (activeIndex === 3) {
            return (
              <View style={styles.agentIconOffset}>
                <SiriOrbAgent size={44} isActive={true} />
              </View>
            );
          }
          const ActiveIconComponent = tabs[activeIndex].component;
          return <ActiveIconComponent isActive={true} />;
        })()}
      </Animated.View>

      {/* Texto animado de la sección activa */}
      <Animated.View
        style={[
          styles.activeTextContainer,
          {
            transform: [{ translateX: bubblePosition }],
            opacity: textOpacity,
          },
        ]}
      >
        <Text style={styles.activeText}>{tabs[activeIndex].name}</Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'visible',
    zIndex: 1000,
    elevation: 1000,
  },
  itemsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 8,
    zIndex: 1001,
  },
  item: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    zIndex: 1002,
  },
  bubble: {
    position: 'absolute',
    top: -22,
    width: 44,
    height: 44,
    backgroundColor: '#0066FF', // Azul igual al botón perfil
    borderRadius: 22,
    zIndex: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  whiteCurveContainer: {
    position: 'absolute',
    top: 0,
    left: -30.65,
    width: 105.3,
    height: 35.75,
    zIndex: 1,
  },
  activeIconContainer: {
    position: 'absolute',
    top: -22,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
    pointerEvents: 'none',
  },
  agentIconOffset: {
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: -3 }, { translateY: 3 }],
  },
  activeTextContainer: {
    position: 'absolute',
    top: 43.875,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
    pointerEvents: 'none',
  },
  activeText: {
    fontFamily: 'System',
    fontWeight: '600',
    fontSize: 12,
    color: '#FFFFFF',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

