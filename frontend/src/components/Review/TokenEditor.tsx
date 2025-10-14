import React, { useState, useEffect } from 'react';
import { TokenInfo, TokenUpdate } from '../../types';
import { Button } from '../common/Button';

interface TokenEditorProps {
  token: TokenInfo;
  onSave: (updates: TokenUpdate) => void;
  onClose: () => void;
}

const entityTypes = [
  'PERSON', 'EMAIL_ADDRESS', 'PHONE_NUMBER', 'DATE_TIME', 'LOCATION',
  'CREDIT_CARD', 'US_SSN', 'IP_ADDRESS', 'URL', 'IBAN', 'CRYPTO',
  'NRP', 'MEDICAL_LICENSE', 'US_DRIVER_LICENSE', 'US_PASSPORT',
];

export const TokenEditor: React.FC<TokenEditorProps> = ({
  token,
  onSave,
  onClose,
}) => {
  const [originalValue, setOriginalValue] = useState<string>('');
  const [entityType, setEntityType] = useState<string>(token.entityType);

  // In a real scenario, you'd fetch the original value from the token map service
  // For now, we'll use a placeholder or assume it's part of the TokenInfo if available
  useEffect(() => {
    // This is a placeholder. The actual original value should come from the backend's token map.
    // For demonstration, we'll use the token itself as a stand-in if no original value is passed.
    setOriginalValue(token.token.replace(/[[\]]/g, '')); // Remove brackets for display
  }, [token]);

  const handleSave = () => {
    onSave({
      token: token.token,
      original_value: originalValue,
      entity_type: entityType,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass-card p-6 rounded-lg shadow-xl w-full max-w-md">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Edit Token: {token.token}</h3>

        <div className="mb-4">
          <label htmlFor="originalValue" className="block text-gray-700 text-sm font-bold mb-2">
            Token Value
          </label>
          <input
            type="text"
            id="originalValue"
            className="glass-input w-full py-2 px-3 leading-tight focus:outline-none"
            value={originalValue}
            onChange={(e) => setOriginalValue(e.target.value)}
          />
        </div>

        <div className="mb-6">
          <label htmlFor="entityType" className="block text-gray-700 text-sm font-bold mb-2">
            Entity Type
          </label>
          <select
            id="entityType"
            className="glass-input w-full py-2 px-3 leading-tight focus:outline-none"
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
          >
            {entityTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end space-x-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};
