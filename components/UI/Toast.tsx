
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConnection } from '../../lib/store/connection';
import { useSettingsStore } from '../../lib/store/settings';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

const MotionDiv = motion.div as any;

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useConnection();
  const { settings } = useSettingsStore();

  if (!settings.enableNotifications) return null;

  return (
    <div className="fixed top-24 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          let styles = "";
          let Icon = Info;
          let iconColor = "";

          switch (toast.type) {
            case 'success':
              styles = "bg-background text-foreground border-primary shadow-[0_0_20px_-5px_rgba(var(--primary),0.3)]";
              Icon = CheckCircle;
              iconColor = "text-primary";
              break;
            case 'error':
              styles = "bg-destructive text-destructive-foreground border-destructive shadow-[0_0_20px_-5px_rgba(239,68,68,0.4)]";
              Icon = AlertCircle;
              iconColor = "text-white";
              break;
            case 'info':
              styles = "bg-background text-foreground border-blue-500 shadow-[0_0_20px_-5px_rgba(59,130,246,0.3)]";
              Icon = Info;
              iconColor = "text-blue-500";
              break;
            default:
              styles = "bg-background text-foreground border-border";
          }

          return (
            <MotionDiv
              key={toast.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, transition: { duration: 0.2 } }}
              className={cn(
                "pointer-events-auto min-w-[320px] max-w-[400px] p-4 rounded-xl border-l-4 flex items-start gap-4 transition-all backdrop-blur-xl",
                styles
              )}
            >
              <div className={cn("mt-0.5 shrink-0", iconColor)}>
                <Icon size={20} />
              </div>
              
              <div className="flex-1 flex flex-col gap-1">
                <span className={cn("text-[9px] font-black uppercase tracking-widest opacity-70", iconColor)}>
                  {toast.type === 'info' ? 'SYSTEM INFO' : toast.type}
                </span>
                <p className="text-xs font-bold leading-relaxed">{toast.message}</p>
              </div>
              
              <button 
                onClick={() => removeToast(toast.id)}
                className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors opacity-60 hover:opacity-100 mt-0.5"
              >
                <X size={14} />
              </button>
            </MotionDiv>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
