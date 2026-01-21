import { memo } from 'react';
import { BotIcon, UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type AvatarRole = 'user' | 'assistant' | 'system';
type AvatarSize = 'sm' | 'md' | 'lg';

interface ChatAvatarProps {
    /** Role determines the icon and styling */
    role: AvatarRole;
    /** Size of the avatar */
    size?: AvatarSize;
    /** Additional className */
    className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
    sm: 'size-6',
    md: 'size-8',
    lg: 'size-10',
};

const iconSizeClasses: Record<AvatarSize, string> = {
    sm: 'size-3',
    md: 'size-4',
    lg: 'size-5',
};

/**
 * Avatar component for chat messages.
 * Displays different icons based on the message role.
 * 
 * @example
 * ```tsx
 * <ChatAvatar role="user" size="md" />
 * <ChatAvatar role="assistant" size="lg" />
 * ```
 */
export const ChatAvatar = memo<ChatAvatarProps>(({ role, size = 'md', className }) => {
    const isUser = role === 'user';

    return (
        <div
            className={cn(
                'flex shrink-0 items-center justify-center rounded-full',
                sizeClasses[size],
                isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                className
            )}
        >
            {isUser ? (
                <UserIcon className={iconSizeClasses[size]} />
            ) : (
                <BotIcon className={iconSizeClasses[size]} />
            )}
        </div>
    );
});

ChatAvatar.displayName = 'ChatAvatar';
