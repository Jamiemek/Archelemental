#!/usr/bin/env python3
"""Reads the elements, joke elements, catalysts and achievements out of the game's JavaScript
and writes them to apworld/archelemental/data.json, so the APWorld always matches the game.

  python3 tools/apdata.py
"""
import json
import os
import re
import subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def read(rel):
    with open(os.path.join(ROOT, rel), encoding='utf-8') as f:
        return f.read()

def block(src, name):
    a = src.index('const %s = [' % name)
    return src[a:src.index('];', a)]

def elements(src, name):
    return [{'sym': m.group(1), 'name': m.group(2), 'odds': int(m.group(3))}
            for m in re.finditer(r"\['([A-Za-z]+)', '((?:[^'\\]|\\.)+)', (\d+)", block(src, name))]

def main():
    data = read('js/data.js')
    shop = read('js/shop.js')
    els = elements(data, 'ELEMENTS')
    for i, e in enumerate(els):
        e['z'] = i + 1
    jokes = elements(data, 'JOKES')
    cats = []
    for m in re.finditer(r"\{ id: '(\w+)', name: '((?:[^'\\]|\\.)+)'|\{ id: '(\w+)', name: \"([^\"]+)\"", block(shop, 'CATALYSTS')):
        line = shop[shop.index(m.group(0)):].split('\n')[0]
        cats.append({
            'id': m.group(1) or m.group(3),
            'name': (m.group(2) or m.group(4)).replace("\\'", "'"),
            'tier': int(re.search(r'tier: (\d)', line).group(1)),
            'joke': 'joke: true' in line,
        })
    ach = [{'name': m.group(2).replace("\\'", "'"), 'formula': m.group(1)}
           for m in re.finditer(r"formula: '([^']+)', name: '((?:[^'\\]|\\.)+)'", block(data, 'ACHIEVEMENTS'))]
    tiers = [m.group(1) for m in re.finditer(r"\{ name: '(\w+)', col:", block(shop, 'CAT_TIERS'))]
    graph = json.loads(subprocess.run(['node', os.path.join(ROOT, 'tools', 'bondgraph.js')], check=True, capture_output=True, text=True).stdout)
    # the listed odds are reshaped when the game loads, so take them as the game has them
    odds = graph.pop('odds')
    for e in els:
        e['odds'] = odds[e['sym']]
    bonds_src = read('js/bonds.js')
    cos = re.search(r"const COSMETIC_NAMES = \{(.*?)\n\};", bonds_src, re.S).group(1)
    cosmetics = [{'id': m.group(1), 'name': m.group(2)} for m in re.finditer(r"(\w+): '([^']+)'", cos)]
    out = {'elements': els, 'jokes': jokes, 'catalysts': cats, 'achievements': ach, 'tiers': tiers,
           'bonds': graph, 'cosmetics': cosmetics}
    with open(os.path.join(ROOT, 'apworld/archelemental/data.json'), 'w', encoding='utf-8', newline='\n') as f:
        json.dump(out, f, separators=(',', ':'), ensure_ascii=False)
        f.write('\n')
    print(len(els), 'elements,', len(jokes), 'jokes,', len(cats), 'catalysts,', len(ach), 'achievements,', graph['nodes'], 'bond slots,', len(cosmetics), 'cosmetics')

if __name__ == '__main__':
    main()
