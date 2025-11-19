
import React, { useState, useEffect } from 'react';
import Modal from './Modal';

interface ManageClassesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClasses: string[];
  onSave: (newClasses: string[]) => void;
}

const ManageClassesModal: React.FC<ManageClassesModalProps> = ({ isOpen, onClose, currentClasses, onSave }) => {
  const [classIds, setClassIds] = useState(currentClasses);

  useEffect(() => {
    // Reset state if modal is reopened with different props
    if (isOpen) {
      setClassIds(currentClasses.length > 0 ? currentClasses : ['']);
    }
  }, [isOpen, currentClasses]);

  const handleClassIdChange = (index: number, value: string) => {
    const newClassIds = [...classIds];
    newClassIds[index] = value;
    setClassIds(newClassIds);
  };

  const handleAddClassId = () => {
    setClassIds([...classIds, '']);
  };

  const handleRemoveClassId = (index: number) => {
    if (classIds.length > 1) {
      const newClassIds = classIds.filter((_, i) => i !== index);
      setClassIds(newClassIds);
    }
  };
  
  const handleSave = () => {
    const filteredIds = classIds.map(c => c.trim().toUpperCase()).filter(Boolean);
    if (filteredIds.length === 0) {
        alert("You must have at least one class ID.");
        return;
    }
    onSave(filteredIds);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Your Classes">
      <div className="space-y-4">
        <p className="text-sm text-slate-400">Add or remove the Class IDs you are responsible for. Students will use these codes to register under you.</p>
        {classIds.map((code, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="flex-grow">
              <label htmlFor={`class-id-${index}`} className="sr-only">Class ID #{index + 1}</label>
              <input
                id={`class-id-${index}`}
                type="text"
                value={code}
                onChange={(e) => handleClassIdChange(index, e.target.value)}
                placeholder={`e.g., DKM5A`}
                className="w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm p-3 focus:ring-cyan-700 focus:border-cyan-700 text-white"
              />
            </div>
            {classIds.length > 1 && (
              <button
                onClick={() => handleRemoveClassId(index)}
                className="p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-sm flex-shrink-0"
                aria-label={`Remove Class ID #${index + 1}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
              </button>
            )}
          </div>
        ))}
        <button onClick={handleAddClassId} className="text-sm font-semibold text-cyan-600 hover:underline">
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
