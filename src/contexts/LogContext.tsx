import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface LogEntry {
  id: string;
  message: string;
  timestamp: Date;
}

interface LogContextType {
  logs: LogEntry[];
  addLog: (message: string) => void;
  clearLogs: () => void;
}

const LogContext = createContext<LogContextType | undefined>(undefined);

export const LogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = useCallback((message: string) => {
    const entry: LogEntry = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      message,
      timestamp: new Date(),
    };
    setLogs((prev) => [...prev, entry].slice(-1000)); // Mantener solo los últimos 1000 logs
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return (
    <LogContext.Provider value={{ logs, addLog, clearLogs }}>
      {children}
    </LogContext.Provider>
  );
};

export const useLogs = () => {
  const context = useContext(LogContext);
  if (!context) {
    throw new Error('useLogs must be used within LogProvider');
  }
  return context;
};

