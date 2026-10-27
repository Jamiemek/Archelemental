# Archelemental

Elemental, the periodic table roll game, made for [Archipelago](https://archipelago.gg).

Play it at **https://jamiemek.github.io/Archelemental/**

Every roll pulls elements from the periodic table, with a chance to chain into compounds. Finding each element for
the first time is a check, and Progressive Luck from the multiworld tilts your rolls toward the rare ones.

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

- The 118 elements. A compound counts for every element in it.
- The 16 joke elements (optional, on by default). They need the Joke Table item before they can turn up.
- One of each catalyst from your own shop or a drop, up to a tier you choose. Catalysts sent by other players don't
  count.
- The 100 compound achievements (optional, off by default: it's a lot of checks).

## Items

- **Progressive Luck** (progression): more luck, so rarer elements turn up more often.
- **Joke Table** (progression): joke elements can turn up, and joke catalysts appear in the shop.
- **Autoroll**, **Chain Boost**, **Extra Roll**, **Shop Slot**: helpers that speed things up.
- Catalysts and **Quark Bundles** as filler. A bundle is worth more the more luck you have.

## Options

| Option | What it does | Default |
| --- | --- | --- |
| `elements_required` | Elements needed to finish (1 to 118) | 118 |
| `jokes_required` | Joke elements needed too (0 to 16) | 0 |
| `joke_elements` | Joke elements as checks, and the Joke Table item | on |
| `catalyst_checks` | Highest catalyst tier that counts (`none` to `mythic`) | `epic` |
| `achievement_checks` | The 100 compound achievements as checks | off |
| `bonds_tree`, `shop`, `events` | Keep those parts of the game | on |
| `restock_minutes` | How often the shop restocks | 10 |
| `luck_items`, `luck_per_item` | How many Progressive Luck items, and how much each gives | 15, 100 |
| `roll_budget` | Rolls the logic will have you spend hunting one thing | 5000 |
| `filler_catalysts`, `filler_quarks` | The mix of filler | 70, 30 |

## How the logic works

The game weights each element by how rare it is, and luck tilts that toward the rarer ones. For every check the
APWorld works out how many rolls it would take at each amount of luck, and expects it once that's within
`roll_budget`. With the defaults, every element is within a few thousand rolls once all the luck has arrived.

## Building

- `python3 tools/build.py` joins `js/*.js` into `game.js` (the page loads that), and packs
  `downloads/archelemental.apworld` and the example YAML for the game's Download buttons.
- `python3 tools/build.py --apworld archelemental.apworld` packs the APWorld. It refreshes `data.json` from the
  game's code first, so the two always match.

## Hosting

The game is a static page, served by GitHub Pages from this repository. Since it's https, browsers only let it connect
to servers that support secure connections, which rooms on archipelago.gg do. A server on your own computer works as
`localhost`.
