'use client';

import { CloudIcon, DropletsIcon, ThermometerIcon, WindIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface WeatherData {
    temperature: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    windGust: number;
    conditions: string;
    location: string;
}

interface WeatherCardProps extends ComponentProps<'div'> {
    data: WeatherData;
}

/**
 * WeatherCard Component
 * A standalone, reusable weather display card matching the Tool component styling.
 */
export function WeatherCard({ data, className, ...props }: WeatherCardProps) {
    return (
        <div
            className={cn('not-prose mb-4 w-full rounded-md border', className)}
            {...props}
        >
            {/* Header - matches ToolHeader styling */}
            <div className="flex w-full items-center justify-between gap-4 p-3">
                <div className="flex items-center gap-2">
                    <CloudIcon className="size-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{data.location}</span>
                    <Badge className="gap-1.5 rounded-full text-xs" variant="secondary">
                        {data.conditions}
                    </Badge>
                </div>
            </div>

            {/* Content - matches ToolContent styling */}
            <div className="border-t p-4 space-y-4">
                {/* Temperature display */}
                <div className="flex items-end gap-3">
                    <div className="flex items-center gap-2">
                        <ThermometerIcon className="size-5 text-muted-foreground" />
                        <span className="text-3xl font-bold tracking-tight">
                            {Math.round(data.temperature)}°C
                        </span>
                    </div>
                    <span className="mb-1 text-sm text-muted-foreground">
                        Feels like {Math.round(data.feelsLike)}°C
                    </span>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 rounded-md bg-muted/50 p-2">
                        <DropletsIcon className="size-4 text-muted-foreground" />
                        <div className="flex flex-col">
                            <span className="text-xs uppercase text-muted-foreground font-medium tracking-wide">
                                Humidity
                            </span>
                            <span className="text-sm font-medium">{data.humidity}%</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-md bg-muted/50 p-2">
                        <WindIcon className="size-4 text-muted-foreground" />
                        <div className="flex flex-col">
                            <span className="text-xs uppercase text-muted-foreground font-medium tracking-wide">
                                Wind
                            </span>
                            <span className="text-sm font-medium">{data.windSpeed} km/h</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Type guard to check if an object is valid WeatherData
 */
export function isWeatherData(data: unknown): data is WeatherData {
    if (!data || typeof data !== 'object') return false;
    const d = data as Record<string, unknown>;
    return (
        typeof d.temperature === 'number' &&
        typeof d.location === 'string' &&
        typeof d.conditions === 'string'
    );
}
