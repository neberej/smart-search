import React, { useEffect, useState } from 'react';
import './Toast.scss';

type ToastProps = {
  message: string;
  setToast: (msg: string) => void;
};

const Toast: React.FC<ToastProps> = ({ message, setToast }) => {
  const [isVisible, setIsVisible] = useState(!!message);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => setToast(''), 300);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [message, setToast]);

  if (!message || !isVisible) return null;

  return <div className={`toast ${isVisible ? 'toast-visible' : ''}`}>{message}</div>;
};

export default Toast;