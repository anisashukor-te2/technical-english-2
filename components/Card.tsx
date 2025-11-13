import React from 'react';

interface CardProps {
  title: string;
  children: React.ReactNode;
  color?: 'blue' | 'green' | 'purple' | 'orange';
}

const Card: React.FC<CardProps> = ({ title, children, color }) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-950/20',
      titleColor: 'text-blue-500',
      borderColor: 'border-blue-900/50'
    },
    green: {
      bg: 'bg-green-900/20',
      titleColor: 'text-green-300',
      borderColor: 'border-green-800/50'
    },
    purple: {
      bg: 'bg-purple-900/20',
      titleColor: 'text-purple-300',
      borderColor: 'border-purple-800/50'
    },
    orange: {
      bg: 'bg-orange-900/20',
      titleColor: 'text-orange-300',
      borderColor: 'border-orange-800/50'
    },
    default: {
      bg: 'bg-slate-800/60',
      titleColor: 'text-cyan-600',
      borderColor: 'border-slate-700'
    }
  };

  const selectedColor = colorClasses[color || 'default'];

  return (
    <div className={`${selectedColor.bg} border ${selectedColor.borderColor} rounded-lg shadow-lg`}>
      <h3 className={`text-lg font-bold ${selectedColor.titleColor} p-4 border-b ${selectedColor.borderColor}`}>
        {title}
      </h3>
      {children}
    </div>
  );
};

export default Card;
