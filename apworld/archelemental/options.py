from dataclasses import dataclass

from Options import Choice, DeathLink as BaseDeathLink, DefaultOnToggle, OptionGroup, PerGameCommonOptions, Range, Toggle

from .data import BOND_NODES


class ElementsRequired(Range):
    """How many of the 118 real elements you need to have found to finish."""
    display_name = "Elements Required"
    range_start = 1
    range_end = 118
    default = 118


class JokesRequired(Range):
    """How many of the 16 joke elements you also need to find to finish. Anything above 0 turns on Joke Elements."""
    display_name = "Joke Elements Required"
    range_start = 0
    range_end = 16
    default = 0


class AchievementsRequired(Range):
    """How many of the 100 compound achievements you also need to complete to finish.
    Anything above 0 turns on Achievement Checks."""
    display_name = "Achievements Required"
    range_start = 0
    range_end = 100
    default = 0


class ElementFrenzy(Toggle):
    """WIP, expect some bugs. The elements on the collection table become items in the multiworld.
    Rolling an element still counts as a check the first time, but it doesn't add to your collection:
    you only get elements by receiving them."""
    display_name = "Element Frenzy"


class IonizationFrenzy(Toggle):
    """WIP, expect some bugs. Every ion tier (+1, +2, +3, -1, -2, -3) of every element is an extra check.
    Adds the Ionization Unlock, Progressive + Ion Chance and Progressive - Ion Chance items.
    The rarest ion tiers of the rarest elements only ever hold filler."""
    display_name = "Ionization Frenzy"


class JokeElements(DefaultOnToggle):
    """Adds the 16 joke elements as checks, and a Joke Table Unlock item that lets you roll them."""
    display_name = "Joke Elements"


class CatalystChecks(Choice):
    """Getting one of each catalyst from your own shop (or a drop) is a check, up to this tier.
    Catalysts other players send you don't count. Needs the shop to be on.
    The higher tiers can take a long while to show up in the shop."""
    display_name = "Catalyst Checks"
    option_none = 0
    option_common = 1
    option_uncommon = 2
    option_rare = 3
    option_epic = 4
    option_legendary = 5
    option_mythic = 6
    default = 4


class AchievementChecks(Toggle):
    """Each of the 100 compound achievements is a check.
    Careful: a few of the compounds are so rare they're only ever given filler."""
    display_name = "Achievement Checks"


class BondsTree(Toggle):
    """Adds the bonds tree. Its slots are checks, and each one's requirements arrive as an item.
    Bond Slots sets how many of them count."""
    display_name = "Bonds Tree"


class BondSlots(Range):
    """How many bonds tree slots are checks, counting out from the middle. Only used with Bonds Tree on.
    The rest of the tree can still be filled in, but those slots aren't checks.
    2,063 to 2,110 count as 2,062: the first slots of the outer ring are only reached from further round it."""
    display_name = "Bond Slots"
    range_start = 1
    range_end = BOND_NODES
    default = 800


class Shop(DefaultOnToggle):
    """Keeps the shop, where you buy catalysts with quarks."""
    display_name = "Shop"


class PlaceAutorollEarly(DefaultOnToggle):
    """Puts Autoroll Unlock on one of the five most common elements in your own game, so it turns up in your first
    few minutes of rolling instead of somewhere deep in the multiworld."""
    display_name = "Place Autoroll Early"


class Events(DefaultOnToggle):
    """Keeps events like Quark Storms. They never count as checks, they just help you find things."""
    display_name = "Events"


class RestockMinutes(Range):
    """How often the shop restocks, in minutes, before Progressive Shop Reset Speed. The normal game is 20."""
    display_name = "Shop Restock Minutes"
    range_start = 10
    range_end = 20
    default = 18


class LuckBoost15(Range):
    """How many +15% luck boosts are in the pool."""
    display_name = "15% Luck Boosts"
    range_start = 0
    range_end = 5
    default = 5


class LuckBoost30(Range):
    """How many +30% luck boosts are in the pool."""
    display_name = "30% Luck Boosts"
    range_start = 0
    range_end = 5
    default = 5


class LuckBoost60(Range):
    """How many +60% luck boosts are in the pool."""
    display_name = "60% Luck Boosts"
    range_start = 0
    range_end = 5
    default = 5


class LuckBoost90(Range):
    """How many +90% luck boosts are in the pool."""
    display_name = "90% Luck Boosts"
    range_start = 0
    range_end = 5
    default = 5


class MinimumLuckBoosts(Range):
    """The fewest luck boosts there can be in total. If your counts above add up to less, the strongest are topped up.
    Luck only comes from these, so too few makes the rare elements very slow."""
    display_name = "Minimum Luck Boosts"
    range_start = 4
    range_end = 20
    default = 8


class RollBudget(Range):
    """How many rolls the logic is willing to have you spend hunting one thing before it counts as reachable.
    Lower means the logic asks for more luck before sending you after rare elements."""
    display_name = "Roll Budget"
    range_start = 500
    range_end = 50000
    default = 5000


class CatalystCopies(Range):
    """How many of each catalyst are in the pool as filler. Filler is trimmed or topped up to fit the number of checks."""
    display_name = "Catalyst Copies"
    range_start = 0
    range_end = 50
    default = 50


class Bundles100(Range):
    """How many 100 quark bundles are in the pool."""
    display_name = "100 Quark Bundles"
    range_start = 0
    range_end = 200
    default = 200


class Bundles1000(Range):
    """How many 1,000 quark bundles are in the pool."""
    display_name = "1,000 Quark Bundles"
    range_start = 0
    range_end = 100
    default = 100


class Bundles10000(Range):
    """How many 10,000 quark bundles are in the pool."""
    display_name = "10,000 Quark Bundles"
    range_start = 0
    range_end = 50
    default = 50


class Bundles100000(Range):
    """How many 100,000 quark bundles are in the pool."""
    display_name = "100,000 Quark Bundles"
    range_start = 0
    range_end = 10
    default = 10


class DeathLink(BaseDeathLink):
    """Adds Deathlink Checks, 5% more on top of your other checks. Each one goes off on a random roll and sends a
    deathlink to everyone else who has it on. A deathlink sent to you sets off all three traps at once: autoroll off
    and all buffs gone for 5 minutes, and every quark you're holding lost."""


class DisableAutorollTraps(Range):
    """How many Disable Autoroll Traps replace filler. Each switches autoroll off for 5 minutes."""
    display_name = "Disable Autoroll Traps"
    range_start = 0
    range_end = 50
    default = 0


class DropAllQuarksTraps(Range):
    """How many Drop All Quarks Traps replace filler. Each takes every quark you're holding."""
    display_name = "Drop All Quarks Traps"
    range_start = 0
    range_end = 50
    default = 0


class AllBuffsGoneTraps(Range):
    """How many All Buffs Gone Traps replace filler. For 5 minutes each, your luck, scanner and autoroll speed,
    bonus rolls, chain chance, quark gain and running catalysts all stop working."""
    display_name = "All Buffs Gone Traps"
    range_start = 0
    range_end = 50
    default = 0


@dataclass
class ArchelementalOptions(PerGameCommonOptions):
    elements_required: ElementsRequired
    jokes_required: JokesRequired
    achievements_required: AchievementsRequired
    element_frenzy: ElementFrenzy
    ionization_frenzy: IonizationFrenzy
    joke_elements: JokeElements
    catalyst_checks: CatalystChecks
    achievement_checks: AchievementChecks
    bonds_tree: BondsTree
    bond_slots: BondSlots
    shop: Shop
    events: Events
    place_autoroll_early: PlaceAutorollEarly
    restock_minutes: RestockMinutes
    luck_boosts_15: LuckBoost15
    luck_boosts_30: LuckBoost30
    luck_boosts_60: LuckBoost60
    luck_boosts_90: LuckBoost90
    minimum_luck_boosts: MinimumLuckBoosts
    roll_budget: RollBudget
    catalyst_copies: CatalystCopies
    bundles_100: Bundles100
    bundles_1000: Bundles1000
    bundles_10000: Bundles10000
    bundles_100000: Bundles100000
    disable_autoroll_traps: DisableAutorollTraps
    drop_all_quarks_traps: DropAllQuarksTraps
    all_buffs_gone_traps: AllBuffsGoneTraps
    death_link: DeathLink


option_groups = [
    OptionGroup("Goal", [ElementsRequired, JokesRequired, AchievementsRequired]),
    OptionGroup("Game modes", [ElementFrenzy, IonizationFrenzy]),
    OptionGroup("Checks", [JokeElements, CatalystChecks, AchievementChecks]),
    OptionGroup("Game", [BondsTree, BondSlots, Shop, Events, RestockMinutes, PlaceAutorollEarly]),
    OptionGroup("Luck", [LuckBoost15, LuckBoost30, LuckBoost60, LuckBoost90, MinimumLuckBoosts, RollBudget]),
    OptionGroup("Filler", [CatalystCopies, Bundles100, Bundles1000, Bundles10000, Bundles100000]),
    OptionGroup("Traps", [DisableAutorollTraps, DropAllQuarksTraps, AllBuffsGoneTraps, DeathLink]),
]
