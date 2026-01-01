# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dice Art is a Next.js web application that converts images into dice mosaic art. Users upload an image, which is analyzed and converted to a grid where each cell has a target dice value (1-6) based on brightness. Users then manually fill in each cell with dice to complete the artwork.

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build
npm run lint     # ESLint
npx prisma db push       # Push schema changes to database
npx prisma generate      # Regenerate Prisma client
npx prisma studio        # Open Prisma database GUI
```

## Architecture

### Core Data Flow

1. **Image Processing** (`src/utils/imageProcessor.ts`): Uploaded images are scaled to a grid (default 50 cells on longest side), and each pixel's luminance is mapped to a DiceValue (1-6) using ITU-R BT.601 standard
2. **Grid State** (`src/types/index.ts`): `GridState` contains a 2D array of `CellState`, each with `targetValue` (what to fill) and `filledValue` (user's input)
3. **Persistence**: Work-in-progress saved to localStorage (`src/utils/storage.ts`), completed artworks saved to SQLite via Prisma

### Key Components

- **Grid** (`src/components/Grid.tsx`): Main interactive canvas. Handles mouse/touch drag painting with Bresenham's line algorithm for smooth strokes. Left-click fills, right-click/long-press clears
- **Dice/NumberCell**: Render filled dice or target number respectively
- **DicePalette**: Bottom toolbar for selecting dice value (1-6), also keyboard shortcut 1-6

### State Management

- **UserContext** (`src/contexts/UserContext.tsx`): Stores nickname in localStorage for gallery attribution
- **useAutoSave** hook: Saves work to localStorage every 60 seconds
- **useZoomPan** hook: Ctrl+wheel zoom, supports 0.5x-3x scale

### API Routes (Next.js App Router)

All under `src/app/api/artworks/`:
- `POST /api/artworks` - Upload completed artwork (requires title, authorName, gridState, imageData)
- `GET /api/artworks` - List artworks (pagination, optional author filter)
- `GET /api/artworks/[id]` - Get single artwork
- `GET /api/artworks/[id]/image` - Get full-size rendered PNG
- `GET /api/artworks/[id]/thumbnail` - Get thumbnail PNG

### Database

SQLite with Prisma ORM. Single `Artwork` model stores gridState as JSON string and imageData as base64 PNG.

## Path Aliases

`@/*` maps to `./src/*` (configured in tsconfig.json)

## Notes

- UI language is Korean
- The app uses a custom `dice-pop` animation for visual feedback when placing dice
- Export renders dice at 60px cell size with 2px gap
