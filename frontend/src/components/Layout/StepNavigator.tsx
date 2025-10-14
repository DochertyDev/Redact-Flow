import React, { useEffect } from 'react';
import { CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../common/Button';
import { Tooltip } from '../common/Tooltip';

export const StepNavigator: React.FC = () => {
  const { currentStep, goToNextStep, goToPreviousStep, isForwardNavigationDisabled, setForwardNavigationDisabled } = useAppStore();

  useEffect(() => {
    if (currentStep === 3) {
      setForwardNavigationDisabled(true);
    } else {
      setForwardNavigationDisabled(false);
    }
  }, [currentStep, setForwardNavigationDisabled]);

  const steps = [
    { id: 1, name: 'Upload' },
    { id: 2, name: 'Sanitize' },
    { id: 3, name: 'Detokenize' },
  ];

  return (
        <nav className="w-full glass-card rounded-none p-4 mt-16 border-b border-white border-opacity-20 flex items-center">
          <div className="flex items-center justify-center gap-x-4 w-full"> {/* Added wrapper div with flex, items-center, justify-center, and gap-x-4 */}
            <Tooltip content="Previous Step">
              <Button onClick={goToPreviousStep} disabled={currentStep <= 1} small variant="secondary" className="!p-2">
                <ArrowLeft size={20} />
              </Button>
            </Tooltip>
    
            <ol className="flex justify-center space-x-4">
              {steps.map((step) => (
                <li key={step.id} className="flex items-center space-x-2">
                  {step.id < currentStep ? (
                    <CheckCircle className="text-success" size={20} />
                  ) : (
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ease-in-out
                        ${step.id === currentStep ? 'bg-primary text-white shadow-md shadow-primary/30' : 'bg-gray-300 bg-opacity-50 text-gray-600 backdrop-blur-sm'}
                      `}
                    >
                      {step.id}
                    </div>
                  )}
                  <span
                    className={`text-sm font-medium hidden md:block
                      ${step.id === currentStep ? 'text-gray-800' : 'text-gray-600'}
                    `}
                  >
                    {step.name}
                  </span>
                </li>
              ))}
            </ol>
    
            <Tooltip content="Next Step">
              <Button onClick={goToNextStep} disabled={currentStep >= 3 || isForwardNavigationDisabled} small variant="secondary" className="!p-2">
                <ArrowRight size={20} />
              </Button>
            </Tooltip>
          </div>
        </nav>
  );
};
