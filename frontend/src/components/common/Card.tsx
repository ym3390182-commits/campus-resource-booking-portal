import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { clsx } from 'clsx';

interface CardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  variant?: 'glass' | 'solid' | 'outline';
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'glass',
  hoverEffect = false,
  className,
  ...props
}) => {
  const baseStyles = 'rounded-2xl p-6 transition-all duration-300 relative overflow-hidden';

  const variants = {
    glass: 'glass-card',
    solid: 'bg-slate-900 border border-slate-800 text-slate-100 shadow-xl',
    outline: 'bg-transparent border border-slate-800 text-slate-100',
  };

  return (
    <motion.div
      whileHover={hoverEffect ? { y: -4, transition: { duration: 0.2 } } : undefined}
      className={clsx(baseStyles, variants[variant], hoverEffect && 'hover:border-indigo-500/40 hover:shadow-indigo-500/5', className)}
      {...props}
    >
      {children}
    </motion.div>
  );
};
