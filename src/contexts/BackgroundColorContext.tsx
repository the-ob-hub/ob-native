import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface GradientColor {
  colors: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}

interface BackgroundColorContextType {
  selectedGradient: string;
  setSelectedGradient: (gradient: string) => void;
  getGradient: (gradientName: string) => GradientColor | null;
}

const BackgroundColorContext = createContext<BackgroundColorContextType | undefined>(undefined);

// Degradés disponibles para el fondo
export const BACKGROUND_GRADIENTS: Record<string, GradientColor> = {
  original: {
    colors: ['transparent'], // Sin overlay, muestra la imagen original
  },
  blue: {
    colors: ['#0066FF', '#0040CC', '#001A99'],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
  purple: {
    colors: ['#7B1FA2', '#5A0F7A', '#3D0A52'],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
  orange: {
    colors: ['#FF8C00', '#CC6F00', '#995200'],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
};

interface BackgroundColorProviderProps {
  children: ReactNode;
}

export const BackgroundColorProvider: React.FC<BackgroundColorProviderProps> = ({ children }) => {
  const [selectedGradient, setSelectedGradient] = useState<string>('original');

  const getGradient = (gradientName: string): GradientColor | null => {
    return BACKGROUND_GRADIENTS[gradientName] || null;
  };

  return (
    <BackgroundColorContext.Provider value={{ selectedGradient, setSelectedGradient, getGradient }}>
      {children}
    </BackgroundColorContext.Provider>
  );
};

export const useBackgroundColor = () => {
  const context = useContext(BackgroundColorContext);
  if (!context) {
    throw new Error('useBackgroundColor must be used within BackgroundColorProvider');
  }
  return context;
};
