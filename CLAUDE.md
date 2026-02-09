# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dice Art is a Next.js web application that converts images into dice mosaic art. Users upload an image (or select from Unsplash preset images), which is analyzed and converted to a grid where each cell has a target dice value (1-6) based on brightness. Users then manually fill in each cell with dice to complete the artwork.

This project is inspired by the amazing dice artwork of [@anna.dice.artworks](https://www.instagram.com/anna.dice.artworks/).

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build
npm run lint     # ESLint
npm test         # Run Jest unit tests
npm run test:e2e # Run Playwright E2E tests
npx prisma db push       # Push schema changes to database
npx prisma generate      # Regenerate Prisma client
npx prisma studio        # Open Prisma database GUI
```

## Architecture

### Page Structure

- `/` - Main page: project intro, image upload, redirects to `/work/[id]`
- `/work/[id]` - Work page: grid editing, auto-save, dice painting
- `/my-works` - My works: list of saved works (localStorage), continue or delete
- `/my-artworks` - My artworks: list of shared artworks (from database)
- `/gallery` - Gallery: public artworks from all users

### Core Data Flow

1. **Image Processing** (`src/utils/imageProcessor.ts`): Uploaded images are scaled to a grid (default 50 cells on longest side), and each pixel's luminance is mapped to a DiceValue (0-6) using ITU-R BT.601 standard
2. **Grid State** (`src/types/index.ts`): `GridState` contains a 2D array of `CellState`, each with `targetValue` (what to fill) and `filledValue` (user's input)
3. **Persistence**: Work-in-progress saved to localStorage (`src/utils/storage.ts`) with UUID-based multi-work support, completed artworks saved to PostgreSQL via Prisma

### Multi-Work Storage

localStorage structure for multiple works:
- `dice-art-works` - Work list (metadata: id, gridSize, progress, timestamps)
- `dice-art-work-{uuid}` - Individual work data (gridState, originalImageData)

Key functions in `src/utils/storage.ts`:
- `generateWorkId()` - UUID v4 generation
- `saveWork(id, gridState, imageData)` - Save/update work
- `loadWork(id)` - Load specific work
- `listWorks()` - Get all work entries
- `deleteWork(id)` - Remove work
- `migrateOldStorage()` - Convert old single-work format

### Key Components

- **ImageUploader** (`src/components/ImageUploader.tsx`): Handles image upload via drag-and-drop or file selection. Also provides 4 Unsplash preset images for quick start
- **CanvasGrid** (`src/components/CanvasGrid.tsx`): Main interactive grid using HTML5 Canvas for performance. Handles mouse/touch drag painting with Bresenham's line algorithm. Left-click fills, right-click/long-press clears. Uses refs for latest state access to avoid stale closures
- **Grid** (`src/components/Grid.tsx`): Legacy React component-based grid (kept for reference/rollback)
- **Dice/NumberCell**: Render filled dice or target number respectively (used in DicePalette)
- **DicePalette** (`src/components/DicePalette.tsx`): Bottom toolbar for selecting dice value (0-6) or eraser. Keyboard shortcuts: 0-6 for dice, E for eraser. Mobile layout uses 2 rows (4+4), desktop uses single row
- **VirtualJoystick** (`src/components/VirtualJoystick.tsx`): Mobile-only joystick for panning the grid view. Uses pointer events and requestAnimationFrame for smooth continuous movement
- **ZoomControls** (`src/components/ZoomControls.tsx`): Zoom in/out buttons with progress preview button. Shows current zoom percentage
- **ProgressPreviewDialog** (`src/components/ProgressPreviewDialog.tsx`): Modal dialog showing current progress as a canvas preview. Filled cells shown as dice, remaining cells as white grid
- **SectionNavigator** (`src/components/SectionNavigator.tsx`): Floating minimap for navigating large grids (50x50+). Shows section progress with bottom sheet UI, keyboard shortcuts (Shift+Arrow), and haptic feedback

### Section System (Large Grid Support)

For grids larger than 50x50 (2500+ cells), the app splits them into manageable sections:
- **sectionUtils** (`src/utils/sectionUtils.ts`): Utility functions for section layout calculation, progress tracking, and coordinate mapping
- **SectionLayout**: Grid divided into sections of max 50x50 cells (e.g., 100x100 → 2x2 sections: A1, A2, B1, B2)
- **Section Navigation**: Floating button shows current section label with circular progress. Tap to open bottom sheet with full minimap
- **Keyboard Shortcuts**: `Shift + Arrow keys` for quick section navigation
- Grid component receives `rowOffset`/`colOffset` to map section coordinates to global grid

### Canvas Rendering

- **canvasRenderer** (`src/utils/canvasRenderer.ts`): Canvas 2D drawing utilities
  - `drawDice()` - Draw single dice with scale/opacity animation support
  - `drawNumberCell()` - Draw target number cell
  - `renderGrid()` - Render entire grid
  - `renderCellDirect()` - Immediate cell rendering (bypasses React state)
  - `getCellFromPoint()` - Convert canvas coordinates to cell index
- **dice-pop animation**: Implemented via requestAnimationFrame loop (150ms duration)
  - Scale: 0.8 → 1.1 → 1.0
  - Opacity: 0.5 → 1.0
  - Animation state tracked in `animationsRef` Map

### State Management

- **UserContext** (`src/contexts/UserContext.tsx`): Stores nickname in localStorage for gallery attribution
- **useAutoSave** hook: Saves work to localStorage every 60 seconds (requires workId)
- **useZoomPan** hook: Ctrl+wheel zoom, supports 0.5x-3x scale

### API Routes (Next.js App Router)

All under `src/app/api/artworks/`:
- `POST /api/artworks` - Upload completed artwork (requires title, authorName, gridState, imageData)
- `GET /api/artworks` - List artworks (pagination, optional author filter)
- `GET /api/artworks/[id]` - Get single artwork
- `GET /api/artworks/[id]/image` - Get full-size rendered PNG
- `GET /api/artworks/[id]/thumbnail` - Get thumbnail PNG

### Database

PostgreSQL (Neon) with Prisma ORM. Single `Artwork` model stores gridState as JSON string and imageData as base64 PNG.

### SEO

- Comprehensive metadata in `src/app/layout.tsx` (Open Graph, Twitter Cards, JSON-LD)
- Dynamic sitemap (`src/app/sitemap.ts`) includes gallery artworks
- robots.txt via `src/app/robots.ts`
- Page-specific metadata in gallery and my-artworks layouts
- PWA manifest at `public/manifest.json`

## Path Aliases

`@/*` maps to `./src/*` (configured in tsconfig.json)

## Testing

### Unit Tests (Jest)
- Located in `src/__tests__/` directory
- Uses `@testing-library/react` for component testing
- Run with `npm test`

### E2E Tests (Playwright)
- Located in `e2e/` directory
- `desktop.spec.ts` - Desktop browser tests
- `mobile-touch.spec.ts` - Mobile touch interaction tests (single finger drag, two-finger pan, long press, eraser, joystick)
- `section-navigator.spec.ts` - Section navigation tests for large grids (floating button, bottom sheet, section switching)
- Uses CDP (Chrome DevTools Protocol) for precise touch event simulation
- Run with `npm run test:e2e`

## Notes

- UI language is Korean
- The app uses a custom `dice-pop` animation for visual feedback when placing dice (Canvas-based, 150ms, scale 0.8→1.1→1.0)
- Export renders dice at 60px cell size with 2px gap
- Unsplash images are fetched directly without API key using public image URLs
- DiceValue type is `0 | 1 | 2 | 3 | 4 | 5 | 6` (includes 0 for blank dice)
- PaletteValue type is `DiceValue | 'eraser' | 'pan'` for palette selection
- SectionInfo/SectionLayout types define section boundaries and navigation structure
