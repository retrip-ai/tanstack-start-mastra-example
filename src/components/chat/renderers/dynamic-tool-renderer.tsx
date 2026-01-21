import { memo } from 'react';
import { MessageResponse } from '@/components/ai-elements/message';
import { Source, Sources, SourcesContent, SourcesTrigger } from '@/components/ai-elements/sources';
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from '@/components/ai-elements/tool';
import { isWeatherData, WeatherCard } from '@/components/ai-elements/weather-card';
import type { DynamicToolPart, MessageRenderer, RendererProps, SourceData } from './types';
import { isDynamicToolPart } from './types';

/**
 * Dynamic Tool Renderer Component
 * Renders network execution results from memory with child messages
 */
const DynamicToolRendererComponent = memo<RendererProps<DynamicToolPart>>(({ part, partIndex }) => {
    return (
        <div className="space-y-2" key={partIndex}>
            {part.output?.childMessages?.map((child, childIndex) => {
                if (child.type === 'tool') {
                    // Special handling for web-search tool - show Sources component instead of Tool
                    if (child.toolName === 'web-search' && child.toolOutput) {
                        const webSearchOutput = child.toolOutput as {
                            text?: string;
                            sources?: SourceData[];
                        };

                        if (webSearchOutput.sources && webSearchOutput.sources.length > 0) {
                            return (
                                <Sources key={childIndex}>
                                    <SourcesTrigger count={webSearchOutput.sources.length} />
                                    <SourcesContent>
                                        {webSearchOutput.sources.map((source, i) => (
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
                            );
                        }
                        return null;
                    }

                    // Special handling for weather tool - show WeatherCard component
                    if (child.toolName === 'weatherTool' && child.toolOutput) {
                        if (isWeatherData(child.toolOutput)) {
                            return <WeatherCard data={child.toolOutput} key={childIndex} />;
                        }
                    }

                    // Default tool rendering for other tools
                    return (
                        <Tool key={childIndex}>
                            <ToolHeader
                                state="output-available"
                                title={child.toolName || 'Tool'}
                                type={`tool-${child.toolName}`}
                            />
                            <ToolContent>
                                {child.args && <ToolInput input={child.args} />}
                                {child.toolOutput && <ToolOutput errorText={undefined} output={child.toolOutput} />}
                            </ToolContent>
                        </Tool>
                    );
                }

                if (child.type === 'text' && child.content) {
                    return <MessageResponse key={childIndex}>{child.content}</MessageResponse>;
                }

                return null;
            })}
        </div>
    );
});

DynamicToolRendererComponent.displayName = 'DynamicToolRenderer';

/**
 * Dynamic Tool Renderer definition for the registry
 */
export const dynamicToolRenderer: MessageRenderer<DynamicToolPart> = {
    type: 'dynamic-tool',
    canRender: isDynamicToolPart,
    Component: DynamicToolRendererComponent as unknown as React.FC<RendererProps>,
    priority: 8,
};
