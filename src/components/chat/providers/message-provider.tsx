'use client';

import type { UIMessage } from '@ai-sdk/react';
import { createContext, useContext, type ReactNode } from 'react';

// ============================================================================
// Message Context
// ============================================================================

interface MessageContextValue {
    /** The message data */
    message: UIMessage;
    /** Role of the message sender */
    role: UIMessage['role'];
    /** Message parts */
    parts: UIMessage['parts'];
    /** Whether this is the last message in the conversation */
    isLastMessage: boolean;
    /** Current streaming status */
    status: 'ready' | 'streaming' | 'submitted' | 'error';
}

const MessageContext = createContext<MessageContextValue | null>(null);

/**
 * Hook to access message context.
 * Must be used within a MessageProvider.
 * 
 * @throws Error if used outside MessageProvider
 * 
 * @example
 * ```tsx
 * function MessageText() {
 *   const { parts, role } = useMessageContext();
 *   // Access message data...
 * }
 * ```
 */
export function useMessageContext(): MessageContextValue {
    const context = useContext(MessageContext);
    if (!context) {
        throw new Error('useMessageContext must be used within a MessageProvider');
    }
    return context;
}

/**
 * Optional version that returns null instead of throwing
 */
export function useMessageContextSafe(): MessageContextValue | null {
    return useContext(MessageContext);
}

// ============================================================================
// Message Provider
// ============================================================================

interface MessageProviderProps {
    /** The message to provide context for */
    message: UIMessage;
    /** Whether this is the last message */
    isLastMessage: boolean;
    /** Current streaming status */
    status: 'ready' | 'streaming' | 'submitted' | 'error';
    /** Children components */
    children: ReactNode;
}

/**
 * Provider component for message context.
 * Wraps message-related components to provide access to message data.
 * 
 * @example
 * ```tsx
 * <MessageProvider message={msg} isLastMessage={true} status="ready">
 *   <Message.Avatar />
 *   <Message.Content />
 *   <Message.Actions />
 * </MessageProvider>
 * ```
 */
export function MessageProvider({
    message,
    isLastMessage,
    status,
    children,
}: MessageProviderProps) {
    const value: MessageContextValue = {
        message,
        role: message.role,
        parts: message.parts,
        isLastMessage,
        status,
    };

    return <MessageContext.Provider value={value}>{children}</MessageContext.Provider>;
}

// ============================================================================
// Selectors (for optimized access to specific parts)
// ============================================================================

/**
 * Hook to get just the message role
 */
export function useMessageRole(): UIMessage['role'] {
    const { role } = useMessageContext();
    return role;
}

/**
 * Hook to get just the message parts
 */
export function useMessageParts(): UIMessage['parts'] {
    const { parts } = useMessageContext();
    return parts;
}

/**
 * Hook to check if message is streaming
 */
export function useIsStreaming(): boolean {
    const { status, isLastMessage } = useMessageContext();
    return status === 'streaming' && isLastMessage;
}

/**
 * Hook to get text parts from message
 */
export function useTextParts(): Array<{ type: 'text'; text: string }> {
    const { parts } = useMessageContext();
    return parts.filter((p): p is { type: 'text'; text: string } => p.type === 'text');
}

/**
 * Hook to get tool parts from message
 */
export function useToolParts(): UIMessage['parts'] {
    const { parts } = useMessageContext();
    return parts.filter((p) => p.type.startsWith('tool-'));
}
