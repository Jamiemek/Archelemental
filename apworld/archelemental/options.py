from dataclasses import dataclass

from Options import Choice, DefaultOnToggle, OptionGroup, PerGameCommonOptions, Range, Toggle


class ElementsRequired(Range):
    """How many of the 118 real elements you need to find to finish."""
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


class JokeElements(DefaultOnToggle):
    """Adds the 16 joke elements as checks, and a Joke Table item that lets you roll them."""
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
    Careful: this adds a lot of checks, and a few of the compounds are so rare they're only ever given filler."""
    display_name = "Achievement Checks"


class BondsTree(DefaultOnToggle):
    """Keeps the bonds tree, where you spend found elements on permanent bonuses."""
    display_name = "Bonds Tree"


class Shop(DefaultOnToggle):
    """Keeps the shop, where you buy catalysts with quarks."""
    display_name = "Shop"


class Events(DefaultOnToggle):
    """Keeps events like Quark Storms. They never count as checks, they just help you find things."""
    display_name = "Events"


class LuckItems(Range):
    """How many Progressive Luck items there are. Rarer elements are in logic once you have enough of them."""
    display_name = "Progressive Luck Items"
    range_start = 5
    range_end = 30
    default = 15


class LuckPerItem(Range):
    """How much luck each Progressive Luck gives, in percent. With 15 items at 100% everything is within a few thousand rolls.
    Much less than that and the rarest elements get very slow."""
    display_name = "Luck per Item"
    range_start = 25
    range_end = 300
    default = 100


class RollBudget(Range):
    """How many rolls the logic is willing to have you spend hunting one thing before it counts as reachable.
    Lower means the logic asks for more luck before sending you after rare elements."""
    display_name = "Roll Budget"
    range_start = 500
    range_end = 50000
    default = 5000


class RestockMinutes(Range):
    """How often the shop restocks, in minutes. The normal game is 20."""
    display_name = "Shop Restock Minutes"
    range_start = 2
    range_end = 20
    default = 10


class FillerCatalysts(Range):
    """How much of the filler is catalysts, compared to Quark Bundles."""
    display_name = "Filler Catalysts"
    range_start = 0
    range_end = 100
    default = 70


class FillerQuarks(Range):
    """How much of the filler is Quark Bundles, compared to catalysts. A bundle is worth more the more luck you have."""
    display_name = "Filler Quarks"
    range_start = 0
    range_end = 100
    default = 30


@dataclass
class ArchelementalOptions(PerGameCommonOptions):
    elements_required: ElementsRequired
    jokes_required: JokesRequired
    joke_elements: JokeElements
    catalyst_checks: CatalystChecks
    achievement_checks: AchievementChecks
    bonds_tree: BondsTree
    shop: Shop
    events: Events
    luck_items: LuckItems
    luck_per_item: LuckPerItem
    roll_budget: RollBudget
    restock_minutes: RestockMinutes
    filler_catalysts: FillerCatalysts
    filler_quarks: FillerQuarks


option_groups = [
    OptionGroup("Goal", [ElementsRequired, JokesRequired]),
    OptionGroup("Checks", [JokeElements, CatalystChecks, AchievementChecks]),
    OptionGroup("Game", [BondsTree, Shop, Events, RestockMinutes]),
    OptionGroup("Luck", [LuckItems, LuckPerItem, RollBudget]),
    OptionGroup("Filler", [FillerCatalysts, FillerQuarks]),
]
