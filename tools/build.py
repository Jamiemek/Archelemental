#!/usr/bin/env python3
"""Joins js/*.js into game.js and updates the ?v= tags in index.html.

  python3 tools/build.py
  python3 tools/build.py --check
  python3 tools/build.py --single OUT
  python3 tools/build.py --apworld OUT     packs apworld/archelemental into an .apworld

A normal build also packs downloads/archelemental.apworld and copies the example YAML next to it,
so the game's Download buttons always hand out the version that matches it.
"""
import hashlib
import json
import os
import re
import zipfile
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# The order the files run in
JS_FILES = [
    'data.js',       # save-version check, elements, table layout, achievements
    'sound.js',      # settings toggles, $, audio, rarity tiers, sounds
    'ui.js',         # the game's dialog, escaping, status lines
    'apstate.js',    # Archipelago: this save's options and items, needed early
    'effects.js',    # rarity effects, secret variants, reduce flashing, particles
    'fxskins.js',    # Retro and Astral spawn effects (cosmetics)
    'scan.js',       # the field scan animation, Quark Storm particles
    'core.js',       # achievement toasts, the compact collection, saving, navigation, element buffs
    'bonds.js',      # the bond network
    'shop.js',       # catalyst shop, inventory, active catalysts
    'odds.js',       # buffs, element weights, odds, score, quarks, Quark Storm rules
    'screens.js',    # roll history, periodic table, home, collection and rankings
    'roll.js',       # the roll itself, multirolls, autoroll, formula parsing
    'settings.js',   # achievement rarities, settings, theme, start-up renders
    'cosmetics.js',  # scanner and page skins, the Final Element badge, the shop's Cosmetics tab
    'cutscenes.js',  # the 15 element cutscenes
    'jokecuts.js',   # the 16 joke element cutscenes
    'storage.js',    # storage use and "Clear redundant finds"
    'viewer.js',     # cutscene and effect viewer
    'ap.js',         # Archipelago: the connection, checks and items
    'away.js',       # while you were away
    'tutorial.js',   # first time tutorial
    'main.js',       # starts the game
]
CSS = 'css/style.css'
BUNDLE = 'game.js'
HEADER = ''

def read(rel):
    with open(os.path.join(ROOT, rel), encoding='utf-8') as f:
        return f.read()

def write(path, text):
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(text)

def joined_js():
    parts = []
    for name in JS_FILES:
        s = read('js/' + name)
        assert s.endswith('\n'), 'js/%s must end with a new line' % name
        parts.append(s)
    return ''.join(parts)

def tag(text):
    return hashlib.sha256(text.encode('utf-8')).hexdigest()[:10]

def stamped_index(bundle):
    page = read('index.html')
    css_ref = re.compile(r'<link rel="stylesheet" href="css/style\.css(\?v=[0-9a-f]*)?">')
    js_ref = re.compile(r'<script src="game\.js(\?v=[0-9a-f]*)?"></script>')
    assert len(css_ref.findall(page)) == 1 and len(js_ref.findall(page)) == 1, 'index.html must load css/style.css and game.js once each'
    page = css_ref.sub('<link rel="stylesheet" href="css/style.css?v=%s">' % tag(read(CSS)), page)
    page = js_ref.sub('<script src="game.js?v=%s"></script>' % tag(bundle), page)
    return page

def single(bundle_body):
    page = read('index.html')
    page = re.sub(r'<link rel="stylesheet" href="css/style\.css(\?v=[0-9a-f]*)?">', lambda m: '<style>\n' + read(CSS) + '</style>', page)
    page = re.sub(r'<script src="game\.js(\?v=[0-9a-f]*)?"></script>', lambda m: '<script>\n' + bundle_body + '</script>', page)
    return page

def apworld(out):
    # the data the APWorld reads comes from the game itself, so refresh it first
    import apdata
    apdata.main()
    src = os.path.join(ROOT, 'apworld', 'archelemental')
    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
        for folder, dirs, files in sorted(os.walk(src)):
            dirs[:] = sorted(d for d in dirs if d != '__pycache__')
            for f in sorted(files):
                if f.endswith('.pyc'):
                    continue
                path = os.path.join(folder, f)
                with open(path, 'rb') as fh:
                    data = fh.read()
                # a packed APWorld's manifest also says which packaging it uses, as Archipelago's own packer does
                if f == 'archipelago.json' and folder == src:
                    manifest = json.loads(data)
                    manifest.update(version=7, compatible_version=7)
                    data = (json.dumps(manifest, indent=4) + '\n').encode('utf-8')
                # a fixed date, so the file only changes when what's in it does
                info = zipfile.ZipInfo(os.path.join('archelemental', os.path.relpath(path, src)), (2026, 1, 1, 0, 0, 0))
                info.compress_type = zipfile.ZIP_DEFLATED
                z.writestr(info, data)
    print('wrote', out)

def main(argv):
    body = joined_js()
    bundle = HEADER + body
    if argv[:1] == ['--check']:
        ok = os.path.exists(os.path.join(ROOT, BUNDLE)) and read(BUNDLE) == bundle and read('index.html') == stamped_index(bundle)
        print('up to date' if ok else 'OUT OF DATE: run python3 tools/build.py')
        return 0 if ok else 1
    if argv[:1] == ['--apworld'] and len(argv) == 2:
        apworld(argv[1])
        return 0
    if argv[:1] == ['--single'] and len(argv) == 2:
        page = single(body)
        write(argv[1], page)
        print('wrote', argv[1], '(%d KB)' % (len(page.encode('utf-8')) // 1024))
        return 0
    if argv:
        print(__doc__)
        return 2
    write(os.path.join(ROOT, BUNDLE), bundle)
    write(os.path.join(ROOT, 'index.html'), stamped_index(bundle))
    os.makedirs(os.path.join(ROOT, 'downloads'), exist_ok=True)
    apworld(os.path.join(ROOT, 'downloads', 'archelemental.apworld'))
    write(os.path.join(ROOT, 'downloads', 'Archelemental.yaml'), read('examples/Archelemental.yaml'))
    print('game.js %d KB, %d files | index.html tags updated' % (len(bundle.encode('utf-8')) // 1024, len(JS_FILES)))
    return 0

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
