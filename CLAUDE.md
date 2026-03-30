# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (Vite)
npm run build    # Build library: svelte-kit sync && svelte-package
npm run check    # Type-check: svelte-kit sync && svelte-check --tsconfig ./tsconfig.json
```

No test runner or linter is configured.

## Architecture

`svelte-pivottable` is a Svelte 5 component library that provides interactive pivot tables with drag-and-drop data exploration (similar to Excel pivot tables). It is a Svelte port of `react-pivottable-grouping`.

### Component Layers (top-down)

```
PivotTableUI        — stateful interactive UI with drag-drop zones (rows/cols/values/unused attrs)
  └─ PivotTable     — stateless renderer selector; instantiates the chosen renderer
       └─ Renderer  — TableRenderer, PlotlyRenderer, TSVExportRenderer, etc.
            └─ PivotData  — data model: aggregation, filtering, sorting, subtotal tree
```

**`PivotData`** (`src/lib/PivotData.ts`) is the computational core. It takes raw data plus options (rows, cols, vals, aggregator, filters) and builds a tree structure used by renderers.

**Renderers** are plain Svelte components that receive props and instantiate `PivotData` themselves. `TableRenderers.ts` and `PlotlyRenderers.ts` export named renderer maps; Plotly renderers use a factory function for dependency injection of the Plotly library.

**UI components** live in `src/lib/UI/`. `SortableAttachment.ts` integrates Sortable.js for reorderable drag-drop lists.

### Svelte 5 Patterns Used

- Runes: `$state`, `$derived`, `$effect` for reactive state
- Props: `let { ...props } = $props()`
- Snippets: `{@render snippetName()}` for composition
- Context API: `setContext` for cross-component data sharing

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/index.js` | Public exports (`PivotTable`, `PivotTableUI`) |
| `src/lib/PivotData.ts` | Data model and aggregation engine |
| `src/lib/PivotTableUI.svelte` | Interactive stateful component |
| `src/lib/PivotTable.svelte` | Renderer selector (stateless) |
| `src/lib/types.ts` | TypeScript types (`Datum`, `Aggregator`, `FilterSet`, etc.) |
| `src/lib/Utilities.ts` | Aggregator functions (`Sum`, `Count`, etc.) and sort helpers |
| `src/lib/TableRenderer.svelte` | Default table/heatmap renderer |
| `src/lib/PlotlyRenderers.ts` | Factory for Plotly chart renderers |
| `src/routes/+page.svelte` | Demo page (Montreal dataset) |

### Build & Packaging

- **SvelteKit** with `@sveltejs/package` exports `.svelte` source files (not compiled JS)
- Entry points: `.` (main), `./PivotTable`, `./PivotTableUI`
- Static adapter for the demo site (`svelte.config.js`)
