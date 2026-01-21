import { memo, useMemo } from 'react';
import type { UIMessage } from '@ai-sdk/react';
import { MessagePartRenderer } from '../message-part-renderer';
import type { GenericPart, StreamStatus } from '../renderers/types';

interface MemoizedMessageProps {
    /** The message to render */
    message: UIMessage;
    /** Whether this is the last message in the conversation */
    isLastMessage: boolean;
    /** Current streaming status */
    status: StreamStatus;
}

/**
 * Check if the message has a text part
 */
function hasTextPart(parts: UIMessage['parts']): boolean {
    return parts.some((p) => p.type === 'text');
}

/**
 * Custom comparison function for message memoization.
 * Only re-renders when necessary based on message state.
 */
function areMessagesEqual(prev: MemoizedMessageProps, next: MemoizedMessageProps): boolean {
    // Quick ID check
    if (prev.message.id !== next.message.id) return false;

    // Status change requires re-render
    if (prev.status !== next.status) return false;

    // isLastMessage change requires re-render (affects streaming indicator)
    if (prev.isLastMessage !== next.isLastMessage) return false;

    // For streaming last message, always re-render (content is changing)
    if (next.isLastMessage && next.status === 'streaming') {
        return false;
    }

    // For non-streaming messages, compare parts length as proxy for changes
    if (prev.message.parts.length !== next.message.parts.length) return false;

    // Messages are effectively equal
    return true;
}

/**
 * MemoizedMessage Component
 * 
 * Optimized message component with custom memoization.
 * Automatically skips re-renders for stable messages.
 * 
 * @example
 * ```tsx
 * {messages.map((msg, i) => (
 *   <MemoizedMessage
 *     key={msg.id}
 *     message={msg}
 *     isLastMessage={i === messages.length - 1}
 *     status={status}
 *   />
 * ))}
 * ```
 */
export const MemoizedMessage = memo<MemoizedMessageProps>(
    ({ message, isLastMessage, status }) => {
        const allParts = message.parts as GenericPart[];
        const hasText = useMemo(() => hasTextPart(message.parts), [message.parts]);

        return (
            <div className="space-y-2">
                {allParts.map((part, index) => (
                    <MessagePartRenderer
                        key={`${message.id}-${index}-${part.type}`}
                        part={part}
                        partIndex={index}
                        isLastMessage={isLastMessage}
                        status={status}
                        hasTextPart={hasText}
                        allParts={allParts}
                    />
                ))}
            </div>
        );
    },
    areMessagesEqual
);

MemoizedMessage.displayName = 'MemoizedMessage';

// ============================================================================
// Hook for memoized message processing
// ============================================================================

interface ProcessedMessage {
    message: UIMessage;
    hasText: boolean;
    toolCount: number;
    hasNetwork: boolean;
}

/**
 * Hook to process messages with memoization.
 * Extracts commonly needed data to avoid repeated calculations.
 */
export function useProcessedMessages(messages: UIMessage[]): ProcessedMessage[] {
    return useMemo(() => {
        return messages.map((message) => ({
            message,
            hasText: message.parts.some((p) => p.type === 'text'),
            toolCount: message.parts.filter((p) => p.type.startsWith('tool-')).length,
            hasNetwork: message.parts.some((p) => p.type === 'data-network'),
        }));
    }, [messages]);
}

/**
 * Hook to extract text content from a message.
 * Memoized to avoid repeated string operations.
 */
export function useMessageTextContent(message: UIMessage): string {
    return useMemo(() => {
        return message.parts
            .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
            .map((p) => p.text)
            .join('\n');
    }, [message.parts]);
}
