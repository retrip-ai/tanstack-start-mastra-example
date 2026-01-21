import { useMemo } from 'react';
import type { SourceData } from '@/components/chat/renderers/types';

interface CitationMatch {
    index: number;
    number: number;
    source: SourceData | null;
}

interface TextWithCitationsResult {
    /** Whether the text contains citation markers like [1], [2] */
    hasCitations: boolean;
    /** Array of text segments split by citation markers */
    segments: string[];
    /** Parsed citations with their corresponding sources */
    citations: CitationMatch[];
}

/**
 * Hook to parse text containing citation markers [1], [2], etc.
 * and map them to corresponding sources.
 * 
 * @param text - Text that may contain citation markers
 * @param sources - Available sources to map citations to
 * @returns Parsed text segments and citation data
 * 
 * @example
 * ```tsx
 * const { hasCitations, segments, citations } = useTextWithCitations(text, sources);
 * 
 * if (hasCitations) {
 *   return segments.map((segment, i) => {
 *     const citation = citations.find(c => c.index === i);
 *     if (citation?.source) {
 *       return <Citation key={i} source={citation.source} />;
 *     }
 *     return <span key={i}>{segment}</span>;
 *   });
 * }
 * ```
 */
export function useTextWithCitations(
    text: string,
    sources: SourceData[] | null
): TextWithCitationsResult {
    return useMemo(() => {
        const hasCitations = /\[\d+\]/.test(text);

        if (!hasCitations || !sources || sources.length === 0) {
            return {
                hasCitations: false,
                segments: [text],
                citations: [],
            };
        }

        const segments = text.split(/(\[\d+\])/);
        const citations: CitationMatch[] = [];

        segments.forEach((segment, index) => {
            const match = segment.match(/\[(\d+)\]/);
            if (match) {
                const citationNumber = Number.parseInt(match[1], 10) - 1;
                citations.push({
                    index,
                    number: citationNumber + 1,
                    source: sources[citationNumber] || null,
                });
            }
        });

        return {
            hasCitations: true,
            segments,
            citations,
        };
    }, [text, sources]);
}

/**
 * Simpler hook variant that just checks for citations
 */
export function useHasCitations(text: string): boolean {
    return useMemo(() => /\[\d+\]/.test(text), [text]);
}
