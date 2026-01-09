import React from 'react';
import { useResponsive } from '@hooks/useResponsive';
import { Card, type CardProps } from './Card';

interface ResponsiveCardProps extends CardProps {
  compact?: boolean;
  mobileStack?: boolean;
}

export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  compact,
  mobileStack,
  className = '',
  children,
  ...props
}) => {
  const responsive = useResponsive();
  
  const shouldCompact = compact || responsive.isCompact;
  const shouldStack = mobileStack && responsive.isMobile;
  
  return (
    <Card
      className={`
        ${shouldCompact ? 'p-3' : 'p-4 md:p-6'}
        ${shouldStack ? 'flex flex-col' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </Card>
  );
};
