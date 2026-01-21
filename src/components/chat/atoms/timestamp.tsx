import { memo, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface TimestampProps {
    /** Date to display */
    date: Date | string | number;
    /** Format style */
    format?: 'relative' | 'time' | 'full';
    /** Additional className */
    className?: string;
}

/**
 * Timestamp component for displaying message times.
 * Supports relative ("2 min ago"), time ("14:30"), or full format.
 * 
 * @example
 * ```tsx
 * <Timestamp date={message.createdAt} format="relative" />
 * <Timestamp date={new Date()} format="time" />
 * ```
 */
export const Timestamp = memo<TimestampProps>(({ date, format = 'relative', className }) => {
    const formattedDate = useMemo(() => {
        const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

        switch (format) {
            case 'relative':
                return formatDistanceToNow(dateObj, { addSuffix: true });
            case 'time':
                return dateObj.toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                });
            case 'full':
                return dateObj.toLocaleString();
            default:
                return formatDistanceToNow(dateObj, { addSuffix: true });
        }
    }, [date, format]);

    return (
        <time
            className={cn('text-xs text-muted-foreground', className)}
            dateTime={typeof date === 'object' ? date.toISOString() : new Date(date).toISOString()}
        >
            {formattedDate}
        </time>
    );
});

Timestamp.displayName = 'Timestamp';
