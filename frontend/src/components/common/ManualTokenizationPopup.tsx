import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { apiService } from '../../services/api';
import { Button } from './Button';

export const ManualTokenizationPopup: React.FC = () => {
  const {
    popupState,
    closePopup,
    tokenMapId,
    setSanitizedText,
    setTokens,
    setLoading,
    setSuccessMessage,
    isLoading,
  } = useAppStore();

  const [manualEntityType, setManualEntityType] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (popupState) {
      setManualEntityType(''); // Reset input on new popup
      setLocalError(null); // Reset local error on new popup
    }
  }, [popupState]);

  // Validation function to check if form can be submitted
  const isFormValid = useCallback(() => {
    return popupState && manualEntityType.trim() !== '' && tokenMapId;
  }, [popupState, manualEntityType, tokenMapId]);

  const handleManualTokenize = async () => {
    if (!isFormValid()) {
      setLocalError('Missing data for manual tokenization.');
      return;
    }

    setLoading(true);
    setLocalError(null);
    setSuccessMessage(null);
    try {
      const response = await apiService.manualTokenize(
        tokenMapId,
        popupState!.text,
        manualEntityType,
        popupState!.start,
        popupState!.end
      );
      setSanitizedText(response.sanitized_text);
      setTokens(response.tokens);
      
      // Show success message with additional occurrences info
      if (response.additional_occurrences !== undefined && response.additional_occurrences > 0) {
        setSuccessMessage(
          `Tokenized "${popupState!.text}" and found ${response.additional_occurrences} additional occurrence${response.additional_occurrences === 1 ? '' : 's'}`
        );
      } else {
        setSuccessMessage(`Successfully tokenized "${popupState!.text}"`);
      }
      
      closePopup();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to manually tokenize text.';
      setLocalError(errorMessage);
      // Don't close the popup on error so user can see the error and try again
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key press for submission
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isFormValid()) {
      e.preventDefault();
      handleManualTokenize();
    }
  };

  if (!popupState) {
    return null;
  }

  return (
    <div
      ref={popupRef}
      style={{ position: 'fixed', top: popupState.top, left: popupState.left, zIndex: 1000 }}
      className="glass-card p-4 rounded-lg shadow-lg flex flex-col gap-2 w-[calc(100vw-32px)] sm:w-80 animate-fade-in transition-all duration-200 ease-in-out"
    >
      <div className={`popup-arrow ${popupState.placement === 'above' ? 'popup-arrow-above' : 'popup-arrow-below'}`} />
      <p className="text-gray-800 text-sm">Selected: <span className="font-semibold">"{popupState.text}"</span></p>
      
      {localError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
          {localError}
        </div>
      )}
      
      <input
        type="text"
        placeholder="Entity Type (e.g., EMPLOYEE_ID)"
        className="glass-input p-2 rounded focus:outline-none"
        value={manualEntityType}
        onChange={(e) => setManualEntityType(e.target.value.toUpperCase())}
        onKeyDown={handleKeyDown}
        autoFocus
      />
      <div className="flex gap-2">
        <Button onClick={handleManualTokenize} disabled={!isFormValid()} loading={isLoading} small>
          Tokenize Manually
        </Button>
        <Button onClick={closePopup} variant="secondary" small>
          Cancel
        </Button>
      </div>
    </div>
  );
};
