#!/usr/bin/env node
// build.js — Zero-dependency build script for cloudpublica.org
// Adapted from justNICE.us pattern. Injects shared nav/footer/scripts partials.

const fs = require('fs');
const path = require('path');

const SRC = __dirname;
const DIST = path.join(SRC, 'dist');
const PARTIALS_DIR = path.join(SRC, '_partials');

const ACTIVE_STYLE = 'text-cyan-300 underline underline-offset-4 decoration-2';

// Load partials
const partials = {
  nav: fs.readFileSync(path.join(PARTIALS_DIR, 'nav.html'), 'utf8'),
  footer: fs.readFileSync(path.join(PARTIALS_DIR, 'footer.html'), 'utf8'),
  scripts: fs.readFileSync(path.join(PARTIALS_DIR, 'scripts.html'), 'utf8'),
};

// Recursively find all files (excluding dist, _partials, .git, node_modules, docs)
function walkDir(dir) {
  const results = [];
  const skipDirs = new Set(['dist', '_partials', '.git', 'node_modules', 'docs', '.github']);
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!skipDirs.has(entry.name)) results.push(...walkDir(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

// Apply active link styling to nav HTML
function applyActiveLinks(navHtml, activeKey) {
  let result = navHtml.replace(new RegExp(`\\{\\{ACTIVE:${activeKey}\\}\\}`, 'g'), ACTIVE_STYLE);
  result = result.replace(/\{\{ACTIVE:\w+\}\}/g, '');
  return result;
}

// Process a single HTML file
function processHtml(content, relPath) {
  const configMatch = content.match(/<!--\s*build:config\s+(\{[^}]+\})\s*-->/);
  if (!configMatch) return content;

  const config = JSON.parse(configMatch[1]);
  const activeKey = config.nav || 'home';

  const navHtml = applyActiveLinks(partials.nav, activeKey);

  let output = content;
  output = output.replace(/<!--\s*build:nav\s*-->/, navHtml);
  output = output.replace(/<!--\s*build:footer\s*-->/, partials.footer);
  output = output.replace(/<!--\s*build:scripts\s*-->/, partials.scripts);

  return output;
}

// Main build
function build() {
  if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true });
  fs.mkdirSync(DIST, { recursive: true });

  const allFiles = walkDir(SRC);
  let htmlCount = 0;
  let processedCount = 0;
  let copiedCount = 0;

  for (const filePath of allFiles) {
    const relPath = path.relative(SRC, filePath);
    const destPath = path.join(DIST, relPath);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });

    if (filePath.endsWith('.html')) {
      htmlCount++;
      const content = fs.readFileSync(filePath, 'utf8');
      const processed = processHtml(content, relPath);
      fs.writeFileSync(destPath, processed);
      if (processed !== content) processedCount++;
    } else {
      fs.copyFileSync(filePath, destPath);
      copiedCount++;
    }
  }

  console.log('Build complete:');
  console.log(`  HTML files: ${htmlCount} (${processedCount} processed with partials)`);
  console.log(`  Other files copied: ${copiedCount}`);
  console.log(`  Output: ${DIST}/`);

  // Verify no leftover tokens
  let tokensFound = 0;
  for (const filePath of walkDir(DIST)) {
    if (!filePath.endsWith('.html')) continue;
    const content = fs.readFileSync(filePath, 'utf8');
    const matches = content.match(/\{\{ACTIVE:\w+\}\}/g);
    if (matches) {
      console.error(`  WARNING: ${path.relative(DIST, filePath)} has leftover tokens: ${matches.join(', ')}`);
      tokensFound += matches.length;
    }
  }
  if (tokensFound === 0) {
    console.log('  Verification: No leftover {{ACTIVE:*}} tokens found.');
  } else {
    console.error(`  ERROR: ${tokensFound} leftover token(s) found!`);
    process.exit(1);
  }
}

build();
