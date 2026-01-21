import { memo } from 'react';
import { Loader2Icon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreamingIndicatorProps {
    /** Text to show alongside the indicator */
    text?: string;
    /** Additional className */
    className?: string;
}

/**
 * Streaming indicator component.
 * Shows an animated spinner to indicate content is being streamed.
 * 
 * @example
 * ```tsx
 * {isStreaming && <StreamingIndicator />}
 * {isStreaming && <StreamingIndicator text="Thinking..." />}
 * ```
 */
export const StreamingIndicator = memo<StreamingIndicatorProps>(({ text, className }) => {
    return (
        <span className={cn('inline-flex items-center gap-1.5 text-muted-foreground', className)}>
            <Loader2Icon className="size-3 animate-spin" />
            {text && <span className="text-xs">{text}</span>}
        </span>
    );
});

StreamingIndicator.displayName = 'StreamingIndicator';

/**
 * Typing dots animation
 */
export const TypingDots = memo<{ className?: string }>(({ className }) => {
    return (
        <span className={cn('inline-flex items-center gap-0.5', className)}>
            <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
            <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
            <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
        </span>
    );
});

TypingDots.displayName = 'TypingDots';
