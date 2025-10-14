import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { CheckCircle, RotateCcw } from 'lucide-react';

export const DownloadPanel: React.FC = () => {
  const { resetState } = useAppStore();

  return (
    <Card className="p-8 max-w-2xl mx-auto mt-10 text-center animate-fade-in">
      <CheckCircle className="mx-auto text-success mb-6" size={64} />
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Process Complete!</h2>
      <p className="text-gray-600 mb-8">
        Your document has been successfully detokenized. You can now start over or close the application.
      </p>

      <div className="mt-8 flex justify-center">
        <Button variant="secondary" onClick={resetState}>
          <RotateCcw className="mr-2 h-5 w-5" />
          Start Over
        </Button>
      </div>
    </Card>
  );
};
