/**
 * Chat Component System
 * 
 * A composable architecture for chat interfaces following:
 * - Registry Pattern for extensible renderers
 * - Compound Components Pattern for flexible composition
 * - Atomic Design for UI consistency
 * - Split Contexts for performance optimization
 */

// Core Components
export { ChatEmptyState } from './chat-empty-state';
export { ChatInput } from './chat-input';
export { ChatLayout } from './chat-layout';
export { MessagePartRenderer } from './message-part-renderer';

// Renderer System
export * from './renderers';

// Providers (Compound Components)
export * from './providers';

// Atoms (Basic UI elements)
export * from './atoms';

// Molecules (Composed UI elements)
export * from './molecules';

// Organisms (Complex components)
export * from './organisms';
