
import React from 'react';

interface UserTypeSelectionScreenProps {
  onSelectType: (type: 'lecturer' | 'student') => void;
}

const UserTypeCard = ({ title, description, onClick, icon }: { title: string, description: string, onClick: () => void, icon: React.ReactNode }) => (
    <div 
        onClick={onClick}
        className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 text-center cursor-pointer hover:bg-slate-800 hover:border-cyan-500 transition-all transform hover:-translate-y-2"
    >
        <div className="flex justify-center items-center mb-4 text-cyan-400">
            {icon}
        </div>
        <h3 className="text-2xl font-bold text-slate-200">{title}</h3>
        <p className="mt-2 text-slate-400">{description}</p>
    </div>
);

const UserTypeSelectionScreen: React.FC<UserTypeSelectionScreenProps> = ({ onSelectType }) => {
  return (
    <div className="min-h-screen flex flex-col">
        <main className="flex-grow flex items-center justify-center p-4">
            <div className="max-w-4xl mx-auto text-center">
                <div className="mb-10">
                    <h1 className="text-5xl font-extrabold text-cyan-400">Technical English 2</h1>
                    <p className="mt-4 text-lg text-slate-400">Your AI-powered partner for mastering professional communication.</p>
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                    <UserTypeCard
                        title="Lecturer Portal"
                        description="Access the lecturer portal to manage classes and review student progress."
                        onClick={() => onSelectType('lecturer')}
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        }
                    />
                     <UserTypeCard
                        title="Student Portal"
                        description="Log in to access practice modules, get instant feedback, and improve your skills."
                        onClick={() => onSelectType('student')}
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path d="M12 14l9-5-9-5-9 5 9 5z" />
                                <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                            </svg>
                        }
                    />
                </div>
            </div>
        </main>
        <footer className="w-full text-left p-4 text-xs text-slate-500">
            © Developed by Anis Abd Shukor
        </footer>
    </div>
  );
};

export default UserTypeSelectionScreen;