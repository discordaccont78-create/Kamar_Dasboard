import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConnection } from '../../lib/store/connection';
import { useSettingsStore } from '../../lib/store/settings';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';

const MotionDiv = motion.div as any;

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useConnection();
  const { settings } = useSettingsStore();

  if (!settings.enableNotifications) return null;

  return (
    <div className="fixed top-24 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <MotionDiv
            key={toast.id}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, transition: { duration: 0.2 } }}
            className={`pointer-events-auto min-w-[300px] p-4 rounded-lg shadow-lg border flex items-center gap-4 transition-all
              ${toast.type === 'success' 
                ? 'bg-background text-foreground border-primary' 
                : 'bg-destructive text-destructive-foreground border-destructive'}`}
          >
            <div className={`p-1 rounded-full ${toast.type === 'success' ? 'text-primary' : 'text-white'}`}>
              {toast.type === 'success' ? (
                <CheckCircle size={20} />
              ) : (
                <AlertCircle size={20} />
              )}
            </div>
            
            <div className="flex-1 flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">{toast.type}</span>
              <p className="text-sm font-medium leading-tight">{toast.message}</p>
            </div>
            
            <button 
              onClick={() => removeToast(toast.id)}
              className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors opacity-60 hover:opacity-100"
            >
              <X size={16} />
            </button>
          </MotionDiv>
        ))}
      </AnimatePresence>
    </div>
  );
};