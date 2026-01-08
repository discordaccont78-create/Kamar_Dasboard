
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettingsStore } from '../../lib/store/settings';
import { translations } from '../../lib/i18n';

const MotionDiv = motion.div as any;
const MotionSpan = motion.span as any;

const TimeDigit = ({ val }: { val: string }) => (
  <div className="relative h-6 w-3.5 md:h-8 md:w-5 overflow-hidden flex items-center justify-center">
    <AnimatePresence mode="popLayout">
      <MotionSpan
        key={val}
        initial={{ y: -10, opacity: 0, filter: 'blur(2px)' }}
        animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
        exit={{ y: 10, opacity: 0, filter: 'blur(2px)' }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="absolute inset-0 flex items-center justify-center font-dina text-lg md:text-xl font-bold leading-none pb-0.5 text-transparent bg-clip-text bg-gradient-to-t from-[hsl(var(--primary))] from-50% to-[hsl(var(--foreground))] to-50% bg-[length:100%_200%] bg-top group-hover:bg-bottom transition-[background-position] duration-500 ease-out"
      >
        {val}
      </MotionSpan>
    </AnimatePresence>
  </div>
);

const Separator = () => (
  <MotionSpan 
    animate={{ opacity: [0.3, 1, 0.3] }} 
    transition={{ duration: 1, repeat: Infinity }}
    className="font-dina text-lg md:text-xl font-bold mx-px -mt-0.5 text-transparent bg-clip-text bg-gradient-to-t from-[hsl(var(--primary))] from-50% to-[hsl(var(--primary))] to-50% bg-[length:100%_200%] bg-top group-hover:bg-bottom transition-[background-position] duration-500 ease-out"
  >
    :
  </MotionSpan>
);

export const DigitalClock: React.FC = () => {
  const [timeParts, setTimeParts] = useState<{h: string[], m: string[], s: string[]}>({ h:['0','0'], m:['0','0'], s:['0','0'] });
  const { settings } = useSettingsStore();
  const t = translations[settings.language];

  useEffect(() => {
    const updateTime = () => {
        const now = new Date();
        const h = now.getHours().toString().padStart(2, '0').split('');
        const m = now.getMinutes().toString().padStart(2, '0').split('');
        const s = now.getSeconds().toString().padStart(2, '0').split('');
        setTimeParts({ h, m, s });
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hidden lg:flex flex-col items-start justify-center pl-4 border-l-2 border-border/30 h-auto py-1">
        <MotionDiv 
        whileHover={{ scale: 1.05 }}
        className="group relative px-2 py-1 rounded-lg border border-transparent hover:border-primary/30 transition-all duration-300 cursor-default overflow-hidden"
        >
            <div className="relative z-10 flex items-center gap-0.5 md:gap-1 drop-shadow-sm select-none" dir="ltr">
                <TimeDigit val={timeParts.h[0]} />
                <TimeDigit val={timeParts.h[1]} />
                <Separator />
                <TimeDigit val={timeParts.m[0]} />
                <TimeDigit val={timeParts.m[1]} />
                <Separator />
                <TimeDigit val={timeParts.s[0]} />
                <TimeDigit val={timeParts.s[1]} />
            </div>
        </MotionDiv>
        <div className="text-[7px] font-black uppercase tracking-[0.4em] text-primary/70 mt-0.5 ml-3">{t.system_time}</div>
    </div>
  );
};
