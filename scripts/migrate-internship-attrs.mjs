#!/usr/bin/env node

/**
 * Migration: Resize internship attributes + add step-2 fields
 *
 * The collection hit the attribute size limit. This script:
 * 1. Deletes oversized string attributes
 * 2. Recreates them with smaller sizes
 * 3. Adds new step-2 fields
 *
 * ⚠️  WARNING: deleting attributes removes their data.
 *     Only run this in development/staging.
 *
 * Run: node scripts/migrate-internship-attrs.mjs
 */

import { Client, Databases } from 'node-appwrite';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env.local');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
} catch {}

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;
const DB = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'prakto';

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const databases = new Databases(client);

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function deleteAttr(key) {
  try {
    await databases.deleteAttribute(DB, 'internships', key);
    console.log(`  🗑  Deleted "${key}"`);
    return true;
  } catch (e) {
    if (e.code === 404) {
      console.log(`  • "${key}" not found (skip)`);
      return false;
    }
    console.error(`  ✗ Delete ${key}: ${e.message}`);
    return false;
  }
}

async function addAttr(key, fn) {
  try {
    await fn();
    console.log(`  ✓ ${key} added`);
    return true;
  } catch (e) {
    if (e.code === 409) {
      console.log(`  • ${key} already exists`);
      return true;
    }
    console.error(`  ✗ ${key}: ${e.message}`);
    return false;
  }
}

async function main() {
  console.log('\n🔧 Migration: Resize + add internship attributes\n');

  // ─── Phase 1: Delete oversized attributes to free space ──────
  console.log('Phase 1: Freeing space by deleting oversized attributes...\n');

  const toDelete = [
    'remote',           // replaced by workplaceType enum
    'description',      // 10000 → 3000
    'requirements',     // 5000 → 1500
    'moderationNote',   // 1000 → 500
    'title',            // 255 → 200
  ];

  let deletedCount = 0;
  for (const key of toDelete) {
    const ok = await deleteAttr(key);
    if (ok) deletedCount++;
    await wait(2000);
  }

  // Wait for Appwrite to process deletions
  console.log(`\n⏳ Waiting 8s for ${deletedCount} deletions to process...\n`);
  await wait(8000);

  // ─── Phase 2: Recreate resized attributes ────────────────────
  console.log('Phase 2: Recreating resized attributes...\n');

  const resized = [
    {
      key: 'title',
      fn: () => databases.createStringAttribute(DB, 'internships', 'title', 200, true)
    },
    {
      key: 'description',
      fn: () => databases.createStringAttribute(DB, 'internships', 'description', 3000, true)
    },
    {
      key: 'requirements',
      fn: () => databases.createStringAttribute(DB, 'internships', 'requirements', 1500, false)
    },
    {
      key: 'moderationNote',
      fn: () => databases.createStringAttribute(DB, 'internships', 'moderationNote', 500, false)
    }
  ];

  for (const { key, fn } of resized) {
    await addAttr(key, fn);
    await wait(2000);
  }

  console.log('\n⏳ Waiting 5s for resized attrs to process...\n');
  await wait(5000);

  // ─── Phase 3: Add new step-2 attributes ──────────────────────
  console.log('Phase 3: Adding new internship fields...\n');

  const newAttrs = [
    {
      key: 'workplaceType',
      fn: () => databases.createEnumAttribute(
        DB, 'internships', 'workplaceType',
        ['on_site', 'remote', 'hybrid'], false, 'on_site'
      )
    },
    {
      key: 'applicationMethod',
      fn: () => databases.createEnumAttribute(
        DB, 'internships', 'applicationMethod',
        ['email', 'platform', 'external'], false, 'platform'
      )
    },
    {
      key: 'contactEmail',
      fn: () => databases.createEmailAttribute(
        DB, 'internships', 'contactEmail', false
      )
    },
    {
      key: 'educationLevel',
      fn: () => databases.createStringAttribute(
        DB, 'internships', 'educationLevel', 50, false
      )
    },
    {
      key: 'responsibilities',
      fn: () => databases.createStringAttribute(
        DB, 'internships', 'responsibilities', 1500, false
      )
    },
    {
      key: 'preferredQualifications',
      fn: () => databases.createStringAttribute(
        DB, 'internships', 'preferredQualifications', 1000, false
      )
    },
    {
      key: 'rejectionMessage',
      fn: () => databases.createStringAttribute(
        DB, 'internships', 'rejectionMessage', 1000, false
      )
    }
  ];

  for (const { key, fn } of newAttrs) {
    await addAttr(key, fn);
    await wait(2000);
  }

  console.log('\n✅ Migration complete!\n');
}

main().catch((e) => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
