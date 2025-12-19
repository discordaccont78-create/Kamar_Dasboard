
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConnection } from '../../lib/store/connection';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useConnection();

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className="pointer-events-auto bg-black text-white px-6 py-4 rounded-2xl shadow-2xl border-2 border-primary/30 flex items-center gap-4 min-w-[300px]"
          >
            {toast.type === 'success' && <CheckCircle className="text-green-500" size={20} />}
            {toast.type === 'error' && <AlertCircle className="text-red-500" size={20} />}
            {toast.type === 'info' && <Info className="text-primary" size={20} />}
            
            <div className="flex-1 flex flex-col">
              <span className="text-xs font-black uppercase tracking-widest">{toast.type}</span>
              <p className="text-sm font-bold text-gray-300">{toast.message}</p>
            </div>
            
            <button 
              onClick={() => removeToast(toast.id)}
              className="text-gray-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
