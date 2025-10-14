import { TokenInfo } from '../types';

export interface HighlightedSegment {
  text: string;
  isToken: boolean;
  isSelection?: boolean;
  tokenInfo?: TokenInfo;
}

export function highlightTokens(
  text: string, 
  tokens: TokenInfo[], 
  selectionRange: { start: number; end: number } | null = null
): HighlightedSegment[] {
  if (!text) return [];

  const points = new Set<number>();
  points.add(0);
  points.add(text.length);

  tokens.forEach(token => {
    points.add(token.start);
    points.add(token.end);
  });

  if (selectionRange) {
    points.add(selectionRange.start);
    points.add(selectionRange.end);
  }

  const sortedPoints = Array.from(points).sort((a, b) => a - b);

  const segments: HighlightedSegment[] = [];
  for (let i = 0; i < sortedPoints.length - 1; i++) {
    const start = sortedPoints[i];
    const end = sortedPoints[i + 1];

    if (start >= end) continue;

    const segmentText = text.substring(start, end);
    if (segmentText.length === 0) continue;

    const isToken = tokens.some(t => start >= t.start && end <= t.end);
    const isSelection = selectionRange ? (start >= selectionRange.start && end <= selectionRange.end) : false;

    segments.push({
      text: segmentText,
      isToken: isToken,
      tokenInfo: tokens.find(t => start >= t.start && end <= t.end),
      isSelection: isSelection,
    });
  }

  return segments;
}
