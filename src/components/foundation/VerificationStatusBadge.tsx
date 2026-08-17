/**
 * VerificationStatusBadge — Unified verification status system
 * 
 * Implements the complete status vocabulary from the Master Spec:
 * VERIFIED, PARTIALLY_VERIFIED, UNVERIFIED, CONFLICTING, 
 * NOT_FOUND, SOURCE_UNAVAILABLE, UPSTREAM_MAINTENANCE, INFERRED, RESTRICTED
 */
import React from 'react';
import { 
  CheckCircle, AlertTriangle, HelpCircle, XCircle, 
  WifiOff, Wrench, Sparkles, Lock, MinusCircle 
} from 'lucide-react';

export type VerificationStatus = 
  | 'VERIFIED'
  | 'PARTIALLY_VERIFIED'
  | 'UNVERIFIED'
  | 'CONFLICTING'
  | 'NOT_FOUND'
  | 'SOURCE_UNAVAILABLE'
  | 'UPSTREAM_MAINTENANCE'
  | 'INFERRED'
  | 'RESTRICTED';

interface VerificationStatusBadgeProps {
  status: VerificationStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const statusConfig: Record<VerificationStatus, {
  icon: React.ElementType;
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}> = {
  VERIFIED: {
    icon: CheckCircle,
    label: 'Підтверджено',
    bgClass: 'bg-emerald-500/10',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/20',
  },
  PARTIALLY_VERIFIED: {
    icon: AlertTriangle,
    label: 'Частково підтверджено',
    bgClass: 'bg-amber-500/10',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-500/20',
  },
  UNVERIFIED: {
    icon: HelpCircle,
    label: 'Не підтверджено',
    bgClass: 'bg-slate-500/10',
    textClass: 'text-slate-400',
    borderClass: 'border-slate-500/20',
  },
  CONFLICTING: {
    icon: XCircle,
    label: 'Конфлікт',
    bgClass: 'bg-red-500/10',
    textClass: 'text-red-400',
    borderClass: 'border-red-500/20',
  },
  NOT_FOUND: {
    icon: MinusCircle,
    label: 'Не знайдено',
    bgClass: 'bg-gray-500/10',
    textClass: 'text-gray-400',
    borderClass: 'border-gray-500/20',
  },
  SOURCE_UNAVAILABLE: {
    icon: WifiOff,
    label: 'Джерело недоступне',
    bgClass: 'bg-orange-500/10',
    textClass: 'text-orange-400',
    borderClass: 'border-orange-500/20',
  },
  UPSTREAM_MAINTENANCE: {
    icon: Wrench,
    label: 'Технічне обслуговування',
    bgClass: 'bg-yellow-500/10',
    textClass: 'text-yellow-400',
    borderClass: 'border-yellow-500/20',
  },
  INFERRED: {
    icon: Sparkles,
    label: 'Визначено AI',
    bgClass: 'bg-blue-500/10',
    textClass: 'text-blue-400',
    borderClass: 'border-blue-500/20',
  },
  RESTRICTED: {
    icon: Lock,
    label: 'Обмежений доступ',
    bgClass: 'bg-purple-500/10',
    textClass: 'text-purple-400',
    borderClass: 'border-purple-500/20',
  },
};

const sizeClasses = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

const iconSizes = { sm: 10, md: 12, lg: 14 };

export const VerificationStatusBadge: React.FC<VerificationStatusBadgeProps> = ({
  status,
  size = 'md',
  showLabel = true,
}) => {
  const config = statusConfig[status];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <span 
      className={`inline-flex items-center gap-1 rounded-md font-medium border ${config.bgClass} ${config.textClass} ${config.borderClass} ${sizeClasses[size]}`}
      title={config.label}
    >
      <Icon size={iconSizes[size]} />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
};
