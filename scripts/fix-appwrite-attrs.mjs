#!/usr/bin/env node

/**
 * Fix script for Appwrite attributes that failed in the initial setup:
 * 1. required + defaultVal is not allowed → make them optional with default
 * 2. internships collection hit attribute size limit → reduce field sizes
 */

import { Client, Databases } from 'node-appwrite';
import { readFileSync } from 'node:fs';
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

async function main() {
  console.log('\n🔧 Fixing Prakto attributes...\n');

  // ─── Fix 1: Enum attributes that need default but were required ───
  // Make them optional (required=false) with a default value

  const enumFixes = [
    { coll: 'users', key: 'status', elements: ['active', 'pending', 'deactivated'], defaultVal: 'active' },
    { coll: 'students', key: 'placementStatus', elements: ['searching', 'applied', 'placed', 'completed'], defaultVal: 'searching' },
    { coll: 'companies', key: 'approvalStatus', elements: ['pending', 'approved', 'rejected'], defaultVal: 'pending' },
    { coll: 'internships', key: 'status', elements: ['draft', 'pending_review', 'published', 'rejected', 'closed'], defaultVal: 'draft' },
    { coll: 'applications', key: 'status', elements: ['submitted', 'reviewed', 'interview', 'accepted', 'rejected', 'withdrawn'], defaultVal: 'submitted' },
    { coll: 'conversations', key: 'status', elements: ['open', 'snoozed', 'done'], defaultVal: 'open' },
    { coll: 'portfolio', key: 'type', elements: ['project', 'design', 'document', 'other'], defaultVal: 'project' },
    { coll: 'calendar_events', key: 'type', elements: ['interview', 'meeting', 'reminder', 'other'], defaultVal: 'meeting' },
    { coll: 'calendar_events', key: 'status', elements: ['scheduled', 'completed', 'cancelled'], defaultVal: 'scheduled' },
  ];

  for (const { coll, key, elements, defaultVal } of enumFixes) {
    try {
      await databases.createEnumAttribute(DB, coll, key, elements, false, defaultVal);
      console.log(`  ✓ ${coll}.${key} (enum, optional, default="${defaultVal}")`);
    } catch (e) {
      if (e.code === 409) console.log(`  • ${coll}.${key} already exists`);
      else console.error(`  ✗ ${coll}.${key}: ${e.message}`);
    }
  }

  // Boolean with default
  const boolFixes = [
    { coll: 'notifications', key: 'isRead', defaultVal: false },
    { coll: 'categories', key: 'isActive', defaultVal: true },
  ];

  for (const { coll, key, defaultVal } of boolFixes) {
    try {
      await databases.createBooleanAttribute(DB, coll, key, false, defaultVal);
      console.log(`  ✓ ${coll}.${key} (boolean, optional, default=${defaultVal})`);
    } catch (e) {
      if (e.code === 409) console.log(`  • ${coll}.${key} already exists`);
      else console.error(`  ✗ ${coll}.${key}: ${e.message}`);
    }
  }

  // ─── Fix 2: Internships large text fields — use smaller sizes ─────
  // description (was 10000 → try 4000), requirements (was 5000 → try 2000), moderationNote (was 1000)
  const internshipTextFixes = [
    { key: 'description', size: 4000, required: true },
    { key: 'requirements', size: 2000, required: false },
    { key: 'moderationNote', size: 500, required: false },
  ];

  for (const { key, size, required } of internshipTextFixes) {
    try {
      await databases.createStringAttribute(DB, 'internships', key, size, required);
      console.log(`  ✓ internships.${key} (string, size=${size})`);
    } catch (e) {
      if (e.code === 409) console.log(`  • internships.${key} already exists`);
      else console.error(`  ✗ internships.${key}: ${e.message}`);
    }
  }

  // ─── Wait & create missing indexes ────────────────────────────
  console.log('\n⏳ Waiting 5s for attributes to process...\n');
  await new Promise((r) => setTimeout(r, 5000));

  console.log('Creating missing indexes...');
  const missingIndexes = [
    { coll: 'users', key: 'idx_status', attrs: ['status'] },
    { coll: 'students', key: 'idx_placementStatus', attrs: ['placementStatus'] },
    { coll: 'companies', key: 'idx_approvalStatus', attrs: ['approvalStatus'] },
    { coll: 'internships', key: 'idx_status', attrs: ['status'] },
    { coll: 'applications', key: 'idx_status', attrs: ['status'] },
    { coll: 'notifications', key: 'idx_isRead', attrs: ['isRead'] },
  ];

  for (const { coll, key, attrs } of missingIndexes) {
    try {
      await databases.createIndex(DB, coll, key, 'key', attrs);
      console.log(`  ◆ ${coll}/${key}`);
    } catch (e) {
      if (e.code === 409) console.log(`  • ${coll}/${key} already exists`);
      else console.error(`  ✗ ${coll}/${key}: ${e.message}`);
    }
  }

  console.log('\n✅ Fixes applied!\n');
}

main().catch((e) => {
  console.error('Fix failed:', e);
  process.exit(1);
});
