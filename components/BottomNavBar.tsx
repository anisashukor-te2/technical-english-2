
import React from 'react';
import { ActiveModule } from '../types';

interface BottomNavBarProps {
  activeModule: ActiveModule;
  setActiveModule: (module: ActiveModule) => void;
  userType: 'student' | 'lecturer';
  onNavigate: () => void;
}

const PresentationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a3 3 0 013-3h2a3 3 0 013 3v2M9 7V5a3 3 0 013-3h2a3 3 0 013 3v2m-6 0h6" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 17v4" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 3h16" />
  </svg>
);

const MeetingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ComplaintsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ResourcesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
  </svg>
);


interface NavItemProps {
  label: string;
  module: ActiveModule;
  isActive: boolean;
  onClick: (module: ActiveModule) => void;
  children: React.ReactNode;
  activeColor: string;
  focusRingColor: string;
}

const NavItem: React.FC<NavItemProps> = ({ label, module, isActive, onClick, children, activeColor, focusRingColor }) => (
  <button
    onClick={() => onClick(module)}
    className={`flex-1 flex flex-col items-center justify-center p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 ${focusRingColor} ${
      isActive ? activeColor : 'text-slate-500 hover:bg-slate-100'
    }`}
    aria-current={isActive ? 'page' : undefined}
  >
    {children}
    <span className="text-xs font-medium mt-1">{label}</span>
  </button>
);

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeModule, setActiveModule, userType, onNavigate }) => {
  const handleNavClick = (module: ActiveModule) => {
    setActiveModule(module);
    onNavigate();
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-20">
      <nav className="max-w-md mx-auto flex items-center justify-around p-1">
        <NavItem
          label="Presentation"
          module="PRESENTATION"
          isActive={activeModule === 'PRESENTATION'}
          onClick={handleNavClick}
          activeColor="bg-blue-100 text-blue-700 font-bold"
          focusRingColor="focus:ring-blue-500/50"
        >
          <PresentationIcon />
        </NavItem>
        <NavItem
          label="Meeting"
          module="MEETING"
          isActive={activeModule === 'MEETING'}
          onClick={handleNavClick}
          activeColor="bg-purple-100 text-purple-700 font-bold"
          focusRingColor="focus:ring-purple-500/50"
        >
          <MeetingIcon />
        </NavItem>
        <NavItem
          label="Complaints"
          module="COMPLAINTS"
          isActive={activeModule === 'COMPLAINTS'}
          onClick={handleNavClick}
          activeColor="bg-orange-100 text-orange-700 font-bold"
          focusRingColor="focus:ring-orange-500/50"
        >
          <ComplaintsIcon />
        </NavItem>
        <NavItem
          label="Resources"
          module="RESOURCES"
          isActive={activeModule === 'RESOURCES'}
          onClick={handleNavClick}
          activeColor="bg-green-100 text-green-700 font-bold"
          focusRingColor="focus:ring-green-500/50"
        >
          <ResourcesIcon />
        </NavItem>
      </nav>
      <div className="text-left px-4 pb-2 text-xs text-slate-500">
        © 2025 Developed by Anis Abd Shukor
      </div>
    </footer>
  );
};

export default BottomNavBar;