interface ChatEmptyStateProps {
	title?: string;
	description?: string;
}

export function ChatEmptyState({
	title = 'Travel Assistant',
	description = 'Ask me about destinations, weather, and travel recommendations',
}: ChatEmptyStateProps) {
	return (
		<div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
			<h2 className="text-2xl font-semibold text-foreground">{title}</h2>
			<p className="text-muted-foreground">{description}</p>
		</div>
	);
}
