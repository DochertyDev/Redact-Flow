import axios, { AxiosInstance, AxiosError } from 'axios';
import { DetokenizeRequest, TokenUpdate, TokenUpdateRequest, PresidioConfig, BackendSanitizeResponse, BackendTokenInfo } from '../types';
import { DetokenizeResponse, ErrorResponse, SanitizeResponse } from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: '', // This will be set dynamically by the App component
      timeout: 90000, // 90 seconds timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          const errorData = error.response.data as ErrorResponse;
          console.error('API Error:', errorData);
          return Promise.reject(new Error(errorData.detail || 'An API error occurred.'));
        } else if (error.request) {
          // The request was made but no response was received
          console.error('Network Error:', error.message);
          return Promise.reject(new Error('Network Error: Please check your internet connection.'));
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error('Request Error:', error.message);
          return Promise.reject(new Error('Request Error: Could not send request.'));
        }
      }
    );
  }

  public setBaseURL(baseURL: string) {
    this.api.defaults.baseURL = baseURL;
  }

  public async sanitize(text: string, config?: PresidioConfig): Promise<SanitizeResponse> {
    const response = await this.api.post<BackendSanitizeResponse>('/sanitize', { text, presidio_config: config });
    
    // Transform snake_case backend response to camelCase frontend format
    const transformedTokens = response.data.tokens.map((token: BackendTokenInfo) => ({
      token: token.token,
      originalValue: token.original_value,
      entityType: token.entity_type,
      start: token.start,
      end: token.end,
      score: token.score,
    }));
    
    return {
      sanitized_text: response.data.sanitized_text,
      token_map_id: response.data.token_map_id,
      tokens: transformedTokens,
      processing_time_ms: response.data.processing_time_ms,
    };
  }

  public async detokenize(tokenMapId: string, llm_output: string): Promise<DetokenizeResponse> {
    const requestBody: DetokenizeRequest = { token_map_id: tokenMapId, text: llm_output };
    const response = await this.api.post<DetokenizeResponse>('/detokenize', requestBody);
    return response.data;
  }

  public async updateTokens(tokenMapId: string, updates: TokenUpdate[]): Promise<void> {
    const requestBody: TokenUpdateRequest = { token_map_id: tokenMapId, updates };
    await this.api.post<void>('/tokens/update', requestBody);
  }

  public async deleteTokenMap(tokenMapId: string): Promise<void> {
    await this.api.delete<void>(`/tokens/${tokenMapId}`);
  }

  public async checkHealth(): Promise<{ status: string }> {
    const response = await this.api.get<{ status: string }>('/health');
    return response.data;
  }

  public async manualTokenize(
    tokenMapId: string,
    textToTokenize: string,
    entityType: string,
    start: number,
    end: number
  ): Promise<SanitizeResponse> {
    const response = await this.api.post<BackendSanitizeResponse>('/tokens/manual', {
      token_map_id: tokenMapId,
      text_to_tokenize: textToTokenize,
      entity_type: entityType,
      start: start,
      end: end,
    });
    
    // Transform snake_case backend response to camelCase frontend format
    const transformedTokens = response.data.tokens.map((token: BackendTokenInfo) => ({
      token: token.token,
      originalValue: token.original_value,
      entityType: token.entity_type,
      start: token.start,
      end: token.end,
      score: token.score,
    }));
    
    return {
      sanitized_text: response.data.sanitized_text,
      token_map_id: response.data.token_map_id,
      tokens: transformedTokens,
      processing_time_ms: response.data.processing_time_ms,
    };
  }

  public async revertToken(tokenMapId: string, token: string): Promise<SanitizeResponse> {
    const response = await this.api.post<BackendSanitizeResponse>('/tokens/revert', {
      token_map_id: tokenMapId,
      token: token,
    });
    
    // Transform snake_case backend response to camelCase frontend format
    const transformedTokens = response.data.tokens.map((token: BackendTokenInfo) => ({
      token: token.token,
      originalValue: token.original_value,
      entityType: token.entity_type,
      start: token.start,
      end: token.end,
      score: token.score,
    }));
    
    return {
      sanitized_text: response.data.sanitized_text,
      token_map_id: response.data.token_map_id,
      tokens: transformedTokens,
      processing_time_ms: response.data.processing_time_ms,
    };
  }
}

export const apiService = new ApiService();
