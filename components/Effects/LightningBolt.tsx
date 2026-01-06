
import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

// Motion Components Definitions
const MotionPath = motion.path as any;
const MotionCircle = motion.circle as any;
const MotionSvg = motion.svg as any;

// Helper: Generate Jagged Path Data
export const generateJaggedPath = (startX: number, startY: number, endX: number, endY: number, segments: number, amplitude: number) => {
    let d = `M ${startX} ${startY}`;
    for (let i = 1; i < segments; i++) {
        const t = i / segments;
        const x = startX + (endX - startX) * t;
        const y = startY + (endY - startY) * t;
        
        // Calculate perpendicular vector for jitter direction
        // This ensures jitter is roughly perpendicular to the line direction
        const dx = endX - startX;
        const dy = endY - startY;
        // Normalize
        const len = Math.sqrt(dx*dx + dy*dy);
        const udx = dx / len;
        const udy = dy / len;
        
        // Perpendicular: (-y, x)
        const pdx = -udy;
        const pdy = udx;

        const offset = (Math.random() - 0.5) * amplitude;
        
        // Apply jitter along perpendicular vector
        const jx = x + (pdx * offset);
        const jy = y + (pdy * offset);

        d += ` L ${jx} ${jy}`;
    }
    d += ` L ${endX} ${endY}`;
    return d;
};

interface LightningBoltProps {
    startX?: number;
    startY?: number;
    endX?: number;
    endY?: number;
    segments?: number;
    amplitude?: number;
    className?: string;
    active?: boolean;
    color?: string;
    viewBox?: string;
    preserveAspectRatio?: string;
    glowIntensity?: number;
    thickness?: number;
}

export const LightningBolt: React.FC<LightningBoltProps> = ({
    startX = 0, startY = 10,
    endX = 100, endY = 10,
    segments = 8,
    amplitude = 10,
    className,
    active = true,
    color = "hsl(var(--primary))",
    viewBox = "0 0 100 20",
    preserveAspectRatio = "none",
    glowIntensity = 2,
    thickness = 1 
}) => {
    const filterId = useMemo(() => `bolt-glow-${Math.random().toString(36).substr(2, 9)}`, []);

    const pathData = useMemo(() => ({
        p1: generateJaggedPath(startX, startY, endX, endY, segments, amplitude * 1.5),
        p2: generateJaggedPath(startX, startY, endX, endY, Math.floor(segments * 1.5), amplitude),
        p3: generateJaggedPath(startX, startY, endX, endY, Math.floor(segments * 0.8), amplitude * 0.5)
    }), [startX, startY, endX, endY, segments, amplitude, active]);

    return (
        <AnimatePresence>
            {active && (
                <MotionSvg
                    viewBox={viewBox}
                    className={cn("w-full h-full overflow-visible pointer-events-none", className)}
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    preserveAspectRatio={preserveAspectRatio}
                >
                    <defs>
                        <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation={glowIntensity} result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                    
                    <MotionPath
                        d={pathData.p1}
                        stroke={color}
                        strokeWidth={6 * thickness}
                        strokeOpacity="0.2"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter={`url(#${filterId})`}
                    />
                    <MotionPath
                        d={pathData.p2}
                        stroke={color}
                        strokeWidth={3 * thickness}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter={`url(#${filterId})`}
                    />
                    <MotionPath
                        d={pathData.p3}
                        stroke="white"
                        strokeWidth={1.5 * thickness}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </MotionSvg>
            )}
        </AnimatePresence>
    )
}

interface LightningHexagonProps {
    radius?: number;
    color?: string;
    className?: string;
    thickness?: number;
    glowIntensity?: number;
}

export const LightningHexagon: React.FC<LightningHexagonProps> = ({
    radius = 100,
    color = "hsl(var(--foreground))", 
    className,
    thickness = 1,
    glowIntensity = 3 // Standard glow
}) => {
    const [tick, setTick] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setTick(t => t + 1);
        }, 60); // Slightly slower tick for better visibility of the bolt structure
        return () => clearInterval(interval);
    }, []);

    const filterId = useMemo(() => `hex-glow-${Math.random().toString(36).substr(2, 9)}`, []);

    const center = radius;
    // Slightly shrink drawing radius to keep glow inside viewbox
    const drawRadius = radius * 0.85; 

    const points = useMemo(() => {
        const pts = [];
        for (let i = 0; i < 6; i++) {
            const angleDeg = 60 * i - 30;
            const angleRad = (Math.PI / 180) * angleDeg;
            pts.push({
                x: center + drawRadius * Math.cos(angleRad),
                y: center + drawRadius * Math.sin(angleRad)
            });
        }
        return pts;
    }, [center, drawRadius]);

    const paths = useMemo(() => {
        return points.map((p, i) => {
            const nextP = points[(i + 1) % 6];
            // Medium amplitude to look energetic but not messy
            return generateJaggedPath(p.x, p.y, nextP.x, nextP.y, 8, radius * 0.06); 
        });
    }, [points, tick, radius]);

    return (
        <div className={cn("relative overflow-visible", className)} style={{ width: radius * 2, height: radius * 2 }}>
            <svg 
                viewBox={`0 0 ${radius * 2} ${radius * 2}`} 
                className="w-full h-full overflow-visible"
            >
                <defs>
                    <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation={glowIntensity} result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {paths.map((d, i) => (
                    <g key={i}>
                        {/* Layer 1: Wide Outer Glow (The Aura) */}
                        <path 
                            d={d} 
                            stroke={color} 
                            strokeWidth={5 * thickness} 
                            strokeOpacity="0.3" 
                            fill="none" 
                            filter={`url(#${filterId})`} 
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        
                        {/* Layer 2: Main Bolt Body (Color) */}
                        <path 
                            d={d} 
                            stroke={color} 
                            strokeWidth={2.5 * thickness}
                            strokeOpacity="0.8" 
                            fill="none" 
                            filter={`url(#${filterId})`}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        
                        {/* Layer 3: White Hot Core (Electricity) */}
                        <path 
                            d={d} 
                            stroke="white" 
                            strokeWidth={1 * thickness} 
                            strokeOpacity="1" 
                            fill="none" 
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </g>
                ))}
            </svg>
        </div>
    );
};
