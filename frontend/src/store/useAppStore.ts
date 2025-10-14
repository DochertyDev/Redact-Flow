import { create } from 'zustand';
import { AppState, Document, TokenInfo, PopupState } from '../types/index.ts';

interface AppStore extends AppState {
  setCurrentDocument: (doc: Document | null) => void;
  setSanitizedText: (text: string) => void;
  setTokenMapId: (id: string) => void;
  setTokens: (tokens: TokenInfo[]) => void;
  setLlmOutput: (output: string) => void;
  setDetokenizedText: (text: string) => void;
  setCurrentStep: (step: number) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setSuccessMessage: (message: string | null) => void;
  resetState: () => void;
  // New state and actions for the global popup
  popupState: PopupState | null;
  selectionRange: { start: number; end: number } | null;
  openPopup: (state: PopupState) => void;
  closePopup: () => void;
  setSelectionRange: (range: { start: number; end: number } | null) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  isForwardNavigationDisabled: boolean;
  setForwardNavigationDisabled: (isDisabled: boolean) => void;
  // Token revert state
  revertingToken: string | null;
  setRevertingToken: (token: string | null) => void;
}

const initialState: AppState = {
  currentDocument: null,
  sanitizedText: '',
  tokenMapId: '',
  tokens: [],
  llmOutput: '',
  detokenizedText: '',
  currentStep: 1,
  isLoading: false,
  error: null,
  successMessage: null,
  popupState: null, // Initial state for popup
  selectionRange: null, // Initial state for selection highlight
  isForwardNavigationDisabled: false,
  revertingToken: null,
};

export const useAppStore = create<AppStore>((set, get) => ({
  ...initialState,
  setCurrentDocument: (doc) => set({ currentDocument: doc, popupState: null, selectionRange: null }), // Close popup on new doc
  setSanitizedText: (text) => set({ sanitizedText: text }),
  setTokenMapId: (id) => set({ tokenMapId: id }),
  setTokens: (tokens) => set({ tokens: tokens }),
  setLlmOutput: (output) => set({ llmOutput: output }),
  setDetokenizedText: (text) => set({ detokenizedText: text }),
  setCurrentStep: (step) => set({ currentStep: step, popupState: null, selectionRange: null }), // Close popup on step change
  setLoading: (isLoading) => set({ isLoading: isLoading }),
  setError: (error) => set({ error: error }),
  setSuccessMessage: (message) => set({ successMessage: message }),
  resetState: () => set(initialState),
  // Popup actions
  openPopup: (state) => set({ popupState: state }),
  closePopup: () => set({ popupState: null, selectionRange: null }),
  setSelectionRange: (range) => set({ selectionRange: range }),
  setForwardNavigationDisabled: (isDisabled: boolean) => set({ isForwardNavigationDisabled: isDisabled }),
  goToNextStep: () => {
    const { currentStep } = get();
    if (currentStep < 4) {
      set({ currentStep: currentStep + 1, popupState: null, selectionRange: null });
    }
  },
  goToPreviousStep: () => {
    const { currentStep } = get();
    if (currentStep > 1) {
      set({ currentStep: currentStep - 1, popupState: null, selectionRange: null });
    }
  },
  setRevertingToken: (token) => set({ revertingToken: token }),
}));
