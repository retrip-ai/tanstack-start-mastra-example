import { memo, useCallback } from 'react';
import { CheckIcon, CopyIcon, RefreshCwIcon, ShareIcon, ThumbsDownIcon, ThumbsUpIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface MessageActionsBarProps {
    /** Text content to copy */
    textContent?: string;
    /** Handler for regenerate action */
    onRegenerate?: () => void;
    /** Handler for share action */
    onShare?: () => void;
    /** Handler for feedback */
    onFeedback?: (positive: boolean) => void;
    /** Additional className */
    className?: string;
}

/**
 * Message actions bar molecule.
 * Shows copy, regenerate, share, and feedback buttons.
 * 
 * @example
 * ```tsx
 * <MessageActionsBar 
 *   textContent={messageText}
 *   onRegenerate={handleRegenerate}
 *   onShare={handleShare}
 * />
 * ```
 */
export const MessageActionsBar = memo<MessageActionsBarProps>(
    ({ textContent, onRegenerate, onShare, onFeedback, className }) => {
        const [copied, setCopied] = useState(false);

        const handleCopy = useCallback(async () => {
            if (!textContent) return;
            await navigator.clipboard.writeText(textContent);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }, [textContent]);

        return (
            <TooltipProvider>
                <div className={cn('flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100', className)}>
                    {/* Copy button */}
                    {textContent && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon-sm" onClick={handleCopy}>
                                    {copied ? (
                                        <CheckIcon className="size-3.5 text-green-500" />
                                    ) : (
                                        <CopyIcon className="size-3.5" />
                                    )}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>{copied ? 'Copied!' : 'Copy'}</TooltipContent>
                        </Tooltip>
                    )}

                    {/* Regenerate button */}
                    {onRegenerate && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon-sm" onClick={onRegenerate}>
                                    <RefreshCwIcon className="size-3.5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Regenerate</TooltipContent>
                        </Tooltip>
                    )}

                    {/* Share button */}
                    {onShare && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon-sm" onClick={onShare}>
                                    <ShareIcon className="size-3.5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Share</TooltipContent>
                        </Tooltip>
                    )}

                    {/* Feedback buttons */}
                    {onFeedback && (
                        <>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon-sm" onClick={() => onFeedback(true)}>
                                        <ThumbsUpIcon className="size-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Good response</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon-sm" onClick={() => onFeedback(false)}>
                                        <ThumbsDownIcon className="size-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Bad response</TooltipContent>
                            </Tooltip>
                        </>
                    )}
                </div>
            </TooltipProvider>
        );
    }
);

MessageActionsBar.displayName = 'MessageActionsBar';
