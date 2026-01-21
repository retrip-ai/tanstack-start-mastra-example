import type { GenericPart, MessageRenderer } from './types';

/**
 * Registry for message part renderers.
 *
 * Allows registration of custom renderers for different message part types.
 * Renderers are matched by the `canRender` predicate and sorted by priority.
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
 * if (renderer) {
 *   return <renderer.Component part={part} {...otherProps} />;
 * }
 * ```
 */
export class RendererRegistry {
    private renderers = new Map<string, MessageRenderer>();
    private sortedRenderers: MessageRenderer[] = [];

    /**
     * Register a new renderer
     */
    register(renderer: MessageRenderer): void {
        this.renderers.set(renderer.type, renderer);
        this.updateSortedRenderers();
    }

    /**
     * Unregister a renderer by type
     */
    unregister(type: string): void {
        this.renderers.delete(type);
        this.updateSortedRenderers();
    }

    /**
     * Update the sorted renderers list by priority
     */
    private updateSortedRenderers(): void {
        this.sortedRenderers = Array.from(this.renderers.values()).sort(
            (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
        );
    }

    /**
     * Get the appropriate renderer for a message part.
     * Checks all renderers by priority order, allowing specialized renderers
     * to override generic ones.
     */
    getRenderer(part: GenericPart): MessageRenderer | null {
        // Check all renderers by priority (highest first)
        // This allows specialized renderers (e.g., weatherRenderer for weatherTool)
        // to take precedence over generic renderers (e.g., toolRenderer)
        for (const renderer of this.sortedRenderers) {
            if (renderer.canRender(part)) {
                return renderer;
            }
        }

        return null;
    }

    /**
     * Get all registered renderer types
     */
    getRegisteredTypes(): string[] {
        return Array.from(this.renderers.keys());
    }

    /**
     * Check if a renderer is registered for a type
     */
    hasRenderer(type: string): boolean {
        return this.renderers.has(type);
    }
}

/**
 * Singleton instance of the renderer registry
 */
export const rendererRegistry = new RendererRegistry();
