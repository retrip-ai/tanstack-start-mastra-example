import { rendererRegistry, type GenericPart, type StreamStatus } from './renderers';

interface MessagePartRendererProps {
	part: GenericPart;
	partIndex: number;
	isLastMessage: boolean;
	status: StreamStatus;
	hasTextPart: boolean;
	allParts: GenericPart[];
}

/**
 * MessagePartRenderer - Composable Message Part Rendering
 *
 * This component uses the RendererRegistry to find and render
 * the appropriate component for each message part type.
 *
 * To add a new part type, create a renderer and register it:
 * ```ts
 * import { rendererRegistry } from './renderers';
 *
 * const myRenderer: MessageRenderer<MyPart> = {
 *   type: 'my-type',
 *   canRender: (part): part is MyPart => part.type === 'my-type',
 *   Component: MyRendererComponent,
 *   priority: 10,
 * };
 *
 * rendererRegistry.register(myRenderer);
 * ```
 */
export function MessagePartRenderer({
	part,
	partIndex,
	isLastMessage,
	status,
	hasTextPart,
	allParts,
}: MessagePartRendererProps) {
	// Get the appropriate renderer for this part type
	const renderer = rendererRegistry.getRenderer(part);

	// If no renderer found, return null (unknown part type)
	if (!renderer) {
		// Log warning in development for unknown part types
		if (process.env.NODE_ENV === 'development') {
			console.warn(`[MessagePartRenderer] No renderer found for part type: ${part.type}`);
		}
		return null;
	}

	// Render using the found renderer's component
	const { Component } = renderer;

	return (
		<Component
			part={part}
			partIndex={partIndex}
			isLastMessage={isLastMessage}
			status={status}
			hasTextPart={hasTextPart}
			allParts={allParts}
		/>
	);
}
