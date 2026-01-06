
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
    exitDuration: number; // Added to store precise duration for this segment
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
        parentExitDelay: number,    // When THIS segment starts fading
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

        // 3. Calculate properties for THIS segment
        const widthMultiplier = Math.max(0.3, 1 - (level * 0.3));
        
        // EXIT DURATION: How long THIS segment takes to fade.
        // It's proportional to thickness. Thinner segments fade faster.
        const myExitDuration = lingerDuration * (0.5 + (0.5 * widthMultiplier));

        // 4. Add THIS segment to results
        results.push({
            id: `lvl${level}-${Math.random().toString(36).substr(2, 5)}`,
            d: pathString,
            dGlow: dGlow,
            dCore: dCore,
            level: level,
            delay: parentEntryDelay, 
            duration: parentDuration,
            exitDelay: parentExitDelay,
            exitDuration: myExitDuration,
            widthMultiplier: widthMultiplier
        });

        // 5. Base Case: Stop if max depth reached or intensity is 0
        if (level >= maxDepth || intensity <= 0) return results;

        // 6. Determine number of branches for this level
        const numBranches = Math.floor(Math.random() * (intensity * (3 - level)));
        
        const availableIndices = Array.from({length: points.length - 4}, (_, i) => i + 2);

        for (let k = 0; k < numBranches; k++) {
            if (availableIndices.length === 0) break;

            const randIndex = Math.floor(Math.random() * availableIndices.length);
            const pointIndex = availableIndices.splice(randIndex, 1)[0];
            const connectionPoint = points[pointIndex]; 

            // --- TIMING MATH ---
            const splitRatio = pointIndex / points.length;
            
            const myEntryDelay = parentEntryDelay + (parentDuration * splitRatio);
            
            // CRITICAL FIX: The child's exit starts when THIS segment's exit reaches the connection point.
            // We must use 'myExitDuration' (this segment's duration), NOT global lingerDuration.
            const myExitDelay = parentExitDelay + (myExitDuration * splitRatio);
            
            const myDuration = Math.min(0.2, parentDuration * 0.6);

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
            0, // Start Exit Delay
            maxDepth,
            branchIntensity
        );
    }, [startX, startY, endX, endY, segments, amplitude, active, branchIntensity, animationDuration, lingerDuration]);

    // Segment Variants
    const segmentVariants = {
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
                    ease: "easeOut"
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
            opacity: 0, 
            transition: { 
                delay: custom.exitDelay,
                // Use pre-calculated duration.
                // Ease must be linear for precise synchronization of the "fade wave"
                duration: custom.exitDuration, 
                ease: "linear" 
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
                            <feGaussianBlur stdDeviation={glowIntensity} result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                    
                    {allSegments.map((seg) => (
                        <g key={seg.id}>
                            {/* Layer 1: Glow (Uses dGlow for volume) */}
                            {seg.level < 2 && (
                                <MotionPath
                                    custom={seg}
                                    variants={animationDuration > 0 ? segmentVariants : staticVariants}
                                    d={seg.dGlow} 
                                    stroke={color}
                                    strokeWidth={Math.max(1, 6 * thickness * seg.widthMultiplier)}
                                    strokeOpacity={0.2 * seg.widthMultiplier}
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
                                filter={`url(#${filterId})`}
                            />

                            {/* Layer 3: White Hot Center (Uses dCore for intensity) */}
                            {seg.level < 2 && (
                                <MotionPath
                                    custom={seg}
                                    variants={animationDuration > 0 ? segmentVariants : staticVariants}
                                    d={seg.dCore} 
                                    stroke="white"
                                    strokeWidth={Math.max(0.2, 1 * thickness * seg.widthMultiplier)}
                                    strokeOpacity={0.8}
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
