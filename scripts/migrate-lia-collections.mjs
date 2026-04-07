#!/usr/bin/env node

/**
 * Creates the lia_notes, lia_journal, lia_goals collections in Appwrite.
 * Safe to run multiple times (skips if already exists).
 *
 * Usage: node scripts/migrate-lia-collections.mjs
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
} catch { /* ignore */ }

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'prakto';

if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
  console.error('Missing NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT_ID, or APPWRITE_API_KEY');
  process.exit(1);
}

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const databases = new Databases(client);

async function safeCreate(collId, name, perms) {
  try {
    await databases.createCollection(DATABASE_ID, collId, name, perms);
    console.log(`✓ Collection "${name}" created`);
  } catch (e) {
    if (e.code === 409) console.log(`• Collection "${name}" already exists`);
    else throw e;
  }
}

async function attr(collId, type, key, opts = {}) {
  const { required = false, defaultVal, size } = opts;
  try {
    if (type === 'string') {
      await databases.createStringAttribute(DATABASE_ID, collId, key, size || 255, required, defaultVal);
    } else if (type === 'boolean') {
      await databases.createBooleanAttribute(DATABASE_ID, collId, key, required, defaultVal);
    } else if (type === 'integer') {
      await databases.createIntegerAttribute(DATABASE_ID, collId, key, required);
    }
    console.log(`  + ${key} (${type})`);
  } catch (e) {
    if (e.code === 409) console.log(`  • ${key} already exists`);
    else console.error(`  ✗ ${key}: ${e.message}`);
  }
}

async function idx(collId, key, type, attributes) {
  try {
    await databases.createIndex(DATABASE_ID, collId, key, type, attributes);
    console.log(`  ◆ Index "${key}"`);
  } catch (e) {
    if (e.code === 409) console.log(`  • Index "${key}" already exists`);
    else console.error(`  ✗ Index "${key}": ${e.message}`);
  }
}

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

const PERMS = ['read("any")', 'create("users")', 'update("users")', 'delete("users")'];

async function main() {
  console.log('\n📓 Creating LIA collections...\n');

  // ─── lia_journal ─────────────────────────────────────────────
  await safeCreate('lia_journal', 'LIA Journal', PERMS);
  await attr('lia_journal', 'string', 'userId');
  await attr('lia_journal', 'integer', 'weekNumber', { required: true });
  await attr('lia_journal', 'integer', 'year', { required: true });
  await attr('lia_journal', 'string', 'content', { size: 10000 });
  await attr('lia_journal', 'string', 'highlights', { size: 5000 });
  await attr('lia_journal', 'string', 'challenges', { size: 5000 });
  await attr('lia_journal', 'string', 'learnings', { size: 5000 });
  await attr('lia_journal', 'string', 'mood', { size: 50 });
  await wait(2000);
  await idx('lia_journal', 'idx_userId', 'key', ['userId']);

  // ─── lia_goals ───────────────────────────────────────────────
  await safeCreate('lia_goals', 'LIA Goals', PERMS);
  await attr('lia_goals', 'string', 'userId');
  await attr('lia_goals', 'string', 'title', { size: 500, required: true });
  await attr('lia_goals', 'string', 'description', { size: 2000 });
  await attr('lia_goals', 'boolean', 'completed', { defaultVal: false });
  await attr('lia_goals', 'string', 'completedAt', { size: 50 });
  await attr('lia_goals', 'string', 'category', { size: 100 });
  await attr('lia_goals', 'integer', 'sortOrder');
  await wait(2000);
  await idx('lia_goals', 'idx_userId', 'key', ['userId']);

  // ─── lia_notes ───────────────────────────────────────────────
  await safeCreate('lia_notes', 'LIA Notes', PERMS);
  await attr('lia_notes', 'string', 'userId');
  await attr('lia_notes', 'string', 'title', { size: 500 });
  await attr('lia_notes', 'string', 'content', { size: 50000 }); // rich text HTML
  await attr('lia_notes', 'boolean', 'pinned', { defaultVal: false });
  await wait(2000);
  await idx('lia_notes', 'idx_userId', 'key', ['userId']);

  // ─── lia_time ────────────────────────────────────────────────
  await safeCreate('lia_time', 'LIA Time Tracking', PERMS);
  await attr('lia_time', 'string', 'userId');
  await attr('lia_time', 'string', 'date', { size: 20, required: true });
  await attr('lia_time', 'integer', 'hours', { required: true });
  await attr('lia_time', 'string', 'description', { size: 1000 });
  await attr('lia_time', 'string', 'category', { size: 50 });
  await wait(2000);
  await idx('lia_time', 'idx_userId', 'key', ['userId']);
  await idx('lia_time', 'idx_date', 'key', ['date']);

  // ─── lia_meetings ────────────────────────────────────────────
  await safeCreate('lia_meetings', 'LIA Mentor Meetings', PERMS);
  await attr('lia_meetings', 'string', 'userId');
  await attr('lia_meetings', 'string', 'date', { size: 20, required: true });
  await attr('lia_meetings', 'string', 'summary', { size: 3000 });
  await attr('lia_meetings', 'string', 'feedback', { size: 3000 });
  await attr('lia_meetings', 'string', 'actions', { size: 3000 });
  await attr('lia_meetings', 'string', 'nextSteps', { size: 500 });
  await wait(2000);
  await idx('lia_meetings', 'idx_userId', 'key', ['userId']);

  // ─── lia_feedback ────────────────────────────────────────────
  await safeCreate('lia_feedback', 'LIA Feedback Log', PERMS);
  await attr('lia_feedback', 'string', 'userId');
  await attr('lia_feedback', 'string', 'date', { size: 20, required: true });
  await attr('lia_feedback', 'string', 'from', { size: 255 });
  await attr('lia_feedback', 'string', 'type', { size: 50 });
  await attr('lia_feedback', 'string', 'content', { size: 5000 });
  await attr('lia_feedback', 'string', 'category', { size: 50 });
  await wait(2000);
  await idx('lia_feedback', 'idx_userId', 'key', ['userId']);

  // ─── lia_contacts ────────────────────────────────────────────
  await safeCreate('lia_contacts', 'LIA Contacts', PERMS);
  await attr('lia_contacts', 'string', 'userId');
  await attr('lia_contacts', 'string', 'name', { size: 255, required: true });
  await attr('lia_contacts', 'string', 'role', { size: 255 });
  await attr('lia_contacts', 'string', 'company', { size: 255 });
  await attr('lia_contacts', 'string', 'email', { size: 255 });
  await attr('lia_contacts', 'string', 'phone', { size: 50 });
  await attr('lia_contacts', 'string', 'notes', { size: 2000 });
  await wait(2000);
  await idx('lia_contacts', 'idx_userId', 'key', ['userId']);

  console.log('\n✅ LIA collections ready!\n');
}

main().catch(e => { console.error('Failed:', e); process.exit(1); });
