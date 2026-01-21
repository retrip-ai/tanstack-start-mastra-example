# 🎯 Plan de Refactorización: Composabilidad y Modularidad React

## 📋 Análisis de Problemas Actuales

### **1. MessagePartRenderer Monolítico (CRÍTICO)**
- **Problema**: 460+ líneas de código con lógica condicional compleja
- **Impacto**: Difícil de mantener, testear y extender
- **Síntomas**:
  - No extensible para nuevos tipos de mensajes
  - Duplicación de lógica para extraer sources
  - Violación del principio Single Responsibility
  - Múltiples responsabilidades en un solo componente

### **2. Falta de Patrones de Composición**
- **Problema**: Componentes rígidos sin composabilidad
- **Impacto**: Baja reutilización y flexibilidad
- **Síntomas**:
  - No hay Factory Pattern para renderers
  - Sin Strategy Pattern para diferentes tipos de mensajes
  - Ausencia de Provider Pattern para estado compartido
  - No hay Render Props ni Component Injection

### **3. Acoplamiento Fuerte**
- **Problema**: Dependencias directas entre capas
- **Impacto**: Dificulta testing y cambios futuros
- **Síntomas**:
  - Dependencias directas a tipos de AI SDK
  - Lógica de negocio mezclada con presentación
  - Componentes no son agnósticos al dominio
  - Props drilling excesivo

### **4. TypeScript y Tipos**
- **Problema**: Uso excesivo de `any` y casteos inseguros
- **Impacto**: Pérdida de type safety y bugs en runtime
- **Síntomas**:
  - Múltiples `as any` en el código
  - Type guards incompletos
  - Falta de discriminated unions

### **5. Performance Issues**
- **Problema**: Re-renders innecesarios y falta de optimización
- **Impacto**: UX degradada con mensajes largos
- **Síntomas**:
  - Falta de memoización
  - No hay virtual scrolling
  - Recreación de objetos en cada render

---

## 🏗️ **PLAN DE REFACTORIZACIÓN: ARQUITECTURA COMPOSABLE**

## **FASE 1: Sistema de Renderers Composable**

### 1.1 **Registry Pattern para Message Renderers**

```typescript
// features/chat/renderers/types.ts
export interface MessagePart {
  type: string;
  [key: string]: unknown;
}

export interface RendererProps<T = unknown> {
  part: T;
  isStreaming: boolean;
  isLastMessage: boolean;
  allParts: MessagePart[];
}

export interface MessageRenderer<T = unknown> {
  type: string;
  canRender: (part: MessagePart) => boolean;
  Component: React.FC<RendererProps<T>>;
  priority?: number;
}

// features/chat/renderers/registry.ts
export class RendererRegistry {
  private renderers = new Map<string, MessageRenderer>();
  private sortedRenderers: MessageRenderer[] = [];

  register<T>(renderer: MessageRenderer<T>) {
    this.renderers.set(renderer.type, renderer);
    this.updateSortedRenderers();
  }

  unregister(type: string) {
    this.renderers.delete(type);
    this.updateSortedRenderers();
  }

  private updateSortedRenderers() {
    this.sortedRenderers = Array.from(this.renderers.values())
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }

  getRenderer(part: MessagePart): MessageRenderer | null {
    // First try exact type match
    const exactMatch = this.renderers.get(part.type);
    if (exactMatch?.canRender(part)) {
      return exactMatch;
    }

    // Then try other renderers by priority
    for (const renderer of this.sortedRenderers) {
      if (renderer.canRender(part)) {
        return renderer;
      }
    }

    return null;
  }
}

// features/chat/renderers/index.ts
import { textRenderer } from './text';
import { toolRenderer } from './tool';
import { networkRenderer } from './network';
import { sourcesRenderer } from './sources';
import { reasoningRenderer } from './reasoning';

const registry = new RendererRegistry();

// Register all renderers
registry.register(textRenderer);
registry.register(toolRenderer);
registry.register(networkRenderer);
registry.register(sourcesRenderer);
registry.register(reasoningRenderer);

export { registry as rendererRegistry };
```

### 1.2 **Micro-Componentes Especializados**

```typescript
// features/chat/components/renderers/TextRenderer.tsx
import { memo } from 'react';
import { useTextWithCitations } from '../../hooks/useTextWithCitations';
import { TextWithCitations } from '../atoms/TextWithCitations';
import type { TextPart } from '../../types';

interface TextRendererProps {
  part: TextPart;
  sources?: Source[];
}

export const TextRenderer = memo<TextRendererProps>(({ part, sources }) => {
  const { text, citations } = useTextWithCitations(part.text, sources);

  if (!text?.trim()) return null;

  return <TextWithCitations text={text} citations={citations} />;
});

TextRenderer.displayName = 'TextRenderer';

// features/chat/components/renderers/ToolRenderer.tsx
import { memo } from 'react';
import { useToolState } from '../../hooks/useToolState';
import { ToolExecution } from '../organisms/ToolExecution';
import type { ToolPart } from '../../types';

interface ToolRendererProps {
  part: ToolPart;
  isStreaming: boolean;
}

export const ToolRenderer = memo<ToolRendererProps>(({ part, isStreaming }) => {
  const { state, input, output, error } = useToolState(part);

  return (
    <ToolExecution
      name={part.toolName}
      state={state}
      input={input}
      output={output}
      error={error}
      isStreaming={isStreaming}
    />
  );
});

ToolRenderer.displayName = 'ToolRenderer';

// features/chat/components/renderers/NetworkRenderer.tsx
import { memo } from 'react';
import { NetworkExecution } from '../organisms/NetworkExecution';
import type { NetworkPart } from '../../types';

interface NetworkRendererProps {
  part: NetworkPart;
  isStreaming: boolean;
  hasTextPart: boolean;
}

export const NetworkRenderer = memo<NetworkRendererProps>(
  ({ part, isStreaming, hasTextPart }) => {
    return (
      <NetworkExecution
        data={part.data}
        isStreaming={isStreaming}
        showFallback={!hasTextPart}
      />
    );
  }
);

NetworkRenderer.displayName = 'NetworkRenderer';
```

---

## **FASE 2: Compound Components Pattern**

### 2.1 **Chat Component con Compound Pattern**

```typescript
// features/chat/components/Chat/Chat.tsx
import { createContext, useContext, ReactNode } from 'react';
import { useChatCore } from '../../hooks/useChatCore';

interface ChatContextValue {
  threadId: string;
  messages: Message[];
  sendMessage: (text: string) => void;
  status: 'idle' | 'streaming' | 'error';
}

const ChatContext = createContext<ChatContextValue | null>(null);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('Chat components must be used within Chat provider');
  }
  return context;
};

interface ChatProps {
  threadId: string;
  children: ReactNode;
}

export const Chat = ({ threadId, children }: ChatProps) => {
  const chatState = useChatCore(threadId);

  return (
    <ChatContext.Provider value={chatState}>
      <div className="flex flex-col h-full">
        {children}
      </div>
    </ChatContext.Provider>
  );
};

// Sub-components
Chat.Messages = function ChatMessages() {
  const { messages } = useChat();
  return (
    <div className="flex-1 overflow-y-auto">
      {messages.map(msg => (
        <Message key={msg.id} message={msg} />
      ))}
    </div>
  );
};

Chat.Input = function ChatInput() {
  const { sendMessage, status } = useChat();
  return (
    <ChatInputComponent
      onSubmit={sendMessage}
      disabled={status === 'streaming'}
    />
  );
};

Chat.Actions = function ChatActions() {
  const { threadId } = useChat();
  return <ChatActionsBar threadId={threadId} />;
};
```

### 2.2 **Message como Compound Component**

```typescript
// features/chat/components/Message/Message.tsx
import { createContext, useContext, ReactNode } from 'react';

interface MessageContextValue {
  role: 'user' | 'assistant';
  parts: MessagePart[];
}

const MessageContext = createContext<MessageContextValue | null>(null);

export const useMessage = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('Message components must be used within Message');
  }
  return context;
};

interface MessageProps {
  message: UIMessage;
  children: ReactNode;
}

export const Message = ({ message, children }: MessageProps) => {
  return (
    <MessageContext.Provider value={message}>
      <div className={cn(
        'flex gap-3 p-4',
        message.role === 'user' ? 'justify-end' : 'justify-start'
      )}>
        {children}
      </div>
    </MessageContext.Provider>
  );
};

Message.Avatar = function MessageAvatar() {
  const { role } = useMessage();
  return <Avatar role={role} />;
};

Message.Content = function MessageContent({ children }: { children: ReactNode }) {
  const { role } = useMessage();
  return (
    <div className={cn(
      'max-w-[70%] rounded-lg p-3',
      role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
    )}>
      {children}
    </div>
  );
};

Message.Text = function MessageText() {
  const { parts } = useMessage();
  const textPart = parts.find(p => p.type === 'text');
  return textPart ? <TextRenderer part={textPart} /> : null;
};

Message.Tools = function MessageTools() {
  const { parts } = useMessage();
  const toolParts = parts.filter(p => p.type.startsWith('tool-'));
  return (
    <>
      {toolParts.map((part, i) => (
        <ToolRenderer key={i} part={part} />
      ))}
    </>
  );
};

Message.Actions = function MessageActions() {
  return (
    <div className="flex gap-2">
      <CopyButton />
      <RegenerateButton />
      <ShareButton />
    </div>
  );
};
```

---

## **FASE 3: Custom Hooks para Lógica Reutilizable**

### 3.1 **Hooks Especializados**

```typescript
// features/chat/hooks/useMessageRenderer.ts
import { useMemo } from 'react';
import { rendererRegistry } from '../renderers';

export function useMessageRenderer(part: MessagePart) {
  return useMemo(() => {
    const renderer = rendererRegistry.getRenderer(part);

    if (!renderer) {
      console.warn(`No renderer found for part type: ${part.type}`);
      return null;
    }

    return renderer.Component;
  }, [part.type]);
}

// features/chat/hooks/useStreamingState.ts
import { useState, useCallback, useRef, useEffect } from 'react';

interface StreamingState {
  status: 'idle' | 'streaming' | 'error' | 'success';
  startTime: number | null;
  duration: number | null;
}

export function useStreamingState() {
  const [state, setState] = useState<StreamingState>({
    status: 'idle',
    startTime: null,
    duration: null,
  });

  const startStreaming = useCallback(() => {
    setState({
      status: 'streaming',
      startTime: Date.now(),
      duration: null,
    });
  }, []);

  const stopStreaming = useCallback((success = true) => {
    setState(prev => ({
      status: success ? 'success' : 'error',
      startTime: prev.startTime,
      duration: prev.startTime ? Date.now() - prev.startTime : null,
    }));
  }, []);

  return {
    ...state,
    startStreaming,
    stopStreaming,
  };
}

// features/chat/hooks/useChatTransport.ts
import { useMemo, useRef } from 'react';
import { DefaultChatTransport } from 'ai';

interface TransportConfig {
  threadId: string;
  apiUrl: string;
  searchEnabled: boolean;
}

export function useChatTransport({ threadId, apiUrl, searchEnabled }: TransportConfig) {
  const searchEnabledRef = useRef(searchEnabled);

  useEffect(() => {
    searchEnabledRef.current = searchEnabled;
  }, [searchEnabled]);

  return useMemo(() => {
    return new DefaultChatTransport({
      api: apiUrl,
      prepareSendMessagesRequest({ messages, id }) {
        return {
          body: {
            id,
            messages: messages.slice(-1),
            webSearchEnabled: searchEnabledRef.current,
            memory: { thread: threadId },
          },
        };
      },
    });
  }, [threadId, apiUrl]);
}

// features/chat/hooks/useTextWithCitations.ts
export function useTextWithCitations(text: string, sources?: Source[]) {
  return useMemo(() => {
    if (!sources?.length) {
      return { text, citations: [] };
    }

    const citations = [];
    const parts = text.split(/(\[\d+\])/);

    for (const part of parts) {
      const match = part.match(/\[(\d+)\]/);
      if (match) {
        const index = parseInt(match[1], 10) - 1;
        if (sources[index]) {
          citations.push({
            number: match[1],
            source: sources[index],
          });
        }
      }
    }

    return { text, citations };
  }, [text, sources]);
}
```

---

## **FASE 4: Providers y Context Optimization**

### 4.1 **Provider Architecture**

```typescript
// features/chat/providers/ChatProvider.tsx
import { ReactNode } from 'react';
import { ChatStateProvider } from './ChatStateProvider';
import { ChatActionsProvider } from './ChatActionsProvider';
import { StreamingProvider } from './StreamingProvider';
import { MessageProvider } from './MessageProvider';

interface ChatProviderProps {
  threadId: string;
  children: ReactNode;
}

export const ChatProvider = ({ threadId, children }: ChatProviderProps) => {
  return (
    <ChatStateProvider threadId={threadId}>
      <ChatActionsProvider>
        <StreamingProvider>
          <MessageProvider>
            {children}
          </MessageProvider>
        </StreamingProvider>
      </ChatActionsProvider>
    </ChatStateProvider>
  );
};

// features/chat/providers/ChatStateProvider.tsx
import { createContext, useContext, ReactNode } from 'react';
import { useChatState } from '../hooks/useChatState';

interface ChatState {
  messages: Message[];
  threadId: string;
  status: Status;
}

const ChatStateContext = createContext<ChatState | null>(null);

export const useChatStateContext = () => {
  const context = useContext(ChatStateContext);
  if (!context) {
    throw new Error('useChatStateContext must be used within ChatStateProvider');
  }
  return context;
};

export const ChatStateProvider = ({ threadId, children }: Props) => {
  const state = useChatState(threadId);

  return (
    <ChatStateContext.Provider value={state}>
      {children}
    </ChatStateContext.Provider>
  );
};
```

### 4.2 **Context Splitting for Performance**

```typescript
// features/chat/providers/SplitContextProvider.tsx
import { createContext, useContext, useMemo, ReactNode } from 'react';

// Split contexts for better performance
const ChatMessagesContext = createContext<Message[]>([]);
const ChatActionsContext = createContext<ChatActions | null>(null);
const ChatConfigContext = createContext<ChatConfig | null>(null);

// Selector hooks
export const useChatMessages = () => useContext(ChatMessagesContext);
export const useChatActions = () => {
  const context = useContext(ChatActionsContext);
  if (!context) throw new Error('ChatActions not available');
  return context;
};
export const useChatConfig = () => {
  const context = useContext(ChatConfigContext);
  if (!context) throw new Error('ChatConfig not available');
  return context;
};

// Provider with memoized values
export const SplitChatProvider = ({ children, threadId }: Props) => {
  const { messages, actions, config } = useChatCore(threadId);

  const memoizedMessages = useMemo(() => messages, [messages]);
  const memoizedActions = useMemo(() => actions, [actions]);
  const memoizedConfig = useMemo(() => config, [config]);

  return (
    <ChatMessagesContext.Provider value={memoizedMessages}>
      <ChatActionsContext.Provider value={memoizedActions}>
        <ChatConfigContext.Provider value={memoizedConfig}>
          {children}
        </ChatConfigContext.Provider>
      </ChatActionsContext.Provider>
    </ChatMessagesContext.Provider>
  );
};
```

---

## **FASE 5: Atomic Design Pattern**

### 5.1 **Estructura de Carpetas por Atomic Design**

```
features/chat/
├── atoms/                 # Componentes básicos indivisibles
│   ├── ChatAvatar.tsx
│   ├── ChatBadge.tsx
│   ├── ChatButton.tsx
│   ├── MessageText.tsx
│   ├── Timestamp.tsx
│   └── index.ts
│
├── molecules/            # Combinación de átomos
│   ├── MessageHeader.tsx
│   ├── ToolStatus.tsx
│   ├── SourceCard.tsx
│   ├── MessageActions.tsx
│   ├── InputActions.tsx
│   └── index.ts
│
├── organisms/           # Componentes complejos
│   ├── MessageContent/
│   │   ├── MessageContent.tsx
│   │   ├── MessageContent.types.ts
│   │   └── MessageContent.test.tsx
│   ├── ChatInput/
│   │   ├── ChatInput.tsx
│   │   ├── ChatInput.hooks.ts
│   │   └── ChatInput.test.tsx
│   ├── NetworkExecution/
│   │   ├── NetworkExecution.tsx
│   │   ├── NetworkStep.tsx
│   │   └── NetworkExecution.types.ts
│   └── index.ts
│
├── templates/          # Layout templates
│   ├── ChatLayout.tsx
│   ├── EmptyStateLayout.tsx
│   └── index.ts
│
└── pages/             # Páginas completas
    ├── ChatPage.tsx
    └── index.ts
```

### 5.2 **Ejemplos de Componentes Atómicos**

```typescript
// atoms/ChatAvatar.tsx
interface ChatAvatarProps {
  role: 'user' | 'assistant';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ChatAvatar = memo<ChatAvatarProps>(({
  role,
  size = 'md',
  className
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  return (
    <div className={cn(
      'rounded-full flex items-center justify-center',
      sizeClasses[size],
      role === 'user' ? 'bg-primary' : 'bg-muted',
      className
    )}>
      {role === 'user' ? <UserIcon /> : <BotIcon />}
    </div>
  );
});

// molecules/MessageHeader.tsx
interface MessageHeaderProps {
  role: 'user' | 'assistant';
  timestamp: Date;
  isStreaming?: boolean;
}

export const MessageHeader = memo<MessageHeaderProps>(({
  role,
  timestamp,
  isStreaming
}) => {
  return (
    <div className="flex items-center gap-2 mb-2">
      <ChatAvatar role={role} size="sm" />
      <span className="font-medium text-sm">
        {role === 'user' ? 'You' : 'Assistant'}
      </span>
      <Timestamp date={timestamp} />
      {isStreaming && <StreamingIndicator />}
    </div>
  );
});

// organisms/MessageContent.tsx
interface MessageContentProps {
  message: UIMessage;
  isStreaming: boolean;
  isLastMessage: boolean;
}

export const MessageContent = memo<MessageContentProps>(({
  message,
  isStreaming,
  isLastMessage
}) => {
  const renderers = useMessageRenderers(message.parts);

  return (
    <div className="space-y-2">
      <MessageHeader
        role={message.role}
        timestamp={message.createdAt}
        isStreaming={isStreaming && isLastMessage}
      />
      <div className="space-y-3">
        {renderers.map((Renderer, index) => (
          <Renderer
            key={index}
            isStreaming={isStreaming}
            isLastMessage={isLastMessage}
          />
        ))}
      </div>
      {message.role === 'assistant' && (
        <MessageActions message={message} />
      )}
    </div>
  );
});
```

---

## **FASE 6: TypeScript Estricto y Type Safety**

### 6.1 **Discriminated Unions y Type Guards**

```typescript
// types/message.ts

// Base type for all message parts
interface BaseMessagePart {
  id: string;
  timestamp: number;
}

// Specific part types with discriminated union
export type MessagePart =
  | TextPart
  | ToolPart
  | NetworkPart
  | ReasoningPart
  | SourcePart;

export interface TextPart extends BaseMessagePart {
  type: 'text';
  text: string;
}

export interface ToolPart extends BaseMessagePart {
  type: 'tool';
  toolName: string;
  toolCallId: string;
  state: ToolState;
  input?: unknown;
  output?: unknown;
  error?: string;
}

export interface NetworkPart extends BaseMessagePart {
  type: 'network';
  data: NetworkData;
}

export interface ReasoningPart extends BaseMessagePart {
  type: 'reasoning';
  text: string;
  duration?: number;
}

export interface SourcePart extends BaseMessagePart {
  type: 'source';
  sources: Source[];
}

// Type guards with proper type narrowing
export const isTextPart = (part: MessagePart): part is TextPart => {
  return part.type === 'text' && 'text' in part;
};

export const isToolPart = (part: MessagePart): part is ToolPart => {
  return part.type === 'tool' && 'toolName' in part;
};

export const isNetworkPart = (part: MessagePart): part is NetworkPart => {
  return part.type === 'network' && 'data' in part;
};

export const isReasoningPart = (part: MessagePart): part is ReasoningPart => {
  return part.type === 'reasoning' && 'text' in part;
};

export const isSourcePart = (part: MessagePart): part is SourcePart => {
  return part.type === 'source' && 'sources' in part;
};

// Utility type for extracting part by type
export type ExtractPart<T extends MessagePart['type']> =
  Extract<MessagePart, { type: T }>;

// Usage example:
type TextPartOnly = ExtractPart<'text'>; // TextPart
```

### 6.2 **Generic Components with Type Safety**

```typescript
// components/generic/TypedRenderer.tsx
import { ComponentType } from 'react';

interface TypedRendererProps<T extends MessagePart> {
  part: T;
  renderer: ComponentType<{ part: T }>;
}

export function TypedRenderer<T extends MessagePart>({
  part,
  renderer: Renderer
}: TypedRendererProps<T>) {
  return <Renderer part={part} />;
}

// Usage with type inference
<TypedRenderer
  part={textPart} // Type: TextPart
  renderer={TextRenderer} // Must accept TextPart
/>

// Mapped type for renderer components
type RendererMap = {
  [K in MessagePart['type']]: ComponentType<{
    part: ExtractPart<K>
  }>;
};

const renderers: RendererMap = {
  text: TextRenderer,
  tool: ToolRenderer,
  network: NetworkRenderer,
  reasoning: ReasoningRenderer,
  source: SourceRenderer,
};
```

---

## **FASE 7: Performance Optimizations**

### 7.1 **Virtual Scrolling Implementation**

```typescript
// features/chat/components/VirtualMessageList.tsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, useMemo } from 'react';

interface VirtualMessageListProps {
  messages: UIMessage[];
}

export const VirtualMessageList = ({ messages }: VirtualMessageListProps) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback((index) => {
      // Estimate based on message content
      const message = messages[index];
      const hasTools = message.parts.some(p => p.type.startsWith('tool-'));
      const hasNetwork = message.parts.some(p => p.type === 'network');

      if (hasNetwork) return 400;
      if (hasTools) return 300;
      return 150;
    }, [messages]),
    overscan: 5,
  });

  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <MessageContent
              message={messages[virtualItem.index]}
              isLastMessage={virtualItem.index === messages.length - 1}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 7.2 **Memoization Strategy**

```typescript
// features/chat/components/MemoizedMessage.tsx
import { memo } from 'react';

// Custom comparison function for deep memo
const areMessagesEqual = (
  prev: MessageContentProps,
  next: MessageContentProps
) => {
  // Quick checks first
  if (prev.message.id !== next.message.id) return false;
  if (prev.isStreaming !== next.isStreaming) return false;
  if (prev.isLastMessage !== next.isLastMessage) return false;

  // Deep comparison for parts (only if needed)
  if (prev.isLastMessage && next.isLastMessage) {
    return JSON.stringify(prev.message.parts) ===
           JSON.stringify(next.message.parts);
  }

  return true;
};

export const MemoizedMessage = memo(MessageContent, areMessagesEqual);

// Hook for memoized calculations
export const useProcessedMessages = (messages: UIMessage[]) => {
  return useMemo(() => {
    return messages
      .map(filterDisplayableContent)
      .map(resolveNetworkData)
      .filter(hasRenderableContent);
  }, [messages]);
};

// Memoize expensive transformations
export const useMessageTransform = (message: UIMessage) => {
  const textContent = useMemo(
    () => extractTextContent(message),
    [message.id, message.parts]
  );

  const tools = useMemo(
    () => extractTools(message),
    [message.id, message.parts]
  );

  const sources = useMemo(
    () => extractSources(message),
    [message.id, message.parts]
  );

  return { textContent, tools, sources };
};
```

### 7.3 **Code Splitting and Lazy Loading**

```typescript
// features/chat/components/LazyRenderers.tsx
import { lazy, Suspense } from 'react';

// Lazy load heavy components
const NetworkExecution = lazy(() =>
  import('./organisms/NetworkExecution')
);

const ToolExecution = lazy(() =>
  import('./organisms/ToolExecution')
);

const CodeBlock = lazy(() =>
  import('./atoms/CodeBlock')
);

// Wrapper with fallback
export const LazyNetworkExecution = (props: NetworkExecutionProps) => (
  <Suspense fallback={<NetworkExecutionSkeleton />}>
    <NetworkExecution {...props} />
  </Suspense>
);

// Route-based code splitting
const ChatPage = lazy(() =>
  import(/* webpackChunkName: "chat" */ './pages/ChatPage')
);
```

---

## **FASE 8: Testing Strategy**

### 8.1 **Unit Tests para Renderers**

```typescript
// __tests__/renderers/TextRenderer.test.tsx
import { render, screen } from '@testing-library/react';
import { TextRenderer } from '@/features/chat/components/renderers/TextRenderer';

describe('TextRenderer', () => {
  it('should render plain text', () => {
    const part = { type: 'text', text: 'Hello World' };
    render(<TextRenderer part={part} />);

    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('should render text with citations', () => {
    const part = { type: 'text', text: 'Hello [1] World [2]' };
    const sources = [
      { url: 'https://example.com', title: 'Example 1' },
      { url: 'https://test.com', title: 'Example 2' },
    ];

    render(<TextRenderer part={part} sources={sources} />);

    expect(screen.getByText(/Hello/)).toBeInTheDocument();
    expect(screen.getByText(/World/)).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('should handle empty text', () => {
    const part = { type: 'text', text: '' };
    const { container } = render(<TextRenderer part={part} />);

    expect(container.firstChild).toBeNull();
  });
});

// __tests__/renderers/ToolRenderer.test.tsx
describe('ToolRenderer', () => {
  it('should show loading state', () => {
    const part = {
      type: 'tool',
      toolName: 'weather',
      state: 'input-streaming',
    };

    render(<ToolRenderer part={part} isStreaming={true} />);

    expect(screen.getByText('weather')).toBeInTheDocument();
    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  it('should show output when available', () => {
    const part = {
      type: 'tool',
      toolName: 'weather',
      state: 'output-available',
      output: { temperature: 25, condition: 'Sunny' },
    };

    render(<ToolRenderer part={part} isStreaming={false} />);

    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText(/temperature.*25/)).toBeInTheDocument();
  });
});
```

### 8.2 **Integration Tests**

```typescript
// __tests__/chat/ChatFlow.test.tsx
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useChat } from '@/features/chat/hooks/useChat';

const wrapper = ({ children }) => (
  <QueryClientProvider client={new QueryClient()}>
    {children}
  </QueryClientProvider>
);

describe('Chat Flow Integration', () => {
  it('should handle message sending and streaming', async () => {
    const { result } = renderHook(
      () => useChat('test-thread'),
      { wrapper }
    );

    // Initial state
    expect(result.current.status).toBe('idle');
    expect(result.current.messages).toHaveLength(0);

    // Send message
    act(() => {
      result.current.sendMessage('Hello AI');
    });

    // Should start streaming
    await waitFor(() => {
      expect(result.current.status).toBe('streaming');
    });

    // Should have user message
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].role).toBe('user');

    // Wait for response
    await waitFor(() => {
      expect(result.current.status).toBe('idle');
      expect(result.current.messages).toHaveLength(2);
    });

    // Should have assistant message
    expect(result.current.messages[1].role).toBe('assistant');
  });

  it('should handle errors gracefully', async () => {
    // Mock API error
    server.use(
      rest.post('/chat', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Server error' }));
      })
    );

    const { result } = renderHook(
      () => useChat('test-thread'),
      { wrapper }
    );

    act(() => {
      result.current.sendMessage('Hello');
    });

    await waitFor(() => {
      expect(result.current.status).toBe('error');
      expect(result.current.error).toBeTruthy();
    });
  });
});
```

### 8.3 **E2E Tests con Playwright**

```typescript
// e2e/chat.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Chat Feature', () => {
  test('should send and receive messages', async ({ page }) => {
    await page.goto('/chat/new');

    // Type message
    const input = page.locator('[data-testid="chat-input"]');
    await input.fill('What is the weather in Paris?');

    // Send message
    await page.locator('[data-testid="send-button"]').click();

    // Wait for user message
    await expect(
      page.locator('[data-testid="message-user"]')
    ).toContainText('What is the weather in Paris?');

    // Wait for streaming indicator
    await expect(
      page.locator('[data-testid="streaming-indicator"]')
    ).toBeVisible();

    // Wait for assistant response
    await expect(
      page.locator('[data-testid="message-assistant"]')
    ).toBeVisible();

    // Check for tool execution
    await expect(
      page.locator('[data-testid="tool-weather"]')
    ).toBeVisible();
  });

  test('should handle network execution', async ({ page }) => {
    await page.goto('/chat/new');

    await page.locator('[data-testid="chat-input"]')
      .fill('Find hotels in Tokyo');
    await page.locator('[data-testid="send-button"]').click();

    // Should show network execution
    await expect(
      page.locator('[data-testid="network-execution"]')
    ).toBeVisible();

    // Should show routing decision
    await expect(
      page.locator('text=/Routing Decision/')
    ).toBeVisible();
  });
});
```

---

## **FASE 9: Documentación y Storybook**

### 9.1 **Storybook Configuration**

```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: [
    '../features/**/*.stories.@(js|jsx|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
};

export default config;
```

### 9.2 **Component Stories**

```typescript
// features/chat/components/Message/Message.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Message } from './Message';

const meta: Meta<typeof Message> = {
  title: 'Chat/Message',
  component: Message,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div className="max-w-3xl mx-auto">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const UserMessage: Story = {
  args: {
    message: {
      id: '1',
      role: 'user',
      parts: [{ type: 'text', text: 'Hello, how are you?' }],
      createdAt: new Date(),
    },
  },
  render: (args) => (
    <Message message={args.message}>
      <Message.Avatar />
      <Message.Content>
        <Message.Text />
      </Message.Content>
    </Message>
  ),
};

export const AssistantWithTool: Story = {
  args: {
    message: {
      id: '2',
      role: 'assistant',
      parts: [
        { type: 'text', text: 'Let me check the weather for you.' },
        {
          type: 'tool-weather',
          state: 'output-available',
          input: { city: 'Paris' },
          output: { temperature: 22, condition: 'Sunny' },
        },
      ],
      createdAt: new Date(),
    },
  },
  render: (args) => (
    <Message message={args.message}>
      <Message.Avatar />
      <Message.Content>
        <Message.Text />
        <Message.Tools />
      </Message.Content>
      <Message.Actions />
    </Message>
  ),
};

export const StreamingMessage: Story = {
  args: {
    message: {
      id: '3',
      role: 'assistant',
      parts: [
        { type: 'reasoning', text: 'Thinking about your request...' },
        { type: 'text', text: 'I am currently processing...' },
      ],
      createdAt: new Date(),
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows a message that is currently being streamed',
      },
    },
  },
};

export const WithSources: Story = {
  args: {
    message: {
      id: '4',
      role: 'assistant',
      parts: [
        {
          type: 'text',
          text: 'According to sources [1], Paris is beautiful [2].'
        },
        {
          type: 'source',
          sources: [
            {
              url: 'https://example.com/paris',
              title: 'Paris Travel Guide',
              description: 'Complete guide to visiting Paris',
            },
            {
              url: 'https://example.com/france',
              title: 'France Tourism',
              description: 'Official tourism site',
            },
          ],
        },
      ],
      createdAt: new Date(),
    },
  },
};
```

### 9.3 **JSDoc Documentation**

```typescript
// features/chat/hooks/useChat.ts

/**
 * Hook for managing chat state and interactions
 *
 * @param threadId - The unique identifier for the chat thread
 * @param options - Optional configuration for the chat
 *
 * @returns Chat state and methods
 *
 * @example
 * ```tsx
 * const { messages, sendMessage, status } = useChat('thread-123');
 *
 * // Send a message
 * sendMessage('Hello AI!');
 *
 * // Check streaming status
 * if (status === 'streaming') {
 *   // Show loading indicator
 * }
 * ```
 */
export function useChat(
  threadId: string,
  options?: UseChatOptions
): UseChatReturn {
  // Implementation
}

/**
 * Registry for message part renderers
 *
 * Allows registration of custom renderers for different message part types.
 * Renderers are matched by type and canRender predicate.
 *
 * @example
 * ```tsx
 * // Register a custom renderer
 * registry.register({
 *   type: 'custom',
 *   canRender: (part) => part.type === 'custom',
 *   Component: CustomRenderer,
 *   priority: 10,
 * });
 *
 * // Get renderer for a part
 * const renderer = registry.getRenderer(part);
 * ```
 */
export class RendererRegistry {
  // Implementation
}
```

---

## 📊 **Beneficios Esperados**

### **Métricas de Mejora**

| Métrica | Actual | Esperado | Mejora |
|---------|--------|----------|--------|
| **Líneas por componente** | 460+ | <100 | -78% |
| **Acoplamiento** | Alto | Bajo | ⬇️ |
| **Cobertura de tests** | 0% | 80%+ | +80% |
| **Type Safety** | Parcial | Total | ✅ |
| **Reutilización** | Baja | Alta | ⬆️ |
| **Time to Feature** | Días | Horas | -70% |
| **Bugs en producción** | Frecuentes | Raros | -60% |

### **Impacto en Developer Experience**

- ✅ **Composabilidad Total**: Componentes 100% composables
- ✅ **Extensibilidad**: Fácil agregar nuevos tipos de mensajes
- ✅ **Testabilidad**: Componentes aislados y testeables
- ✅ **Documentación**: Storybook con ejemplos vivos
- ✅ **Type Safety**: Sin `any`, tipos estrictos
- ✅ **Performance**: Optimizado con memoización y virtual scrolling

---

## 🚀 **Cronograma de Implementación**

### **Sprint 1 (Semana 1-2): Foundation**
- [ ] Refactorizar MessagePartRenderer en micro-componentes
- [ ] Implementar Registry Pattern
- [ ] Crear tipos base y discriminated unions
- [ ] Setup inicial de tests

### **Sprint 2 (Semana 3-4): Composition**
- [ ] Implementar Compound Components Pattern
- [ ] Crear custom hooks especializados
- [ ] Refactorizar Chat y Message components
- [ ] Agregar providers y contexts

### **Sprint 3 (Semana 5-6): Optimization**
- [ ] Implementar virtual scrolling
- [ ] Aplicar memoización estratégica
- [ ] Code splitting y lazy loading
- [ ] Optimizar re-renders

### **Sprint 4 (Semana 7-8): Quality**
- [ ] Escribir unit tests (80% coverage)
- [ ] Crear integration tests
- [ ] Setup Storybook
- [ ] Documentar componentes y hooks

### **Sprint 5 (Semana 9-10): Polish**
- [ ] Refinamiento de UX
- [ ] Accesibilidad (a11y)
- [ ] Performance profiling
- [ ] Deploy y monitoreo

---

## 🎯 **Criterios de Éxito**

1. **Todos los componentes son composables** y siguen patterns consistentes
2. **No hay uso de `any`** en el código TypeScript
3. **80%+ cobertura de tests** unitarios
4. **Todos los componentes documentados** en Storybook
5. **MessagePartRenderer dividido** en componentes <100 líneas
6. **Performance mejorada** en 30%+ (medido con React DevTools)
7. **Zero props drilling** - todo manejo de estado via Context/Hooks

---

## 📚 **Referencias y Recursos**

- [React Patterns](https://reactpatterns.com/)
- [Compound Components Pattern](https://kentcdodds.com/blog/compound-components-with-react-hooks)
- [Atomic Design Methodology](https://atomicdesign.bradfrost.com/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [React Performance Optimization](https://react.dev/reference/react/memo)

---

## 🤝 **Próximos Pasos**

1. **Review del plan** con el equipo
2. **Crear branch** `refactor/composable-architecture`
3. **Setup inicial** de herramientas (Storybook, Testing)
4. **Comenzar Sprint 1** con MessagePartRenderer
5. **Daily updates** del progreso

---

*Documento creado: Enero 2025*
*Última actualización: Enero 2025*
*Versión: 1.0.0*