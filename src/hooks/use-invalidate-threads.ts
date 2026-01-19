import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { mastraQueryKeys, threadsQueryOptions } from '@/lib/mastra-queries';

/**
 * Hook para invalidar la caché de threads y mensajes
 * Útil después de crear o actualizar conversaciones
 * @returns Funciones para invalidar threads y mensajes con delay opcional
 */
export function useInvalidateThreads() {
	const queryClient = useQueryClient();

	const invalidateThreads = useCallback(
		(delay = 1000) => {
			setTimeout(() => {
				queryClient.invalidateQueries({
					queryKey: threadsQueryOptions().queryKey,
				});
			}, delay);
		},
		[queryClient]
	);

	const invalidateThreadMessages = useCallback(
		(threadId: string, delay = 500) => {
			setTimeout(() => {
				queryClient.invalidateQueries({
					queryKey: mastraQueryKeys.messages(threadId),
				});
			}, delay);
		},
		[queryClient]
	);

	return { invalidateThreads, invalidateThreadMessages };
}
