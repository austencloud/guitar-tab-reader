# TabScroll Architecture Migration Guide

## Overview

This document describes the comprehensive architectural refactor from a **lib-based** structure to a **module-first, DI-powered** architecture using InversifyJS and Svelte 5 runes.

## Migration Summary

### What Changed

#### Before (Lib-Based Structure)
```
src/
├── lib/
│   ├── components/    # All components mixed together
│   ├── state/         # Singleton state exports
│   └── utils/         # Helper functions and services
└── routes/            # SvelteKit routes
```

#### After (Module-First Structure)
```
src/
├── core/
│   └── di/            # Dependency injection container
├── features/
│   ├── tabs/          # Tab parsing and display
│   │   ├── components/
│   │   ├── state/
│   │   └── services/
│   │       ├── contracts/
│   │       └── implementations/
│   ├── tuner/         # Guitar tuner
│   ├── practice/      # Practice tracking
│   └── shared/        # Shared UI and user state
├── lib/
│   ├── app.ts         # App initialization
│   └── useService.svelte.ts  # DI helper
└── routes/            # SvelteKit routes (updated to use DI)
```

## Key Architectural Principles

### 1. Module-First Separation

Each feature is self-contained with its own:
- **Components**: Thin presentational wrappers
- **State**: Injectable Svelte 5 rune-based state classes
- **Services**: Business logic with contracts/implementations

### 2. Dependency Injection with InversifyJS

All services are registered in a centralized DI container:

```typescript
// Service definition with decorator
@injectable()
export class TabParserService implements ITabParser {
    constructor(@inject(TYPES.SomeDependency) private dep: ISomeDependency) {}

    parse(content: string): ParsedTab {
        // Implementation
    }
}
```

### 3. No Utils Folders

Everything is registered as a service through the DI container:
- ✅ `features/tabs/services/implementations/TabParserService.ts`
- ❌ `lib/utils/tabParser.ts`

### 4. Thin Reactive Components

Components are purely presentational and inject services:

```svelte
<script lang="ts">
import { useService } from '$lib/useService.svelte';
import { TYPES } from '$core/di';
import type { UIState } from '$features/shared/services';

const uiState = useService<UIState>(TYPES.UIState);
</script>
```

### 5. Full Reliance on Svelte 5 Runes

All state uses modern Svelte 5 features:
- `$state` for reactive variables
- `$derived` for computed properties
- `$effect` for side effects
- `$props` for component props

## Service Registration

Each feature module exports a `registerXxxServices` function:

```typescript
// features/tabs/services/index.ts
export function registerTabServices(container: Container): void {
    container.bind(TYPES.TabParser)
        .toDynamicValue(() => createTabParser())
        .inSingletonScope();

    container.bind(TYPES.TabState).to(TabState).inSingletonScope();
}
```

The main container initialization calls all registration functions:

```typescript
// core/di/container.ts
export async function initializeContainer(): Promise<void> {
    const { registerTabServices } = await import('$features/tabs/services');
    const { registerTunerServices } = await import('$features/tuner/services');
    const { registerPracticeServices } = await import('$features/practice/services');
    const { registerSharedServices } = await import('$features/shared/services');

    registerTabServices(container);
    registerTunerServices(container);
    registerPracticeServices(container);
    registerSharedServices(container);
}
```

## Application Initialization

The app initializes once in the root layout:

```typescript
// routes/+layout.svelte
import { initializeApp } from '$lib/app';
import { useService } from '$lib/useService.svelte';

onMount(async () => {
    await initializeApp(); // Sets up DI container + loads persisted state

    // Access services after initialization
    uiState = useService<UIState>(TYPES.UIState);
    userState = useService<UserState>(TYPES.UserState);
});
```

## Migration Checklist

### ✅ Completed

- [x] Install InversifyJS + reflect-metadata
- [x] Configure TypeScript decorators
- [x] Create feature module directory structure
- [x] Create DI container infrastructure
- [x] Migrate tab parsing services to contracts/implementations
- [x] Migrate tuner audio services to contracts/implementations
- [x] Convert all state classes to @injectable
- [x] Register all services in DI container
- [x] Create app initialization system
- [x] Update root layout to use DI container
- [x] Create `useService` helper for components

### 🚧 Remaining (Future Work)

- [ ] Migrate all 29 components to feature modules
- [ ] Update all component imports to use new paths
- [ ] Update all route pages to use DI container
- [ ] Migrate tests to new structure
- [ ] Remove old `src/lib/state`, `src/lib/utils`, `src/lib/components`
- [ ] Add JSDoc documentation to all services
- [ ] Create Storybook for component development

## Using Services in Components

### Old Way (Singleton Imports)

```svelte
<script lang="ts">
import { uiState } from '$lib/state';

// Direct singleton usage
uiState.openModal('settings');
</script>
```

### New Way (DI Container)

```svelte
<script lang="ts">
import { useService } from '$lib/useService.svelte';
import { TYPES } from '$core/di';
import type { UIState } from '$features/shared/services';

// Get service from container
const uiState = useService<UIState>(TYPES.UIState);

// Use service (same API)
uiState.openModal('settings');
</script>
```

## Service Types Reference

All service identifiers are defined in `core/di/types.ts`:

```typescript
export const TYPES = {
    // Tab Services
    TabParser: Symbol.for('TabParser'),
    TabState: Symbol.for('TabState'),

    // Tuner Services
    AudioProcessor: Symbol.for('AudioProcessor'),
    PitchDetector: Symbol.for('PitchDetector'),

    // Practice Services
    PracticeState: Symbol.for('PracticeState'),
    AudioState: Symbol.for('AudioState'),

    // Shared Services
    UIState: Symbol.for('UIState'),
    UserState: Symbol.for('UserState'),
    PersistenceManager: Symbol.for('PersistenceManager'),
} as const;
```

## Benefits of This Architecture

### 1. **Better Testability**
- Services can be easily mocked and injected
- No singleton dependencies to stub

### 2. **Clear Separation of Concerns**
- Features are isolated modules
- Dependencies are explicit through constructor injection

### 3. **Improved Scalability**
- Easy to add new features without cluttering lib/
- Each feature owns its domain

### 4. **Type Safety**
- Contracts (interfaces) define service APIs
- TypeScript ensures implementations match contracts

### 5. **Maintainability**
- Code is organized by feature, not by layer
- Easy to find related code
- Clear dependency graph

## Common Patterns

### Creating a New Service

1. **Define the contract** (interface):
```typescript
// features/myfeature/services/contracts/IMyService.ts
export interface IMyService {
    doSomething(): void;
}
```

2. **Implement the service**:
```typescript
// features/myfeature/services/implementations/MyServiceImpl.ts
import { injectable, inject } from 'inversify';
import { TYPES } from '$core/di';

@injectable()
export class MyServiceImpl implements IMyService {
    constructor(@inject(TYPES.SomeDependency) private dep: ISomeDependency) {}

    doSomething(): void {
        // Implementation
    }
}
```

3. **Register in DI container**:
```typescript
// features/myfeature/services/index.ts
export function registerMyFeatureServices(container: Container): void {
    container.bind(TYPES.MyService).to(MyServiceImpl).inSingletonScope();
}
```

4. **Add type to TYPES**:
```typescript
// core/di/types.ts
export const TYPES = {
    // ... existing types
    MyService: Symbol.for('MyService'),
} as const;
```

## Troubleshooting

### Service Not Found Error

If you get `No matching bindings found for serviceIdentifier`:
- Check that the service is registered in the appropriate `registerXxxServices` function
- Ensure `initializeContainer()` is being called
- Verify the service type is added to `TYPES`

### Circular Dependency Error

If services depend on each other circularly:
- Use `@inject()` with `@optional()` for optional dependencies
- Consider refactoring to remove circular dependency
- Use events/callbacks instead of direct dependencies

### Reactivity Not Working

If state changes don't trigger UI updates:
- Ensure state classes use Svelte 5 runes (`$state`, `$derived`)
- Check that the service reference is stored in a `$state` variable in components
- Verify you're not destructuring reactive properties

## Next Steps

To complete the migration:

1. **Component Migration**: Move components from `src/lib/components/` to feature modules
2. **Route Updates**: Update all route pages to use `useService()` instead of singleton imports
3. **Test Migration**: Update tests to use DI container and mock services
4. **Cleanup**: Remove old lib structure once migration is complete

## Resources

- [InversifyJS Documentation](https://inversify.io/)
- [Svelte 5 Runes](https://svelte.dev/docs/svelte/what-are-runes)
- [SvelteKit Project Structure](https://kit.svelte.dev/docs/project-structure)

---

**Migration Date**: January 2025
**Status**: Phase 1 Complete (Infrastructure + Services)
**Next Phase**: Component Migration
