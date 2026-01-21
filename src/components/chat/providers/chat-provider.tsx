'use client';

import { createContext, useContext, useRef, type ReactNode } from 'react';
import type { UIMessage } from '@ai-sdk/react';

// ============================================================================
// Chat Context Types
// ============================================================================

type ChatStatus = 'ready' | 'streaming' | 'submitted' | 'error';

interface ChatContextValue {
    /** Thread ID for the current chat */
    threadId: string;
    /** All messages in the chat */
    messages: UIMessage[];
    /** Current chat status */
    status: ChatStatus;
    /** Whether web search is enabled */
    webSearchEnabled: boolean;
}

interface ChatActionsContextValue {
    /** Send a new message */
    sendMessage: (text: string, attachments?: File[]) => void;
    /** Stop the current stream */
    stop: () => void;
    /** Toggle web search */
    toggleWebSearch: () => void;
    /** Reload the last message */
    reload: () => void;
}

// ============================================================================
// Contexts (Split for performance)
// ============================================================================

const ChatStateContext = createContext<ChatContextValue | null>(null);
const ChatActionsContext = createContext<ChatActionsContextValue | null>(null);

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to access chat state.
 * Must be used within a ChatProvider.
 */
export function useChatState(): ChatContextValue {
    const context = useContext(ChatStateContext);
    if (!context) {
        throw new Error('useChatState must be used within a ChatProvider');
    }
    return context;
}

/**
 * Hook to access chat actions.
 * Must be used within a ChatProvider.
 */
export function useChatActions(): ChatActionsContextValue {
    const context = useContext(ChatActionsContext);
    if (!context) {
        throw new Error('useChatActions must be used within a ChatProvider');
    }
    return context;
}

/**
 * Hook to get just the messages (optimized, avoids re-render on status change)
 */
export function useChatMessages(): UIMessage[] {
    const { messages } = useChatState();
    return messages;
}

/**
 * Hook to get just the chat status
 */
export function useChatStatus(): ChatStatus {
    const { status } = useChatState();
    return status;
}

/**
 * Hook to check if chat is streaming
 */
export function useIsChatlStreaming(): boolean {
    const { status } = useChatState();
    return status === 'streaming';
}

/**
 * Hook to get thread ID
 */
export function useChatThreadId(): string {
    const { threadId } = useChatState();
    return threadId;
}

// ============================================================================
// Provider
// ============================================================================

interface ChatProviderProps {
    /** Thread ID */
    threadId: string;
    /** Messages array */
    messages: UIMessage[];
    /** Current status */
    status: ChatStatus;
    /** Whether web search is enabled */
    webSearchEnabled: boolean;
    /** Send message handler */
    onSendMessage: (text: string, attachments?: File[]) => void;
    /** Stop handler */
    onStop: () => void;
    /** Toggle web search handler */
    onToggleWebSearch: () => void;
    /** Reload handler */
    onReload: () => void;
    /** Children */
    children: ReactNode;
}

/**
 * Provider component for chat context.
 * Splits state and actions into separate contexts for performance.
 * 
 * @example
 * ```tsx
 * <ChatProvider
 *   threadId={threadId}
 *   messages={messages}
 *   status={status}
 *   webSearchEnabled={webSearch}
 *   onSendMessage={handleSend}
 *   onStop={handleStop}
 *   onToggleWebSearch={handleToggle}
 *   onReload={handleReload}
 * >
 *   <Chat.Messages />
 *   <Chat.Input />
 * </ChatProvider>
 * ```
 */
export function ChatProvider({
    threadId,
    messages,
    status,
    webSearchEnabled,
    onSendMessage,
    onStop,
    onToggleWebSearch,
    onReload,
    children,
}: ChatProviderProps) {
    // Use refs to keep actions stable
    const actionsRef = useRef<ChatActionsContextValue>({
        sendMessage: onSendMessage,
        stop: onStop,
        toggleWebSearch: onToggleWebSearch,
        reload: onReload,
    });

    // Update refs on each render
    actionsRef.current.sendMessage = onSendMessage;
    actionsRef.current.stop = onStop;
    actionsRef.current.toggleWebSearch = onToggleWebSearch;
    actionsRef.current.reload = onReload;

    const stateValue: ChatContextValue = {
        threadId,
        messages,
        status,
        webSearchEnabled,
    };

    return (
        <ChatStateContext.Provider value={stateValue}>
            <ChatActionsContext.Provider value={actionsRef.current}>
                {children}
            </ChatActionsContext.Provider>
        </ChatStateContext.Provider>
    );
}
