import React, { useState, useEffect } from 'react';
import { Info } from 'lucide-react';
import { useAppStore } from './store/useAppStore';
import { Header } from './components/Layout/Header';
import { StepNavigator } from './components/Layout/StepNavigator';
import { FileUpload } from './components/Upload/FileUpload';
import { ReviewPanel } from './components/Review/ReviewPanel';
import { DetokenizationView } from './components/Detokenize/DetokenizationView';
import { DownloadPanel } from './components/Download/DownloadPanel';
import { ManualTokenizationPopup } from './components/common/ManualTokenizationPopup';
import { Document } from './types';
import { apiService } from './services/api';

// Extend the Window interface to include the electron property from preload.js
declare global {
  interface Window {
    electron?: {
      onBackendPort: (callback: (port: number) => void) => void;
    };
  }
}

function App() {
  const { currentStep, setCurrentStep, setCurrentDocument, setError } = useAppStore();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  useEffect(() => {
    // This effect runs once when the app starts.
    // It listens for the backend port provided by the main Electron process.
    if (window.electron && window.electron.onBackendPort) {
      window.electron.onBackendPort((port) => {
        console.log(`Backend port received by renderer: ${port}`);
        const baseURL = `http://127.0.0.1:${port}/api`;
        apiService.setBaseURL(baseURL);
        console.log(`API base URL successfully set to: ${baseURL}`);
      });
    } else {
      console.warn('Electron context not found. Running in browser mode or preload script failed.');
    }
  }, []);

  const handleFileSelect = (doc: Document | null) => {
    setCurrentDocument(doc);
    setError(null); // Clear any previous errors
  };

  const handleProceedToSanitize = () => {
    setCurrentStep(2);
  };

  const stepContent: { [key: number]: { header: string; description: React.ReactNode; centered?: boolean } } = {
    1: {
      header: "Upload or Paste Document",
      description: <p className="text-gray-600">Upload a .txt file or paste your text directly to get started.</p>,
      centered: true,
    },
    2: {
      header: "Review & Sanitize",
      description: (
        <ol className="text-gray-600 space-y-2 list-none">
          <li><span className="font-bold">1.</span> Click `Sanitize` to tokenize detected PII and review results in both panels.</li>
          <li><span className="font-bold">2.</span> To manually tokenize missed items: highlight text in the left panel, enter an entity description, and press `Enter`.</li>
          <li><span className="font-bold">3.</span> Download the sanitized file, then continue with the green arrow.</li>
        </ol>
      ),
    },
    3: {
      header: "Detokenize & Download",
      description: (
        <ol className="text-gray-600 space-y-2 list-none">
          <li><span className="font-bold">1.</span> Upload the LLM output as a file or paste it directly.</li>
          <li><span className="font-bold">2.</span> Click `Detokenize` to restore original values and review the results.</li>
          <li><span className="font-bold">3.</span> Download the file.</li>
        </ol>
      ),
    },
    4: {
      header: "Great Work!",
      description: <p className="text-gray-600">That wasn't so bad... was it?</p>,
      centered: true,
    },
  };

  // handleProceedToDownload is no longer needed

  const renderStepComponent = () => {
    switch (currentStep) {
      case 1:
        return <FileUpload onFileSelect={handleFileSelect} onProceed={handleProceedToSanitize} />;
      case 2:
        return <ReviewPanel />;
      case 3:
        return <DetokenizationView />;
      case 4:
        return <DownloadPanel />;
      default:
        return <FileUpload onFileSelect={handleFileSelect} onProceed={handleProceedToSanitize} />;
    }
  };

  return (
    <div className="min-h-screen text-gray-800 font-sans">
      <Header />
      <StepNavigator />
      <main className="container mx-auto p-4 pt-24 pb-24">
        {stepContent[currentStep] && (
          <>
            <div className="flex items-center justify-center gap-2 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 text-center">{stepContent[currentStep].header}</h2>
              <button
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                className="text-green-500 hover:text-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 rounded"
                aria-label="Toggle description"
              >
                <Info size={24} />
              </button>
            </div>
            {isDescriptionExpanded && (
              <div className="max-w-prose mx-auto mb-8">
                <div className={`glass-card p-4 rounded-lg ${stepContent[currentStep].centered ? 'text-center' : 'text-left'}`}>
                  {stepContent[currentStep].description}
                </div>
              </div>
            )}
          </>
        )}
        {renderStepComponent()}
      </main>
      <ManualTokenizationPopup />
    </div>
  );
}

export default App;
