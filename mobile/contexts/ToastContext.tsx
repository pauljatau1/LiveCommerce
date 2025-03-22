import React, { createContext, useContext, useState } from 'react';
import CustomToast from '../components/CustomToast';

type ToastType = 'success' | 'error' | 'info';

interface ToastContextType {
  show: (options: {
    type?: ToastType;
    text1?: string;
    text2?: string;
    duration?: number;
    topPosition?: number;
  }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [toastProps, setToastProps] = useState({
    type: 'success' as ToastType,
    text1: '',
    text2: '',
    duration: 3000,
  });

  const show = (options: {
    type?: ToastType;
    text1?: string;
    text2?: string;
    duration?: number;
    topPosition?: number;
  }) => {
    setToastProps(options as { type: ToastType; text1: string; text2: string; duration: number });
    setVisible(true);
  };

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <CustomToast
        visible={visible}
        onHide={() => setVisible(false)}
        {...toastProps}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
} 