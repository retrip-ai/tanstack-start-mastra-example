/**
 * Utilidades para manejo de mensajes de chat
 */

interface UIMessage {
	id: string;
	role: 'user' | 'assistant';
	parts: Array<{
		type: string;
		text?: string;
		[key: string]: unknown;
	}>;
}

/**
 * Extrae el texto completo de un mensaje
 * Filtra solo las partes de tipo 'text' y las concatena
 * @param message - Mensaje del chat
 * @returns Texto completo del mensaje
 */
export function getMessageText(message: UIMessage): string {
	return message.parts
		.filter((part): part is { type: 'text'; text: string } => part.type === 'text')
		.map((part) => part.text)
		.join('');
}

/**
 * Extrae el texto de un part tipo data-network
 * @param part - Part del mensaje
 * @returns Texto del campo output si existe
 */
export function getTextFromNetworkPart(part: {
	type: string;
	data?: { output?: string };
}): string | undefined {
	if (part.type === 'data-network' && part.data?.output) {
		return part.data.output;
	}
	return undefined;
}

/**
 * Verifica si un mensaje tiene contenido renderizable
 * @param message - Mensaje del chat
 * @returns true si el mensaje tiene contenido para mostrar
 */
export function hasRenderableContent(message: UIMessage): boolean {
	return message.parts.some((part) => {
		if (part.type === 'text' && 'text' in part) {
			const text = part.text as string;
			return text && text.trim() !== '';
		}
		return (
			part.type === 'reasoning' ||
			part.type === 'data-network' ||
			part.type === 'dynamic-tool' ||
			part.type.startsWith('tool-')
		);
	});
}
