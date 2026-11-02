import json
import pkgutil

# data.json is written from the game's own code by tools/apdata.py, so the two never drift apart
DATA = json.loads(pkgutil.get_data(__name__, "data.json").decode("utf-8"))

ELEMENTS = DATA["elements"]
JOKES = DATA["jokes"]
CATALYSTS = DATA["catalysts"]
ACHIEVEMENTS = DATA["achievements"]
TIERS = DATA["tiers"]
COSMETICS = DATA["cosmetics"]
BOND_NODES = DATA["bonds"]["nodes"]
BOND_EDGES = DATA["bonds"]["edges"]


def _bond_tree():
    """Each slot's way in from the middle: the shortest path through the tree. The tree has loops, which only ever
    give more ways in, so logic that follows one path is never too generous."""
    adj = [[] for _ in range(BOND_NODES)]
    for a, b in BOND_EDGES:
        adj[a].append(b)
        adj[b].append(a)
    parent = [-1] * BOND_NODES
    seen = [False] * BOND_NODES
    seen[0] = True
    queue = [0]
    for n in queue:
        for m in sorted(adj[n]):
            if not seen[m]:
                seen[m] = True
                parent[m] = n
                queue.append(m)
    return parent


BOND_PARENT = _bond_tree()

# the secret tier never counts: those catalysts are too rare to send anyone after
SECRET_TIER = 6
# catalysts that start an event, and the one that only matters with the bonds tree
EVENT_CATALYSTS = {"stormseed", "singseed", "colliderkey"}
BONDS_CATALYSTS = {"bondagent"}

ELEMENT_BASE = 1000
JOKE_BASE = 2000
CATALYST_BASE = 3000
ACHIEVEMENT_BASE = 4000
ION_BASE = 6000
BOND_BASE = 20000

# an ion tier is a sign and a size: +1, +2, +3, -1, -2, -3 (the game stops at 3)
ION_TIERS = [(1, 1), (1, 2), (1, 3), (-1, 1), (-1, 2), (-1, 3)]


def element_location(e):
    return f"{e['name']} ({e['sym']})"


def joke_location(j):
    return f"{j['name']} ({j['sym']})"


def catalyst_location(c):
    return f"Catalyst: {c['name']}"


def achievement_location(a):
    return f"Achievement: {a['name']}"


def ion_tier_label(sign, size):
    return ("+" if sign > 0 else "-") + str(size)


def ion_location(e, tier_index):
    sign, size = ION_TIERS[tier_index]
    return f"{e['name']} ({e['sym']}) ion {ion_tier_label(sign, size)}"


def bond_location(node):
    return f"Bond {node + 1}"


def bond_item(node):
    return f"Bond {node + 1} Requirements"
