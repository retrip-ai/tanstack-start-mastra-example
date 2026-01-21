import type { ToolUIPart } from 'ai';
import { memo } from 'react';
import { Source, Sources, SourcesContent, SourcesTrigger } from '@/components/ai-elements/sources';
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from '@/components/ai-elements/tool';
import type { MessageRenderer, RendererProps, SourceData, ToolPart } from './types';
import { isToolPart } from './types';

/**
 * Tool Renderer Component
 * Renders tool execution UI with special handling for web-search
 */
const ToolRendererComponent = memo<RendererProps<ToolPart>>(({ part, partIndex }) => {
    // Cast to ToolUIPart for full type access
    const toolPart = part as unknown as ToolUIPart;

    // Special handling for web-search tool to render ONLY sources
    if (toolPart.type === 'tool-web-search' && toolPart.output) {
        const output = toolPart.output as {
            text?: string;
            sources?: SourceData[];
        };

        // Only render sources, NOT the text (which has citations [1], [2])
        // The text is internal context, the agent response comes later
        return (
            <div className="space-y-2" key={partIndex}>
                {output.sources && output.sources.length > 0 && (
                    <Sources>
                        <SourcesTrigger count={output.sources.length} />
                        <SourcesContent>
                            {output.sources.map((source, i) => (
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

    // Default tool rendering for other tools
    return (
        <Tool key={partIndex}>
            <ToolHeader state={toolPart.state} title={toolPart.type.replace('tool-', '')} type={toolPart.type} />
            <ToolContent>
                {toolPart.input !== undefined && toolPart.input !== null && (
                    <ToolInput input={toolPart.input} />
                )}
                {(toolPart.output || toolPart.errorText) && (
                    <ToolOutput errorText={toolPart.errorText} output={toolPart.output} />
                )}
            </ToolContent>
        </Tool>
    );
});

ToolRendererComponent.displayName = 'ToolRenderer';

/**
 * Tool Renderer definition for the registry
 * Note: Uses 'tool' as type but canRender matches all 'tool-*' types
 */
export const toolRenderer: MessageRenderer<ToolPart> = {
    type: 'tool',
    canRender: isToolPart,
    Component: ToolRendererComponent as unknown as React.FC<RendererProps>,
    priority: 5,
};
