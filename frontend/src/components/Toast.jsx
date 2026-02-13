import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, opts = {}) => {
    const id = Date.now() + Math.random();
    const toast = { id, message, ...opts };
    setToasts((t) => [...t, toast]);
    const timeout = opts.duration || 4000;
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), timeout);
    return id;
  }, []);

  const remove = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  return (
    <ToastContext.Provider value={{ push, remove }}>
      {children}
      <div style={containerStyle}>
        {toasts.map((t) => (
          <div key={t.id} style={toastStyle} onClick={() => remove(t.id)}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const containerStyle = {
  position: 'fixed',
  right: 20,
  top: 20,
  zIndex: 99999,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const toastStyle = {
  background: '#111',
  color: '#fff',
  padding: '10px 14px',
  borderRadius: 8,
  boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
  cursor: 'pointer',
};

export default ToastProvider;
