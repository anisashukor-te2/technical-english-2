import React from 'react';
import Modal from './Modal';

interface MicrophoneHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InstructionStep: React.FC<{ step: number; children: React.ReactNode }> = ({ step, children }) => (
    <li className="flex items-start gap-3">
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-fuchsia-600 text-white flex items-center justify-center font-bold text-sm">{step}</div>
        <div className="flex-grow pt-0.5 text-slate-300">{children}</div>
    </li>
);

const BrowserInstructions: React.FC<{ browserName: string; children: React.ReactNode }> = ({ browserName, children }) => (
    <div>
        <h4 className="text-lg font-semibold text-slate-200 mb-2">{browserName}</h4>
        <ol className="space-y-3 text-sm">
            {children}
        </ol>
    </div>
);

const LockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="inline-block h-4 w-4 mx-1" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
    </svg>
);


const MicrophoneHelpModal: React.FC<MicrophoneHelpModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="How to Enable Your Microphone">
        <div className="space-y-6">
            <p className="text-slate-400">
                To use the recording features, your browser needs permission to access your microphone. Follow the steps for your browser below.
            </p>
            
            <BrowserInstructions browserName="Google Chrome & Microsoft Edge">
                <InstructionStep step={1}>
                    Look for the icon in your address bar (usually a lock <LockIcon /> or a camera icon). Click on it.
                </InstructionStep>
                <InstructionStep step={2}>
                    Find the "Microphone" setting in the dropdown that appears.
                </InstructionStep>
                <InstructionStep step={3}>
                    Switch the toggle to "Allow" access for this site.
                </InstructionStep>
                <InstructionStep step={4}>
                    You may need to reload the page for the changes to take effect.
                </InstructionStep>
            </BrowserInstructions>

             <BrowserInstructions browserName="Mozilla Firefox">
                <InstructionStep step={1}>
                    Look for a microphone icon <svg xmlns="http://www.w3.org/2000/svg" className="inline-block h-4 w-4 mx-1" viewBox="0 0 20 20" fill="currentColor"><path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" /><path fillRule="evenodd" d="M5.5 8.5A.5.5 0 016 9v1a4 4 0 004 4h.01a4 4 0 004-4V9a.5.5 0 011 0v1a5 5 0 01-4.5 4.975V17h3a.5.5 0 010 1h-7a.5.5 0 010-1h3v-2.025A5 5 0 015 10V9a.5.5 0 01.5-.5z" clipRule="evenodd" /></svg> in the address bar on the left.
                </InstructionStep>
                <InstructionStep step={2}>
                    Click the "x" next to "Blocked Temporarily" or "Blocked" to remove the block.
                </InstructionStep>
                 <InstructionStep step={3}>
                    Reload the page. The browser should ask for microphone permission again. Click "Allow".
                </InstructionStep>
            </BrowserInstructions>

            <p className="text-xs text-slate-500 text-center pt-4 border-t border-slate-700">
                If you are still having trouble, check your computer's system settings to ensure your microphone is enabled and not being used by another application.
            </p>
        </div>
    </Modal>
  );
};

export default MicrophoneHelpModal;