import React, { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { FileText, UploadCloud, XCircle, Download, WandSparkles, Type, Upload, Copy } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Tooltip } from '../common/Tooltip';
import { readTextFile, downloadTextFile } from '../../utils/fileReader';
import { apiService } from '../../services/api';
import { MAX_FILE_SIZE_BYTES } from '../../constants';

// interface DetokenizationViewProps {
//   // onProceed: () => void; // No longer needed
// }

export const DetokenizationView: React.FC = () => {
  const { tokenMapId, detokenizedText, llmOutput, isLoading, setLoading, setLlmOutput, setDetokenizedText, setError, currentDocument, goToNextStep } = useAppStore();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState<string>('');
  const [errorFile, setErrorFile] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload');
  const MAX_CHAR_LIMIT = 3000000;

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    setErrorFile(null);

    if (fileRejections.length > 0) {
      const firstRejection = fileRejections[0];
      const firstError = firstRejection.errors[0];
      if (firstError.code === 'file-too-large') {
        setErrorFile('File exceeds the 5 MB size limit.');
      } else {
        setErrorFile(firstError.message);
      }
      return;
    }

    if (acceptedFiles.length === 0) {
      setErrorFile('Please upload a .txt file.');
      return;
    }

    const file = acceptedFiles[0];
    if (file.type !== 'text/plain') {
      setErrorFile('Only .txt files are supported.');
      return;
    }

    // Clear pasted text when a file is uploaded
    setPastedText('');
    setSelectedFile(file);
    try {
      const content = await readTextFile(file);
      setFileContent(content);
      setLlmOutput(content);
    } catch (e: unknown) {
      setErrorFile(`Failed to read file: ${e instanceof Error ? e.message : 'An unknown error occurred'}`);
      setSelectedFile(null);
      setFileContent(null);
    }
  }, [setLlmOutput]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE_BYTES,
  });

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileContent(null);
    setErrorFile(null);
    setLlmOutput('');
  };

  const handlePastedTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length > MAX_CHAR_LIMIT) {
      setErrorFile(`Text exceeds maximum limit of ${MAX_CHAR_LIMIT.toLocaleString()} characters.`);
      return;
    }
    setErrorFile(null);
    
    // Clear file when text is pasted
    if (text.trim() && selectedFile) {
      setSelectedFile(null);
      setFileContent(null);
    }
    
    setPastedText(text);
    setLlmOutput(text);
  };

  const handleClearPastedText = () => {
    setPastedText('');
    setErrorFile(null);
    setLlmOutput('');
  };

  const toggleInputMode = () => {
    setInputMode(inputMode === 'upload' ? 'paste' : 'upload');
    setErrorFile(null);
  };

  const handleDetokenize = async () => {
    if (!llmOutput || !tokenMapId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await apiService.detokenize(tokenMapId, llmOutput);
      setDetokenizedText(response.detokenized_text);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to detokenize document.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDetokenized = () => {
    if (detokenizedText && currentDocument) {
      downloadTextFile(detokenizedText, `detokenized_${currentDocument.filename}`);
      goToNextStep(); // Automatically move to download step
    }
  };

  const handleCopyDetokenized = async () => {
    if (detokenizedText) {
      try {
        await navigator.clipboard.writeText(detokenizedText);
        goToNextStep(); // Automatically move to download step
      } catch (err) {
        setError('Failed to copy text to clipboard.');
      }
    }
  };

  return (
    <div className="animate-fade-in h-full">
      <div className="flex flex-col md:flex-row gap-6 px-6">
      <Card className="flex-1 p-6 flex flex-col min-h-[450px]">
        
        <div className="flex justify-center mb-4">
          <Button onClick={toggleInputMode} variant="secondary" small>
            {inputMode === 'upload' ? (
              <>
                <Type className="mr-2" size={18} />
                Switch to Paste Text
              </>
            ) : (
              <>
                <Upload className="mr-2" size={18} />
                Switch to File Upload
              </>
            )}
          </Button>
        </div>

        {inputMode === 'upload' ? (
          /* File Upload Section */
          <div className="flex flex-col mb-4">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 cursor-pointer transition-all duration-300
                ${isDragActive ? 'border-primary bg-primary bg-opacity-5 shadow-lg' : 'border-gray-300 hover:border-primary hover:bg-white hover:bg-opacity-30'}
              `}
            >
              <input {...getInputProps()} />
              <UploadCloud className="mx-auto text-gray-500 mb-2" size={32} />
              <p className="text-gray-600 text-sm text-center">
                {isDragActive ? 'Drop the file here ...' : 'Upload LLM output (.txt)'}
              </p>
            </div>

            {selectedFile && fileContent && (
              <div className="mt-4 p-3 glass-panel rounded-lg flex items-center justify-between animate-fade-in">
                <div className="flex items-center space-x-3">
                  <FileText className="text-primary" size={20} />
                  <p className="text-gray-800 font-medium text-sm">{selectedFile.name}</p>
                </div>
                <Button variant="danger" onClick={handleRemoveFile} small>
                  Remove
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* Paste Text Section */
          <div className="flex flex-col mb-4">
            <textarea
              value={pastedText}
              onChange={handlePastedTextChange}
              placeholder="Paste LLM output here..."
              className="glass-panel p-4 rounded-lg resize-none text-gray-700 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary transition-all h-36"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">
                {pastedText.length.toLocaleString()} / {MAX_CHAR_LIMIT.toLocaleString()}
              </span>
              {pastedText && (
                <Button variant="danger" onClick={handleClearPastedText} small>
                  Clear
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col flex-grow">
          {errorFile && (
            <div className="mb-2 text-red-600 flex items-center justify-center space-x-2 animate-fade-in">
              <XCircle size={20} />
              <span>{errorFile}</span>
            </div>
          )}
          <div className="glass-panel p-4 rounded-lg overflow-auto text-gray-700 whitespace-pre-wrap h-48">
            {llmOutput || 'Upload or paste LLM output to see content here...'}
          </div>
        </div>
      </Card>

      <Card className="flex-1 p-6 flex flex-col min-h-[450px]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Detokenized Document Preview</h2>
          <div className="flex items-center gap-2">
            <Button onClick={handleDetokenize} loading={isLoading} disabled={!llmOutput || !tokenMapId || isLoading}>
              {isLoading ? (
              'Detokenizing...'
            ) : (
              <>
                <WandSparkles className="mr-2 h-4 w-4" />
                Detokenize
              </>
            )}
            </Button>
            <Tooltip content="Copy Detokenized Text">
              <Button onClick={handleCopyDetokenized} disabled={!detokenizedText || !currentDocument} className="!p-3">
                <Copy size={20} />
              </Button>
            </Tooltip>
            <Tooltip content="Download Detokenized File">
              <Button onClick={handleDownloadDetokenized} disabled={!detokenizedText || !currentDocument} className="!p-3">
                <Download size={20} />
              </Button>
            </Tooltip>
          </div>
        </div>
                <div className="glass-panel p-4 rounded-lg overflow-auto text-gray-700 whitespace-pre-wrap h-96">
                  {detokenizedText || 'Detokenized content will appear here after processing.'}
                </div>
              </Card>
            </div>
          </div>
          );
        };
