import React from 'react';
import { useAdBlocker } from '@/hooks/useAdBlocker';
import { cn } from '@/lib/utils';

interface AdBlockWrapperProps {
  children: React.ReactNode;
  className?: string;
  showProtectionBadge?: boolean;
  onAdBlocked?: (count: number) => void;
}

const AdBlockWrapper: React.FC<AdBlockWrapperProps> = ({
  children,
  className,
  showProtectionBadge: _showProtectionBadge,
  onAdBlocked: _onAdBlocked,
}) => {
  useAdBlocker({ enabled: true });

  return (
    <div className={cn('relative', className)}>
      {children}
    </div>
  );
};

export default AdBlockWrapper;
