from typing import Any, ClassVar

from BaseClasses import Location, LocationProgressType, Region, Tutorial
from worlds.AutoWorld import WebWorld, World

from .data import (
    ACHIEVEMENT_BASE, ACHIEVEMENTS, BONDS_CATALYSTS, CATALYST_BASE, CATALYSTS, ELEMENT_BASE, ELEMENTS, EVENT_CATALYSTS,
    JOKE_BASE, JOKES, SECRET_TIER, achievement_location, catalyst_location, element_location, joke_location,
)
from .items import (
    CHAIN_BOOSTS, EXTRA_ROLLS, FILLER_TIER_WEIGHTS, ITEM_NAME_TO_ID, ITEMS, SHOP_SLOTS, ArchelementalItem,
)
from .logic import luck_needed, rolls_for_compound, rolls_for_element
from .options import ArchelementalOptions, option_groups

LOCATION_NAME_TO_ID = {}
for e in ELEMENTS:
    LOCATION_NAME_TO_ID[element_location(e)] = ELEMENT_BASE + e["z"]
for i, j in enumerate(JOKES):
    LOCATION_NAME_TO_ID[joke_location(j)] = JOKE_BASE + i + 1
for i, c in enumerate(CATALYSTS):
    if c["tier"] < SECRET_TIER:
        LOCATION_NAME_TO_ID[catalyst_location(c)] = CATALYST_BASE + i + 1
for i, a in enumerate(ACHIEVEMENTS):
    LOCATION_NAME_TO_ID[achievement_location(a)] = ACHIEVEMENT_BASE + i + 1

# a check whose expected rolls at full luck is this many times the budget only ever gets filler
HOPELESS = 20


class ArchelementalLocation(Location):
    game = "Archelemental"


class ArchelementalWeb(WebWorld):
    theme = "stone"
    option_groups = option_groups
    tutorials = [Tutorial(
        "Multiworld Setup Guide",
        "How to set up and play Archelemental with Archipelago.",
        "English",
        "setup_en.md",
        "setup/en",
        ["Jamiemek"],
    )]


class ArchelementalWorld(World):
    """
    Archelemental is Elemental, the periodic table roll game, for Archipelago.
    Every roll pulls elements from the periodic table; finding each one for the first time is a check.
    Progressive Luck from the multiworld tilts the odds toward the rare ones.
    """
    game = "Archelemental"
    web = ArchelementalWeb()
    options_dataclass = ArchelementalOptions
    options: ArchelementalOptions
    item_name_to_id: ClassVar[dict[str, int]] = ITEM_NAME_TO_ID
    location_name_to_id: ClassVar[dict[str, int]] = LOCATION_NAME_TO_ID
    origin_region_name = "Lab"

    def generate_early(self) -> None:
        if self.options.jokes_required.value > 0:
            self.options.joke_elements.value = 1
        if not self.options.shop:
            self.options.catalyst_checks.value = 0
        n = self.options.luck_items.value
        per = self.options.luck_per_item.value
        budget = self.options.roll_budget.value
        jokes = bool(self.options.joke_elements)
        full = n * per
        # Progressive Luck needed for each check (None: out of reach even at full luck)
        self.need: dict[str, int | None] = {}
        for e in ELEMENTS:
            self.need[element_location(e)] = luck_needed(lambda L, s=e["sym"]: rolls_for_element(s, L, jokes), n, per, budget)
        if jokes:
            for j in JOKES:
                self.need[joke_location(j)] = luck_needed(lambda L, s=j["sym"]: rolls_for_element(s, L, True), n, per, budget)
        if self.options.achievement_checks:
            for a in ACHIEVEMENTS:
                name = achievement_location(a)
                self.need[name] = luck_needed(lambda L, f=a["formula"]: rolls_for_compound(f, L, jokes), n, per, budget)
                if self.need[name] is None:
                    self.need[name] = -1 if rolls_for_compound(a["formula"], full, jokes) > budget * HOPELESS else None
        # elements and jokes always have to be possible: anything out of reach waits for the last luck
        for name, k in self.need.items():
            if k is None:
                self.need[name] = n

    def catalysts_checked(self):
        top = self.options.catalyst_checks.value
        out = []
        for i, c in enumerate(CATALYSTS):
            if c["tier"] >= min(top, SECRET_TIER):
                continue
            if c["joke"] and not self.options.joke_elements:
                continue
            out.append((i, c))
        return out

    def create_regions(self) -> None:
        lab = Region("Lab", self.player, self.multiworld)
        self.multiworld.regions.append(lab)
        names = [element_location(e) for e in ELEMENTS]
        if self.options.joke_elements:
            names += [joke_location(j) for j in JOKES]
        names += [catalyst_location(c) for _, c in self.catalysts_checked()]
        if self.options.achievement_checks:
            names += [achievement_location(a) for a in ACHIEVEMENTS]
        for name in names:
            loc = ArchelementalLocation(self.player, name, LOCATION_NAME_TO_ID[name], lab)
            if self.need.get(name) == -1:
                loc.progress_type = LocationProgressType.EXCLUDED
            lab.locations.append(loc)

    def create_item(self, name: str) -> ArchelementalItem:
        return ArchelementalItem(name, ITEMS[name][1], ITEMS[name][0], self.player)

    def filler_catalysts(self):
        out = []
        for c in CATALYSTS:
            if c["tier"] >= SECRET_TIER:
                continue
            if c["joke"] and not self.options.joke_elements:
                continue
            if c["id"] in EVENT_CATALYSTS and not self.options.events:
                continue
            if c["id"] in BONDS_CATALYSTS and not self.options.bonds_tree:
                continue
            out.append(c)
        return out

    def get_filler_item_name(self) -> str:
        cats = self.filler_catalysts()
        cw = self.options.filler_catalysts.value
        qw = self.options.filler_quarks.value
        if not cats or not cw or self.random.random() * (cw + qw) >= cw:
            if qw or not cats:
                return "Quark Bundle"
        weights = [FILLER_TIER_WEIGHTS[c["tier"]] for c in cats]
        return self.random.choices(cats, weights)[0]["name"]

    def create_items(self) -> None:
        pool = ["Progressive Luck"] * self.options.luck_items.value
        if self.options.joke_elements:
            pool.append("Joke Table")
        pool += ["Autoroll"] + ["Chain Boost"] * CHAIN_BOOSTS + ["Extra Roll"] * EXTRA_ROLLS
        if self.options.shop:
            pool += ["Shop Slot"] * SHOP_SLOTS
        spaces = len(self.multiworld.get_unfilled_locations(self.player))
        pool = pool[:spaces]
        pool += [self.get_filler_item_name() for _ in range(spaces - len(pool))]
        self.multiworld.itempool += [self.create_item(name) for name in pool]

    def set_rules(self) -> None:
        p = self.player
        for loc in self.multiworld.get_region("Lab", p).locations:
            k = self.need.get(loc.name)
            if loc.name.startswith("Catalyst: "):
                c = next(c for c in CATALYSTS if catalyst_location(c) == loc.name)
                # higher tiers turn up less often and cost more, so they wait for more luck
                k = round(self.options.luck_items.value * c["tier"] / 6)
                joke = c["joke"]
            else:
                joke = any(loc.name == joke_location(j) for j in JOKES)
            k = max(0, k or 0)
            if joke:
                loc.access_rule = lambda state, k=k: state.has("Joke Table", p) and state.has("Progressive Luck", p, k)
            elif k:
                loc.access_rule = lambda state, k=k: state.has("Progressive Luck", p, k)
        # the goal: enough elements (and jokes) in reach
        el = sorted(self.need[element_location(e)] for e in ELEMENTS)[self.options.elements_required.value - 1]
        need_jokes = self.options.jokes_required.value
        jk = sorted(self.need[joke_location(j)] for j in JOKES)[need_jokes - 1] if need_jokes else 0
        goal = max(el, jk)
        if need_jokes:
            self.multiworld.completion_condition[p] = lambda state: state.has("Joke Table", p) and state.has("Progressive Luck", p, goal)
        else:
            self.multiworld.completion_condition[p] = lambda state: state.has("Progressive Luck", p, goal)

    def fill_slot_data(self) -> dict[str, Any]:
        return self.options.as_dict(
            "elements_required", "jokes_required", "joke_elements", "catalyst_checks", "achievement_checks",
            "bonds_tree", "shop", "events", "luck_items", "luck_per_item", "restock_minutes",
        )
