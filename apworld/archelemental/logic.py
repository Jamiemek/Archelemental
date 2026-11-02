"""How much luck each check needs.

The game weights every element by 1/odds, and luck tilts that toward the rarer ones:
    weight = (1 / odds) * (1 + 1.5 * log10(odds + 1) / 3) ** (luck / 150)
A check is in logic once the expected number of rolls to find it is within the roll budget.
Luck comes from the flat Luck Boost items, so "how much luck" is a percentage, not a count of items.
"""
import math
import re
from functools import lru_cache

from .data import ELEMENTS, JOKES

# a roll is one element, plus a 1 in 8 chance of each extra one
BASE_CHAIN = 8
ELEMENTS_PER_ROLL = BASE_CHAIN / (BASE_CHAIN - 1)

LUCK_STEP = 15

# ions (see rollIon in the game): the base chance of a + and a - ion, and what each Progressive Ion Chance adds
ION_PLUS = 0.01
ION_MINUS = 0.001
ION_PLUS_STEP = 0.01
ION_MINUS_STEP = 0.002


def weight(odds, luck):
    return (1 / odds) * (1 + 1.5 * math.log10(odds + 1) / 3) ** (luck / 150)


@lru_cache(maxsize=None)
def chances(luck, jokes):
    pool = ELEMENTS + (JOKES if jokes else [])
    w = {e["sym"]: weight(e["odds"], luck) for e in pool}
    total = sum(w.values())
    return {s: v / total for s, v in w.items()}


def rolls_for_element(sym, luck, jokes):
    return 1 / (chances(luck, jokes)[sym] * ELEMENTS_PER_ROLL)


def parse_formula(formula):
    counts = {}
    for sym, n in re.findall(r"([A-Z][a-z]?)(\d*)", formula):
        counts[sym] = counts.get(sym, 0) + (int(n) if n else 1)
    return counts


def rolls_for_compound(formula, luck, jokes):
    # exactly these elements in one chain, in any order
    counts = parse_formula(formula)
    p = chances(luck, jokes)
    n = sum(counts.values())
    ways = math.factorial(n)
    chance = 1.0
    for sym, k in counts.items():
        if sym not in p:
            return math.inf
        ways //= math.factorial(k)
        chance *= p[sym] ** k
    chance *= ways * (1 / BASE_CHAIN) ** (n - 1) * (1 - 1 / BASE_CHAIN)
    return 1 / chance if chance > 0 else math.inf


def luck_needed(rolls_at, max_luck, budget):
    """The least luck (in percent) that brings a check within budget, or None if even all of it doesn't."""
    steps = list(range(0, int(max_luck) + 1, LUCK_STEP))
    if steps[-1] != max_luck:
        steps.append(max_luck)
    for luck in steps:
        if rolls_at(luck) <= budget:
            return luck
    return None


def ion_chance(sign, size, levels):
    """Chance that one roll comes out as an ion of this sign and at least this size, with this many Ion Chance items."""
    if sign > 0:
        p = ION_PLUS + ION_PLUS_STEP * levels
    else:
        p = ION_MINUS + ION_MINUS_STEP * levels
    return p ** size


def rolls_for_ion(sym, sign, size, luck, levels, jokes):
    """Expected rolls to roll this ion of this element as the first element of a roll."""
    first = chances(luck, jokes)[sym]
    return 1 / (first * ion_chance(sign, size, levels))
