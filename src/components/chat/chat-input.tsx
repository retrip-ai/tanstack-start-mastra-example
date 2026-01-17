import { GlobeIcon } from 'lucide-react';
import { Context, ContextContent, ContextTrigger } from '@/components/ai-elements/context';
import {
	PromptInput,
	PromptInputActionAddAttachments,
	PromptInputActionMenu,
	PromptInputActionMenuContent,
	PromptInputActionMenuTrigger,
	PromptInputBody,
	PromptInputButton,
	PromptInputFooter,
	PromptInputSubmit,
	PromptInputTextarea,
	PromptInputTools,
} from '@/components/ai-elements/prompt-input';

interface ChatInputProps {
	value: string;
	onChange: (value: string) => void;
	onSubmit: (e: React.FormEvent) => void;
	disabled?: boolean;
	status?: 'ready' | 'streaming' | 'submitted' | 'error';
	placeholder?: string;
	contextUsage?: {
		totalTokens: number;
		maxTokens: number;
	};
	messagesCount?: number;
}

export function ChatInput({
	value,
	onChange,
	onSubmit,
	disabled,
	status = 'ready',
	placeholder = 'Ask about travel destinations...',
	contextUsage,
	messagesCount = 0,
}: ChatInputProps) {
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			onSubmit(e as unknown as React.FormEvent);
		}
	};

	return (
		<form onSubmit={onSubmit}>
			<PromptInput onSubmit={() => {}}>
				<PromptInputBody>
					<PromptInputTextarea
						onChange={(e) => onChange(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder={placeholder}
						value={value}
					/>
				</PromptInputBody>
				<PromptInputFooter>
					<PromptInputTools>
						<PromptInputActionMenu>
							<PromptInputActionMenuTrigger />
							<PromptInputActionMenuContent>
								<PromptInputActionAddAttachments />
							</PromptInputActionMenuContent>
						</PromptInputActionMenu>
						<PromptInputButton>
							<GlobeIcon size={16} />
							<span>Search</span>
						</PromptInputButton>
					</PromptInputTools>

					<div className="flex items-center gap-2 ml-auto">
						{/* Context usage - solo mostrar si hay más de un mensaje */}
						{contextUsage && messagesCount > 1 && contextUsage.totalTokens > 0 && (
							<Context maxTokens={contextUsage.maxTokens} usedTokens={contextUsage.totalTokens}>
								<ContextTrigger />
								<ContextContent>
									<div className="p-3">
										<div className="flex items-center justify-between gap-3 text-xs">
											<span className="font-medium text-muted-foreground">
												{new Intl.NumberFormat('en-US', {
													notation: 'compact',
													maximumFractionDigits: 1,
												}).format(contextUsage.totalTokens)}{' '}
												/{' '}
												{new Intl.NumberFormat('en-US', {
													notation: 'compact',
													maximumFractionDigits: 0,
												}).format(contextUsage.maxTokens)}{' '}
												context used
											</span>
										</div>
									</div>
								</ContextContent>
							</Context>
						)}

						<PromptInputSubmit disabled={disabled} status={status} />
					</div>
				</PromptInputFooter>
			</PromptInput>
		</form>
	);
}
