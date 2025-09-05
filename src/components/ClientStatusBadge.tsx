import React from 'react';
import { ClientStatus, getStatusConfig } from '../types/clientStatus';

interface ClientStatusBadgeProps {
  status: ClientStatus;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}

const ClientStatusBadge: React.FC<ClientStatusBadgeProps> = ({
  status,
  showIcon = true,
  size = 'md',
  onClick,
  className = ''
}) => {
  const statusConfig = getStatusConfig(status);
  
  if (!statusConfig) return null;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const Component = onClick ? 'button' : 'span';

  return (
    <Component
      className={`inline-flex items-center gap-1 rounded-full font-medium transition-all duration-200 ${statusConfig.bgColor} ${statusConfig.color} ${sizeClasses[size]} ${onClick ? 'cursor-pointer hover:scale-105 hover:shadow-sm' : ''} ${className}`}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
    >
      {showIcon && <span>{statusConfig.icon}</span>}
      {statusConfig.label}
    </Component>
  );
};

export default ClientStatusBadge;
