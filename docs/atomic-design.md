# Atomic Design w Grunberg

## Wprowadzenie

Projekt Grunberg wykorzystuje metodologię **Atomic Design** do organizacji komponentów UI. Ta metodologia dzieli interfejs użytkownika na hierarchię od najmniejszych, najbardziej podstawowych elementów (atomów) do złożonych, w pełni funkcjonalnych komponentów (organizmów).

## Struktura katalogów

```
src/components/
├── atoms/              # Podstawowe, niepodzielne elementy UI
├── molecules/          # Proste grupy atomów tworzące funkcjonalne jednostki
├── organisms/          # Złożone komponenty łączące atomy i molekuły
├── Layout/            # Komponenty layoutu i szablonów
└── [Inne komponenty]  # Pozostałe komponenty niezrefaktoryzowane
```

## Poziomy Atomic Design

### 1. Atoms (Atomy)

Najdrobniejsze, niepodzielne elementy interfejsu. Są to podstawowe bloki budulcowe, które samodzielnie mają ograniczoną funkcjonalność, ale stanowią fundament dla bardziej złożonych komponentów.

**Lokalizacja:** `src/components/atoms/`

#### Button
Uniwersalny przycisk z różnymi wariantami i rozmiarami.

```typescript
import { Button } from "../components/atoms/Button/Button";

<Button variant="primary" size="medium" icon={<Icon />}>
  Kliknij mnie
</Button>
```

**Props:**
- `variant`: `"primary" | "secondary" | "ghost"` - styl przycisku
- `size`: `"small" | "medium" | "large"` - rozmiar
- `icon`: `ReactNode` - opcjonalna ikona
- `children`: `ReactNode` - zawartość przycisku

#### Input
Pole tekstowe z wariantami stylistycznymi.

```typescript
import { Input } from "../components/atoms/Input/Input";

<Input 
  variant="dark" 
  placeholder="Wpisz tekst..." 
  error={false}
/>
```

**Props:**
- `variant`: `"default" | "dark"` - styl pola
- `error`: `boolean` - czy pole ma błąd
- Wszystkie standardowe atrybuty HTML input

#### MessageBubble
Pojedyncza wiadomość w czacie.

```typescript
import { MessageBubble } from "../components/atoms/MessageBubble/MessageBubble";

<MessageBubble 
  text="Witaj w Mglistej Wieży..." 
  type="narration" 
  animate={true}
/>
```

**Props:**
- `text`: `string` - treść wiadomości
- `type`: `"narration" | "action" | "dialogue" | "system"` - typ wiadomości
- `animate`: `boolean` - czy animować pojawienie się

---

### 2. Molecules (Molekuły)

Grupy atomów tworzące prostsze funkcjonalne komponenty. Molekuły łączą kilka atomów, tworząc bardziej użyteczną jednostkę.

**Lokalizacja:** `src/components/molecules/`

#### ChatInput
Pole tekstowe do wprowadzania komend w czacie.

```typescript
import { ChatInput } from "../components/molecules/ChatInput/ChatInput";

<ChatInput 
  placeholder="Wpisz komendę..." 
  onSendMessage={(message) => console.log(message)}
/>
```

**Props:**
- `placeholder`: `string` - tekst placeholder
- `onSendMessage`: `(message: string) => void` - callback po wysłaniu wiadomości

**Składa się z:**
- `Input` (atom)
- Własna logika obsługi Enter i wysyłania

#### MessageList
Lista wiadomości w czacie.

```typescript
import { MessageList } from "../components/molecules/MessageList/MessageList";

const messages = [
  { id: 1, type: "narration", text: "Witaj..." },
  { id: 2, type: "action", text: "Rozglądasz się..." }
];

<MessageList messages={messages} />
```

**Props:**
- `messages`: `Message[]` - tablica wiadomości

**Składa się z:**
- Wiele `MessageBubble` (atom)
- Kontener ze scrollem

#### ActionButton
Przycisk akcji z ikoną i skrótem klawiszowym.

```typescript
import { ActionButton } from "../components/molecules/ActionButton/ActionButton";

<ActionButton 
  label="Questy" 
  icon="📜" 
  shortcutKey="Q"
  onClick={() => console.log("Otwarto questy")}
  isActive={false}
/>
```

**Props:**
- `label`: `string` - etykieta przycisku
- `icon`: `string` - ikona (emoji lub znak)
- `shortcutKey`: `string` - skrót klawiszowy
- `onClick`: `() => void` - callback przy kliknięciu
- `isActive`: `boolean` - czy przycisk jest aktywny

#### SkillButton
Przycisk umiejętności z cooldownem.

```typescript
import { SkillButton } from "../components/molecules/SkillButton/SkillButton";

<SkillButton 
  name="Atak" 
  icon="⚔️" 
  shortcutKey="1"
  cooldown={0}
  onClick={() => console.log("Użyto ataku")}
/>
```

**Props:**
- `name`: `string` - nazwa umiejętności
- `icon`: `string` - ikona
- `shortcutKey`: `string` - skrót klawiszowy
- `cooldown`: `number` - czas cooldownu (0 = dostępne)
- `onClick`: `() => void` - callback przy użyciu

---

### 3. Organisms (Organizmy)

Złożone komponenty łączące atomy i molekuły w w pełni funkcjonalne sekcje interfejsu. Organizmy reprezentują wyraźne sekcje aplikacji.

**Lokalizacja:** `src/components/organisms/`

#### Chat
Kompletny system czatu z historią wiadomości i polem do wprowadzania tekstu.

```typescript
import { Chat } from "../components/organisms/Chat/Chat";

<Chat />
```

**Składa się z:**
- `MessageList` (molekuła)
- `ChatInput` (molekuła)
- Stan wiadomości i logika zarządzania

#### ActionButtonGroup
Grupa przycisków akcji (questy, mapa, statystyki, ekwipunek).

```typescript
import { ActionButtonGroup } from "../components/organisms/ActionButtonGroup/ActionButtonGroup";

const buttons = [
  { id: 1, label: "Questy", icon: "📜", key: "Q" },
  { id: 2, label: "Mapa", icon: "🗺️", key: "M" }
];

<ActionButtonGroup buttons={buttons} />
```

**Props:**
- `buttons`: `ActionButtonData[]` - tablica definicji przycisków

**Składa się z:**
- Wiele `ActionButton` (molekuła)
- Grid layout

#### SkillBar
Pasek umiejętności gracza.

```typescript
import { SkillBar } from "../components/organisms/SkillBar/SkillBar";

const skills = [
  { id: 1, name: "Atak", key: "1", icon: "⚔️", cooldown: 0 },
  { id: 2, name: "Magia", key: "3", icon: "✨", cooldown: 3 }
];

<SkillBar skills={skills} title="Umiejętności" />
```

**Props:**
- `skills`: `Skill[]` - tablica umiejętności
- `title`: `string` - tytuł sekcji (domyślnie "Umiejętności")

**Składa się z:**
- Wiele `SkillButton` (molekuła)
- Tytuł i layout

---

## Zasady stosowania Atomic Design

### 1. Pojedyncza odpowiedzialność
Każdy komponent powinien mieć jedną, jasno określoną odpowiedzialność.

### 2. Kompozycja zamiast dziedziczenia
Buduj złożone komponenty poprzez komponowanie prostszych, nie przez dziedziczenie.

### 3. Reużywalność
Atomy i molekuły powinny być maksymalnie ogólne i reużywalne. Organizmy mogą być bardziej specyficzne dla konkretnego kontekstu.

### 4. Separacja logiki i prezentacji
- **Atomy** - tylko prezentacja, żadnej logiki biznesowej
- **Molekuły** - minimalna logika UI (np. obsługa formularzy)
- **Organizmy** - mogą zawierać logikę biznesową i zarządzanie stanem

### 5. Props drilling
Unikaj nadmiernego przekazywania props przez wiele poziomów. W razie potrzeby użyj Context API lub state management.

---

## Konwencje nazewnictwa

### Pliki i foldery
```
ComponentName/
├── ComponentName.tsx    # Komponent
└── ComponentName.css    # Style
```

### Komponenty
- **PascalCase** dla nazw komponentów: `Button`, `ChatInput`, `MessageBubble`
- **camelCase** dla props: `onClick`, `isActive`, `shortcutKey`

### Style CSS
- **BEM notation** dla klas CSS:
  - `.component` - blok
  - `.component__element` - element
  - `.component--modifier` - modyfikator

Przykład:
```css
.action-button { }
.action-button__icon { }
.action-button__label { }
.action-button--active { }
```

---

## Migracja istniejących komponentów

Komponenty, które zostały już zrefaktoryzowane:

✅ **Chat** → `organisms/Chat`
✅ **ActionButtons** → `organisms/ActionButtonGroup`
✅ **SkillBar** → `organisms/SkillBar`
✅ **GameHeader** → `organisms/GameHeader`
✅ **HUD** → `organisms/PlayerStats`
✅ **Minimap** → `organisms/Minimap`
✅ **StatusBar** → `molecules/StatusBar`

Komponenty oczekujące na refaktoryzację:
- CharacterSheet
- Inventory
- Combat

---

## Przykład użycia w GameLayout

```typescript
import { Chat } from "../../organisms/Chat/Chat";
import { SkillBar } from "../../organisms/SkillBar/SkillBar";
import { ActionButtonGroup } from "../../organisms/ActionButtonGroup/ActionButtonGroup";
import { Minimap } from "../../organisms/Minimap/Minimap";
import { GameHeader } from "../../organisms/GameHeader/GameHeader";
import { PlayerStats } from "../../organisms/PlayerStats/PlayerStats";

const GameLayout = () => {
  const actionButtons = [
    { id: 1, label: "Questy", icon: "📜", key: "Q" },
    { id: 2, label: "Mapa", icon: "🗺️", key: "M" },
    { id: 3, label: "Statystyki", icon: "📊", key: "C" },
    { id: 4, label: "Ekwipunek", icon: "🎒", key: "I" },
  ];

  const skills = [
    { id: 1, name: "Atak", key: "1", icon: "⚔️", cooldown: 0 },
    { id: 2, name: "Obrona", key: "2", icon: "🛡️", cooldown: 0 },
    { id: 3, name: "Magia", key: "3", icon: "✨", cooldown: 3 },
    { id: 4, name: "Unik", key: "4", icon: "💨", cooldown: 0 },
  ];

  return (
    <div className="game-layout">
      <header className="game-layout__header">
        <GameHeader level={1} location="Mglisty Portal - Piętro 1" />
      </header>

      <aside className="game-layout__minimap">
        <Minimap />
      </aside>

      <main className="game-layout__chat">
        <Chat />
      </main>

      <aside className="game-layout__hud">
        <PlayerStats />
      </aside>

      <section className="game-layout__skills">
        <SkillBar skills={skills} />
      </section>

      <nav className="game-layout__navigation">
        <ActionButtonGroup buttons={actionButtons} />
      </nav>
    </div>
  );
};
```

---

## Testowanie

Każdy poziom Atomic Design testujemy inaczej:

### Atomy
- Testy jednostkowe renderowania
- Testy props i wariantów
- Testy accessibility (a11y)

### Molekuły
- Testy integracyjne atomów
- Testy interakcji użytkownika
- Testy callbacks

### Organizmy
- Testy e2e scenariuszy użytkownika
- Testy stanu i logiki biznesowej
- Testy integracji z API (jeśli dotyczy)

---

## Korzyści z Atomic Design w Grunberg

1. **Konsystencja** - jednolity wygląd i zachowanie w całej aplikacji
2. **Reużywalność** - komponenty można łatwo wykorzystać w różnych kontekstach
3. **Łatwość utrzymania** - zmiany w atomach propagują się automatycznie
4. **Skalowalność** - łatwo dodawać nowe funkcjonalności
5. **Testowanie** - izolowane komponenty są łatwiejsze do testowania
6. **Dokumentacja** - hierarchia ułatwia zrozumienie struktury

---

## Dalsze kroki

1. Refaktoryzacja pozostałych komponentów do struktury Atomic Design
2. Dodanie Storybook dla dokumentacji wizualnej komponentów
3. Implementacja testów jednostkowych dla atomów i molekuł
4. Utworzenie design system guide z paletą kolorów i typografią
5. Rozważenie użycia CSS-in-JS lub CSS Modules dla lepszej izolacji stylów

