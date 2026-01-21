import { memo } from 'react';
import {
    InlineCitation,
    InlineCitationCard,
    InlineCitationCardBody,
    InlineCitationCardTrigger,
    InlineCitationCarousel,
    InlineCitationCarouselContent,
    InlineCitationCarouselHeader,
    InlineCitationCarouselIndex,
    InlineCitationCarouselItem,
    InlineCitationCarouselNext,
    InlineCitationCarouselPrev,
    InlineCitationSource,
} from '@/components/ai-elements/inline-citation';
import { MessageResponse } from '@/components/ai-elements/message';
import { Source, Sources, SourcesContent, SourcesTrigger } from '@/components/ai-elements/sources';
import { useSourcesExtractor } from '@/hooks/use-sources-extractor';
import { useTextWithCitations } from '@/hooks/use-text-with-citations';
import type { GenericPart, MessageRenderer, RendererProps, TextPart } from './types';
import { isTextPart } from './types';

/**
 * Check if text contains duplicate reasoning from network data
 */
function isDuplicateReasoning(
    text: string,
    allParts: GenericPart[],
    isStreaming: boolean,
    isLastMessage: boolean
): boolean {
    if (!isStreaming || !isLastMessage) return false;

    const networkPart = allParts.find((p) => p.type === 'data-network');
    if (!networkPart) return false;

    const data = networkPart.data as { steps?: Array<{ task?: { reason?: string } }> } | undefined;
    const reasoningText = data?.steps?.find((s) => s.task?.reason)?.task?.reason;

    return reasoningText !== undefined && text === reasoningText;
}

/**
 * Text Renderer Component
 * Renders text content with optional citation support using hooks
 */
const TextRendererComponent = memo<RendererProps<TextPart>>(
    ({ part, partIndex, isLastMessage, status, allParts }) => {
        const text = part.text;

        // Skip empty text
        if (!text || text.trim() === '') return null;

        // Skip if this is duplicate reasoning during streaming
        if (isDuplicateReasoning(text, allParts, status === 'streaming', isLastMessage)) {
            return null;
        }

        // Use hooks for sources and citations
        const webSources = useSourcesExtractor(allParts);
        const { hasCitations, segments, citations } = useTextWithCitations(text, webSources);

        // If we have citations and sources, render with InlineCitation
        if (hasCitations && webSources && webSources.length > 0) {
            return (
                <div className="space-y-2" key={partIndex}>
                    <div>
                        {segments.map((segment, index) => {
                            const citation = citations.find((c) => c.index === index);
                            if (citation?.source) {
                                return (
                                    <InlineCitation key={index}>
                                        <InlineCitationCard>
                                            <InlineCitationCardTrigger sources={[citation.source.url]} />
                                            <InlineCitationCardBody>
                                                <InlineCitationCarousel>
                                                    <InlineCitationCarouselHeader>
                                                        <InlineCitationCarouselPrev />
                                                        <InlineCitationCarouselNext />
                                                        <InlineCitationCarouselIndex />
                                                    </InlineCitationCarouselHeader>
                                                    <InlineCitationCarouselContent>
                                                        <InlineCitationCarouselItem>
                                                            <InlineCitationSource
                                                                title={citation.source.title || new URL(citation.source.url).hostname}
                                                                url={citation.source.url}
                                                            />
                                                        </InlineCitationCarouselItem>
                                                    </InlineCitationCarouselContent>
                                                </InlineCitationCarousel>
                                            </InlineCitationCardBody>
                                        </InlineCitationCard>
                                    </InlineCitation>
                                );
                            }
                            return <span key={index}>{segment}</span>;
                        })}
                    </div>
                    {/* Show sources list at the bottom */}
                    <Sources>
                        <SourcesTrigger count={webSources.length} />
                        <SourcesContent>
                            {webSources.map((source, i) => (
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
                </div>
            );
        }

        return <MessageResponse key={partIndex}>{text}</MessageResponse>;
    }
);

TextRendererComponent.displayName = 'TextRenderer';

/**
 * Text Renderer definition for the registry
 */
export const textRenderer: MessageRenderer<TextPart> = {
    type: 'text',
    canRender: isTextPart,
    Component: TextRendererComponent as unknown as React.FC<RendererProps>,
    priority: 10,
};
