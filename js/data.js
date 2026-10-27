// the game's own errors are kept here and reported once the server can be reached
const errLog = [];
function errKeep(msg, where) {
    msg = String(msg || '').slice(0, 300);
    if (!msg || errLog.length >= 5 || errLog.some(x => x.m === msg && x.w === where)) {
        return;
    }
    errLog.push({ m: msg, w: where, sent: false });
}
addEventListener('error', e => {
    if (/game\.js|index\.html|\/$/.test(e.filename || '')) {
        errKeep(e.message, (e.filename || '').split('/').pop().replace(/\?.*/, '') + ':' + e.lineno + ':' + e.colno);
    }
});
addEventListener('unhandledrejection', e => {
    const st = String(e.reason && e.reason.stack || '');
    const at = st.match(/game\.js:(\d+:\d+)/);
    if (at) {
        errKeep(e.reason.message || e.reason, 'game.js:' + at[1]);
    }
});
// a new SAVE_VERSION starts from a blank slate (old progress is kept as a backup)
const SAVE_VERSION = '2';
try {
    if (localStorage.getItem('elementalSaveVersion') !== SAVE_VERSION) {
        const oldSave = {};
        Object.keys(localStorage).filter(k => k.startsWith('elemental')).forEach(k => {
            oldSave[k] = localStorage.getItem(k);
            localStorage.removeItem(k);
        });
        if (Object.keys(oldSave).length) {
            localStorage.setItem('legacyElementalBackup', JSON.stringify(oldSave));
        }
        localStorage.setItem('elementalSaveVersion', SAVE_VERSION);
    }
} catch (e) {}

const ELEMENTS = [
    ['H', 'Hydrogen', 6],
    ['He', 'Helium', 42],
    ['Li', 'Lithium', 129],
    ['Be', 'Beryllium', 323],
    ['B', 'Boron', 402],
    ['C', 'Carbon', 23],
    ['N', 'Nitrogen', 42],
    ['O', 'Oxygen', 3],
    ['F', 'Fluorine', 251],
    ['Ne', 'Neon', 1796],
    ['Na', 'Sodium', 10823],
    ['Mg', 'Magnesium', 323],
    ['Al', 'Aluminium', 186],
    ['Si', 'Silicon', 5578],
    ['P', 'Phosphorus', 186],
    ['S', 'Sulfur', 81],
    ['Cl', 'Chlorine', 129],
    ['Ar', 'Argon', 1796],
    ['K', 'Potassium', 17321],
    ['Ca', 'Calcium', 251],
    ['Sc', 'Scandium', 24945],
    ['Ti', 'Titanium', 402],
    ['V', 'Vanadium', 10823],
    ['Cr', 'Chromium', 487],
    ['Mn', 'Manganese', 1247],
    ['Fe', 'Iron', 579],
    ['Co', 'Cobalt', 3485],
    ['Ni', 'Nickel', 1247],
    ['Cu', 'Copper', 186],
    ['Zn', 'Zinc', 323],
    ['Ga', 'Gallium', 10823],
    ['Ge', 'Germanium', 13924],
    ['As', 'Arsenic', 8033],
    ['Se', 'Selenium', 3485],
    ['Br', 'Bromine', 1796],
    ['Kr', 'Krypton', 24945],
    ['Rb', 'Rubidium', 53785],
    ['Sr', 'Strontium', 1796],
    ['Y', 'Yttrium', 17321],
    ['Zr', 'Zirconium', 10823],
    ['Nb', 'Niobium', 33607],
    ['Mo', 'Molybdenum', 5578],
    ['Tc', 'Technetium', 1038663],
    ['Ru', 'Ruthenium', 53785],
    ['Rh', 'Rhodium', 150289],
    ['Pd', 'Palladium', 17321],
    ['Ag', 'Silver', 129],
    ['Cd', 'Cadmium', 4696],
    ['In', 'Indium', 20999],
    ['Sn', 'Tin', 1247],
    ['Sb', 'Antimony', 8033],
    ['Te', 'Tellurium', 24945],
    ['I', 'Iodine', 1003],
    ['Xe', 'Xenon', 43237],
    ['Cs', 'Caesium', 65204],
    ['Ba', 'Barium', 1796],
    ['La', 'Lanthanum', 24945],
    ['Ce', 'Cerium', 10823],
    ['Pr', 'Praseodymium', 65204],
    ['Nd', 'Neodymium', 43237],
    ['Pm', 'Promethium', 1549018],
    ['Sm', 'Samarium', 65204],
    ['Eu', 'Europium', 33607],
    ['Gd', 'Gadolinium', 33607],
    ['Tb', 'Terbium', 104355],
    ['Dy', 'Dysprosium', 43237],
    ['Ho', 'Holmium', 104355],
    ['Er', 'Erbium', 43237],
    ['Tm', 'Thulium', 150289],
    ['Yb', 'Ytterbium', 24945],
    ['Lu', 'Lutetium', 65204],
    ['Hf', 'Hafnium', 24945],
    ['Ta', 'Tantalum', 43237],
    ['W', 'Tungsten', 2420],
    ['Re', 'Rhenium', 65204],
    ['Os', 'Osmium', 104355],
    ['Ir', 'Iridium', 65204],
    ['Pt', 'Platinum', 1796],
    ['Au', 'Gold', 251],
    ['Hg', 'Mercury', 1003],
    ['Tl', 'Thallium', 33607],
    ['Pb', 'Lead', 186],
    ['Bi', 'Bismuth', 1247],
    ['Po', 'Polonium', 1712206],
    ['At', 'Astatine', 2643713],
    ['Rn', 'Radon', 346402],
    ['Fr', 'Francium', 4766589],
    ['Ra', 'Radium', 240527],
    ['Ac', 'Actinium', 466677],
    ['Th', 'Thorium', 10823],
    ['Pa', 'Protactinium', 746881],
    ['U', 'Uranium', 52150385],
    ['Np', 'Neptunium', 2186769],
    ['Pu', 'Plutonium', 1712206],
    ['Am', 'Americium', 1872698],
    ['Cm', 'Curium', 2643713],
    ['Bk', 'Berkelium', 4766589],
    ['Cf', 'Californium', 4081997],
    ['Es', 'Einsteinium', 7359800],
    ['Fm', 'Fermium', 7359800],
    ['Md', 'Mendelevium', 8594113],
    ['No', 'Nobelium', 9797879],
    ['Lr', 'Lawrencium', 10976097],
    ['Rf', 'Rutherfordium', 13269647],
    ['Db', 'Dubnium', 14389952],
    ['Sg', 'Seaborgium', 15495102],
    ['Bh', 'Bohrium', 16586541],
    ['Hs', 'Hassium', 17665479],
    ['Mt', 'Meitnerium', 18732937],
    ['Ds', 'Darmstadtium', 19789794],
    ['Rg', 'Roentgenium', 20836807],
    ['Cn', 'Copernicium', 21874641],
    ['Nh', 'Nihonium', 22903880],
    ['Fl', 'Flerovium', 23925043],
    ['Mc', 'Moscovium', 24938592],
    ['Lv', 'Livermorium', 25944942],
    ['Ts', 'Tennessine', 26944470],
    ['Og', 'Oganesson', 28924388]
];
ELEMENTS.forEach(e => e[2] = e[0] === 'U' ? 12000000 : Math.max(2, Math.round(e[2] ** 0.82)));
// cutscene elements, Db up to U
['Db', 'Sg', 'Bh', 'Hs', 'Mt', 'Ds', 'Rg', 'Cn', 'Nh', 'Fl', 'Mc', 'Lv', 'Ts', 'Og', 'U'].forEach((sym, i, list) => {
    ELEMENTS.find(e => e[0] === sym)[2] = Math.round(740643 * Math.pow(12000000 / 740643, i / (list.length - 1)));
});
const elementBySymbol = Object.fromEntries(ELEMENTS.map(e => [e[0], e]));
const JOKES = [
    ['Um', 'Ummium', 35000000, 'The element of surprise', [1, 1]],
    ['Zz', 'Snorium', 45000000, "Only reacts when it's woken up", [1, 18]],
    ['Mu', 'Mundanium', 55000000, 'The most ordinary element imaginable, somehow this rare', [2, 1]],
    ['Ln', 'Lostium', 70000000, 'Always in the last place you look', [2, 2]],
    ['Df', 'Deferrium', 90000000, 'Will react tomorrow', [2, 13]],
    ['Cz', 'Caffeinium', 120000000, 'Makes every neighbour jittery', [2, 14]],
    ['Mb', 'Maybium', 150000000, 'Exists until you check', [2, 15]],
    ['Dj', 'Déjà-vium', 190000000, "You've definitely rolled this before", [2, 16]],
    ['Ha', 'Halfinium', 230000000, 'Always exactly halfway through decaying', [2, 17]],
    ['Ad', 'Administratium', 280000000, 'The heaviest element; it slows everything around it down', [2, 18]],
    ['Pi', 'Pi', 314159265, 'Goes on forever and never repeats', [3, 14]],
    ['Nu', 'Nopeium', 350000000, 'Refuses to bond with anything', [3, 1]],
    ['Xx', 'Redactium', 500000000, '[DATA EXPUNGED]', [3, 2]],
    ['Uo', 'Unobtainium', 700000000, 'The one every scientist is after', [3, 16]],
    ['Zo', 'Zoomium', 1000000000, 'Already gone before you see it', [3, 17]],
    ['Gg', 'Gameoverium', 1500000000, 'The last element there will ever be', [3, 18]]
];
JOKES.forEach(j => elementBySymbol[j[0]] = j);
const JOKE_SYMS = new Set(JOKES.map(j => j[0]));
const isJoke = sym => JOKE_SYMS.has(sym);
const tableLayout = {};
function placeRow(p, a) {
    a.forEach(([s, c]) => tableLayout[s] = [p, c]);
}
placeRow(1, [['H', 1], ['He', 18]]);
placeRow(2, [['Li', 1], ['Be', 2], ['B', 13], ['C', 14], ['N', 15], ['O', 16], ['F', 17], ['Ne', 18]]);
placeRow(3, [['Na', 1], ['Mg', 2], ['Al', 13], ['Si', 14], ['P', 15], ['S', 16], ['Cl', 17], ['Ar', 18]]);
placeRow(4, [
    ['K', 1], ['Ca', 2], ['Sc', 3], ['Ti', 4], ['V', 5], ['Cr', 6], ['Mn', 7], ['Fe', 8], ['Co', 9], ['Ni', 10], ['Cu', 11], ['Zn', 12], ['Ga', 13], ['Ge', 14], ['As', 15], ['Se', 16], ['Br', 17], ['Kr', 18]
]);
placeRow(5, [
    ['Rb', 1], ['Sr', 2], ['Y', 3], ['Zr', 4], ['Nb', 5], ['Mo', 6], ['Tc', 7], ['Ru', 8], ['Rh', 9], ['Pd', 10], ['Ag', 11], ['Cd', 12], ['In', 13], ['Sn', 14], ['Sb', 15], ['Te', 16], ['I', 17], ['Xe', 18]
]);
placeRow(6, [
    ['Cs', 1], ['Ba', 2], ['Hf', 4], ['Ta', 5], ['W', 6], ['Re', 7], ['Os', 8], ['Ir', 9], ['Pt', 10], ['Au', 11], ['Hg', 12], ['Tl', 13], ['Pb', 14], ['Bi', 15], ['Po', 16], ['At', 17], ['Rn', 18]
]);
placeRow(7, [
    ['Fr', 1], ['Ra', 2], ['Rf', 4], ['Db', 5], ['Sg', 6], ['Bh', 7], ['Hs', 8], ['Mt', 9], ['Ds', 10], ['Rg', 11], ['Cn', 12], ['Nh', 13], ['Fl', 14], ['Mc', 15], ['Lv', 16], ['Ts', 17], ['Og', 18]
]);
['La', 'Ce', 'Pr', 'Nd', 'Pm', 'Sm', 'Eu', 'Gd', 'Tb', 'Dy', 'Ho', 'Er', 'Tm', 'Yb', 'Lu'].forEach((s, i) => tableLayout[s] = [9, i + 4]);
['Ac', 'Th', 'Pa', 'U', 'Np', 'Pu', 'Am', 'Cm', 'Bk', 'Cf', 'Es', 'Fm', 'Md', 'No', 'Lr'].forEach((s, i) => tableLayout[s] = [10, i + 4]);
const ACHIEVEMENTS = [
    {
        formula: 'H2O', name: 'Water', flavor: 'A tiny, bent molecule that covers most of Earth and makes life as we know it possible.', rarity: 'Common'
    },
    {
        formula: 'CO2', name: 'Carbon dioxide', flavor: 'Plants borrow this invisible gas to build sugars; too much in the atmosphere traps extra heat.', rarity: 'Common'
    },
    {
        formula: 'ClNa', name: 'Table salt', flavor: 'Sodium and chlorine make the familiar crystals that season food and help nerves work.', rarity: 'Rare'
    },
    {
        formula: 'O2', name: 'Oxygen', flavor: 'The reactive gas many organisms use to release energy from food.', rarity: 'Common'
    },
    {
        formula: 'O3', name: 'Ozone', flavor: 'High in the atmosphere it shields Earth from ultraviolet light; near the ground it is a pollutant.', rarity: 'Common'
    },
    {
        formula: 'NH3', name: 'Ammonia', flavor: 'Sharp-smelling and nitrogen-rich, ammonia is an important starting point for fertilisers.', rarity: 'Rare'
    },
    {
        formula: 'CH4', name: 'Methane', flavor: 'A simple carbon fuel and a powerful greenhouse gas.', rarity: 'Epic'
    },
    {
        formula: 'H2O2', name: 'Hydrogen peroxide', flavor: 'A reactive liquid used in bleaching and disinfection, breaking down into water and oxygen.', rarity: 'Common'
    },
    {
        formula: 'C2H4', name: 'Ethylene', flavor: 'A plant hormone that helps fruit ripen and a key industrial chemical.', rarity: 'Legendary'
    },
    {
        formula: 'C2H2', name: 'Acetylene', flavor: 'A highly combustible gas once used in bright lamps and now in metalworking.', rarity: 'Rare'
    },
    {
        formula: 'HCl', name: 'Hydrochloric acid', flavor: 'In water, this strong acid is also part of the stomach’s digestive chemistry.', rarity: 'Common'
    },
    {
        formula: 'H2SO4', name: 'Sulfuric acid', flavor: 'A major industrial chemical used in batteries, fertiliser production and refining.', rarity: 'Epic'
    },
    {
        formula: 'HNO3', name: 'Nitric acid', flavor: 'A strong acid and important industrial ingredient in fertilisers.', rarity: 'Uncommon'
    },
    {
        formula: 'NaOH', name: 'Sodium hydroxide', flavor: 'A caustic base used to make soap and clean industrial equipment.', rarity: 'Rare'
    },
    {
        formula: 'KOH', name: 'Potassium hydroxide', flavor: 'A strong base used in soft soaps and alkaline batteries.', rarity: 'Rare'
    },
    {
        formula: 'CaCO3', name: 'Calcium carbonate', flavor: 'Found in limestone, chalk, shells and many stalactites.', rarity: 'Rare'
    },
    {
        formula: 'CaO', name: 'Quicklime', flavor: 'Made by heating limestone; it reacts strongly with water.', rarity: 'Common'
    },
    {
        formula: 'Ca(OH)2', name: 'Slaked lime', flavor: 'Used in mortar and to reduce acidity in soil and water.', rarity: 'Rare'
    },
    {
        formula: 'MgSO4', name: 'Epsom salt', flavor: 'A magnesium salt often sold for baths and used in gardening.', rarity: 'Legendary'
    },
    {
        formula: 'CuSO4', name: 'Copper sulfate', flavor: 'Its vivid blue crystals make it a classic chemistry-lab compound.', rarity: 'Legendary'
    },
    {
        formula: 'SiO2', name: 'Silica', flavor: 'The main ingredient in quartz and sand, and a key material in glass.', rarity: 'Rare'
    },
    {
        formula: 'H2', name: 'Hydrogen gas', flavor: 'The lightest molecule, used in industry and explored as an energy carrier.', rarity: 'Common'
    },
    {
        formula: 'N2', name: 'Nitrogen gas', flavor: 'The quiet majority of the air, making up about four-fifths of the atmosphere.', rarity: 'Uncommon'
    },
    {
        formula: 'Cl2', name: 'Chlorine gas', flavor: 'A reactive greenish gas whose chemistry helps disinfect water.', rarity: 'Uncommon'
    },
    {
        formula: 'HF', name: 'Hydrofluoric acid', flavor: 'An unusually hazardous acid that can attack glass by reacting with silica.', rarity: 'Common'
    },
    {
        formula: 'CO', name: 'Carbon monoxide', flavor: 'An odourless, poisonous gas formed by incomplete combustion.', rarity: 'Common'
    },
    {
        formula: 'HCN', name: 'Hydrogen cyanide', flavor: 'A small, highly toxic molecule with a history in both chemistry and industry.', rarity: 'Uncommon'
    },
    {
        formula: 'NO', name: 'Nitric oxide', flavor: 'A signalling molecule in the body and a reactive gas in the atmosphere.', rarity: 'Common'
    },
    {
        formula: 'NO2', name: 'Nitrogen dioxide', flavor: 'A brownish air pollutant that contributes to smog and acid deposition.', rarity: 'Common'
    },
    {
        formula: 'N2O', name: 'Nitrous oxide', flavor: 'Known as laughing gas, it is used medically and is also a greenhouse gas.', rarity: 'Uncommon'
    },
    {
        formula: 'SO2', name: 'Sulfur dioxide', flavor: 'A pungent gas released by some volcanoes and burning sulfur-containing fuels.', rarity: 'Common'
    },
    {
        formula: 'SO3', name: 'Sulfur trioxide', flavor: 'A reactive sulfur oxide that forms sulfuric acid when combined with water.', rarity: 'Uncommon'
    },
    {
        formula: 'H2S', name: 'Hydrogen sulfide', flavor: 'A toxic gas known for its rotten-egg smell at low concentrations.', rarity: 'Uncommon'
    },
    {
        formula: 'HBr', name: 'Hydrobromic acid', flavor: 'A strong acid used to introduce bromine into organic molecules.', rarity: 'Uncommon'
    },
    {
        formula: 'HI', name: 'Hydroiodic acid', flavor: 'A strong hydrogen halide acid used in specialised chemical synthesis.', rarity: 'Uncommon'
    },
    {
        formula: 'LiCl', name: 'Lithium chloride', flavor: 'A hygroscopic salt used in laboratories and some industrial processes.', rarity: 'Uncommon'
    },
    {
        formula: 'KCl', name: 'Potassium chloride', flavor: 'A mineral salt used in fertilisers and as a substitute for table salt.', rarity: 'Epic'
    },
    {
        formula: 'KI', name: 'Potassium iodide', flavor: 'A source of iodine used in medicine and laboratory chemistry.', rarity: 'Epic'
    },
    {
        formula: 'NaF', name: 'Sodium fluoride', flavor: 'A fluoride salt used in carefully controlled amounts to help protect teeth.', rarity: 'Epic'
    },
    {
        formula: 'CaF2', name: 'Fluorite', flavor: 'A colourful mineral and a major natural source of fluorine.', rarity: 'Legendary'
    },
    {
        formula: 'AgCl', name: 'Silver chloride', flavor: 'A light-sensitive solid that helped make traditional photography possible.', rarity: 'Uncommon'
    },
    {
        formula: 'AgNO3', name: 'Silver nitrate', flavor: 'A light-sensitive silver salt used in analytical chemistry and photography.', rarity: 'Rare'
    },
    {
        formula: 'NaNO3', name: 'Sodium nitrate', flavor: 'A naturally occurring nitrate used as a fertiliser and industrial feedstock.', rarity: 'Legendary'
    },
    {
        formula: 'ZnO', name: 'Zinc oxide', flavor: 'A white powder used in sunscreens, rubber and protective ointments.', rarity: 'Common'
    },
    {
        formula: 'TiO2', name: 'Titanium dioxide', flavor: 'A bright white pigment used in paints and many everyday materials.', rarity: 'Uncommon'
    },
    {
        formula: 'Al2O3', name: 'Alumina', flavor: 'A hard ceramic oxide and the key feedstock for aluminium production.', rarity: 'Epic'
    },
    {
        formula: 'PbS', name: 'Galena', flavor: 'The principal ore of lead, recognised by its metallic grey appearance.', rarity: 'Uncommon'
    },
    {
        formula: 'SnO2', name: 'Cassiterite', flavor: 'The main ore of tin, important to metalworking for thousands of years.', rarity: 'Uncommon'
    },
    {
        formula: 'NaBr', name: 'Sodium bromide', flavor: 'A bromide salt used in laboratories and specialised chemical processes.', rarity: 'Epic'
    },
    {
        formula: 'KBr', name: 'Potassium bromide', flavor: 'A salt once common in photographic materials and infrared spectroscopy.', rarity: 'Epic'
    },
    {
        formula: 'MgO', name: 'Magnesia', flavor: 'A heat-resistant oxide used to line furnaces and make refractory ceramics.', rarity: 'Common'
    },
    {
        formula: 'CaCl2', name: 'Calcium chloride', flavor: 'A moisture-loving salt used for de-icing roads and drying gases.', rarity: 'Epic'
    },
    {
        formula: 'SiC', name: 'Silicon carbide', flavor: 'An extremely hard material used in abrasives and high-performance ceramics.', rarity: 'Rare'
    },
    {
        formula: 'BN', name: 'Boron nitride', flavor: 'A boron-nitrogen material with forms that resemble graphite and diamond.', rarity: 'Uncommon'
    },
    {
        formula: 'B2O3', name: 'Boron trioxide', flavor: 'A glass-forming oxide that helps make heat-resistant borosilicate glass.', rarity: 'Legendary'
    },
    {
        formula: 'H3BO3', name: 'Boric acid', flavor: 'A mild acid used in glassmaking and some specialised applications.', rarity: 'Legendary'
    },
    {
        formula: 'CH2O', name: 'Formaldehyde', flavor: 'A simple carbonyl compound used to make resins and preserve specimens.', rarity: 'Uncommon'
    },
    {
        formula: 'CH2O2', name: 'Formic acid', flavor: 'The acid found in ant venom and nettles, with a sharp sting.', rarity: 'Uncommon'
    },
    {
        formula: 'H2CO3', name: 'Carbonic acid', flavor: 'Formed when carbon dioxide dissolves in water, it helps give fizzy drinks their bite.', rarity: 'Rare'
    },
    {
        formula: 'HClO', name: 'Hypochlorous acid', flavor: 'A weak, fast-acting disinfectant that your own white blood cells make.', rarity: 'Common'
    },
    {
        formula: 'NaClO', name: 'Sodium hypochlorite', flavor: 'The active ingredient in household bleach.', rarity: 'Epic'
    },
    {
        formula: 'CaSO4', name: 'Calcium sulfate', flavor: 'The mineral behind gypsum, plaster and drywall.', rarity: 'Legendary'
    },
    {
        formula: 'MgCl2', name: 'Magnesium chloride', flavor: 'A salt found in seawater, used for de-icing and tofu making.', rarity: 'Epic'
    },
    {
        formula: 'FeS2', name: 'Pyrite', flavor: "Fool's gold: a brassy iron sulfide that sparks when struck.", rarity: 'Epic'
    },
    {
        formula: 'Cu2O', name: 'Cuprite', flavor: 'A deep red copper ore with a mirror-like shine.', rarity: 'Rare'
    },
    {
        formula: 'CuO', name: 'Copper oxide', flavor: 'A black oxide that tints glazes and glass blue-green.', rarity: 'Common'
    },
    {
        formula: 'ZnS', name: 'Zinc sulfide', flavor: 'A glow-in-the-dark phosphor and the main ore of zinc.', rarity: 'Uncommon'
    },
    {
        formula: 'HgS', name: 'Cinnabar', flavor: 'A vivid red mercury ore once ground into pigment.', rarity: 'Uncommon'
    },
    {
        formula: 'Ag2S', name: 'Silver sulfide', flavor: 'The dark tarnish that forms on silver.', rarity: 'Epic'
    },
    {
        formula: 'AgBr', name: 'Silver bromide', flavor: 'A light-sensitive crystal used in classic photographic film.', rarity: 'Rare'
    },
    {
        formula: 'Li2O', name: 'Lithium oxide', flavor: 'A lithium compound used in specialised ceramics and glass.', rarity: 'Rare'
    },
    {
        formula: 'LiOH', name: 'Lithium hydroxide', flavor: 'A strong base used in batteries and to scrub CO2 in spacecraft.', rarity: 'Common'
    },
    {
        formula: 'MnO2', name: 'Manganese dioxide', flavor: 'A dark mineral used in dry-cell batteries.', rarity: 'Uncommon'
    },
    {
        formula: 'WO3', name: 'Tungsten trioxide', flavor: 'A yellow oxide used in smart-glass coatings.', rarity: 'Rare'
    },
    {
        formula: 'ZrO2', name: 'Zirconia', flavor: 'The tough ceramic behind cubic zirconia gemstones.', rarity: 'Rare'
    },
    {
        formula: 'CS2', name: 'Carbon disulfide', flavor: 'A smelly, volatile solvent used in making rayon.', rarity: 'Rare'
    },
    {
        formula: 'CH4O', name: 'Methanol', flavor: 'The simplest alcohol, used as a solvent and fuel.', rarity: 'Epic'
    },
    {
        formula: 'PH3', name: 'Phosphine', flavor: 'A toxic, garlicky-smelling gas of phosphorus and hydrogen.', rarity: 'Rare'
    },
    {
        formula: 'PbO', name: 'Lead oxide', flavor: 'Litharge: a yellow oxide used in glass and old batteries.', rarity: 'Common'
    },
    {
        formula: 'SnCl2', name: 'Tin(II) chloride', flavor: 'A reducing agent used in labs and mirror making.', rarity: 'Legendary'
    },
    {
        formula: 'CdS', name: 'Cadmium sulfide', flavor: "A bright yellow pigment famous in artists' paint.", rarity: 'Rare'
    },
    {
        formula: 'BaO', name: 'Barium oxide', flavor: 'A reactive oxide used in glass and cathode coatings.', rarity: 'Uncommon'
    },
    {
        formula: 'SrO', name: 'Strontium oxide', flavor: 'A strontium compound used in specialised glass and ceramics.', rarity: 'Uncommon'
    },
    {
        formula: 'CsCl', name: 'Caesium chloride', flavor: 'A dense salt used to separate DNA by centrifuge.', rarity: 'Epic'
    },
    {
        formula: 'NaI', name: 'Sodium iodide', flavor: 'A salt used in iodised supplements and radiation detectors.', rarity: 'Epic'
    },
    {
        formula: 'KF', name: 'Potassium fluoride', flavor: 'A fluoride salt used in chemical synthesis.', rarity: 'Epic'
    },
    {
        formula: 'GeO2', name: 'Germanium dioxide', flavor: 'A clear oxide used in optical fibres.', rarity: 'Rare'
    },
    {
        formula: 'NiO', name: 'Nickel oxide', flavor: 'A green-grey oxide used in batteries and ceramics.', rarity: 'Common'
    },
    {
        formula: 'CoO', name: 'Cobalt oxide', flavor: 'The classic source of cobalt blue in glass and glazes.', rarity: 'Uncommon'
    },
    {
        formula: 'LiF', name: 'Lithium fluoride', flavor: 'A crystal that is transparent to ultraviolet light.', rarity: 'Uncommon'
    },
    {
        formula: 'AgI', name: 'Silver iodide', flavor: 'A crystal used in cloud-seeding experiments.', rarity: 'Rare'
    },
    {
        formula: 'PtO2', name: 'Platinum dioxide', flavor: "Adams' catalyst, used for hydrogenation reactions.", rarity: 'Uncommon'
    },
    {
        formula: 'ThO2', name: 'Thorium dioxide', flavor: 'One of the most heat-resistant oxides known.', rarity: 'Rare'
    },
    {
        formula: 'IrO2', name: 'Iridium dioxide', flavor: 'A durable catalyst used in electrolysis.', rarity: 'Rare'
    },
    {
        formula: 'NaH', name: 'Sodium hydride', flavor: 'A reactive hydride used as a strong base in synthesis.', rarity: 'Uncommon'
    },
    {
        formula: 'CaH2', name: 'Calcium hydride', flavor: 'A drying agent that reacts vigorously with water.', rarity: 'Uncommon'
    },
    {
        formula: 'LiH', name: 'Lithium hydride', flavor: 'A compact hydrogen store used in specialised chemistry.', rarity: 'Common'
    },
    {
        formula: 'MgF2', name: 'Magnesium fluoride', flavor: 'A crystal used in lens coatings and ultraviolet optics.', rarity: 'Legendary'
    },
    {
        formula: 'CaC2', name: 'Calcium carbide', flavor: 'Reacts with water to release acetylene gas.', rarity: 'Rare'
    },
    {
        formula: 'FeO', name: 'Wustite', flavor: 'A black iron oxide found in steelmaking.', rarity: 'Common'
    }
];
let unlockedAchievements = [];
try {
    unlockedAchievements = JSON.parse(localStorage.getItem('elementalAchievements') || '[]');
} catch (e) {
    unlockedAchievements = [];
}
