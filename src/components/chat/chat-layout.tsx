interface ChatLayoutProps {
	children: React.ReactNode;
}

export function ChatLayout({ children }: ChatLayoutProps) {
	return (
		<div className="relative flex h-full w-full flex-col overflow-hidden">
			<div className="mx-auto flex size-full max-w-4xl flex-col p-6">{children}</div>
		</div>
	);
}
