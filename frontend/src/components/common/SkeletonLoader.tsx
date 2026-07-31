import React from 'react';
import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={clsx('animate-pulse rounded-xl bg-slate-800/60 dark:bg-slate-800/80', className)}
        />
      ))}
    </>
  );
};
