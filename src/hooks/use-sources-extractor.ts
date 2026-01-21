import { useMemo } from 'react';
import type { GenericPart, SourceData } from '@/components/chat/renderers/types';

/**
 * Hook to extract sources from message parts.
 * Supports multiple source formats:
 * - Mastra "source-url" type (when sendSources: true)
 * - AI SDK "source" type
 * 
 * @param allParts - All parts from the current message
 * @returns Array of sources or null if none found
 * 
 * @example
 * ```tsx
 * const sources = useSourcesExtractor(allParts);
 * if (sources) {
 *   return <Sources count={sources.length} />;
 * }
 * ```
 */
export function useSourcesExtractor(allParts: GenericPart[]): SourceData[] | null {
    return useMemo(() => {
        const sources: SourceData[] = [];

        for (const p of allParts) {
            // Mastra sends sources as "source-url" type when sendSources: true
            if (p.type === 'source-url') {
                const url = p.url as string | undefined;
                if (url) {
                    sources.push({
                        url,
                        title: (p.title as string) || undefined,
                        description: (p.description as string) || undefined,
                        lastUpdated: (p.lastUpdated as string) || undefined,
                    });
                }
            }

            // AI SDK sends sources as parts with type "source"
            if (p.type === 'source') {
                const sourceData = (p.source as SourceData) || p;
                if (sourceData?.url) {
                    sources.push({
                        url: sourceData.url,
                        title: sourceData.title || undefined,
                        description: sourceData.description || undefined,
                        lastUpdated: sourceData.lastUpdated || undefined,
                    });
                }
            }
        }

        return sources.length > 0 ? sources : null;
    }, [allParts]);
}

/**
 * Hook to extract sources from network data (agent network web-search tool)
 * 
 * @param networkData - Network execution data
 * @returns Array of sources or null if none found
 */
export function useNetworkSources(
    networkData: { steps?: Array<{ name?: string; output?: unknown }> } | undefined
): SourceData[] | null {
    return useMemo(() => {
        if (!networkData?.steps) return null;

        const webSearchStep = networkData.steps.find(
            (step) => step.name === 'web-search' && step.output
        );

        if (!webSearchStep?.output) return null;

        const output = webSearchStep.output as {
            sources?: SourceData[];
        };

        return output.sources && output.sources.length > 0 ? output.sources : null;
    }, [networkData]);
}
