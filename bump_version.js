const fs = require('fs');

// Patch index.js
let index = fs.readFileSync('src/index.js', 'utf8');
index = index.replace(/version: '[\d\.]+'/g, "version: '4.1.0'");
index = index.replace(/WORKI TRACKER v[\d\.]+/g, "WORKI TRACKER v4.1");
fs.writeFileSync('src/index.js', index);
console.log("Updated src/index.js");

// Patch migrate.js
let migrate = fs.readFileSync('src/migrate.js', 'utf8');
migrate = migrate.replace(/Schema v3\.0/g, "Schema v4.1");
migrate = migrate.replace(/Migração v3\.0/g, "Migração v4.1");
fs.writeFileSync('src/migrate.js', migrate);
console.log("Updated src/migrate.js");

// Patch wk.js
let wk = fs.readFileSync('public/wk.js', 'utf8');
wk = wk.replace(/Worki Tracker v[\d\.]+/g, "Worki Tracker v4.1");
fs.writeFileSync('public/wk.js', wk);
console.log("Updated public/wk.js");

// Patch index.html
let html = fs.readFileSync('src/views/index.html', 'utf8');
html = html.replace(/Worki Tracker v[\d\.]+/g, "Worki Tracker v4.1");
html = html.replace(/<span class="text-xs text-slate-400 font-medium">v[\d\.]+<\/span>/g, '<span class="text-xs text-slate-400 font-medium">v4.1</span>');
fs.writeFileSync('src/views/index.html', html);
console.log("Updated src/views/index.html");

// Patch package.json
if (fs.existsSync('package.json')) {
    let pkg = fs.readFileSync('package.json', 'utf8');
    pkg = pkg.replace(/"version": "[\d\.]+"/g, '"version": "4.1.0"');
    fs.writeFileSync('package.json', pkg);
    console.log("Updated package.json");
}
