import React from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { TokenInfo } from '../../types';
import { ChevronLeft, ChevronRight } from 'lucide-react'; // Import icons

interface TokenSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  tokens: TokenInfo[];
  onTokenClick: (token: TokenInfo) => void;
  revertingToken: string | null;
  className?: string;
}

export const TokenSidebar: React.FC<TokenSidebarProps> = ({
  isOpen,
  onToggle,
  tokens,
  onTokenClick,
  revertingToken,
  className,
}) => {
  // Group tokens by token name and count occurrences
  const uniqueTokens = React.useMemo(() => {
    const tokenMap = new Map<string, { tokenInfo: TokenInfo; count: number }>();
    
    tokens.forEach((token) => {
      const existing = tokenMap.get(token.token);
      if (existing) {
        existing.count += 1;
      } else {
        tokenMap.set(token.token, { tokenInfo: token, count: 1 });
      }
    });
    
    return Array.from(tokenMap.values());
  }, [tokens]);

  return (
    <div
      className={`glass-card shadow-lg transition-all duration-300 ease-in-out overflow-hidden rounded-l-lg h-full relative ${className}`}
    >
      <Card className="h-full flex flex-col p-4 rounded-l-lg bg-white/80 max-h-full">
        {isOpen ? (
          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-4"> {/* Adjusted mb-4 for alignment */}
              <h2 className="text-xl font-bold text-gray-800">Detected Tokens ({uniqueTokens.length})</h2> {/* Removed mt-2 */}
              <Button onClick={onToggle} small variant="secondary" className="!p-2">
                <ChevronRight size={20} />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-start h-full w-full pt-4"> {/* Adjusted justify-start and pt-4 */}
            <Button onClick={onToggle} small variant="secondary" className="!p-2 mb-4"> {/* Button at the top */}
              <ChevronLeft size={20} />
            </Button>
            <span className="text-gray-600 font-bold text-lg writing-mode-vertical-lr rotate-180">Detected Tokens ({uniqueTokens.length})</span>
            <div className="flex-grow"></div> {/* Spacer to push content up */}
          </div>
        )}
        <div className="flex-grow overflow-auto pr-2">
          {isOpen && uniqueTokens.length === 0 ? (
            <p className="text-gray-600">No tokens detected.</p>
          ) : (
            isOpen && (
              <ul className="space-y-2">
                {uniqueTokens.map(({ tokenInfo, count }, index) => {
                  const isReverting = revertingToken === tokenInfo.token;
                  const isAnyReverting = revertingToken !== null;
                  
                  return (
                    <li key={index} className="flex justify-between items-center glass-panel p-3 rounded-lg">
                      <div className="text-sm">
                        <p className="text-gray-800 font-medium">
                          {tokenInfo.token} 
                          {count > 1 && (
                            <span className="ml-1.5 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded">×{count}</span>
                          )}
                          <span className="text-gray-500 text-xs font-normal ml-1">({(tokenInfo.score * 100).toFixed(1)}%)</span>
                        </p>
                        <p className="text-gray-600 text-xs italic">"{tokenInfo.originalValue}"</p>
                        <p className="text-gray-600 text-xs">{tokenInfo.entityType}</p>
                      </div>
                      <Button 
                        small 
                        onClick={() => onTokenClick(tokenInfo)} 
                        disabled={isAnyReverting}
                        loading={isReverting}
                      >
                        {isReverting ? 'Reverting...' : 'Revert'}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )
          )}
        </div>
      </Card>
    </div>
  );
};
