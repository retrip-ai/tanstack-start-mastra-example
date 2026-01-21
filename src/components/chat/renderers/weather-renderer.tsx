import { memo } from 'react';
import { isWeatherData, WeatherCard } from '@/components/ai-elements/weather-card';
import type { MessageRenderer, RendererProps, ToolPart } from './types';
import { isToolPart } from './types';

const WeatherRendererComponent = memo<RendererProps<ToolPart>>(({ part }) => {
    // Support both Vercel AI SDK 'result' and mapped 'output' properties
    const output = part.output || (part as unknown as { result: unknown }).result;

    // Only render if we have valid weather data
    if (!output || !isWeatherData(output)) return null;

    return <WeatherCard data={output} />;
});

WeatherRendererComponent.displayName = 'WeatherRenderer';

export const weatherRenderer: MessageRenderer<ToolPart> = {
    type: 'tool-call',
    // High priority to override generic tool renderer
    priority: 50,
    canRender: (part) => {
        if (!isToolPart(part)) return false;

        const toolPart = part as unknown as { toolName?: string; name?: string };
        const name = toolPart.toolName || toolPart.name;

        // Check for both potential names
        return name === 'get-weather' || name === 'weatherTool';
    },
    Component: WeatherRendererComponent as unknown as React.FC<RendererProps>,
};
