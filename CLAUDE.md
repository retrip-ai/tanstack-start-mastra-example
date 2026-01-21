# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

```bash
# Start development servers (Mastra backend + Vite frontend + AI DevTools)
bun run dev

# Run individual servers
bun run mastra:dev   # Mastra backend on localhost:4111
bun run vite:dev     # Frontend on localhost:3000

# Build and test
bun run build        # Production build
bun run test         # Run all tests with Vitest
bun run preview      # Preview production build

# Code quality
bun run check        # Run Biome linting and formatting checks
bun run lint         # Check for linting issues
bun run format       # Auto-format code
```

## Architecture Overview

### Tech Stack
- **Frontend Framework**: TanStack Start (SSR React framework)
- **AI Framework**: Mastra (agent orchestration and memory)
- **Streaming**: AI SDK v6 with real-time event streaming
- **State Management**: TanStack Query for server state
- **Database**: SQLite via LibSQL for thread persistence

### Agent Network Architecture

The application uses a **routing agent** pattern that delegates to specialized sub-agents:

```
User Message → Routing Agent → Weather Agent
                            ↘ Destinations Agent
                            ↘ Web Search Tool (Perplexity Sonar)
```

**Key agents:**
- `routing-agent` (src/mastra/agents/routing-agent.ts): Main orchestrator using Gemini 3 Flash Preview
- `weather-agent` (src/mastra/agents/weather-agent.ts): Weather data retrieval
- `destinations-agent` (src/mastra/agents/destinations-agent.ts): Travel recommendations

### Stream Event System

The app handles multiple stream event types with specialized UI components:

- **text**: Regular AI responses → `MessageResponse`
- **tool-web-search**: Web search with citations → `Sources`
- **data-network**: Agent routing decisions → `NetworkExecution`
- **reasoning**: Model thinking process → `Reasoning`
- **tool-\***: Other tool invocations → `Tool`

Stream events flow: Backend (Mastra) → SSE → useChat hook → MessagePartRenderer → UI Components

### Message Processing Pipeline

1. **Sending**: `useChat()` → `DefaultChatTransport` → POST `/chat` → `networkRoute()` → agents
2. **Loading History**: `useQuery()` → `listThreadMessages()` → `toAISdkV5Messages()` → `resolveInitialMessages()` → `filterDisplayableMessages()`
3. **Rendering**: Messages are processed through `MessagePartRenderer` which dynamically renders components based on `part.type`

### Key Configuration Files

- **src/mastra/index.ts**: Mastra server configuration with agents, storage, and API routes
- **src/mastra/memory.ts**: Thread memory with auto title generation using Gemini Flash Lite
- **src/lib/constants.ts**: Environment variables (GOOGLE_GENERATIVE_AI_API_KEY, PERPLEXITY_API_KEY)
- **vite.config.mts**: Vite configuration with TanStack Start, Tailwind, and Nitro plugins

### Web Search Integration

When `webSearchEnabled` is true:
1. Request context passes flag through middleware
2. Routing agent prioritizes web search for current information
3. Perplexity Sonar returns text with citations and source metadata
4. UI renders sources with title, description, and last updated info

### Development Workflow

The project uses:
- **Bun** as the package manager and runtime
- **Biome** for linting and formatting (configured in biome.json)
- **TypeScript** with strict mode and path aliases (@/*)
- **Concurrent development** running Mastra + Vite + AI DevTools simultaneously

### Testing Strategy

Tests use Vitest and can be run with `bun run test`. Focus areas:
- Message filtering logic in `filter-displayable-messages.ts`
- Network message resolution in `resolve-initial-messages.ts`
- Stream event handling in chat components