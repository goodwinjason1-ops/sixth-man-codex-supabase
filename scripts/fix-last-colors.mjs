#!/usr/bin/env node
import { readdir, readFile, writeFile } from 'fs/promises';
import { join, extname } from 'path';

const SRC_DIR = join(process.cwd(), 'src');

const MAPPINGS = [
  // placeholder colors
  ['placeholder-[#1a8a68]', 'placeholder-gray-400'],
  // Chart grid strokes
  ['stroke="#1a8a68"', 'stroke="#D4E4D4"'],
  ["stroke=\"#1a8a68\"", "stroke=\"#D4E4D4\""],
  // Remaining inline style #1a8a68 references
  ["'#1a8a68'", "'#D4E4D4'"],
  // Remaining #0d5943 references
  ["'#0d5943'", "'#FFFFFF'"],
  ["#0d5943", "#005028"],
  // bg-[#065f46] remnants
  ["bg-[#065f46]", "bg-[#005028]"],
  // Any remaining #065f46
  ["#065f46", "#005028"],
];

async function getAllFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await getAllFiles(fullPath));
    else if (['.jsx', '.js', '.css'].includes(extname(entry.name))) files.push(fullPath);
  }
  return files;
}

async function main() {
  const files = await getAllFiles(SRC_DIR);
  let changed = 0;
  for (const file of files) {
    let content = await readFile(file, 'utf-8');
    const original = content;
    for (const [old, replacement] of MAPPINGS) {
      content = content.replaceAll(old, replacement);
    }
    if (content !== original) {
      await writeFile(file, content, 'utf-8');
      changed++;
      console.log(`  ${file.replace(process.cwd() + '\\', '')}`);
    }
  }
  console.log(`\nModified ${changed} files. Done!`);
}

main().catch(console.error);
