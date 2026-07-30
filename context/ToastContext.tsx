
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: ToastType) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000); // Auto close after 4s
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={`pointer-events-auto flex items-center gap-3 min-w-[300px] p-4 rounded-xl shadow-lg border animate-fade-in transition-all
              ${toast.type === 'success' ? 'bg-white border-emerald-100 text-emerald-800' : 
                toast.type === 'error' ? 'bg-white border-rose-100 text-rose-800' : 
                'bg-white border-blue-100 text-blue-800'}
            `}
          >
            <div className={`p-2 rounded-full 
              ${toast.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 
                toast.type === 'error' ? 'bg-rose-100 text-rose-600' : 
                'bg-blue-100 text-blue-600'}
            `}>
              {toast.type === 'success' && <CheckCircle className="w-5 h-5" />}
              {toast.type === 'error' && <AlertTriangle className="w-5 h-5" />}
              {toast.type === 'info' && <Info className="w-5 h-5" />}
            </div>
            <p className="font-medium text-sm flex-1 text-slate-700">{toast.message}</p>
            <button onClick={() => removeToast(toast.id)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};
