import { memo } from 'react';
import type { UIMessage } from '@ai-sdk/react';
import { cn } from '@/lib/utils';
import { ChatAvatar } from '../atoms/chat-avatar';
import { StreamingIndicator } from '../atoms/streaming-indicator';
import { Timestamp } from '../atoms/timestamp';

interface MessageHeaderProps {
    /** Role of the message sender */
    role: UIMessage['role'];
    /** When the message was created */
    timestamp?: Date | string;
    /** Whether the message is currently streaming */
    isStreaming?: boolean;
    /** Additional className */
    className?: string;
}

/**
 * Message header molecule.
 * Combines avatar, role label, timestamp, and streaming indicator.
 * 
 * @example
 * ```tsx
 * <MessageHeader 
 *   role="assistant" 
 *   timestamp={message.createdAt}
 *   isStreaming={isLastMessage && status === 'streaming'}
 * />
 * ```
 */
export const MessageHeader = memo<MessageHeaderProps>(
    ({ role, timestamp, isStreaming, className }) => {
        const roleLabel = role === 'user' ? 'You' : 'Assistant';

        return (
            <div className={cn('mb-2 flex items-center gap-2', className)}>
                <ChatAvatar role={role} size="sm" />
                <span className="font-medium text-sm">{roleLabel}</span>
                {timestamp && <Timestamp date={timestamp} format="relative" />}
                {isStreaming && <StreamingIndicator />}
            </div>
        );
    }
);

MessageHeader.displayName = 'MessageHeader';
