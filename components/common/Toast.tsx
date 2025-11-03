import React, { useState, useEffect } from 'react';

interface ToastProps {
  message: string;
  onClick: () => void;
  onDismiss: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, onClick, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    setIsVisible(true);

    // Set a timer to animate out and then call the dismiss function
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 5000); // Wait 5 seconds

    const finalDismissTimer = setTimeout(() => {
        onDismiss();
    }, 5500); // Dismiss after fade out animation (500ms)

    return () => {
        clearTimeout(timer);
        clearTimeout(finalDismissTimer);
    };
  }, [onDismiss]);

  const handleToastClick = () => {
    onClick();
    setIsVisible(false);
  };

  const animationClassIn = 'animate-[slideInFromTop_0.5s_ease-out_forwards]';
  const animationClassOut = 'animate-[fadeOut_0.5s_ease-in_forwards]';

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md ${isVisible ? animationClassIn : animationClassOut}`}
    >
      <div
        onClick={handleToastClick}
        className="flex items-center justify-between p-4 bg-slate-800 border border-fuchsia-500 rounded-lg shadow-2xl cursor-pointer hover:bg-slate-700 transition-colors"
      >
        <div className="flex items-center">
            <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-fuchsia-400 animate-pulse" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
            </div>
            <div className="ml-3 w-0 flex-1">
                <p className="text-sm font-medium text-slate-200">New Submission!</p>
                <p className="mt-1 text-sm text-slate-400">{message}</p>
            </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setIsVisible(false); }}
          className="ml-4 flex-shrink-0 text-slate-500 hover:text-white"
        >
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Toast;
