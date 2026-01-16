import type { NetworkDataPart } from '@mastra/ai-sdk';
import type { ToolUIPart } from 'ai';
import { MessageResponse } from '@/components/ai-elements/message';
import { NetworkExecution } from '@/components/ai-elements/network-execution';
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/components/ai-elements/reasoning';
import {
	Tool,
	ToolContent,
	ToolHeader,
	ToolInput,
	ToolOutput,
} from '@/components/ai-elements/tool';

interface MessagePartRendererProps {
	part: {
		type: string;
		[key: string]: unknown;
	};
	partIndex: number;
	isLastMessage: boolean;
	status: 'ready' | 'streaming' | 'submitted' | 'error';
}

export function MessagePartRenderer({
	part,
	partIndex,
	isLastMessage,
	status,
}: MessagePartRendererProps) {
	// Text content
	if (part.type === 'text' && 'text' in part) {
		const text = part.text as string;
		if (!text || text.trim() === '') return null;
		return <MessageResponse key={partIndex}>{text}</MessageResponse>;
	}

	// Reasoning/thinking content - only show during streaming on the last message
	if (part.type === 'reasoning' && 'text' in part) {
		// Only render reasoning if we're streaming and this is the last message
		if (status !== 'streaming' || !isLastMessage) {
			return null;
		}
		const text = part.text as string;
		return (
			<Reasoning isStreaming={status === 'streaming'} key={partIndex}>
				<ReasoningTrigger />
				<ReasoningContent>{text}</ReasoningContent>
			</Reasoning>
		);
	}

	// Network execution (agent networks)
	if (part.type === 'data-network' && 'data' in part) {
		const networkPart = part as NetworkDataPart;
		const networkData = networkPart.data;

		// Extraer el razonamiento del primer step con task.reason
		const stepWithTask = networkData.steps?.find((s) => (s as any).task?.reason) as
			| { task: { reason: string } }
			| undefined;
		const reasoningText = stepWithTask?.task?.reason;

		return (
			<div className="space-y-2" key={partIndex}>
				{/* Mostrar reasoning si existe (solo estará presente durante/después del streaming, no al recargar) */}
				{reasoningText && (
					<Reasoning isStreaming={status === 'streaming'}>
						<ReasoningTrigger />
						<ReasoningContent>{reasoningText}</ReasoningContent>
					</Reasoning>
				)}
				{/* NetworkExecution para detalles técnicos */}
				<NetworkExecution data={networkData} isStreaming={status === 'streaming'} />
			</div>
		);
	}

	// Dynamic tool (network execution results from memory)
	if (part.type === 'dynamic-tool' && 'output' in part) {
		const dynamicPart = part as {
			type: 'dynamic-tool';
			toolCallId: string;
			toolName: string;
			state: string;
			input: unknown;
			output: {
				childMessages?: Array<{
					type: 'tool' | 'text';
					toolCallId?: string;
					toolName?: string;
					args?: Record<string, unknown>;
					toolOutput?: Record<string, unknown>;
					content?: string;
				}>;
				result?: string;
			};
		};

		return (
			<div className="space-y-2" key={partIndex}>
				{dynamicPart.output?.childMessages?.map((child, childIndex) => {
					if (child.type === 'tool') {
						return (
							<Tool key={childIndex}>
								<ToolHeader
									state="output-available"
									title={child.toolName || 'Tool'}
									type={`tool-${child.toolName}`}
								/>
								<ToolContent>
									{child.args && <ToolInput input={child.args} />}
									{child.toolOutput && (
										<ToolOutput errorText={undefined} output={child.toolOutput} />
									)}
								</ToolContent>
							</Tool>
						);
					}
					if (child.type === 'text' && child.content) {
						return <MessageResponse key={childIndex}>{child.content}</MessageResponse>;
					}
					return null;
				})}
			</div>
		);
	}

	// Tool calls (tool-{toolKey})
	if (part.type.startsWith('tool-')) {
		const toolPart = part as ToolUIPart;
		return (
			<Tool key={partIndex}>
				<ToolHeader
					state={toolPart.state}
					title={toolPart.type.replace('tool-', '')}
					type={toolPart.type}
				/>
				<ToolContent>
					{toolPart.input !== undefined && toolPart.input !== null && (
						<ToolInput input={toolPart.input as any} />
					)}
					{(toolPart.output || toolPart.errorText) && (
						<ToolOutput errorText={toolPart.errorText} output={toolPart.output as any} />
					)}
				</ToolContent>
			</Tool>
		);
	}

	return null;
}
