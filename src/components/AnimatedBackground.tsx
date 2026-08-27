import React, { useState, useEffect, useMemo } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

interface OrbProps {
  color: string;
  size: number;
  initialX: number;
  initialY: number;
  duration: number;
}

const Orb = ({ color, size, initialX, initialY, duration }: OrbProps) => {
  return (
    <motion.div
      className="absolute rounded-full blur-[100px] opacity-20 pointer-events-none"
      style={{
        backgroundColor: color,
        width: size,
        height: size,
        left: `${initialX}%`,
        top: `${initialY}%`,
      }}
      animate={{
        x: [0, 50, -50, 0],
        y: [0, -50, 50, 0],
        scale: [1, 1.2, 0.8, 1],
      }}
      transition={{
        duration: duration,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
};

export const AnimatedBackground = () => {
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | 'night'>('morning');
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setTimeOfDay('morning');
    else if (hour >= 12 && hour < 17) setTimeOfDay('afternoon');
    else if (hour >= 17 && hour < 21) setTimeOfDay('evening');
    else setTimeOfDay('night');

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const theme = useMemo(() => {
    switch (timeOfDay) {
      case 'morning':
        return {
          bg: '#0a0f0d',
          orbs: ['#22c55e', '#fbbf24', '#4ade80'],
          accent: 'rgba(34, 197, 94, 0.1)'
        };
      case 'afternoon':
        return {
          bg: '#0a0f0d',
          orbs: ['#22c55e', '#60a5fa', '#34d399'],
          accent: 'rgba(34, 197, 94, 0.1)'
        };
      case 'evening':
        return {
          bg: '#0f0a0d',
          orbs: ['#f59e0b', '#ef4444', '#22c55e'],
          accent: 'rgba(245, 158, 11, 0.1)'
        };
      case 'night':
      default:
        return {
          bg: '#050a08',
          orbs: ['#14532d', '#1e3a8a', '#22c55e'],
          accent: 'rgba(34, 197, 94, 0.05)'
        };
    }
  }, [timeOfDay]);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" style={{ backgroundColor: theme.bg }}>
      {/* Dynamic Orbs */}
      <Orb color={theme.orbs[0]} size={400} initialX={-10} initialY={-10} duration={20} />
      <Orb color={theme.orbs[1]} size={500} initialX={80} initialY={70} duration={25} />
      <Orb color={theme.orbs[2]} size={300} initialX={40} initialY={30} duration={18} />

      {/* Mouse Reactive Glow */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-10 pointer-events-none"
        style={{
          backgroundColor: theme.orbs[0],
          x: smoothX,
          y: smoothY,
          translateX: '-50%',
          translateY: '-50%',
        }}
      />

      {/* Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]" 
        style={{ 
          backgroundImage: `radial-gradient(${theme.orbs[0]} 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} 
      />

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
    </div>
  );
};
