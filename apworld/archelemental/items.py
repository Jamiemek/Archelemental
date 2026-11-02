from BaseClasses import Item, ItemClassification

from .data import BOND_GROUP, BOND_NODES, CATALYSTS, COSMETICS, ELEMENTS, SECRET_TIER, bond_item

P = ItemClassification.progression
PS = ItemClassification.progression_skip_balancing
U = ItemClassification.useful
F = ItemClassification.filler
T = ItemClassification.trap

FIXED_ITEMS = {
    "Progressive Bonus Roll": (1, U, 3),
    "Progressive Shop Luck": (2, P, 8),
    "Progressive Shop Reset Speed": (3, U, 8),
    "Progressive Shop Slot": (4, U, 5),
    "Catalyst Rolling Unlock": (5, U, 1),
    "Shop Hold Unlock": (6, U, 1),
    "Progressive Autoroll Speed": (11, U, 8),
    "Progressive Scanner Speed": (12, U, 8),
    "Progressive Event Spawn Chance": (13, U, 8),
    "Progressive Quark Gain": (14, U, 8),
    "Autoroll Unlock": (15, U, 1),
    "Progressive Chain Boost": (16, U, 3),
    "Joke Table Unlock": (17, P, 1),
    "Ionization Unlock": (18, P, 1),
    "Progressive + Ion Chance": (19, P, 5),
    "Progressive - Ion Chance": (20, P, 5),
}

LUCK_BOOSTS = {
    "Luck Boost 15%": (7, 15),
    "Luck Boost 30%": (8, 30),
    "Luck Boost 60%": (9, 60),
    "Luck Boost 90%": (10, 90),
}

BUNDLES = {
    "Quark Bundle 100": (21, 100),
    "Quark Bundle 1000": (22, 1000),
    "Quark Bundle 10000": (23, 10000),
    "Quark Bundle 100000": (24, 100000),
}

# 25 to 27 were the old Roll Speed, Luck and Quark Drop Traps
TRAPS = {
    "Disable Autoroll Trap": 28,
    "Drop All Quarks Trap": 29,
    "All Buffs Gone Trap": 30,
}

ITEMS = {}
for name, (i, cls, _) in FIXED_ITEMS.items():
    ITEMS[name] = (i, cls)
for name, (i, _) in LUCK_BOOSTS.items():
    ITEMS[name] = (i, P)
for name, (i, _) in BUNDLES.items():
    ITEMS[name] = (i, F)
for name, i in TRAPS.items():
    ITEMS[name] = (i, T)

COSMETIC_ITEM_BASE = 40
COSMETIC_ITEMS = {}
for i, c in enumerate(COSMETICS):
    ITEMS[c["name"]] = (COSMETIC_ITEM_BASE + i, U)
    COSMETIC_ITEMS[c["name"]] = c["id"]

CATALYST_ITEM_BASE = 100
for i, c in enumerate(CATALYSTS):
    if c["tier"] < SECRET_TIER:
        ITEMS[c["name"]] = (CATALYST_ITEM_BASE + i, U if c["tier"] >= 4 else F)

ELEMENT_ITEM_BASE = 5000
ELEMENT_ITEMS = {}
for e in ELEMENTS:
    name = f"Element: {e['name']}"
    # nothing is locked behind them, so they don't need to be progression: that keeps the fill quick
    ITEMS[name] = (ELEMENT_ITEM_BASE + e["z"], U)
    ELEMENT_ITEMS[e["sym"]] = name

# 10000 and up held one slot's requirements each, up to 1.3.0; groups start from 30000
BOND_ITEM_BASE = 30000
for n in range(0, BOND_NODES, BOND_GROUP):
    ITEMS[bond_item(n)] = (BOND_ITEM_BASE + n // BOND_GROUP, PS)

ITEM_NAME_TO_ID = {name: data[0] for name, data in ITEMS.items()}

# catalyst filler leans toward the common tiers
FILLER_TIER_WEIGHTS = [40, 25, 15, 10, 6, 4]


class ArchelementalItem(Item):
    game = "Archelemental"
