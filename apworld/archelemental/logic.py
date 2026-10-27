"""How much Progressive Luck each check needs.

The game weights every element by 1/odds, and luck tilts that toward the rarer ones:
    weight = (1 / odds) * (1 + 1.5 * log10(odds + 1) / 3) ** (luck / 150)
A check is in logic once the expected number of rolls to find it is within the roll budget.
"""
import math
import re
from functools import lru_cache

from .data import ELEMENTS, JOKES

# a roll is one element, plus a 1 in 8 chance of each extra one
BASE_CHAIN = 8
ELEMENTS_PER_ROLL = BASE_CHAIN / (BASE_CHAIN - 1)


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


def luck_needed(rolls_at, luck_items, luck_per_item, budget):
    """The fewest Progressive Luck items that bring a check within budget, or None if even all of them don't."""
    for k in range(luck_items + 1):
        if rolls_at(k * luck_per_item) <= budget:
            return k
    return None
