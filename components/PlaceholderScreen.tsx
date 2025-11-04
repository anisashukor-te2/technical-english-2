import React from 'react';

interface PlaceholderScreenProps {
  moduleName: string;
}

const PlaceholderScreen: React.FC<PlaceholderScreenProps> = ({ moduleName }) => {
  return (
    <div className="max-w-4xl mx-auto flex flex-col items-center justify-center h-[calc(100vh-300px)] text-center bg-slate-800/50 border border-slate-700 rounded-lg p-8 animate-fade-in">
       <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-cyan-500 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h2 className="text-3xl font-bold text-cyan-400 mb-3">{moduleName}</h2>
      <p className="text-lg text-slate-400">This module is coming soon!</p>
      <p className="mt-2 text-slate-500">We're working hard to bring you more features. Please check back later.</p>
    </div>
  );
};

export default PlaceholderScreen;