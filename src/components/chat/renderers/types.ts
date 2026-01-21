import type { NetworkDataPart } from '@mastra/ai-sdk';
import type { ToolUIPart } from 'ai';
import type { ReactElement } from 'react';

// ============================================================================
// Base Types
// ============================================================================

/**
 * Source data structure used across different part types
 */
export interface SourceData {
    url: string;
    title?: string;
    description?: string;
    lastUpdated?: string;
}

/**
 * Generic part type for extensible parts - uses Record instead of index signature
 */
export type GenericPart = Record<string, unknown> & {
    type: string;
};

// ============================================================================
// Discriminated Union: MessagePart Types
// ============================================================================

/**
 * Text content part
 */
export interface TextPart {
    type: 'text';
    text: string;
    [key: string]: unknown;
}

/**
 * Reasoning/thinking content part
 */
export interface ReasoningPart {
    type: 'reasoning';
    text: string;
    [key: string]: unknown;
}

/**
 * Network execution part (agent networks)
 */
export interface NetworkPart {
    type: 'data-network';
    data: NetworkDataPart['data'];
    [key: string]: unknown;
}

/**
 * Source URL part (Mastra sendSources: true format)
 */
export interface SourceUrlPart {
    type: 'source-url';
    url?: string;
    title?: string;
    description?: string;
    lastUpdated?: string;
    sourceId?: string;
    [key: string]: unknown;
}

/**
 * AI SDK source part
 */
export interface SourcePart {
    type: 'source';
    source?: SourceData;
    url?: string;
    title?: string;
    description?: string;
    [key: string]: unknown;
}

/**
 * Dynamic tool part (network execution results from memory)
 */
export interface DynamicToolPart {
    type: 'dynamic-tool';
    toolCallId: string;
    toolName: string;
    state: string;
    input: unknown;
    output: {
        childMessages?: Array<{
            type: 'tool' | 'text';
            toolCallId?: string;
            toolName?: string;
            args?: Record<string, unknown>;
            toolOutput?: Record<string, unknown>;
            content?: string;
        }>;
        result?: string;
    };
    [key: string]: unknown;
}

/**
 * Tool part (matches tool-* types)
 */
export interface ToolPart {
    type: `tool-${string}`;
    toolCallId?: string;
    state: ToolUIPart['state'];
    input?: unknown;
    output?: unknown;
    errorText?: string;
    [key: string]: unknown;
}

/**
 * Union type of all known message parts
 */
export type MessagePart =
    | TextPart
    | ReasoningPart
    | NetworkPart
    | SourceUrlPart
    | SourcePart
    | DynamicToolPart
    | ToolPart;

// ============================================================================
// Type Guards
// ============================================================================

export const isTextPart = (part: GenericPart): part is TextPart => {
    return part.type === 'text' && 'text' in part;
};

export const isReasoningPart = (part: GenericPart): part is ReasoningPart => {
    return part.type === 'reasoning' && 'text' in part;
};

export const isNetworkPart = (part: GenericPart): part is NetworkPart => {
    return part.type === 'data-network' && 'data' in part;
};

export const isSourceUrlPart = (part: GenericPart): part is SourceUrlPart => {
    return part.type === 'source-url';
};

export const isSourcePart = (part: GenericPart): part is SourcePart => {
    return part.type === 'source';
};

export const isDynamicToolPart = (part: GenericPart): part is DynamicToolPart => {
    return part.type === 'dynamic-tool' && 'output' in part;
};

export const isToolPart = (part: GenericPart): part is ToolPart => {
    return part.type.startsWith('tool-');
};

// ============================================================================
// Renderer Types
// ============================================================================

/**
 * Status of the message stream
 */
export type StreamStatus = 'ready' | 'streaming' | 'submitted' | 'error';

/**
 * Props passed to every renderer component
 */
export interface RendererProps<T = GenericPart> {
    /** The message part to render */
    part: T;
    /** Index of this part in the message */
    partIndex: number;
    /** Whether this is the last message in the conversation */
    isLastMessage: boolean;
    /** Current streaming status */
    status: StreamStatus;
    /** Whether the message contains a text part */
    hasTextPart: boolean;
    /** All parts in the current message */
    allParts: GenericPart[];
}

/**
 * Interface for a message part renderer
 */
export interface MessageRenderer<T = GenericPart> {
    /** Unique type identifier */
    type: string;
    /** Check if this renderer can handle the given part */
    canRender: (part: GenericPart) => boolean;
    /** The React component that renders the part */
    Component: React.FC<RendererProps<T>>;
    /** Priority for renderer matching (higher = checked first) */
    priority?: number;
}

/**
 * Result type for renderer lookup
 */
export type RendererResult = ReactElement | null;
