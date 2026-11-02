// Prints the bonds tree's shape (how many slots there are and which ones touch) as JSON.
// It runs the game's own generator, so the APWorld's copy of the tree can never drift from the game's.
//   node tools/bondgraph.js
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const between = (src, from, to) => {
    const a = src.indexOf(from);
    const b = src.indexOf(to, a);
    if (a < 0 || b < 0) {
        throw new Error('could not find ' + from + ' .. ' + to);
    }
    return src.slice(a, b);
};
const store = {};
const sandbox = {
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
    console, Math, JSON, Object, Array, Set, Map, Date, Number, String, Boolean, RegExp, Error, parseInt, parseFloat, isNaN,
    addEventListener() { }, setTimeout: () => 0
};
sandbox.window = sandbox;
vm.createContext(sandbox);
const bonds = read('js/bonds.js');
const src = [
    read('js/data.js'),
    between(read('js/screens.js'), 'const FAMILY = {};', 'function buildTable'),
    between(read('js/odds.js'), 'function hillFormula', 'const BASE_CHAIN'),
    between(read('js/roll.js'), 'function parseFormula', 'ACHIEVEMENTS.forEach(a => a.hill'),
    'function findFormula() { return null; }\nconst apOpt = () => 1;\n',
    bonds.slice(0, bonds.indexOf('function net()')),
    'this.__N = genNetwork();'
].join('\n');
vm.runInContext(src, sandbox);
const N = sandbox.__N;
const out = { nodes: N.nodes.length, inner: N.base, edges: N.edges.map(e => [e.a, e.b]) };
process.stdout.write(JSON.stringify(out));
