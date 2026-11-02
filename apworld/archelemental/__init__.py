import logging
from typing import Any, ClassVar

from BaseClasses import Location, LocationProgressType, Region, Tutorial
from worlds.AutoWorld import WebWorld, World

from .data import (
    ACHIEVEMENT_BASE, ACHIEVEMENTS, BOND_BASE, BOND_NODES, BONDS_CATALYSTS, CATALYST_BASE, CATALYSTS,
    COSMETICS, ELEMENT_BASE, ELEMENTS, EVENT_CATALYSTS, ION_BASE, ION_TIERS, JOKE_BASE, JOKES, SECRET_TIER,
    achievement_location, bond_checks, bond_item, bond_location, catalyst_location, element_location, ion_location, joke_location,
)
from .items import (
    BUNDLES, ELEMENT_ITEMS, FILLER_TIER_WEIGHTS, FIXED_ITEMS, ITEM_NAME_TO_ID, ITEMS, LUCK_BOOSTS, TRAPS,
    ArchelementalItem,
)
from .logic import luck_needed, rolls_for_compound, rolls_for_element, rolls_for_ion
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
for e in ELEMENTS:
    for t in range(len(ION_TIERS)):
        LOCATION_NAME_TO_ID[ion_location(e, t)] = ION_BASE + (e["z"] - 1) * len(ION_TIERS) + t + 1
for n in range(BOND_NODES):
    LOCATION_NAME_TO_ID[bond_location(n)] = BOND_BASE + n

# a check whose expected rolls at full luck is this many times the budget only ever gets filler
HOPELESS = 20
# how many Progressive Ion Chance items there are of each sign
ION_LEVELS = 5

# when there are more items than checks, these are handed over at the start instead, first to last
GIVEN_FIRST = [c["name"] for c in COSMETICS] + [
    "Progressive Chain Boost", "Progressive Event Spawn Chance", "Progressive Quark Gain",
    "Progressive Shop Reset Speed", "Progressive Scanner Speed", "Progressive Autoroll Speed",
]


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
    Every roll pulls elements from the periodic table, and nearly everything that makes the game easier
    (luck, speed, shop upgrades, the requirements for every slot of the bonds tree) is an item in the multiworld.
    """
    game = "Archelemental"
    web = ArchelementalWeb()
    options_dataclass = ArchelementalOptions
    options: ArchelementalOptions
    item_name_to_id: ClassVar[dict[str, int]] = ITEM_NAME_TO_ID
    location_name_to_id: ClassVar[dict[str, int]] = LOCATION_NAME_TO_ID
    origin_region_name = "Lab"

    def generate_early(self) -> None:
        o = self.options
        if o.jokes_required.value > 0:
            o.joke_elements.value = 1
        if o.achievements_required.value > 0:
            o.achievement_checks.value = 1
        if not o.shop:
            o.catalyst_checks.value = 0
        counts = {"Luck Boost 15%": o.luck_boosts_15.value, "Luck Boost 30%": o.luck_boosts_30.value,
                  "Luck Boost 60%": o.luck_boosts_60.value, "Luck Boost 90%": o.luck_boosts_90.value}
        order = ["Luck Boost 90%", "Luck Boost 60%", "Luck Boost 30%", "Luck Boost 15%"]
        while sum(counts.values()) < o.minimum_luck_boosts.value:
            name = next(n for n in order if counts[n] < 5)
            counts[name] += 1
        self.boost_counts = counts
        self.max_luck = sum(LUCK_BOOSTS[n][1] * k for n, k in counts.items())
        jokes = bool(o.joke_elements)
        budget = o.roll_budget.value
        full = self.max_luck
        # luck needed for each check (None: out of reach even at full luck)
        self.need: dict[str, int | None] = {}
        for e in ELEMENTS:
            self.need[element_location(e)] = luck_needed(lambda L, s=e["sym"]: rolls_for_element(s, L, jokes), full, budget)
        if jokes:
            for j in JOKES:
                self.need[joke_location(j)] = luck_needed(lambda L, s=j["sym"]: rolls_for_element(s, L, True), full, budget)
        self.hopeless: dict[str, float] = {}
        if o.achievement_checks:
            for a in ACHIEVEMENTS:
                name = achievement_location(a)
                self.need[name] = luck_needed(lambda L, f=a["formula"]: rolls_for_compound(f, L, jokes), full, budget)
                if self.need[name] is None:
                    rolls = rolls_for_compound(a["formula"], full, jokes)
                    if rolls > budget * HOPELESS:
                        self.hopeless[name] = rolls
                        self.need[name] = full
        # elements and jokes always have to be possible: anything out of reach waits for the last luck
        for name, k in self.need.items():
            if k is None:
                self.need[name] = full
        self.ion_levels = ION_LEVELS if o.ionization_frenzy else 0
        if o.ionization_frenzy:
            for e in ELEMENTS:
                for t, (sign, size) in enumerate(ION_TIERS):
                    name = ion_location(e, t)
                    rolls = rolls_for_ion(e["sym"], sign, size, full, ION_LEVELS, jokes)
                    self.need[name] = self.need[element_location(e)]
                    if rolls > budget * HOPELESS:
                        self.hopeless[name] = rolls
        self.plan_locations()
        self.plan_items()
        spaces = len(self.location_names)
        # excluded locations can only hold filler, so only exclude as many as the filler can cover
        slack = max(0, int((spaces - len(self.required)) * 0.6))
        worst = sorted(self.hopeless, key=lambda n: -self.hopeless[n])
        self.excluded = set(worst[:slack])
        for name in worst[slack:]:
            del self.hopeless[name]


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

    def plan_locations(self) -> None:
        o = self.options
        names = [element_location(e) for e in ELEMENTS]
        if o.joke_elements:
            names += [joke_location(j) for j in JOKES]
        names += [catalyst_location(c) for _, c in self.catalysts_checked()]
        if o.achievement_checks:
            names += [achievement_location(a) for a in ACHIEVEMENTS]
        if o.ionization_frenzy:
            names += [ion_location(e, t) for e in ELEMENTS for t in range(len(ION_TIERS))]
        self.lab_names = names
        self.bond_ids, self.bond_parent = bond_checks(o.bond_slots.value) if o.bonds_tree else ([], {})
        self.location_names = names + [bond_location(n) for n in self.bond_ids]

    def create_regions(self) -> None:
        p = self.player
        lab = Region("Lab", p, self.multiworld)
        self.multiworld.regions.append(lab)
        for name in self.lab_names:
            loc = ArchelementalLocation(p, name, LOCATION_NAME_TO_ID[name], lab)
            if name in self.excluded:
                loc.progress_type = LocationProgressType.EXCLUDED
            lab.locations.append(loc)
        if not self.bond_ids:
            return
        # the bonds tree: you can take a slot once you've taken the one before it on the way out and hold its requirements
        regions = {}
        for n in self.bond_ids:
            r = Region(bond_location(n), p, self.multiworld)
            r.locations.append(ArchelementalLocation(p, bond_location(n), BOND_BASE + n, r))
            self.multiworld.regions.append(r)
            regions[n] = r

        def rule_for(item):
            return lambda state: state.has(item, p)

        lab.connect(regions[0], "Start of the bonds tree", rule_for(bond_item(0)))
        for n in self.bond_ids[1:]:
            regions[self.bond_parent[n]].connect(regions[n], None, rule_for(bond_item(n)))


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
        if self.random.random() < 0.4:
            return self.random.choices(list(BUNDLES), [100, 50, 10, 2])[0]
        cats = self.filler_catalysts()
        weights = [FILLER_TIER_WEIGHTS[c["tier"]] for c in cats]
        return self.random.choices(cats, weights)[0]["name"]

    def plan_items(self) -> None:
        o = self.options
        req: list[str] = []
        for name, (_, _, copies) in FIXED_ITEMS.items():
            if name in ("Progressive Shop Luck", "Progressive Shop Reset Speed", "Progressive Shop Slot",
                        "Shop Hold Unlock", "Catalyst Rolling Unlock") and not o.shop:
                continue
            if name == "Progressive Event Spawn Chance" and not o.events:
                continue
            if name in ("Progressive + Ion Chance", "Progressive - Ion Chance") and not o.ionization_frenzy:
                continue
            req += [name] * copies
        for name, k in self.boost_counts.items():
            req += [name] * k
        req += [c["name"] for c in COSMETICS]
        req += [bond_item(n) for n in self.bond_ids]
        if o.element_frenzy:
            req += [ELEMENT_ITEMS[e["sym"]] for e in ELEMENTS]
        self.required = req
        traps = ["Roll Speed Trap"] * o.roll_speed_traps.value + ["Luck Trap"] * o.luck_traps.value \
            + ["Quark Drop Trap"] * o.quark_drop_traps.value
        bundles = ["Quark Bundle 100"] * o.bundles_100.value + ["Quark Bundle 1000"] * o.bundles_1000.value \
            + ["Quark Bundle 10000"] * o.bundles_10000.value + ["Quark Bundle 100000"] * o.bundles_100000.value
        cats = [c["name"] for c in self.filler_catalysts() for _ in range(o.catalyst_copies.value)]
        self.traps, self.bundles, self.cats = traps, bundles, cats

    def create_items(self) -> None:
        spaces = len(self.location_names)
        pool = list(self.required)
        # more items than checks: hand the least important ones over at the start
        given = []
        for name in GIVEN_FIRST:
            while len(pool) > spaces and name in pool:
                pool.remove(name)
                given.append(name)
        if len(pool) > spaces:
            raise Exception(f"Archelemental: {len(pool)} items for {spaces} checks for {self.player_name}. "
                            "Turn on more checks (achievements, Ionization Frenzy) or turn off Element Frenzy.")
        if given:
            logging.warning("Archelemental (%s): more items than checks, so %d start in your inventory: %s",
                            self.player_name, len(given), ", ".join(sorted(set(given))))
            for name in given:
                self.multiworld.push_precollected(self.create_item(name))
        room = spaces - len(pool)
        traps = list(self.traps)
        self.random.shuffle(traps)
        pool += traps[:room]
        room = spaces - len(pool)
        filler = self.bundles + self.cats
        self.random.shuffle(filler)
        pool += filler[:room]
        while len(pool) < spaces:
            pool.append(self.get_filler_item_name())
        self.multiworld.itempool += [self.create_item(name) for name in pool]


    def luck_of(self, state) -> int:
        return sum(state.count(name, self.player) * LUCK_BOOSTS[name][1] for name in self.boost_counts)

    def set_rules(self) -> None:
        p = self.player
        o = self.options
        shop_luck_max = FIXED_ITEMS["Progressive Shop Luck"][2]
        for loc in self.multiworld.get_region("Lab", p).locations:
            name = loc.name
            luck = self.need.get(name, 0)
            conditions = []
            if name.startswith("Catalyst: "):
                c = next(c for c in CATALYSTS if catalyst_location(c) == name)
                # higher tiers turn up less often and cost more, so they wait for more shop luck
                k = round(shop_luck_max * c["tier"] / 6)
                luck = 0
                if k:
                    conditions.append(lambda state, k=k: state.has("Progressive Shop Luck", p, k))
                if c["joke"]:
                    conditions.append(lambda state: state.has("Joke Table Unlock", p))
            elif any(name == joke_location(j) for j in JOKES):
                conditions.append(lambda state: state.has("Joke Table Unlock", p))
            elif " ion " in name:
                size = int(name[-1])
                plus = name[-2] == "+"
                conditions.append(lambda state: state.has("Ionization Unlock", p))
                conditions.append(lambda state, s=size, n="Progressive + Ion Chance" if plus else "Progressive - Ion Chance":
                                  state.has(n, p, min(ION_LEVELS, 2 * s - 1)))
            if luck:
                conditions.append(lambda state, k=luck: self.luck_of(state) >= k)
            if conditions:
                loc.access_rule = lambda state, cs=tuple(conditions): all(c(state) for c in cs)
        goal_luck = sorted(self.need[element_location(e)] for e in ELEMENTS)[o.elements_required.value - 1]
        need_jokes = o.jokes_required.value
        if need_jokes:
            goal_luck = max(goal_luck, sorted(self.need[joke_location(j)] for j in JOKES)[need_jokes - 1])
        need_ach = o.achievements_required.value
        if need_ach:
            goal_luck = max(goal_luck, sorted(self.need[achievement_location(a)] for a in ACHIEVEMENTS)[need_ach - 1])
        def goal(state):
            if self.luck_of(state) < goal_luck:
                return False
            if need_jokes and not state.has("Joke Table Unlock", p):
                return False
            return True

        self.multiworld.completion_condition[p] = goal

    def fill_slot_data(self) -> dict[str, Any]:
        data = self.options.as_dict(
            "elements_required", "jokes_required", "achievements_required", "element_frenzy", "ionization_frenzy",
            "joke_elements", "catalyst_checks", "achievement_checks", "bonds_tree", "bond_slots", "shop", "events",
            "restock_minutes",
        )
        data["bond_nodes"] = BOND_NODES
        data["ion_levels"] = self.ion_levels
        return data
