import type { UIMessage } from '@ai-sdk/react';
import { getTextFromPart, isNetworkMessage } from '@/lib/utils';

/**
 * Filters out internal system messages that should not be displayed to the user.
 * This includes:
 * - Completion Check Results (network routing metadata)
 * - Network execution JSON messages
 * - Messages with no displayable content
 * - Reasoning parts (only shown during streaming, not in history)
 */
export function filterDisplayableMessages(messages: UIMessage[]): UIMessage[] {
	return messages
		.map((message) => {
			// Remove reasoning parts from historical messages
			// Reasoning should only be shown during streaming
			const filteredParts = message.parts
				.filter((part) => part.type !== 'reasoning')
				.map((part) => {
					// Also remove task.reason from data-network parts (historical messages)
					if (part.type === 'data-network' && 'data' in part) {
						const networkPart = part as any;
						return {
							...networkPart,
							data: {
								...networkPart.data,
								steps: networkPart.data.steps?.map((step: any) => {
									if (step.task?.reason) {
										const { task, ...restStep } = step;
										// biome-ignore lint/correctness/noUnusedVariables: reason is being removed intentionally
										const { reason, ...restTask } = task;
										return {
											...restStep,
											task: restTask,
										};
									}
									return step;
								}),
							},
						};
					}
					return part;
				});
			return {
				...message,
				parts: filteredParts,
			};
		})
		.filter((message) => {
			const metadata = message.metadata as Record<string, unknown> | undefined;

			// Filter out "Completion Check" messages from network routing
			if (metadata?.mode === 'network' && metadata?.completionResult) {
				return false;
			}

			// Filter out messages that are network execution JSON
			const textPart = message.parts.find((p) => p.type === 'text');
			const textContent = textPart ? getTextFromPart(textPart) : undefined;
			if (textContent && isNetworkMessage(textContent)) {
				return false;
			}

			// Check if message has any displayable content
			// We display tools, network data, and text (reasoning is filtered out above)
			const hasDisplayableContent = message.parts.some((part) => {
				// Text content (non-empty)
				if (part.type === 'text') {
					const text = getTextFromPart(part);
					return text && text.trim() !== '';
				}
				// Tool calls - displayable
				if (part.type.startsWith('tool-')) {
					return true;
				}
				// Network execution data - displayable
				if (part.type === 'data-network') {
					return true;
				}
				// Dynamic tool parts (from resolved network messages)
				if (part.type === 'dynamic-tool') {
					return true;
				}
				return false;
			});

			return hasDisplayableContent;
		});
}
