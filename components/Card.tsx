import React from 'react';

interface CardProps {
  title: string;
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ title, children }) => {
  return (
    <div className="bg-slate-800/70 backdrop-blur-sm border border-slate-700 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold text-cyan-400 p-4 border-b border-slate-700">
        {title}
      </h3>
      {children}
    </div>
  );
};

export default Card;