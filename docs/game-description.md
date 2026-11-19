# Text-based RPG dungeon crawler

## Status

**Working today:**

- character creator (race, gender, class, stat points)
- main menu: new game, continue, load a save file
- game screen layout: chat, minimap, player stats, skills and action buttons (with placeholder data)
- local autosave in localStorage and save file import
- the game API: creating a game and server-validated player intents (`move`, `equip`, `unequip`)

**Planned:** everything else below. The roadmap in the README tracks the order.

## Assumptions

- the player creates a character with a short form
- there is a dialogue and quest system
- the game is a dungeon crawler with many floors whose layout and order change often (procedural floors from a seed)
- everything is set in a fantasy RPG world
- the player's own copy of the game is the local save (localStorage); the server copy expires 24 hours after the last change
- save files can be exported and imported

## Planned UI

- chat (the main descriptive and dialogue feature)
- a map drawn live as the player moves
- quest window
- health, mana and experience bars
- character progression window
- stats window
- equipment and backpack window
- combat system (4+ actions, as in Nintendo's Pokémon games)
- movement with the arrow keys
- choosing the active quest ???
- soundtracks that build the atmosphere
- UI lighting effects (like Ambilight on TVs)

## Story themes under consideration

- The Tower of Mist: a magical structure whose shape changes every night
- a dungeon like the one in the anime "That Time I Got Reincarnated as a Slime"
