#!/usr/bin/env node
/**
 * Fix remaining old color references.
 * Run: node scripts/fix-remaining-colors.mjs
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join, extname } from 'path';

const SRC_DIR = join(process.cwd(), 'src');

// Additional color mappings that the initial batch missed
const ADDITIONAL_MAPPINGS = [
  // text-[#0a3d2e] was used as dark text on colored bg (= needs white on those)
  // Since text-[#0a3d2e] is on dark-green buttons/badges, replace with text-white
  ['text-[#0a3d2e]', 'text-white'],
  // Any remaining from-[#0d5943] or to-[#1a8a68] gradients → dark green
  ['from-[#0d5943]', 'from-[#005028]'],
  ['to-[#0a3d2e]', 'to-[#003018]'],
  ['to-[#1a8a68]', 'to-[#00A651]'],
  ['from-[#22c55e]', 'from-[#00A651]'],
  ['to-[#22c55e]', 'to-[#00A651]'],
  ['from-[#4ade80]', 'from-[#00A651]'],
  ['to-[#4ade80]', 'to-[#00A651]'],
  // border-[#0a3d2e]
  ['border-[#0a3d2e]', 'border-[#D4E4D4]'],
  // border-t-[#22c55e] (spinner)
  ['border-t-[#22c55e]', 'border-t-[#00A651]'],
  // shadow-[#22c55e]
  ['shadow-[#22c55e]', 'shadow-[#00A651]'],
  // ring-[#4ade80]
  ['ring-[#4ade80]', 'ring-[#00A651]'],
  // Remaining divide colors
  ['divide-[#1a8a68]', 'divide-[#D4E4D4]'],
  // via colors in gradients
  ['via-[#0d5943]', 'via-[#005028]'],
  // Any remaining old background in inline styles
];

async function getAllFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await getAllFiles(fullPath));
    } else if (['.jsx', '.js', '.css'].includes(extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

async function processFile(filePath) {
  let content = await readFile(filePath, 'utf-8');
  const original = content;

  for (const [old, replacement] of ADDITIONAL_MAPPINGS) {
    content = content.replaceAll(old, replacement);
  }

  if (content !== original) {
    await writeFile(filePath, content, 'utf-8');
    return true;
  }
  return false;
}

async function main() {
  console.log('Fix Remaining Colors Script');
  console.log('===========================');

  const files = await getAllFiles(SRC_DIR);
  console.log(`Scanning ${files.length} files...`);

  let changed = 0;
  const changedFiles = [];

  for (const file of files) {
    if (await processFile(file)) {
      changed++;
      changedFiles.push(file.replace(process.cwd() + '\\', '').replace(process.cwd() + '/', ''));
    }
  }

  console.log(`\nModified ${changed} files:`);
  changedFiles.forEach(f => console.log(`  ${f}`));
  console.log('\nDone!');
}

main().catch(console.error);
