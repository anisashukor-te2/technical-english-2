import React, { useState, useEffect } from 'react';
import Modal from './Modal';

interface ManageClassesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClasses: string[];
  onSave: (newClasses: string[]) => void;
}

const ManageClassesModal: React.FC<ManageClassesModalProps> = ({ isOpen, onClose, currentClasses, onSave }) => {
  const [classCodes, setClassCodes] = useState(currentClasses);

  useEffect(() => {
    // Reset state if modal is reopened with different props
    if (isOpen) {
      setClassCodes(currentClasses.length > 0 ? currentClasses : ['']);
    }
  }, [isOpen, currentClasses]);

  const handleClassCodeChange = (index: number, value: string) => {
    const newClassCodes = [...classCodes];
    newClassCodes[index] = value;
    setClassCodes(newClassCodes);
  };

  const handleAddClassCode = () => {
    setClassCodes([...classCodes, '']);
  };

  const handleRemoveClassCode = (index: number) => {
    if (classCodes.length > 1) {
      const newClassCodes = classCodes.filter((_, i) => i !== index);
      setClassCodes(newClassCodes);
    }
  };
  
  const handleSave = () => {
    const filteredCodes = classCodes.map(c => c.trim().toUpperCase()).filter(Boolean);
    if (filteredCodes.length === 0) {
        alert("You must have at least one class ID.");
        return;
    }
    onSave(filteredCodes);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Your Classes">
      <div className="space-y-4">
        <p className="text-sm text-slate-400">Add or remove the Class IDs you are responsible for. Students will use these codes to register under you.</p>
        {classCodes.map((code, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="flex-grow">
              <label htmlFor={`class-code-${index}`} className="sr-only">Class ID #{index + 1}</label>
              <input
                id={`class-code-${index}`}
                type="text"
                value={code}
                onChange={(e) => handleClassCodeChange(index, e.target.value)}
                placeholder={`e.g., DKM5A`}
                className="w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm p-3 focus:ring-cyan-700 focus:border-cyan-700 text-white"
              />
            </div>
            {classCodes.length > 1 && (
              <button
                onClick={() => handleRemoveClassCode(index)}
                className="p-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
                aria-label={`Remove Class ID #${index + 1}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
              </button>
            )}
          </div>
        ))}
        <button onClick={handleAddClassCode} className="text-sm font-semibold text-cyan-600 hover:underline">
          + Add Another Class
        </button>
      </div>
      <div className="flex justify-end gap-3 pt-6 border-t border-slate-700 mt-6">
        <button type="button" onClick={onClose} className="bg-slate-600 text-slate-200 font-bold py-2 px-4 rounded-lg hover:bg-slate-500">Cancel</button>
        <button type="button" onClick={handleSave} className="bg-cyan-800 text-white font-bold py-2 px-4 rounded-lg hover:bg-cyan-900">
          Save Changes
        </button>
      </div>
    </Modal>
  );
};

export default ManageClassesModal;
