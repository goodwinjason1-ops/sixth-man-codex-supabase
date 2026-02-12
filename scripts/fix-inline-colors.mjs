#!/usr/bin/env node
/**
 * Fix inline style color references (Recharts, JSX style objects etc.)
 * Run: node scripts/fix-inline-colors.mjs
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join, extname } from 'path';

const SRC_DIR = join(process.cwd(), 'src');

// Inline color replacements (in JS strings, style objects, etc.)
const INLINE_MAPPINGS = [
  // Chart tooltip/container backgrounds
  ["backgroundColor: '#0d5943'", "backgroundColor: '#FFFFFF'"],
  ["border: '1px solid #1a8a68'", "border: '1px solid #D4E4D4'"],
  // Chart fills and strokes
  ["fill=\"#22c55e\"", "fill=\"#00A651\""],
  ["stroke=\"#22c55e\"", "stroke=\"#00A651\""],
  ["fill=\"#4ade80\"", "fill=\"#00A651\""],
  ["fill: '#22c55e'", "fill: '#00A651'"],
  ["fill: '#4ade80'", "fill: '#00A651'"],
  ["stroke: '#22c55e'", "stroke: '#00A651'"],
  // Axis tick colors
  ["fill: '#4ade80'", "fill: '#6B7C6B'"],
  // Chart data colors
  ["color: '#4ade80'", "color: '#6B7C6B'"],
  // ProgressRing default
  ["color = '#4ade80'", "color = '#00A651'"],
  // Chart color arrays
  ["'#22c55e'", "'#00A651'"],
  // Recharts dot fills
  ["dot={{ fill: '#22c55e'", "dot={{ fill: '#00A651'"],
  // Border colors in style objects
  ["border-[#4ade80]", "border-[#00A651]"],
  // Remaining bg-[#0d5943] in className strings
  ["bg-[#0d5943]", "bg-white"],
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

  for (const [old, replacement] of INLINE_MAPPINGS) {
    content = content.replaceAll(old, replacement);
  }

  if (content !== original) {
    await writeFile(filePath, content, 'utf-8');
    return true;
  }
  return false;
}

async function main() {
  console.log('Fix Inline Colors Script');
  console.log('========================');

  const files = await getAllFiles(SRC_DIR);
  let changed = 0;
  const changedFiles = [];

  for (const file of files) {
    if (await processFile(file)) {
      changed++;
      changedFiles.push(file.replace(process.cwd() + '\\', '').replace(process.cwd() + '/', ''));
    }
  }

  console.log(`Modified ${changed} files:`);
  changedFiles.forEach(f => console.log(`  ${f}`));
  console.log('\nDone!');
}

main().catch(console.error);
