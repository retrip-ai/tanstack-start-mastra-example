import { useChat } from '@ai-sdk/react';
import { createFileRoute, redirect, useNavigate, useRouterState } from '@tanstack/react-router';
import { DefaultChatTransport } from 'ai';
import { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import {
	Conversation,
	ConversationContent,
	ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Loader } from '@/components/ai-elements/loader';
import {
	Message,
	MessageContent,
} from '@/components/ai-elements/message';
import { ChatEmptyState, ChatInput, ChatLayout, MessagePartRenderer } from '@/components/chat';
import { useInvalidateThreads } from '@/hooks/use-invalidate-threads';
import { hasRenderableContent } from '@/lib/chat-utils';
import { MASTRA_BASE_URL, RESOURCE_ID } from '@/lib/constants';
import { threadMessagesQueryOptions } from '@/lib/mastra-queries';

const chatSearchSchema = z.object({
	new: z.boolean().optional(),
});

export const Route = createFileRoute('/chat/$threadId')({
	validateSearch: chatSearchSchema,
	loaderDeps: ({ search }) => ({ isNew: search.new }),
	loader: async ({ params, context, deps }) => {
		const { threadId } = params;
		const isNewChat = deps.isNew === true;

		// Si es un chat nuevo, no validar existencia (el thread se creará al enviar el primer mensaje)
		if (isNewChat) {
			return {
				initialMessages: [] as any,
				threadExists: true, // Consideramos que "existe" para evitar redirección
			};
		}

		// Prefetch mensajes del thread usando query options
		// Usamos ensureQueryData porque necesitamos los datos para el componente
		const data = await context.queryClient.ensureQueryData(threadMessagesQueryOptions(threadId));

		// Si el thread no existe, redirigir a home
		if (!data.exists) {
			throw redirect({ to: '/' });
		}

		return {
			initialMessages: data.messages as any,
			threadExists: data.exists,
		};
	},
	component: ChatPage,
});

function ChatPage() {
	const { threadId } = Route.useParams();
	const { new: isNewChat } = Route.useSearch();
	const loaderData = Route.useLoaderData();
	const initialMessages = loaderData.initialMessages;
	const routerState = useRouterState();
	const [inputValue, setInputValue] = useState('');
	const initialMessageSentRef = useRef(false);
	const navigate = useNavigate();
	const { invalidateThreads } = useInvalidateThreads();

	// Obtener el mensaje inicial del estado de navegación
	const initialMessage = (routerState.location.state as { initialMessage?: string })
		?.initialMessage;

	const { messages, sendMessage, status } = useChat({
		id: threadId,
		messages: initialMessages,
		generateId: () => uuidv4(),
		transport: new DefaultChatTransport({
			api: `${MASTRA_BASE_URL}/chat`,
			prepareSendMessagesRequest({ messages, id }) {
				const body = {
					id,
					messages: messages.length > 0 ? [messages[messages.length - 1]] : [],
					memory: {
						thread: threadId,
						resource: RESOURCE_ID,
					},
				};

				return {
					body,
				};
			},
		}),
	});

	// Enviar mensaje inicial si viene del estado de navegación
	useEffect(() => {
		if (isNewChat && initialMessage && !initialMessageSentRef.current && status !== 'streaming') {
			initialMessageSentRef.current = true;
			sendMessage({ text: initialMessage });

			// Limpiar el param ?new de la URL
			navigate({
				to: '/chat/$threadId',
				params: { threadId },
				search: {}, // Sin el param new
				replace: true,
			});

			// Invalidar threads después de enviar mensaje
			invalidateThreads();
		}
	}, [isNewChat, initialMessage, status, sendMessage, navigate, threadId, invalidateThreads]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!inputValue.trim() || status === 'streaming') return;

		sendMessage({ text: inputValue });
		setInputValue('');

		// Invalidate threads after sending message
		invalidateThreads();
	};

	return (
		<ChatLayout>
			<Conversation className="flex-1">
				<ConversationContent>
					{messages.length === 0 ? (
						<ChatEmptyState />
					) : (
						messages.map((message, index) => {
							// Check if message has any renderable content
							if (!hasRenderableContent(message as any)) return null;

							return (
								<Message from={message.role} key={message.id}>
									<MessageContent>
										{message.parts.map((part, partIndex) => {
											const hasTextPart = message.parts.some(
												(p) => p.type === 'text' && 'text' in p && (p.text as string)?.trim(),
											);
											return (
												<MessagePartRenderer
													hasTextPart={hasTextPart}
													isLastMessage={index === messages.length - 1}
													key={partIndex}
													part={part}
													partIndex={partIndex}
													status={status}
												/>
											);
										})}
									</MessageContent>
								</Message>
							);
						})
					)}
					{status === 'streaming' && (
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<Loader size={14} />
							<span>Thinking...</span>
						</div>
					)}
				</ConversationContent>
				<ConversationScrollButton />
			</Conversation>

			<div className="grid shrink-0 gap-4 pt-4">
				<ChatInput
					disabled={!inputValue.trim() || status === 'streaming'}
					onChange={setInputValue}
					onSubmit={handleSubmit}
					status={status}
					value={inputValue}
				/>
			</div>
		</ChatLayout>
	);
}
