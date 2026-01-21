import { useMemo } from 'react';
import type { NetworkDataPart } from '@mastra/ai-sdk';
import type { SourceData } from '@/components/chat/renderers/types';

interface NetworkDataResult {
    /** Reasoning/thinking text from the network steps */
    reasoning: string | null;
    /** Sources extracted from web-search step */
    sources: SourceData[] | null;
    /** Whether network has completed output */
    hasOutput: boolean;
    /** The final output text */
    output: string | null;
}

/**
 * Hook to extract structured data from network execution parts.
 * Parses reasoning, sources, and output from agent network data.
 * 
 * @param networkData - Network execution data from data-network part
 * @returns Structured network data including reasoning, sources, and output
 * 
 * @example
 * ```tsx
 * const { reasoning, sources, hasOutput, output } = useNetworkData(part.data);
 * 
 * if (reasoning) {
 *   return <Reasoning text={reasoning} />;
 * }
 * ```
 */
export function useNetworkData(
    networkData: NetworkDataPart['data'] | undefined
): NetworkDataResult {
    return useMemo(() => {
        if (!networkData) {
            return {
                reasoning: null,
                sources: null,
                hasOutput: false,
                output: null,
            };
        }

        // Extract reasoning from steps
        const stepWithTask = networkData.steps?.find(
            (s) => (s as { task?: { reason?: string } }).task?.reason
        ) as { task: { reason: string } } | undefined;
        const reasoning = stepWithTask?.task?.reason || null;

        // Extract sources from web-search step
        const webSearchStep = networkData.steps?.find(
            (step) => step.name === 'web-search' && step.output
        );
        let sources: SourceData[] | null = null;
        if (webSearchStep?.output) {
            const output = webSearchStep.output as { sources?: SourceData[] };
            sources = output.sources && output.sources.length > 0 ? output.sources : null;
        }

        // Check for output
        const hasOutput = networkData.output !== undefined && networkData.output !== null;
        const output = hasOutput ? String(networkData.output) : null;

        return {
            reasoning,
            sources,
            hasOutput,
            output,
        };
    }, [networkData]);
}

/**
 * Hook to detect if text is duplicate reasoning from network data.
 * Used to avoid showing the same reasoning twice.
 * 
 * @param text - Text to check
 * @param networkReasoning - Reasoning from network data
 * @param isStreaming - Whether the message is currently streaming
 * @param isLastMessage - Whether this is the last message
 */
export function useIsDuplicateReasoning(
    text: string,
    networkReasoning: string | null,
    isStreaming: boolean,
    isLastMessage: boolean
): boolean {
    return useMemo(() => {
        if (!isStreaming || !isLastMessage) return false;
        return networkReasoning !== null && text === networkReasoning;
    }, [text, networkReasoning, isStreaming, isLastMessage]);
}
