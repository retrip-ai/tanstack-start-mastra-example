/**
 * Renderer Registry and Exports
 *
 * This module provides a composable system for rendering message parts.
 * All renderers are registered in a central registry and can be extended.
 */

// Export types
export * from './types';

// Export registry
export { rendererRegistry, RendererRegistry } from './registry';

// Export individual renderers
export { textRenderer } from './text-renderer';
export { reasoningRenderer } from './reasoning-renderer';
export { networkRenderer } from './network-renderer';
export { toolRenderer } from './tool-renderer';
export { dynamicToolRenderer } from './dynamic-tool-renderer';
export { weatherRenderer } from './weather-renderer';

// Import for registration
import { rendererRegistry } from './registry';
import { textRenderer } from './text-renderer';
import { reasoningRenderer } from './reasoning-renderer';
import { networkRenderer } from './network-renderer';
import { toolRenderer } from './tool-renderer';
import { dynamicToolRenderer } from './dynamic-tool-renderer';
import { weatherRenderer } from './weather-renderer';
import type { MessageRenderer } from './types';

// Register all default renderers (cast to base type for registry)
rendererRegistry.register(textRenderer as MessageRenderer);
rendererRegistry.register(reasoningRenderer as MessageRenderer);
rendererRegistry.register(networkRenderer as MessageRenderer);
rendererRegistry.register(toolRenderer as MessageRenderer);
rendererRegistry.register(dynamicToolRenderer as MessageRenderer);
rendererRegistry.register(weatherRenderer as MessageRenderer);
