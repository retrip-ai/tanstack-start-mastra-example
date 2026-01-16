import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { threadsQueryOptions } from '@/lib/mastra-queries';

/**
 * Hook para invalidar la caché de threads
 * Útil después de crear o actualizar conversaciones
 * @returns Función para invalidar threads con delay opcional
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

	return { invalidateThreads };
}
