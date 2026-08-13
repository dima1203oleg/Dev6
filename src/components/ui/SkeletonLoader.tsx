import { motion } from 'motion/react';

export const SkeletonBox = ({ className }: { className?: string }) => (
  <motion.div
    initial={{ opacity: 0.3 }}
    animate={{ opacity: 0.7 }}
    transition={{ repeat: Infinity, duration: 1.5, repeatType: 'reverse' }}
    className={`bg-slate-800/60 rounded-xl ${className || 'h-24 w-full'}`}
  />
);

export const SkeletonText = ({ className, width }: { className?: string; width?: string }) => (
  <motion.div
    initial={{ opacity: 0.3 }}
    animate={{ opacity: 0.7 }}
    transition={{ repeat: Infinity, duration: 1.5, repeatType: 'reverse' }}
    className={`bg-slate-800/80 rounded ${className || 'h-4'}`}
    style={{ width: width || '100%' }}
  />
);

export const SkeletonLensPanel = () => (
  <div className="space-y-6">
    <SkeletonBox className="h-48 w-full" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <SkeletonBox className="h-64 w-full" />
      <SkeletonBox className="h-64 w-full" />
    </div>
  </div>
);

export const SkeletonList = ({ items = 5 }: { items?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: items }).map((_, i) => (
      <div key={i}>
        <SkeletonBox className="h-16 w-full rounded-lg" />
      </div>
    ))}
  </div>
);
