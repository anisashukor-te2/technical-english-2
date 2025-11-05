import React from 'react';

interface CardProps {
  title: string;
  children: React.ReactNode;
  color?: 'blue' | 'green' | 'purple' | 'orange';
}

const Card: React.FC<CardProps> = ({ title, children, color }) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-100/70',
      titleColor: 'text-blue-700',
      borderColor: 'border-blue-200'
    },
    green: {
      bg: 'bg-green-100/70',
      titleColor: 'text-green-700',
      borderColor: 'border-green-200'
    },
    purple: {
      bg: 'bg-purple-100/70',
      titleColor: 'text-purple-700',
      borderColor: 'border-purple-200'
    },
    orange: {
      bg: 'bg-orange-100/70',
      titleColor: 'text-orange-700',
      borderColor: 'border-orange-200'
    },
    default: {
      bg: 'bg-white/60',
      titleColor: 'text-blue-600',
      borderColor: 'border-slate-200'
    }
  };

  const selectedColor = colorClasses[color || 'default'];

  return (
    <div className={`${selectedColor.bg} backdrop-blur-lg border border-white/30 rounded-lg shadow-lg`}>
      <h3 className={`text-lg font-bold ${selectedColor.titleColor} p-4 border-b ${selectedColor.borderColor}`}>
        {title}
      </h3>
      {children}
    </div>
  );
};

export default Card;
