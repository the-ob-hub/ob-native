import React, { createContext, useContext, useState, ReactNode } from 'react';

interface BackgroundColorContextType {
  backgroundColor: string;
  setBackgroundColor: (color: string) => void;
}

const BackgroundColorContext = createContext<BackgroundColorContextType | undefined>(undefined);

// Colores disponibles para el fondo
export const BACKGROUND_COLORS = {
  default: 'transparent', // Sin overlay, muestra la imagen original
  blue: '#0066FF',
  purple: '#7B1FA2',
  orange: '#FF8C00',
};

interface BackgroundColorProviderProps {
  children: ReactNode;
}

export const BackgroundColorProvider: React.FC<BackgroundColorProviderProps> = ({ children }) => {
  const [backgroundColor, setBackgroundColor] = useState<string>(BACKGROUND_COLORS.default);

  return (
    <BackgroundColorContext.Provider value={{ backgroundColor, setBackgroundColor }}>
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

