/**
 * Chat Providers
 * 
 * Exports context providers for chat state management.
 * Using split contexts for optimized re-renders.
 */

export {
    ChatProvider,
    useChatState,
    useChatActions,
    useChatMessages,
    useChatStatus,
    useIsChatlStreaming,
    useChatThreadId,
} from './chat-provider';

export {
    MessageProvider,
    useMessageContext,
    useMessageContextSafe,
    useMessageRole,
    useMessageParts,
    useIsStreaming,
    useTextParts,
    useToolParts,
} from './message-provider';
