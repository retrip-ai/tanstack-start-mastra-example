import { memo, useMemo } from 'react';
import { MessageResponse } from '@/components/ai-elements/message';
import { NetworkExecution } from '@/components/ai-elements/network-execution';
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/components/ai-elements/reasoning';
import { Source, Sources, SourcesContent, SourcesTrigger } from '@/components/ai-elements/sources';
import { isWeatherData, WeatherCard } from '@/components/ai-elements/weather-card';
import { useNetworkData } from '@/hooks/use-network-data';
import type { MessageRenderer, NetworkPart, RendererProps } from './types';
import { isNetworkPart } from './types';

/**
 * Extract weather data from network steps' toolResults
 */
function extractWeatherFromNetwork(networkData: NetworkPart['data']) {
    if (!networkData?.steps) return null;

    for (const step of networkData.steps) {
        const task = step as { task?: { toolResults?: Array<{ toolName?: string; result?: unknown }> } };
        const toolResults = task.task?.toolResults;
        if (!toolResults) continue;

        for (const result of toolResults) {
            if (result.toolName === 'weatherTool' && result.result && isWeatherData(result.result)) {
                return result.result;
            }
        }
    }
    return null;
}

/**
 * Network Renderer Component
 * Renders agent network execution with reasoning, sources, and fallback output
 * Uses useNetworkData hook for data extraction
 */
const NetworkRendererComponent = memo<RendererProps<NetworkPart>>(
    ({ part, partIndex, isLastMessage, status, hasTextPart }) => {
        const networkData = part.data;
        const isStreaming = status === 'streaming';

        // Use hook for structured data extraction
        const { reasoning, sources, hasOutput, output } = useNetworkData(networkData);

        // Extract weather data from network steps
        const weatherData = useMemo(() => extractWeatherFromNetwork(networkData), [networkData]);

        // Apply fallback only when:
        // 1. No text part in the message
        // 2. Stream finished (status === 'ready')
        // 3. Is the last message
        // 4. Network data has output
        const shouldShowFallback = !hasTextPart && status === 'ready' && isLastMessage && hasOutput;

        if (shouldShowFallback) {
            return (
                <div className="space-y-2" key={partIndex}>
                    {/* Show reasoning if exists */}
                    {reasoning && (
                        <Reasoning isStreaming={false}>
                            <ReasoningTrigger />
                            <ReasoningContent>{reasoning}</ReasoningContent>
                        </Reasoning>
                    )}
                    {/* Weather Card (rendered outside NetworkExecution) */}
                    {weatherData && <WeatherCard data={weatherData} />}
                    {/* NetworkExecution for technical details */}
                    <NetworkExecution data={networkData} isStreaming={false} />
                    {/* Show sources if they exist */}
                    {sources && sources.length > 0 && (
                        <Sources>
                            <SourcesTrigger count={sources.length} />
                            <SourcesContent>
                                {sources.map((source, i) => (
                                    <Source
                                        description={source.description}
                                        href={source.url}
                                        key={i}
                                        lastUpdated={source.lastUpdated}
                                        title={source.title}
                                    />
                                ))}
                            </SourcesContent>
                        </Sources>
                    )}
                    {/* Show response text at the end */}
                    {output && <MessageResponse>{output}</MessageResponse>}
                </div>
            );
        }

        return (
            <div className="space-y-2" key={partIndex}>
                {/* Show reasoning if exists */}
                {reasoning && (
                    <Reasoning isStreaming={isStreaming}>
                        <ReasoningTrigger />
                        <ReasoningContent>{reasoning}</ReasoningContent>
                    </Reasoning>
                )}
                {/* Weather Card (rendered outside NetworkExecution) */}
                {weatherData && <WeatherCard data={weatherData} />}
                {/* NetworkExecution for technical details */}
                <NetworkExecution data={networkData} isStreaming={isStreaming} />
                {/* Show sources if they exist */}
                {sources && sources.length > 0 && (
                    <Sources>
                        <SourcesTrigger count={sources.length} />
                        <SourcesContent>
                            {sources.map((source, i) => (
                                <Source
                                    description={source.description}
                                    href={source.url}
                                    key={i}
                                    lastUpdated={source.lastUpdated}
                                    title={source.title}
                                />
                            ))}
                        </SourcesContent>
                    </Sources>
                )}
            </div>
        );
    }
);

NetworkRendererComponent.displayName = 'NetworkRenderer';

/**
 * Network Renderer definition for the registry
 */
export const networkRenderer: MessageRenderer<NetworkPart> = {
    type: 'data-network',
    canRender: isNetworkPart,
    Component: NetworkRendererComponent as unknown as React.FC<RendererProps>,
    priority: 15,
};
