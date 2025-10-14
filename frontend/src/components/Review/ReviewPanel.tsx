import { downloadTextFile } from '../../utils/fileReader';
import { TokenHighlight } from '../Sanitize/TokenHighlight';
import { TokenSidebar } from './TokenSidebar';
import { Toast } from '../common/Toast';
import React, { useState, useRef, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Tooltip } from '../common/Tooltip';
import { highlightTokens } from '../../utils/textHighlighter';
import { apiService } from '../../services/api';
import { TokenInfo } from '../../types';
import { Download, ArrowRight, Maximize, BrushCleaning, Copy } from 'lucide-react';

const generateSanitizedPlaceholderTokens = (text: string, allTokens: TokenInfo[]): TokenInfo[] => {
  const placeholderTokens: TokenInfo[] = [];
  const regex = /\[([A-Z_]+)_(\d+)\]/g; // Matches [ENTITY_TYPE_ID]
  let match;
  while ((match = regex.exec(text)) !== null) {
    const fullPlaceholder = match[0]; // e.g., [PERSON_1]
    const entityType = match[1];     // e.g., PERSON
    const start = match.index;
    const end = match.index + fullPlaceholder.length;

    // Find the corresponding original TokenInfo to get the originalValue
    const originalTokenInfo = allTokens.find(t => t.token === fullPlaceholder);

    placeholderTokens.push({
      token: fullPlaceholder,
      entityType: entityType,
      start: start,
      end: end,
      score: originalTokenInfo?.score || 1.0,
      originalValue: originalTokenInfo?.originalValue || '',
    });
  }
  return placeholderTokens;
};

export const ReviewPanel: React.FC = () => {
  const {
    sanitizedText,
    tokens,
    tokenMapId,
    currentDocument,
    selectionRange,
    setError,
    setTokens,
    setCurrentStep,
    openPopup,
    closePopup,
    setSelectionRange,
    isLoading,
    setLoading,
    setSanitizedText,
    setTokenMapId,
    revertingToken,
    setRevertingToken,
    successMessage,
    setSuccessMessage,
  } = useAppStore();

  const handleSanitize = async () => {
    console.log('handleSanitize called');
    if (!currentDocument) {
      console.log('currentDocument is null, returning');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log('Calling apiService.sanitize with document:', currentDocument.text);
      const response = await apiService.sanitize(currentDocument.text);
      console.log('API response received:', response);
      setSanitizedText(response.sanitized_text);
      setTokenMapId(response.token_map_id);
      setTokens(response.tokens);
      console.log('State updated: sanitizedText, tokenMapId, tokens');
    } catch (err: unknown) {
      console.error('Error during sanitization:', err);
      setError(err instanceof Error ? err.message : 'Failed to sanitize document.');
    } finally {
      setLoading(false);
      console.log('Sanitization process finished');
    }
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [enlargedPanel, setEnlargedPanel] = useState<'original' | 'sanitized' | null>(null);
  const originalTextRef = useRef<HTMLDivElement>(null);
  const sanitizedTextRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  const sanitizedPlaceholderTokens = useMemo(() => generateSanitizedPlaceholderTokens(sanitizedText, tokens), [sanitizedText, tokens]);

  const handleTextSelection = () => {
    if (!originalTextRef.current || !currentDocument) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.toString().trim() === '') {
      closePopup();
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(originalTextRef.current);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);

    const start = preSelectionRange.toString().length;
    const end = start + range.toString().length;
    const text = range.toString();

    if (text.length > 0 && currentDocument.text.substring(start, end) === text) {
      const POPUP_HEIGHT = 120; // Estimated height
      const POPUP_WIDTH = 320; // w-80
      const BUFFER = 8;

      let top: number, left: number, placement: 'above' | 'below';

      if (window.innerHeight - rect.bottom >= POPUP_HEIGHT + BUFFER) {
        placement = 'below';
        top = rect.bottom + BUFFER;
      } else {
        placement = 'above';
        top = rect.top - POPUP_HEIGHT - BUFFER;
      }

      left = rect.left + (rect.width / 2) - POPUP_WIDTH / 2;

      if (left < BUFFER) left = BUFFER;
      if (left + POPUP_WIDTH > window.innerWidth - BUFFER) {
        left = window.innerWidth - POPUP_WIDTH - BUFFER;
      }

      openPopup({ top, left, placement, text, start, end });
      setSelectionRange({ start, end });
    } else {
      closePopup();
    }
  };

  const handleTokenClick = async (token: TokenInfo) => {
    if (!tokenMapId || revertingToken) {
      return; // Prevent multiple simultaneous reverts
    }

    setRevertingToken(token.token);
    setError(null);

    try {
      console.log('Reverting token:', token.token);
      const response = await apiService.revertToken(tokenMapId, token.token);
      
      // Update the state with the new sanitized text and tokens
      setSanitizedText(response.sanitized_text);
      setTokens(response.tokens);
      
      console.log('Token reverted successfully');
    } catch (err: unknown) {
      console.error('Error reverting token:', err);
      setError(err instanceof Error ? err.message : 'Failed to revert token.');
    } finally {
      setRevertingToken(null);
    }
  };



  const handleDownloadSanitized = () => {
    if (sanitizedText && currentDocument) {
      downloadTextFile(sanitizedText, `sanitized_${currentDocument.filename}`);
    }
  };

  const handleCopySanitized = async () => {
    if (sanitizedText) {
      try {
        await navigator.clipboard.writeText(sanitizedText);
        setSuccessMessage('Sanitized text copied to clipboard!');
      } catch (err) {
        setError('Failed to copy text to clipboard.');
      }
    }
  };

  const handleEnlargeOriginal = () => {
    setEnlargedPanel(enlargedPanel === 'original' ? null : 'original');
  };

  const handleEnlargeSanitized = () => {
    setEnlargedPanel(enlargedPanel === 'sanitized' ? null : 'sanitized');
  };

  const highlightedOriginalText = currentDocument ? highlightTokens(currentDocument.text, tokens, selectionRange) : [];
  const highlightedSanitizedText = highlightTokens(sanitizedText, sanitizedPlaceholderTokens);

  // Synchronized scrolling handler
  const handleScroll = (source: 'original' | 'sanitized') => {
    if (isScrollingRef.current) {
      return;
    }

    isScrollingRef.current = true;

    const sourceRef = source === 'original' ? originalTextRef : sanitizedTextRef;
    const targetRef = source === 'original' ? sanitizedTextRef : originalTextRef;

    if (sourceRef.current && targetRef.current) {
      const sourceElement = sourceRef.current;
      const targetElement = targetRef.current;

      // Calculate scroll percentage
      const scrollPercentage = sourceElement.scrollTop / (sourceElement.scrollHeight - sourceElement.clientHeight);

      // Apply to target
      targetElement.scrollTop = scrollPercentage * (targetElement.scrollHeight - targetElement.clientHeight);
    }

    // Reset flag after a short delay to allow scroll event to complete
    setTimeout(() => {
      isScrollingRef.current = false;
    }, 50);
  };

    return (
      <>
        {successMessage && (
          <Toast message={successMessage} onClose={() => setSuccessMessage(null)} />
        )}
      <div className="flex flex-col gap-6 p-6 animate-fade-in relative h-[calc(100vh-12rem)]">
        <div className="flex flex-row w-full h-full">
          <div className="flex flex-row gap-6 h-full items-start flex-grow">
                      <div className="flex flex-row gap-6 h-full items-start flex-grow">
            <div className={`h-full ${isSidebarOpen ? 'w-3/4' : 'w-full'} transition-all duration-300 ease-in-out`}>
              <div className="flex flex-col md:flex-row gap-6 h-full">
                {/* Original Document Card for Manual Selection */}
                <Card className={`p-6 relative flex flex-col h-full transition-all duration-300 ease-in-out ${
                  enlargedPanel === 'sanitized' ? 'w-16' : enlargedPanel === 'original' ? 'flex-1' : 'flex-1'
                }`}>
                  {enlargedPanel === 'sanitized' ? (
                    <div className="flex flex-col items-center h-full w-full pt-4">
                      <Tooltip content="Restore Original Document">
                        <Button
                          onClick={handleEnlargeOriginal}
                          variant="secondary"
                          className="!p-3 mb-4"
                        >
                          <Maximize size={20} />
                        </Button>
                      </Tooltip>
                      <span className="text-gray-600 font-bold text-lg writing-mode-vertical-lr rotate-180">Original Document</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800">Original Document</h2>
                        <div className="flex gap-2">
                          <Tooltip content={enlargedPanel === 'original' ? 'Restore View' : 'Enlarge Original Document'}>
                            <Button
                              onClick={handleEnlargeOriginal}
                              variant="secondary"
                              className="!p-3"
                            >
                              <Maximize size={20} />
                            </Button>
                          </Tooltip>
                          <Button onClick={handleSanitize} loading={isLoading} disabled={!currentDocument || isLoading || sanitizedText !== ''}>
                            {isLoading ? 'Sanitizing...' : (
                              <span className="flex items-center justify-center">
                                <BrushCleaning size={20} className="mr-2" />
                                Sanitize
                              </span>
                            )}
                          </Button>
                        </div>
                      </div>
                      <div
                        ref={originalTextRef}
                        className="glass-panel p-4 rounded-lg flex-1 overflow-auto text-gray-700 whitespace-pre-wrap cursor-text"
                        onMouseUp={handleTextSelection}
                        onScroll={() => handleScroll('original')}
                      >
                        {highlightedOriginalText.map((segment, index) => (
                          <span key={index} className={segment.isSelection ? 'selection-highlight' : segment.isToken ? 'token-highlight' : ''}>
                            {segment.text}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </Card>

                {/* Sanitized Document Card */}
                {sanitizedText ? (
                <Card className={`p-6 flex flex-col h-full transition-all duration-300 ease-in-out ${
                  enlargedPanel === 'original' ? 'w-16' : enlargedPanel === 'sanitized' ? 'flex-1' : 'flex-1'
                }`}>
                  {enlargedPanel === 'original' ? (
                    <div className="flex flex-col items-center h-full w-full pt-4">
                      <Tooltip content="Restore Sanitized Document">
                        <Button
                          onClick={handleEnlargeSanitized}
                          variant="secondary"
                          className="!p-3 mb-4"
                        >
                          <Maximize size={20} />
                        </Button>
                      </Tooltip>
                      <span className="text-gray-600 font-bold text-lg writing-mode-vertical-lr rotate-180">Sanitized Document</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800">Sanitized Document</h2>
                        <div className="flex gap-2">
                          <Tooltip content={enlargedPanel === 'sanitized' ? 'Restore View' : 'Enlarge Sanitized Document'}>
                            <Button
                              onClick={handleEnlargeSanitized}
                              variant="secondary"
                              className="!p-3"
                            >
                              <Maximize size={20} />
                            </Button>
                          </Tooltip>
                          <Tooltip content="Copy Sanitized Text">
                            <Button
                              onClick={handleCopySanitized}
                              disabled={!sanitizedText}
                              variant="secondary"
                              className="!p-3"
                            >
                              <Copy size={20} />
                            </Button>
                          </Tooltip>
                          <Tooltip content="Download Sanitized File">
                            <Button
                              onClick={handleDownloadSanitized}
                              disabled={!sanitizedText}
                              variant="secondary"
                              className="!p-3"
                            >
                              <Download size={20} />
                            </Button>
                          </Tooltip>
                          <Tooltip content="Proceed to Detokenization">
                            <Button
                              onClick={() => setCurrentStep(3)}
                              disabled={!sanitizedText}
                              className="!p-3"
                            >
                              <ArrowRight size={20} />
                            </Button>
                          </Tooltip>
                        </div>
                      </div>
                      <div
                        ref={sanitizedTextRef}
                        className="glass-panel p-4 rounded-lg flex-1 overflow-auto text-gray-700 whitespace-pre-wrap"
                        onScroll={() => handleScroll('sanitized')}
                      >
                        {highlightedSanitizedText.map((segment, index) => (
                          <TokenHighlight key={index} segment={segment} onTokenClick={handleTokenClick} />
                        ))}
                      </div>
                    </>
                  )}
                </Card>
                ) : (
                  <Card className="flex-1 p-6 flex flex-col h-full items-center justify-center text-gray-500 text-lg">
                    <BrushCleaning size={48} className="mb-4" />
                    <p>Sanitize the document to see the redacted version here.</p>
                  </Card>
                )}
              </div>
            </div>
            {sanitizedText && (
            <TokenSidebar
              isOpen={isSidebarOpen}
              onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
              tokens={tokens}
              onTokenClick={handleTokenClick}
              revertingToken={revertingToken}
              className={`flex-shrink-0 ${isSidebarOpen ? 'w-1/4' : 'w-16'}`}
            />
            )}
          </div>
          </div>
        </div>

      </div>
      </>
    );
  };
