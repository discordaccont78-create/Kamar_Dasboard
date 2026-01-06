
import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

// Motion Components Definitions
const MotionPath = motion.path as any;
const MotionSvg = motion.svg as any;

interface Point {
    x: number;
    y: number;
}

interface BranchData {
    d: string;
    delay: number; // Time in seconds to wait before drawing (Entry)
    duration: number; // How fast the branch draws (Entry)
    splitRatio: number; // Position (0-1) along the main bolt where this branch connects
}

// 1. Generate Points Function (Returns Array of {x,y} instead of string)
export const generateLightningPoints = (
    startX: number, 
    startY: number, 
    endX: number, 
    endY: number, 
    segments: number, 
    amplitude: number
): Point[] => {
    const points: Point[] = [{ x: startX, y: startY }];
    
    for (let i = 1; i < segments; i++) {
        const t = i / segments;
        // Linear position
        const x = startX + (endX - startX) * t;
        const y = startY + (endY - startY) * t;
        
        // Calculate perpendicular vector
        const dx = endX - startX;
        const dy = endY - startY;
        const len = Math.sqrt(dx*dx + dy*dy) || 1; // Avoid divide by zero
        
        // Normal vector (-dy, dx)
        const udx = -dy / len;
        const udy = dx / len;
        
        // Jitter offset
        const offset = (Math.random() - 0.5) * amplitude;
        
        points.push({
            x: x + (udx * offset),
            y: y + (udy * offset)
        });
    }
    
    points.push({ x: endX, y: endY });
    return points;
};

// 2. Convert Points to SVG Path String
const pointsToPath = (points: Point[]): string => {
    if (points.length === 0) return "";
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
        d += ` L ${points[i].x} ${points[i].y}`;
    }
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
    animationDuration?: number;
    branchIntensity?: number; // New: 0 = No branches, 1 = High branching
    lingerDuration?: number; // How long it stays visible while fading
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
    thickness = 1,
    animationDuration = 0,
    branchIntensity = 0, // Default none
    lingerDuration = 0.3 // Default fade out
}) => {
    const filterId = useMemo(() => `bolt-glow-${Math.random().toString(36).substr(2, 9)}`, []);

    // Generate Main Bolt and Branches
    const boltData = useMemo(() => {
        // A. Generate Main Spine Points
        const mainPoints = generateLightningPoints(startX, startY, endX, endY, segments, amplitude);
        
        // B. Generate Branches with Timing Data
        const branches: BranchData[] = [];
        
        if (branchIntensity > 0) {
            // Determine number of branches based on length and intensity
            const dist = Math.hypot(endX - startX, endY - startY);
            const numBranches = Math.floor(Math.random() * branchIntensity * 3); 
            
            // We need indices from mainPoints (exclude first and last few points to avoid ugly starts)
            const availableIndices = Array.from({length: mainPoints.length - 4}, (_, i) => i + 2);
            
            for (let k = 0; k < numBranches; k++) {
                if (availableIndices.length === 0) break;
                
                // Pick a random spot on the main bolt
                const randIndex = Math.floor(Math.random() * availableIndices.length);
                const pointIndex = availableIndices.splice(randIndex, 1)[0];
                const startNode = mainPoints[pointIndex];
                
                // --- TIMING & POSITION CALCULATION ---
                // Calculate how far along the main path this point is (0.0 to 1.0)
                const splitRatio = pointIndex / mainPoints.length;
                
                // The branch should start drawing exactly when the main bolt reaches this point.
                // If animationDuration is 0 (instant), delay is 0.
                const delay = animationDuration * splitRatio;

                // Branches draw faster than the main bolt (snappier)
                const branchDrawDuration = Math.min(0.2, animationDuration * 0.5);

                // Calculate main direction angle
                const mainAngle = Math.atan2(endY - startY, endX - startX);
                
                // Branch direction: Main Angle +/- (30 to 60 degrees)
                const directionSign = Math.random() < 0.5 ? 1 : -1;
                const deviation = (Math.PI / 6) + (Math.random() * (Math.PI / 6)); // 30-60 deg
                const branchAngle = mainAngle + (directionSign * deviation);
                
                // Branch Length: 20% to 40% of total length
                const branchLen = dist * (0.2 + Math.random() * 0.2);
                
                const branchEndX = startNode.x + Math.cos(branchAngle) * branchLen;
                const branchEndY = startNode.y + Math.sin(branchAngle) * branchLen;
                
                // Generate points for this branch (fewer segments, less amplitude)
                const branchPoints = generateLightningPoints(
                    startNode.x, startNode.y, 
                    branchEndX, branchEndY, 
                    Math.floor(segments / 3), 
                    amplitude * 0.6
                );
                
                branches.push({
                    d: pointsToPath(branchPoints),
                    delay,
                    duration: branchDrawDuration,
                    splitRatio // Crucial: Store where this branch is relative to main bolt
                });
            }
        }

        // C. Create Variations for Animation (Jitter Effect)
        const p2 = pointsToPath(mainPoints);
        const p1Points = generateLightningPoints(startX, startY, endX, endY, segments, amplitude * 1.5);
        const p1 = pointsToPath(p1Points);
        const p3Points = generateLightningPoints(startX, startY, endX, endY, segments, amplitude * 0.5);
        const p3 = pointsToPath(p3Points);

        return { p1, p2, p3, branches };

    }, [startX, startY, endX, endY, segments, amplitude, active, branchIntensity, animationDuration]);

    // MAIN PATH Variants (Retract from Tail Logic)
    const mainVariants = {
        hidden: { 
            pathLength: 0, 
            pathOffset: 0, 
            opacity: 0 
        },
        visible: { 
            pathLength: 1, 
            pathOffset: 0,
            opacity: 1,
            transition: { 
                pathLength: { duration: animationDuration, ease: "linear" }, 
                opacity: { duration: 0.05 },
                pathOffset: { duration: 0 }
            }
        },
        exit: { 
            // LOGIC: As pathLength goes to 0 AND pathOffset goes to 1,
            // the stroke shrinks towards the end of the path.
            pathLength: 0,
            pathOffset: 1, 
            opacity: 0,
            transition: { 
                pathLength: { duration: lingerDuration, ease: "easeInOut" },
                pathOffset: { duration: lingerDuration, ease: "easeInOut" },
                // Keep opacity high for most of the exit so we see the movement, then fade at the very end
                opacity: { duration: lingerDuration, ease: "easeIn", times: [0, 0.8, 1], values: [1, 1, 0] } 
            } 
        }
    };

    // BRANCH Variants (Physics-based Sequential Fading)
    const branchVariants = {
        hidden: { 
            pathLength: 0, 
            pathOffset: 0,
            opacity: 0 
        },
        visible: (custom: BranchData) => ({ 
            pathLength: 1, 
            pathOffset: 0,
            opacity: 1,
            transition: { 
                pathLength: { 
                    delay: custom.delay, 
                    duration: custom.duration, 
                    ease: "easeOut"
                }, 
                opacity: { 
                    delay: custom.delay, 
                    duration: 0.01 
                },
                pathOffset: { duration: 0 }
            }
        }),
        exit: (custom: BranchData) => ({ 
            pathLength: 0, 
            pathOffset: 1,
            opacity: 0, 
            transition: { 
                // CRITICAL: The branch starts fading ONLY when the main bolt's fade (which takes lingerDuration)
                // reaches the splitRatio point.
                delay: lingerDuration * custom.splitRatio,
                
                // Once triggered, the branch fades faster than the main bolt (it's smaller/thinner).
                // We use a fraction of the lingerDuration, ensuring it looks like power loss.
                duration: lingerDuration * 0.25, 
                
                ease: "circOut" // Sudden drop looks more like electrical cutoff
            } 
        })
    };

    const staticVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 }
    };

    // SCALE GLOW: Large bolts should have massive glows
    const dynamicGlow = glowIntensity * (thickness * 0.8);

    return (
        <AnimatePresence>
            {active && (
                <MotionSvg
                    viewBox={viewBox}
                    className={cn("w-full h-full overflow-visible pointer-events-none", className)}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    preserveAspectRatio={preserveAspectRatio}
                >
                    <defs>
                        <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation={dynamicGlow} result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                    
                    {/* 1. BRANCHES */}
                    {boltData.branches.map((b, i) => (
                        <MotionPath
                            key={`branch-${i}`}
                            custom={b} 
                            variants={animationDuration > 0 ? branchVariants : staticVariants}
                            d={b.d}
                            stroke={color}
                            strokeWidth={1.5 * thickness}
                            strokeOpacity="0.6"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            filter={`url(#${filterId})`}
                        />
                    ))}

                    {/* 2. MAIN BOLT: Outer Glow */}
                    <MotionPath
                        variants={animationDuration > 0 ? mainVariants : staticVariants}
                        d={boltData.p1}
                        stroke={color}
                        strokeWidth={6 * thickness}
                        strokeOpacity="0.2"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter={`url(#${filterId})`}
                    />
                    
                    {/* 3. MAIN BOLT: Body */}
                    <MotionPath
                        variants={animationDuration > 0 ? mainVariants : staticVariants}
                        d={boltData.p2}
                        stroke={color}
                        strokeWidth={3 * thickness}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter={`url(#${filterId})`}
                    />
                    
                    {/* 4. MAIN BOLT: White Core */}
                    <MotionPath
                        variants={animationDuration > 0 ? mainVariants : staticVariants}
                        d={boltData.p3}
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
        }, 60); 
        return () => clearInterval(interval);
    }, []);

    const filterId = useMemo(() => `hex-glow-${Math.random().toString(36).substr(2, 9)}`, []);

    const center = radius;
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
            // Using legacy generator here since we just need simple string
            return pointsToPath(generateLightningPoints(p.x, p.y, nextP.x, nextP.y, 8, radius * 0.06)); 
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
