from BaseClasses import Item, ItemClassification

from .data import CATALYSTS, SECRET_TIER

P = ItemClassification.progression
U = ItemClassification.useful
F = ItemClassification.filler

# name: (id, classification)
ITEMS = {
    "Progressive Luck": (1, P),
    "Joke Table": (2, P),
    "Autoroll": (3, U),
    "Chain Boost": (4, U),
    "Extra Roll": (5, U),
    "Shop Slot": (6, U),
    "Quark Bundle": (7, F),
}
CATALYST_ITEM_BASE = 100
for i, c in enumerate(CATALYSTS):
    if c["tier"] < SECRET_TIER:
        ITEMS[c["name"]] = (CATALYST_ITEM_BASE + i, U if c["tier"] >= 4 else F)

ITEM_NAME_TO_ID = {name: data[0] for name, data in ITEMS.items()}

# how many of each helper go in the pool
CHAIN_BOOSTS = 3
EXTRA_ROLLS = 2
SHOP_SLOTS = 2
# catalyst filler leans toward the common tiers
FILLER_TIER_WEIGHTS = [40, 25, 15, 10, 6, 4]


class ArchelementalItem(Item):
    game = "Archelemental"
