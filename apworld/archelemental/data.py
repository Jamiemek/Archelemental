import json
import pkgutil

# data.json is written from the game's own code by tools/apdata.py, so the two never drift apart
DATA = json.loads(pkgutil.get_data(__name__, "data.json").decode("utf-8"))

ELEMENTS = DATA["elements"]
JOKES = DATA["jokes"]
CATALYSTS = DATA["catalysts"]
ACHIEVEMENTS = DATA["achievements"]
TIERS = DATA["tiers"]

# the secret tier never counts: those catalysts are too rare to send anyone after
SECRET_TIER = 6
# catalysts that start an event, and the one that only matters with the bonds tree
EVENT_CATALYSTS = {"stormseed", "singseed", "colliderkey"}
BONDS_CATALYSTS = {"bondagent"}

# ids: locations and items each count up from their own base, in blocks
ELEMENT_BASE = 1000
JOKE_BASE = 2000
CATALYST_BASE = 3000
ACHIEVEMENT_BASE = 4000


def element_location(e):
    return f"{e['name']} ({e['sym']})"


def joke_location(j):
    return f"{j['name']} ({j['sym']})"


def catalyst_location(c):
    return f"Catalyst: {c['name']}"


def achievement_location(a):
    return f"Achievement: {a['name']}"
