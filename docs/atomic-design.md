# Atomic Design in Grunberg

## Introduction

Grunberg organizes its UI components with the **Atomic Design** methodology: a hierarchy from the smallest elements (atoms) to complete sections of the interface (organisms) and page layouts (templates).

## Directory structure

```
apps/web/src/
├── components/
│   ├── atoms/        # Basic, indivisible UI elements
│   ├── molecules/    # Small groups of atoms that form a functional unit
│   ├── organisms/    # Complete interface sections
│   ├── templates/    # Page layouts that place organisms
│   └── CharacterCreator.tsx   # not yet split into the hierarchy
├── screens/          # Connect hooks (state, actions) to components
├── hooks/            # Reusable UI logic (autosave, saved game)
├── contexts/         # Game store provider and its hooks
└── app/              # Next.js routes: thin page.tsx files and API Route Handlers
```

## Components by level

### Atoms

**Location:** `apps/web/src/components/atoms/`

| Component       | Props                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------ |
| `Button`        | `variant?: "primary" \| "secondary" \| "ghost"`, `size?: "small" \| "medium" \| "large"`, `icon?: ReactNode`, `children`, plus all `<button>` attributes |
| `Input`         | `variant?: "default" \| "dark"`, `error?: boolean`, plus all `<input>` attributes                |
| `Label`         | `children`, `size?: "small" \| "medium" \| "large"`, `variant?: "default" \| "uppercase"`, `className?` |
| `MapCell`       | `type: "wall" \| "explored" \| "unexplored" \| "player"`, `x?`, `y?`                             |
| `MessageBubble` | `text: string`, `type: "narration" \| "action" \| "dialogue" \| "system"`, `animate?: boolean`   |
| `StatBadge`     | `label: string`, `value: number \| string`, `color?: string`                                     |

```tsx
import { Button } from "@/components/atoms/Button";

export const StartButton = () => (
  <Button variant="primary" size="medium">
    Click me
  </Button>
);
```

### Molecules

**Location:** `apps/web/src/components/molecules/`

| Component         | Props                                                                                             | Made of            |
| ----------------- | ------------------------------------------------------------------------------------------------- | ------------------ |
| `ActionButton`    | `label`, `icon: ReactNode`, `hotKey`, `onClick?`, `isActive?`                                      | button, icon       |
| `ChatInput`       | `placeholder?`, `onSendMessage: (message: string) => void`                                         | `Input`            |
| `CurrencyDisplay` | `amount: number`, `icon?`, `label?`                                                                | –                  |
| `InfoField`       | `label`, `value: string \| number`, `valueColor?`                                                  | –                  |
| `MessageList`     | `messages: { id, type, text }[]`                                                                   | `MessageBubble`    |
| `SkillButton`     | `name`, `icon: ReactNode`, `hotKey`, `cooldown?`, `onClick?`, `isActive?`                          | button, icon       |
| `StatGrid`        | `stats: { label, value, color? }[]`                                                                | `StatBadge`        |
| `StatusBar`       | `label`, `current`, `max`, `color`                                                                 | –                  |

### Organisms

**Location:** `apps/web/src/components/organisms/`

| Component           | Props                                                                     | Made of                       |
| ------------------- | ------------------------------------------------------------------------- | ----------------------------- |
| `ActionButtonGroup` | `buttons: { id, label, icon, hotKey, onClick?, isActive? }[]`              | `ActionButton`                |
| `Chat`              | –                                                                         | `MessageList`, `ChatInput`    |
| `GameHeader`        | `level?`, `location?`, `title?`                                           | –                             |
| `MainMenu`          | `onNewGame`, `onContinue`, `onLoadSave: (file: File) => Promise<void>`     | buttons, `useSavedGame`       |
| `Minimap`           | `gridSize?`, `playerPosition?`, `title?`                                  | `MapCell`                     |
| `PlayerStats`       | `hp?`, `mana?`, `exp?`, `stats?`, `gold?`                                  | `StatusBar`, `StatGrid`, `CurrencyDisplay` |
| `SkillBar`          | `skills: { id, name, hotKey, icon, cooldown?, onClick? }[]`                | `SkillButton`                 |

### Templates

| Component    | Responsibility                                                                                      |
| ------------ | --------------------------------------------------------------------------------------------------- |
| `GameLayout` | Places the header, chat, minimap, player stats, skill bar and action buttons in the game screen grid. |

## Where logic lives

- **Components render; hooks hold logic.** State, side effects and data access live in hooks:
  - `useGameState()` returns the game state;
  - `useGameActions()` returns stable actions;
  - `useSavedGame()` reads the local save;
  - `useAutoSave()` saves the game (debounced);
  - `useCharacterForm()` holds the character creator's state and rules;
  - `useChatMessages()` holds the chat history; `useChatInput()` handles typing, Enter to send and Enter-to-focus;
  - `useSkillHotkeys()` binds skills to their keys (ignored while the player types in a text field).
- **Screens connect the two.** `screens/MenuScreen.tsx`, `NewCharacterScreen.tsx` and `GameScreen.tsx` call hooks and pass data and callbacks down. `app/*/page.tsx` files only render a screen.
- **Components call at most one hook and render.** `Chat`, `ChatInput`, `SkillBar` and `CharacterCreator` have no state or effects of their own. Hooks are tested on their own with React Testing Library (`apps/web/src/hooks/*.test.ts(x)`).

```tsx
"use client";

import { useRouter } from "next/navigation";
import type { Character } from "@grunberg/engine";
import CharacterCreator from "@/components/CharacterCreator";
import { useGameActions } from "@/contexts/useGameActions";

// A screen: hooks in, plain props out.
export const NewCharacterScreen = () => {
  const router = useRouter();
  const { createCharacter } = useGameActions();

  const handleCharacterCreated = (character: Character) => {
    createCharacter(character);
    router.push("/game");
  };

  return <CharacterCreator onCharacterCreated={handleCharacterCreated} />;
};
```

## Atomic Design principles

1. **Single responsibility:** every component has one clearly defined job.
2. **Composition over inheritance:** complex components are built by composing simpler ones.
3. **Reusability:** atoms and molecules stay generic; organisms may be specific to the game.
4. **Logic separate from presentation:** atoms and molecules are presentational. Organisms may hold UI-only state (e.g. which skill is highlighted), while game state and side effects live in hooks.
5. **No props drilling:** screens read state through hooks instead of passing it through many levels.

## Conventions

### Files and folders

```
ComponentName/
├── ComponentName.tsx          # Component
├── ComponentName.module.css   # Styles (CSS Modules)
└── index.ts                   # Re-export
```

### Naming

- **PascalCase** for components: `Button`, `ChatInput`, `MessageBubble`
- **camelCase** for props: `onClick`, `isActive`, `hotKey`
- **CSS Modules with BEM-style class names**, scoped per component:

```css
.action-button {
}
.action-button__icon {
}
.action-button--active {
}
```

```tsx
import styles from "./GameLayout.module.css";

export const Header = () => <header className={styles["game-layout__header"]} />;
```

## Example: GameLayout

`apps/web/src/components/templates/GameLayout/GameLayout.tsx` (shortened):

```tsx
import { GiScrollQuill, GiSwordsPower } from "react-icons/gi";
import { ActionButtonGroup } from "../../organisms/ActionButtonGroup";
import { Chat } from "../../organisms/Chat";
import { SkillBar } from "../../organisms/SkillBar";
import styles from "./GameLayout.module.css";

export const GameLayout = () => {
  const actionButtons = [{ id: 1, label: "Quests", icon: <GiScrollQuill />, hotKey: "Q" }];
  const skills = [{ id: 1, name: "Attack", hotKey: "1", icon: <GiSwordsPower />, cooldown: 0 }];

  return (
    <div className={styles["game-layout"]}>
      <main className={styles["game-layout__chat"]}>
        <Chat />
      </main>
      <section className={styles["game-layout__skills"]}>
        <SkillBar skills={skills} />
      </section>
      <nav className={styles["game-layout__navigation"]}>
        <ActionButtonGroup buttons={actionButtons} />
      </nav>
    </div>
  );
};
```

> The UI labels in the code are still in Polish ("Questy", "Atak"); they will be translated together with the game texts.

## Testing

**Today:**

- unit tests for the game store, save validation, server request handling and every API route (Vitest);
- hook tests with React Testing Library (character form, chat, skill hotkeys);
- no visual or e2e component tests yet.

**Planned (see the README roadmap):**

| Level     | Tests                                                                          |
| --------- | ------------------------------------------------------------------------------ |
| Atoms     | rendering, props and variants, accessibility (axe)                             |
| Molecules | user interaction and callbacks                                                 |
| Organisms | Storybook stories; Playwright e2e for the main flows (menu → new game → game) |

## Benefits of Atomic Design in Grunberg

1. **Consistency:** the same look and behavior across the app
2. **Reusability:** components are easy to use in new contexts
3. **Maintainability:** changes to atoms propagate automatically
4. **Scalability:** new features are assembled from existing pieces
5. **Testability:** small, isolated components are easier to test
6. **Documentation:** the hierarchy makes the structure easy to understand

## Next steps

1. Build the missing organisms: CharacterSheet, Inventory, Combat
2. Split `CharacterCreator` into the hierarchy (its form logic already lives in `useCharacterForm`)
3. Generate chat messages from engine events instead of placeholder text
4. Translate the UI labels to English
5. Add Storybook and component tests (axe, Playwright)
6. Write a design system guide (color palette, typography)
