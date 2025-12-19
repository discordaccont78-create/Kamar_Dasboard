
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConnection } from '../../lib/store/connection';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';

// Fix: Casting motion.div to any to resolve property type errors (initial, animate, exit)
const MotionDiv = motion.div as any;

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useConnection();

  return (
    <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <MotionDiv
            key={toast.id}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, transition: { duration: 0.2 } }}
            className={`pointer-events-auto min-w-[300px] p-5 rounded-2xl shadow-2xl border-l-8 flex items-center gap-4 transition-all
              ${toast.type === 'success' ? 'bg-black border-primary text-white' : 'bg-black border-red-500 text-white'}`}
          >
            <div className={`p-2 rounded-xl bg-white/10 ${toast.type === 'success' ? 'text-primary' : 'text-red-500'}`}>
              {toast.type === 'success' ? (
                <CheckCircle size={24} />
              ) : (
                <AlertCircle size={24} />
              )}
            </div>
            
            <div className="flex-1 flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-50">{toast.type}</span>
              <p className="text-sm font-bold leading-tight">{toast.message}</p>
            </div>
            
            <button 
              onClick={() => removeToast(toast.id)}
              className="p-1 hover:bg-white/10 rounded-full transition-colors opacity-40 hover:opacity-100"
            >
              <X size={18} />
            </button>
          </MotionDiv>
        ))}
      </AnimatePresence>
    </div>
  );
};
