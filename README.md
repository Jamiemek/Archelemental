# Archelemental

Elemental, the periodic table roll game, made for [Archipelago](https://archipelago.gg).

Play it at **https://jamiemek.github.io/Archelemental/**

Every roll pulls elements from the periodic table, with a chance to chain into compounds. Nearly everything that helps
(luck, speed, shop upgrades, the requirements for every bonds tree slot) arrives as a multiworld item.

## Playing

1. Download `archelemental.apworld` from the game's Archipelago page (it always matches the live game), then
   double-click it or put it in your Archipelago `custom_worlds` folder.
2. Make your options file: in the Archipelago Launcher choose "Generate Template Options", or start from
   [`examples/Archelemental.yaml`](examples/Archelemental.yaml).
3. Once the multiworld is generated and hosted, open the game, go to **Archipelago** and connect with the server
   address, your slot name and the password if there is one.

Each seed and slot keeps its own save on your device, so several games can run side by side. The game reconnects by
itself when you come back, and anything you found while offline is sent as soon as it does.

## Checks

- The 118 elements, the first time each is rolled. A compound counts for every element in it.
- Every slot of the bonds tree (2,683 of them). Slots no longer give buffs: taking one is a check.
- One of each catalyst from your own shop or a drop, up to a tier you choose.
- The 16 joke elements (optional, on by default; they need the Joke Table Unlock).
- The 100 compound achievements (optional, off by default).
- Ionization Frenzy (optional): all six ion tiers of every element.

## Items

- **Luck Boosts**: 5 each of +15%, +30%, +60% and +90% (counts are options, with a minimum). Luck comes only from these.
- **Progressive**: Bonus Roll (3), Shop Luck (8), Shop Reset Speed (8), Shop Slot (5), Autoroll Speed (8), Scanner Speed (8),
  Event Spawn Chance (8), Quark Gain (8), Chain Boost (3).
- **Unlocks**: Autoroll, Catalyst Rolling, Shop Hold, Joke Table, Ionization.
- **Bond N Requirements**: one per bonds tree slot. It gives the elements that slot asks for, once, and they're used up
  when you take the slot.
- **Cosmetics**: every scanner, page and spawn effect skin.
- **Filler**: up to 50 of each catalyst and four sizes of Quark Bundle (100, 1,000, 10,000, 100,000). Filler is trimmed or
  topped up to match the number of checks.
- **Traps** (optional): Roll Speed, Luck and Quark Drop, each lasting a few minutes.

## Game modes

- **Element Frenzy** (WIP, expect some bugs): the elements are items. Rolling one is still a check, but it doesn't add to your collection: you only
  have an element once you receive it.
- **Ionization Frenzy** (WIP, expect some bugs): every ion tier of every element is a check, and Progressive + Ion Chance and Progressive - Ion
  Chance join the pool. The rarest tiers of the rarest elements only hold filler.

Both can be on, or neither.

## Options

| Option | What it does | Default |
| --- | --- | --- |
| `elements_required`, `jokes_required`, `achievements_required` | What you need to finish | 118, 0, 0 |
| `element_frenzy`, `ionization_frenzy` | The two game modes | off |
| `joke_elements` | Joke elements as checks, and the Joke Table Unlock | on |
| `catalyst_checks` | Highest catalyst tier that counts (`none` to `mythic`) | `epic` |
| `achievement_checks` | The 100 compound achievements as checks | off |
| `bonds_tree`, `shop`, `events` | Keep those parts of the game | on |
| `restock_minutes` | Shop restock time before Reset Speed items | 18 |
| `luck_boosts_15/30/60/90`, `minimum_luck_boosts` | How many of each luck boost, and the fewest in total | 5 each, 8 |
| `roll_budget` | Rolls the logic will have you spend hunting one thing | 5000 |
| `catalyst_copies`, `bundles_100` ... `bundles_100000` | The filler | 50, 200/100/50/10 |
| `roll_speed_traps`, `luck_traps`, `quark_drop_traps` | Traps that replace filler | 0 |

## How the logic works

The game weights each element by how rare it is, and luck tilts that toward the rarer ones. For every check the APWorld
works out how many rolls it would take at each amount of luck, and expects it once the luck boosts you hold get it within
`roll_budget`. Bonds tree slots follow the tree: you can take a slot once you've taken the one before it and hold its
Bond N Requirements.

If there are more items than checks, the least important upgrades and the cosmetics start in your inventory instead.

## Building

- `python3 tools/build.py` joins `js/*.js` into `game.js` (the page loads that), and packs
  `downloads/archelemental.apworld` and the example YAML for the game's Download buttons.
- `python3 tools/build.py --apworld archelemental.apworld` packs the APWorld. It refreshes `data.json` from the
  game's code first, so the two always match.

## Hosting

The game is a static page, served by GitHub Pages from this repository. Since it's https, browsers only let it connect
to servers that support secure connections, which rooms on archipelago.gg do. A server on your own computer works as
`localhost`.
