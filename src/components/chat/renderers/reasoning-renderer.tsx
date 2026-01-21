import { memo } from 'react';
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/components/ai-elements/reasoning';
import type { MessageRenderer, ReasoningPart, RendererProps } from './types';
import { isReasoningPart } from './types';

/**
 * Reasoning Renderer Component
 * Renders thinking/reasoning content only during streaming on the last message
 */
const ReasoningRendererComponent = memo<RendererProps<ReasoningPart>>(
    ({ part, partIndex, isLastMessage, status }) => {
        // Only render reasoning if we're streaming and this is the last message
        if (status !== 'streaming' || !isLastMessage) {
            return null;
        }

        const text = part.text;
        if (!text) return null;

        return (
            <Reasoning isStreaming={status === 'streaming'} key={partIndex}>
                <ReasoningTrigger />
                <ReasoningContent>{text}</ReasoningContent>
            </Reasoning>
        );
    }
);

ReasoningRendererComponent.displayName = 'ReasoningRenderer';

/**
 * Reasoning Renderer definition for the registry
 */
export const reasoningRenderer: MessageRenderer<ReasoningPart> = {
    type: 'reasoning',
    canRender: isReasoningPart,
    Component: ReasoningRendererComponent as unknown as React.FC<RendererProps>,
    priority: 20,
};
