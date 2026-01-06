
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

// Updated Interface for Recursive Segments
interface RenderableSegment {
    id: string; 
    d: string; 
    dGlow: string; 
    dCore: string; 
    level: number; 
    delay: number; 
    duration: number; 
    exitDelay: number; 
    exitDuration: number; // Precise duration for geometry retraction
    globalExitDuration: number; // Total duration for opacity fade
    widthMultiplier: number; 
}

// 1. Generate Points Function
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
        const len = Math.sqrt(dx*dx + dy*dy) || 1; 
        
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
    branchIntensity?: number; 
    lingerDuration?: number; 
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
    branchIntensity = 0, 
    lingerDuration = 0.3 
}) => {
    const filterId = useMemo(() => `bolt-glow-${Math.random().toString(36).substr(2, 9)}`, []);

    // Recursive Generator Function
    const generateRecursiveSegments = (
        pStart: Point,
        pEnd: Point,
        currentSegments: number,
        currentAmp: number,
        level: number,
        parentEntryDelay: number,   // When THIS segment starts drawing
        parentDuration: number,     // Duration of THIS segment's draw
        
        parentExitDelay: number,    // When THIS segment starts fading (Absolute time)
        parentExitDuration: number, // How long THIS segment has to fade
        totalLingerLimit: number,   // The absolute deadline for the entire effect
        
        maxDepth: number,
        intensity: number
    ): RenderableSegment[] => {
        const results: RenderableSegment[] = [];

        // 1. Generate Points for this segment (Main Spine)
        const points = generateLightningPoints(pStart.x, pStart.y, pEnd.x, pEnd.y, currentSegments, currentAmp);
        const pathString = pointsToPath(points);

        let dGlow = pathString;
        let dCore = pathString;

        // 2. Generate Variations for Volume
        if (level <= 1) {
             const pointsGlow = generateLightningPoints(pStart.x, pStart.y, pEnd.x, pEnd.y, currentSegments, currentAmp * 1.5);
             dGlow = pointsToPath(pointsGlow);
             
             const pointsCore = generateLightningPoints(pStart.x, pStart.y, pEnd.x, pEnd.y, currentSegments, currentAmp * 0.5);
             dCore = pointsToPath(pointsCore);
        }

        // 3. Add THIS segment to results
        results.push({
            id: `lvl${level}-${Math.random().toString(36).substr(2, 5)}`,
            d: pathString,
            dGlow: dGlow,
            dCore: dCore,
            level: level,
            delay: parentEntryDelay, 
            duration: parentDuration,
            exitDelay: parentExitDelay,
            exitDuration: parentExitDuration, 
            globalExitDuration: totalLingerLimit, // Store global limit for opacity fade
            widthMultiplier: Math.max(0.3, 1 - (level * 0.3))
        });

        // 4. Base Case
        if (level >= maxDepth || intensity <= 0) return results;

        // 5. Determine number of branches
        const numBranches = Math.floor(Math.random() * (intensity * (3 - level)));
        const availableIndices = Array.from({length: points.length - 4}, (_, i) => i + 2);

        for (let k = 0; k < numBranches; k++) {
            if (availableIndices.length === 0) break;

            const randIndex = Math.floor(Math.random() * availableIndices.length);
            const pointIndex = availableIndices.splice(randIndex, 1)[0];
            const connectionPoint = points[pointIndex]; 

            // --- TIMING LOGIC (SYNCHRONIZED DEATH, INSTANT LIFE) ---
            const splitRatio = pointIndex / points.length;
            
            // Entry Logic (Draw)
            const myEntryDelay = parentEntryDelay + (parentDuration * splitRatio);
            
            // Unclamped Speed: Allow the bolt to strike as fast as the math dictates.
            const myDuration = parentDuration * 0.5;

            // Exit Logic (Fade)
            // The child starts fading when the parent's fade reaches the connection point
            const myExitDelay = parentExitDelay + (parentExitDuration * splitRatio);
            
            // CRITICAL: The child MUST finish by 'totalLingerLimit'.
            let myExitDuration = totalLingerLimit - myExitDelay;
            
            // Safety clamp
            if (myExitDuration < 0.05) myExitDuration = 0.05;

            // --- GEOMETRY MATH ---
            const dx = pEnd.x - pStart.x;
            const dy = pEnd.y - pStart.y;
            const parentAngle = Math.atan2(dy, dx);
            const parentDist = Math.sqrt(dx*dx + dy*dy);

            const directionSign = Math.random() < 0.5 ? 1 : -1;
            const deviation = (Math.PI / 5) + (Math.random() * (Math.PI / 4)); 
            const branchAngle = parentAngle + (directionSign * deviation);
            const branchLen = parentDist * (0.3 + Math.random() * 0.3);
            
            const branchEnd: Point = {
                x: connectionPoint.x + Math.cos(branchAngle) * branchLen,
                y: connectionPoint.y + Math.sin(branchAngle) * branchLen
            };

            // RECURSIVE CALL
            const childSegments = generateRecursiveSegments(
                connectionPoint,
                branchEnd,
                Math.max(4, Math.floor(currentSegments / 2)),
                currentAmp * 0.5, 
                level + 1,
                myEntryDelay,
                myDuration,
                
                myExitDelay,
                myExitDuration,
                totalLingerLimit, // Pass the global deadline down
                
                maxDepth,
                intensity 
            );

            results.push(...childSegments);
        }

        return results;
    };

    // Memoize the entire tree generation
    const allSegments = useMemo(() => {
        const maxDepth = branchIntensity > 0.8 ? 3 : (branchIntensity > 0.3 ? 2 : 1);
        
        return generateRecursiveSegments(
            { x: startX, y: startY },
            { x: endX, y: endY },
            segments,
            amplitude,
            0, // Start Level
            0, // Start Delay
            animationDuration,
            
            // Root Exit Params
            0, // Root Exit Delay
            lingerDuration, // Root Exit Duration
            lingerDuration, // Total Linger Limit (Deadline)
            
            maxDepth,
            branchIntensity
        );
    }, [startX, startY, endX, endY, segments, amplitude, active, branchIntensity, animationDuration, lingerDuration]);

    // Segment Variants
    // Type as 'any' to handle the mix of single number opacity (hidden/visible) and array number[] opacity (exit)
    const segmentVariants: any = {
        hidden: { 
            pathLength: 0, 
            pathOffset: 0,
            opacity: 0 
        },
        visible: (custom: RenderableSegment) => ({ 
            pathLength: 1, 
            pathOffset: 0,
            opacity: 1,
            transition: { 
                pathLength: { 
                    delay: custom.delay, 
                    duration: custom.duration, 
                    // Linear easing for entry makes it look sharper and faster (like a projectile)
                    ease: "linear"
                }, 
                opacity: { 
                    delay: custom.delay, 
                    duration: 0.01 
                },
                pathOffset: { duration: 0 }
            }
        }),
        exit: (custom: RenderableSegment) => ({ 
            pathLength: 0, 
            pathOffset: 1,
            // Keyframes: Start at 1, dip, flash back up, dip, gone.
            opacity: [1, 0.4, 0.9, 0.2, 0], 
            transition: { 
                // GEOMETRY FADE (Retraction): Follows the recursive wave timing
                pathLength: {
                    delay: custom.exitDelay,
                    duration: custom.exitDuration,
                    ease: "linear"
                },
                pathOffset: {
                    delay: custom.exitDelay,
                    duration: custom.exitDuration,
                    ease: "linear"
                },
                // OPACITY FADE (Dimming with Flicker)
                opacity: {
                    delay: 0,
                    duration: custom.globalExitDuration, 
                    times: [0, 0.3, 0.5, 0.8, 1], // Timing of the flickers
                    ease: "easeInOut",
                    repeat: 0
                }
            } 
        })
    };

    const staticVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 }
    };

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
                            {/* 1. Standard Blur */}
                            <feGaussianBlur in="SourceGraphic" stdDeviation={glowIntensity} result="blur" />
                            
                            {/* 2. Fractal Noise for "Plasma" Texture */}
                            {/* baseFrequency high = fine grain. numOctaves low = performance */}
                            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="noise" />
                            
                            {/* 3. Displace the blur with the noise to make it "smoky/electric" */}
                            <feDisplacementMap in="blur" in2="noise" scale={glowIntensity * 2} result="texturedGlow" />
                            
                            {/* 4. Boost the Glow brightness */}
                            <feComponentTransfer in="texturedGlow" result="boostedGlow">
                                <feFuncA type="linear" slope="1.5" /> 
                            </feComponentTransfer>

                            <feMerge>
                                <feMergeNode in="boostedGlow" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                    
                    {allSegments.map((seg) => (
                        <g key={seg.id}>
                            {/* Layer 1: Glow (Uses dGlow for volume + Turbulence Filter) */}
                            {seg.level < 2 && (
                                <MotionPath
                                    custom={seg}
                                    variants={animationDuration > 0 ? segmentVariants : staticVariants}
                                    d={seg.dGlow} 
                                    stroke={color}
                                    strokeWidth={Math.max(1, 6 * thickness * seg.widthMultiplier)}
                                    strokeOpacity={0.4 * seg.widthMultiplier}
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    filter={`url(#${filterId})`}
                                />
                            )}

                            {/* Layer 2: Core Bolt (Uses main d) */}
                            <MotionPath
                                custom={seg}
                                variants={animationDuration > 0 ? segmentVariants : staticVariants}
                                d={seg.d}
                                stroke={color}
                                strokeWidth={Math.max(0.5, 2.5 * thickness * seg.widthMultiplier)}
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                // Also apply filter to core to blend it with plasma
                                filter={`url(#${filterId})`} 
                            />

                            {/* Layer 3: White Hot Center (Uses dCore for intensity - No Filter, sharpest part) */}
                            {seg.level < 2 && (
                                <MotionPath
                                    custom={seg}
                                    variants={animationDuration > 0 ? segmentVariants : staticVariants}
                                    d={seg.dCore} 
                                    stroke="white"
                                    strokeWidth={Math.max(0.2, 1 * thickness * seg.widthMultiplier)}
                                    strokeOpacity={0.9}
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            )}
                        </g>
                    ))}
                </MotionSvg>
            )}
        </AnimatePresence>
    )
}

// Hexagon Component remains mostly unchanged but uses legacy generator for simplicity
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
    glowIntensity = 3 
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
