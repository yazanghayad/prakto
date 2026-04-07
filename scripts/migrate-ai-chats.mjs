#!/usr/bin/env node

/**
 * Creates the ai_chats collection in Appwrite.
 * Stores AI assistant chat sessions per user.
 * Safe to run multiple times (skips if already exists).
 *
 * Usage: node scripts/migrate-ai-chats.mjs
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
    } else if (type === 'datetime') {
      await databases.createDatetimeAttribute(DATABASE_ID, collId, key, required, defaultVal);
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
  console.log('\n🤖 Creating AI Chats collection...\n');

  await safeCreate('ai_chats', 'AI Chat Sessions', PERMS);

  // userId — owner of the chat session
  await attr('ai_chats', 'string', 'userId', { size: 36, required: true });

  // title — auto-generated from first user message (truncated)
  await attr('ai_chats', 'string', 'title', { size: 200 });

  // messages — JSON stringified array of { role, content, timestamp }
  await attr('ai_chats', 'string', 'messages', { size: 100000, required: true });

  // timestamps
  await attr('ai_chats', 'datetime', 'createdAt', { required: true });
  await attr('ai_chats', 'datetime', 'updatedAt', { required: true });

  await wait(2000);

  // Indexes
  await idx('ai_chats', 'idx_userId', 'key', ['userId']);
  await idx('ai_chats', 'idx_updatedAt', 'key', ['updatedAt']);

  console.log('\n✅ AI Chats collection ready!\n');
}

main().catch(e => { console.error('Failed:', e); process.exit(1); });
