import React, { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { FileText, UploadCloud, XCircle, Type, Upload } from 'lucide-react';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { readTextFile } from '../../utils/fileReader';
import { Document } from '../../types';
import { MAX_FILE_SIZE_BYTES } from '../../constants';

interface FileUploadProps {
  onFileSelect: (document: Document | null) => void;
  onProceed: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  onProceed,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload');
  const MAX_CHAR_LIMIT = 3000000;

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    setError(null);

    if (fileRejections.length > 0) {
      const firstRejection = fileRejections[0];
      const firstError = firstRejection.errors[0];
      if (firstError.code === 'file-too-large') {
        setError('File exceeds the 5 MB size limit.');
      } else {
        setError(firstError.message);
      }
      return;
    }

    if (acceptedFiles.length === 0) {
      setError('Please upload a .txt file.');
      return;
    }

    const file = acceptedFiles[0];
    if (file.type !== 'text/plain') {
      setError('Only .txt files are supported.');
      return;
    }

    // Clear pasted text when a file is uploaded
    setPastedText('');
    setSelectedFile(file);
    try {
      const content = await readTextFile(file);
      setFileContent(content);
      onFileSelect({
        id: file.name, // Using filename as a simple ID for now
        filename: file.name,
        text: content,
        mimeType: file.type,
      });
    } catch (e: unknown) {
      setError(`Failed to read file: ${e instanceof Error ? e.message : 'An unknown error occurred'}`);
      setSelectedFile(null);
      setFileContent(null);
    }
  }, [onFileSelect]);

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
    setError(null);
    onFileSelect(null); // Reset document in store
  };

  const handlePastedTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length > MAX_CHAR_LIMIT) {
      setError(`Text exceeds maximum limit of ${MAX_CHAR_LIMIT.toLocaleString()} characters.`);
      return;
    }
    setError(null);
    
    // Clear file when text is pasted
    if (text.trim() && selectedFile) {
      setSelectedFile(null);
      setFileContent(null);
    }
    
    setPastedText(text);
    
    if (text.trim()) {
      onFileSelect({
        id: 'pasted_text',
        filename: 'original_text.txt',
        text: text,
        mimeType: 'text/plain',
      });
    } else {
      onFileSelect(null);
    }
  };

  const handleClearPastedText = () => {
    setPastedText('');
    setError(null);
    onFileSelect(null);
  };

  const toggleInputMode = () => {
    setInputMode(inputMode === 'upload' ? 'paste' : 'upload');
    setError(null);
  };

  return (
    <div className="animate-fade-in">
      <Card className="p-8 max-w-2xl mx-auto">
        <div className="flex justify-center mb-6">
          <Button onClick={toggleInputMode} variant="secondary">
            {inputMode === 'upload' ? (
              <>
                <Type className="mr-2" size={20} />
                Switch to Paste Text
              </>
            ) : (
              <>
                <Upload className="mr-2" size={20} />
                Switch to File Upload
              </>
            )}
          </Button>
        </div>

        {inputMode === 'upload' ? (
          /* File Upload Section */
          <div className="flex flex-col">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-10 cursor-pointer transition-all duration-300
                ${isDragActive ? 'border-primary bg-primary bg-opacity-5 shadow-lg' : 'border-gray-300 hover:border-primary hover:bg-white hover:bg-opacity-30'}
              `}
            >
              <input {...getInputProps()} />
              <UploadCloud className="mx-auto text-gray-500 mb-4" size={48} />
              <p className="text-gray-600 text-center">
                {isDragActive ? 'Drop the file here ...' : "Drag 'n' drop a .txt file here, or click to select one"}
              </p>
            </div>

            {selectedFile && fileContent && (
              <div className="mt-6 p-4 glass-panel rounded-lg flex items-center justify-between animate-fade-in">
                <div className="flex items-center space-x-3">
                  <FileText className="text-primary" size={24} />
                  <div>
                    <p className="text-gray-800 font-medium">{selectedFile.name}</p>
                    <p className="text-gray-600 text-sm">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
                <Button variant="danger" onClick={handleRemoveFile} small>
                  Remove
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* Paste Text Section */
          <div className="flex flex-col">
            <textarea
              value={pastedText}
              onChange={handlePastedTextChange}
              placeholder="Paste your text here..."
              className="glass-panel p-4 rounded-lg resize-none text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              style={{ minHeight: '300px' }}
            />
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-gray-600">
                {pastedText.length.toLocaleString()} / {MAX_CHAR_LIMIT.toLocaleString()} characters
              </span>
              {pastedText && (
                <Button variant="danger" onClick={handleClearPastedText} small>
                  Clear
                </Button>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 text-red-600 flex items-center justify-center space-x-2 animate-fade-in">
            <XCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <Button onClick={onProceed} disabled={(!selectedFile && !pastedText.trim()) || !!error}>
            Proceed to Sanitization
          </Button>
        </div>
    </Card>
    </div>
  );
};
