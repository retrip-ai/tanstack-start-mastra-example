import type { HistoryState } from '@tanstack/react-router';
import { useNavigate } from '@tanstack/react-router';
import { useCallback } from 'react';

interface ChatNavigationState extends HistoryState {
	initialMessage?: string;
}

/**
 * Hook para manejar navegación al chat con mensaje inicial
 * @returns Función para navegar al chat con threadId y mensaje inicial
 */
export function useChatNavigation() {
	const navigate = useNavigate();

	const navigateToChat = useCallback(
		(threadId: string, initialMessage: string) => {
			navigate({
				to: '/chat/$threadId',
				params: { threadId },
				replace: true,
				search: { new: true },
				state: {
					initialMessage,
				} as ChatNavigationState,
			});
		},
		[navigate]
	);

	return { navigateToChat };
}
