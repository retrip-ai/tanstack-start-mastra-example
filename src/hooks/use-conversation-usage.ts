import type { UIMessage } from '@ai-sdk/react';
import { useMemo } from 'react';

const MAX_CONTEXT_TOKENS = 1_000_000; // 1M tokens para Gemini

type ConversationUsage = {
	totalTokens: number;
	maxTokens: number;
};

export function useConversationUsage(messages: UIMessage[]): ConversationUsage {
	return useMemo(() => {
		let totalTokens = 0;

		for (const message of messages) {
			for (const part of message.parts) {
				if (part.type === 'data-network' && 'data' in part) {
					const data = (part as any).data;
					if (data?.usage?.totalTokens) {
						totalTokens += data.usage.totalTokens;
					}
				}
			}
		}

		return {
			totalTokens,
			maxTokens: MAX_CONTEXT_TOKENS,
		};
	}, [messages]);
}
