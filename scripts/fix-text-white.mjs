#!/usr/bin/env node
/**
 * Fix text-white restoration script
 * Finds lines where text-gray-800 sits on a colored background and restores text-white.
 * Run: node scripts/fix-text-white.mjs
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join, extname } from 'path';

const SRC_DIR = join(process.cwd(), 'src');

// Patterns that indicate a colored background where white text is needed
const COLORED_BG_PATTERNS = [
  'bg-[#005028]', 'bg-[#00A651]', 'bg-[#003018]',
  'bg-gradient-to-r', 'bg-gradient-to-l', 'bg-gradient-to-br', 'bg-gradient-to-bl',
  'bg-gradient-to-t', 'bg-gradient-to-b', 'bg-gradient-to-tr', 'bg-gradient-to-tl',
  'bg-red-500', 'bg-red-600', 'bg-red-700',
  'bg-blue-500', 'bg-blue-600', 'bg-blue-700',
  'bg-purple-500', 'bg-purple-600', 'bg-purple-700',
  'bg-violet-500', 'bg-violet-600', 'bg-violet-700',
  'bg-indigo-500', 'bg-indigo-600', 'bg-indigo-700',
  'bg-orange-500', 'bg-orange-600', 'bg-orange-700',
  'bg-pink-500', 'bg-pink-600', 'bg-pink-700',
  'bg-emerald-500', 'bg-emerald-600', 'bg-emerald-700',
  'bg-green-500', 'bg-green-600', 'bg-green-700',
  'bg-teal-500', 'bg-teal-600', 'bg-teal-700',
  'bg-cyan-500', 'bg-cyan-600', 'bg-cyan-700',
  'bg-amber-500', 'bg-amber-600', 'bg-amber-700',
  'bg-yellow-500', 'bg-yellow-600', 'bg-yellow-700',
  'bg-lime-500', 'bg-lime-600', 'bg-lime-700',
  'bg-rose-500', 'bg-rose-600', 'bg-rose-700',
  'bg-sky-500', 'bg-sky-600', 'bg-sky-700',
  'bg-slate-500', 'bg-slate-600', 'bg-slate-700',
  'bg-lakers-700', 'bg-lakers-800', 'bg-lakers-900',
  'bg-black',
];

function hasColoredBg(line) {
  return COLORED_BG_PATTERNS.some(p => line.includes(p));
}

async function getAllFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await getAllFiles(fullPath));
    } else if (['.jsx', '.js'].includes(extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

async function processFile(filePath) {
  let content = await readFile(filePath, 'utf-8');
  const original = content;
  let fixes = 0;

  // Strategy: For each line, if it has a colored bg AND text-gray-800, replace text-gray-800 with text-white
  const lines = content.split('\n');
  const result = lines.map(line => {
    if (hasColoredBg(line) && line.includes('text-gray-800')) {
      fixes++;
      return line.replace(/\btext-gray-800\b/g, 'text-white');
    }
    return line;
  });

  if (fixes > 0) {
    await writeFile(filePath, result.join('\n'), 'utf-8');
    return fixes;
  }
  return 0;
}

async function main() {
  console.log('Fix text-white Restoration Script');
  console.log('==================================');

  const files = await getAllFiles(SRC_DIR);
  console.log(`Scanning ${files.length} source files...`);

  let totalFixes = 0;
  const fixedFiles = [];

  for (const file of files) {
    const fixes = await processFile(file);
    if (fixes > 0) {
      totalFixes += fixes;
      const relPath = file.replace(process.cwd() + '\\', '').replace(process.cwd() + '/', '');
      fixedFiles.push({ path: relPath, fixes });
    }
  }

  console.log(`\nRestored text-white in ${fixedFiles.length} files (${totalFixes} total fixes):`);
  fixedFiles.forEach(f => console.log(`  ${f.path} (${f.fixes} fixes)`));
  console.log('\nDone!');
}

main().catch(console.error);
