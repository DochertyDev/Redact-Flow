export interface Document {
  id: string;
  filename: string;
  text: string;
  mimeType: string;
}

export interface TokenInfo {
  token: string;
  originalValue: string;
  entityType: string;
  start: number;
  end: number;
  score: number;
}

export interface TokenUpdate {
  token: string;
  original_value: string;
  entity_type: string;
}

export interface PopupState {
  top: number;
  left: number;
  placement: 'above' | 'below';
  text: string;
  start: number;
  end: number;
}

export interface TokenMapping {
  token: string;
  originalValue: string;
  entityType: string;
  occurrenceIndex: number;
}

export interface ManualTokenRequest {
  token_map_id: string;
  text_to_tokenize: string;
  entity_type: string;
  start: number;
  end: number;
}

export interface BackendTokenInfo {
  token: string;
  original_value: string;
  entity_type: string;
  start: number;
  end: number;
  score: number;
}

export interface BackendSanitizeResponse {
  sanitized_text: string;
  token_map_id: string;
  tokens: BackendTokenInfo[];
  processing_time_ms: number;
}

export type PresidioConfig = Record<string, unknown>;

// API Request/Response Types
export interface SanitizeRequest {
  text: string;
  presidio_config?: PresidioConfig; // Added
}

export interface SanitizeResponse {
  sanitized_text: string;
  token_map_id: string;
  tokens: TokenInfo[];
  processing_time_ms: number; // Added
  additional_occurrences?: number; // Number of additional occurrences found during manual tokenization
}

export interface DetokenizeRequest {
  token_map_id: string;
  text: string;
}

export interface DetokenizeResponse {
  detokenized_text: string;
}

export interface TokenUpdateRequest {
  token_map_id: string;
  updates: TokenUpdate[];
}

export interface ErrorResponse {
  detail: string;
}

export type AppState = {
  currentDocument: Document | null;
  sanitizedText: string;
  tokenMapId: string;
  tokens: TokenInfo[];
  llmOutput: string;
  detokenizedText: string;
  currentStep: number;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  popupState: PopupState | null;
  selectionRange: { start: number; end: number } | null;
  isForwardNavigationDisabled: boolean;
  revertingToken: string | null;
}
