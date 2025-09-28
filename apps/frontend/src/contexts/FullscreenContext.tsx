import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FullscreenContextType {
  isFullscreen: boolean;
  setIsFullscreen: (isFullscreen: boolean) => void;
}

const FullscreenContext = createContext<FullscreenContextType | undefined>(undefined);

interface FullscreenProviderProps {
  children: ReactNode;
}

export const FullscreenProvider: React.FC<FullscreenProviderProps> = ({ children }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <FullscreenContext.Provider value={{ isFullscreen, setIsFullscreen }}>
      {children}
    </FullscreenContext.Provider>
  );
};

export const useFullscreen = (): FullscreenContextType => {
  const context = useContext(FullscreenContext);
  if (context === undefined) {
    throw new Error('useFullscreen must be used within a FullscreenProvider');
  }
  return context;
};
