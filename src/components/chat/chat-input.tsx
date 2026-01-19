import { GlobeIcon } from 'lucide-react';
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
}: ChatInputProps) {
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			onSubmit(e as unknown as React.FormEvent);
		}
	};

	return (
		<form onSubmit={onSubmit}>
			<PromptInput onSubmit={() => { }}>
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

					<PromptInputSubmit disabled={disabled} status={status} />
				</PromptInputFooter>
			</PromptInput>
		</form>
	);
}
