import React from 'react';

interface BadgeProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
}

const Badge: React.FC<BadgeProps> = ({ title, description, icon, unlocked }) => {
  return (
    <div className={`p-4 text-center bg-slate-900/50 rounded-lg border border-slate-700 ${!unlocked ? 'opacity-50' : ''}`}>
      <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-2 ${unlocked ? 'bg-cyan-800' : 'bg-slate-700'}`}>
        <div className={`text-3xl ${unlocked ? 'text-cyan-400' : 'text-slate-500'}`}>
            {icon}
        </div>
      </div>
      <h4 className={`font-bold ${unlocked ? 'text-slate-200' : 'text-slate-500'}`}>{title}</h4>
      <p className="text-xs text-slate-500">{unlocked ? description : 'Locked'}</p>
    </div>
  );
};

export default Badge;