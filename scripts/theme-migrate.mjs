#!/usr/bin/env node
/**
 * Theme Migration Script
 * Converts dark green theme to light professional theme.
 * Run: node scripts/theme-migrate.mjs
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join, extname } from 'path';

const SRC_DIR = join(process.cwd(), 'src');

// Ordered longest-first to avoid partial matches
const COLOR_MAPPINGS = [
  // Hover backgrounds
  ['hover:bg-[#0f6b52]', 'hover:bg-[#E8F0E8]'],
  ['hover:bg-[#1a8a68]', 'hover:bg-gray-100'],
  ['hover:bg-[#0d5943]', 'hover:bg-gray-50'],
  ['hover:bg-[#22c55e]', 'hover:bg-[#00A651]'],
  ['hover:bg-[#0a3d2e]', 'hover:bg-[#F5F9F5]'],
  // Hover borders
  ['hover:border-[#22c55e]', 'hover:border-[#00A651]'],
  ['hover:border-[#4ade80]', 'hover:border-[#00A651]'],
  // Focus rings
  ['focus:ring-[#22c55e]', 'focus:ring-[#00A651]'],
  ['focus:ring-offset-[#0a3d2e]', 'focus:ring-offset-[#F5F9F5]'],
  // Backgrounds
  ['bg-[#0a3d2e]', 'bg-[#F5F9F5]'],
  ['bg-[#0d5943]', 'bg-white'],
  ['bg-[#065f46]', 'bg-[#005028]'],
  ['bg-[#22c55e]', 'bg-[#005028]'],
  ['bg-[#4ade80]', 'bg-[#00A651]'],
  ['bg-[#1a8a68]', 'bg-[#D4E4D4]'],
  // Borders
  ['border-[#1a8a68]', 'border-[#D4E4D4]'],
  ['border-[#22c55e]', 'border-[#00A651]'],
  ['border-[#065f46]', 'border-[#005028]'],
  // Text colors
  ['text-[#4ade80]', 'text-[#00A651]'],
  ['text-[#22c55e]', 'text-[#00A651]'],
  ['text-[#1a8a68]', 'text-[#6B7C6B]'],
  // Opacity variants (bg)
  ['bg-white/5', 'bg-gray-100'],
  ['bg-white/10', 'bg-gray-100'],
  ['bg-white/20', 'bg-gray-200'],
  // Opacity variants (text)
  ['text-white/40', 'text-gray-400'],
  ['text-white/50', 'text-gray-400'],
  ['text-white/60', 'text-gray-500'],
  ['text-white/70', 'text-gray-600'],
  ['text-white/80', 'text-gray-700'],
  ['text-white/90', 'text-gray-800'],
];

// Backgrounds that should keep white text
const COLORED_BG_PATTERNS = [
  'bg-[#005028]', 'bg-[#00A651]', 'bg-[#003018]',
  'bg-gradient-to', 'bg-red-', 'bg-blue-', 'bg-purple-',
  'bg-violet-', 'bg-orange-', 'bg-yellow-', 'bg-pink-',
  'bg-indigo-', 'bg-emerald-', 'bg-green-', 'bg-teal-',
  'bg-cyan-', 'bg-amber-',
];

function hasColoredBg(classStr) {
  return COLORED_BG_PATTERNS.some(p => classStr.includes(p));
}

/**
 * Replace text-white with text-gray-800, but only when the className
 * string doesn't contain a colored background.
 */
function replaceTextWhite(content) {
  // Match className strings (both template literals and regular strings)
  return content.replace(
    /(className\s*=\s*{?\s*[`"'])([^`"']*?)\btext-white\b([^`"']*?)([`"'])/g,
    (match, prefix, before, after, suffix) => {
      const fullClass = before + 'text-white' + after;
      if (hasColoredBg(fullClass)) {
        return match; // Keep text-white on colored backgrounds
      }
      return prefix + before + 'text-gray-800' + after + suffix;
    }
  );
}

/**
 * Also handle className strings built with concatenation or ternaries
 * that may span multiple segments. For safety, also do a line-based approach.
 */
function replaceTextWhiteLineBased(content) {
  const lines = content.split('\n');
  const result = [];

  for (const line of lines) {
    // Skip lines that have colored backgrounds — keep text-white there
    if (COLORED_BG_PATTERNS.some(p => line.includes(p))) {
      result.push(line);
      continue;
    }
    // Replace text-white on lines without colored backgrounds
    result.push(line.replace(/\btext-white\b/g, 'text-gray-800'));
  }

  return result.join('\n');
}

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

  // Step 1: Apply all direct color mappings
  for (const [oldColor, newColor] of COLOR_MAPPINGS) {
    content = content.replaceAll(oldColor, newColor);
  }

  // Step 2: Context-aware text-white replacement (line-based)
  content = replaceTextWhiteLineBased(content);

  if (content !== original) {
    await writeFile(filePath, content, 'utf-8');
    return true;
  }
  return false;
}

async function main() {
  console.log('Theme Migration Script');
  console.log('=====================');

  const files = await getAllFiles(SRC_DIR);
  console.log(`Found ${files.length} source files to process`);

  let changed = 0;
  const changedFiles = [];

  for (const file of files) {
    const wasChanged = await processFile(file);
    if (wasChanged) {
      changed++;
      changedFiles.push(file.replace(process.cwd() + '\\', '').replace(process.cwd() + '/', ''));
    }
  }

  console.log(`\nModified ${changed} files:`);
  changedFiles.forEach(f => console.log(`  ${f}`));
  console.log('\nDone!');
}

main().catch(console.error);
