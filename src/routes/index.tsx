import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion';
import { ChatEmptyState, ChatInput, ChatLayout } from '@/components/chat';
import { useChatNavigation } from '@/hooks/use-chat-navigation';

export const Route = createFileRoute('/')({
	loader: () => {
		return { threadId: uuidv4() };
	},
	component: HomePage,
});

const suggestions = [
	'Where can I travel for a beach vacation?',
	"What's the weather like in Tokyo?",
	'Recommend me a mountain destination',
	'Best places to visit in Europe',
];

function HomePage() {
	const { threadId } = Route.useLoaderData();
	const [inputValue, setInputValue] = useState('');
	const { navigateToChat } = useChatNavigation();

	const handleSubmit = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			if (!inputValue.trim()) return;

			navigateToChat(threadId, inputValue);
		},
		[inputValue, navigateToChat, threadId]
	);

	const handleSuggestionClick = useCallback(
		(suggestion: string) => {
			navigateToChat(threadId, suggestion);
		},
		[navigateToChat, threadId]
	);

	return (
		<ChatLayout>
			<ChatEmptyState />

			<div className="grid shrink-0 gap-4 pt-4">
				<Suggestions>
					{suggestions.map((suggestion) => (
						<Suggestion
							key={suggestion}
							onClick={() => handleSuggestionClick(suggestion)}
							suggestion={suggestion}
						/>
					))}
				</Suggestions>

				<ChatInput
					disabled={!inputValue.trim()}
					onChange={setInputValue}
					onSubmit={handleSubmit}
					value={inputValue}
				/>
			</div>
		</ChatLayout>
	);
}
