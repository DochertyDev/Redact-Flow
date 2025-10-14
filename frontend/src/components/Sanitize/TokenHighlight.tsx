import React from 'react';
import { TokenInfo } from '../../types';
import { Tooltip } from '../common/Tooltip';

interface HighlightedSegment {
  text: string;
  isToken: boolean;
  tokenInfo?: TokenInfo;
}

interface TokenHighlightProps {
  segment: HighlightedSegment;
  onTokenClick?: (token: TokenInfo) => void;
}

const getTokenTypeColor = (entityType: string) => {
  switch (entityType) {
    case 'PERSON': return 'bg-blue-400/30 border-blue-500 text-blue-900 hover:border-blue-600';
    case 'EMAIL_ADDRESS': return 'bg-green-400/30 border-green-500 text-green-900 hover:border-green-600';
    case 'PHONE_NUMBER': return 'bg-purple-400/30 border-purple-500 text-purple-900 hover:border-purple-600';
    case 'DATE_TIME': return 'bg-yellow-400/30 border-yellow-500 text-yellow-900 hover:border-yellow-600';
    case 'LOCATION': return 'bg-red-400/30 border-red-500 text-red-900 hover:border-red-600';
    case 'CREDIT_CARD': return 'bg-indigo-400/30 border-indigo-500 text-indigo-900 hover:border-indigo-600';
    case 'US_SSN': return 'bg-pink-400/30 border-pink-500 text-pink-900 hover:border-pink-600';
    default: return 'bg-green-400/30 border-green-500 text-green-900 hover:border-green-600';
  }
};

export const TokenHighlight: React.FC<TokenHighlightProps> = ({
  segment,
  onTokenClick,
}) => {
  if (!segment.isToken || !segment.tokenInfo) {
    return <>{segment.text}</>;
  }

  const { entityType, score, originalValue } = segment.tokenInfo;
  const colorClass = getTokenTypeColor(entityType);

  const tooltipContent = (
    <div className="text-xs">
      <p><strong>Original Value:</strong> {originalValue}</p>
      <p><strong>Type:</strong> {entityType}</p>
      <p><strong>Score:</strong> {(score * 100).toFixed(1)}%</p>
    </div>
  );

  return (
    <Tooltip content={tooltipContent}>
      <span
        onClick={() => onTokenClick && onTokenClick(segment.tokenInfo!)}
        className={`relative rounded-md px-1 py-0.5 border transition-all duration-200 cursor-pointer
          ${colorClass}
        `}
      >
        {segment.text}
      </span>
    </Tooltip>
  );
};
