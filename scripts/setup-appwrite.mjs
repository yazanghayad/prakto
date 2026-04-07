#!/usr/bin/env node

/**
 * Prakto — Appwrite Database Setup Script
 *
 * Creates the database, collections, attributes, and indexes
 * for the Prakto internship platform.
 *
 * Usage: node scripts/setup-appwrite.mjs
 *
 * Requires env vars:
 *   NEXT_PUBLIC_APPWRITE_ENDPOINT
 *   NEXT_PUBLIC_APPWRITE_PROJECT_ID
 *   APPWRITE_API_KEY
 */

import { Client, Databases, Storage, ID } from 'node-appwrite';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load .env.local
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
} catch {
  console.error('Could not read .env.local — set env vars manually');
}

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'prakto';

if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
  console.error('Missing required env vars. Check .env.local');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);

// ─── Helpers ───────────────────────────────────────────────────

async function safeCreateDatabase(id, name) {
  try {
    await databases.create(id, name);
    console.log(`✓ Database "${name}" created`);
  } catch (e) {
    if (e.code === 409) console.log(`• Database "${name}" already exists`);
    else throw e;
  }
}

async function safeCreateCollection(dbId, collId, name, permissions = []) {
  try {
    await databases.createCollection(dbId, collId, name, permissions);
    console.log(`  ✓ Collection "${name}" created`);
  } catch (e) {
    if (e.code === 409) console.log(`  • Collection "${name}" already exists`);
    else throw e;
  }
}

async function attr(dbId, collId, type, key, opts = {}) {
  const { required = false, defaultVal, size, elements, array = false, min, max } = opts;
  try {
    switch (type) {
      case 'string':
        await databases.createStringAttribute(dbId, collId, key, size || 255, required, defaultVal, array);
        break;
      case 'email':
        await databases.createEmailAttribute(dbId, collId, key, required, defaultVal);
        break;
      case 'boolean':
        await databases.createBooleanAttribute(dbId, collId, key, required, defaultVal);
        break;
      case 'integer':
        await databases.createIntegerAttribute(dbId, collId, key, required, min ?? null, max ?? null, defaultVal);
        break;
      case 'datetime':
        await databases.createDatetimeAttribute(dbId, collId, key, required, defaultVal);
        break;
      case 'enum':
        await databases.createEnumAttribute(dbId, collId, key, elements, required, defaultVal);
        break;
      case 'url':
        await databases.createUrlAttribute(dbId, collId, key, required, defaultVal);
        break;
    }
    console.log(`    + ${key} (${type})`);
  } catch (e) {
    if (e.code === 409) console.log(`    • ${key} already exists`);
    else console.error(`    ✗ ${key}: ${e.message}`);
  }
}

async function idx(dbId, collId, key, type, attributes) {
  try {
    await databases.createIndex(dbId, collId, key, type, attributes);
    console.log(`    ◆ Index "${key}"`);
  } catch (e) {
    if (e.code === 409) console.log(`    • Index "${key}" already exists`);
    else console.error(`    ✗ Index "${key}": ${e.message}`);
  }
}

async function safeCreateBucket(id, name, opts = {}) {
  try {
    await storage.createBucket(
      id,
      name,
      opts.permissions,
      opts.fileSecurity,
      opts.enabled ?? true,
      opts.maximumFileSize,
      opts.allowedFileExtensions
    );
    console.log(`  ✓ Bucket "${name}" created`);
  } catch (e) {
    if (e.code === 409) console.log(`  • Bucket "${name}" already exists`);
    else throw e;
  }
}

// Wait for attributes to be available (Appwrite processes them async)
function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Main ──────────────────────────────────────────────────────

async function main() {
  console.log('\n🚀 Prakto — Appwrite Setup\n');
  console.log(`Endpoint: ${ENDPOINT}`);
  console.log(`Project:  ${PROJECT_ID}`);
  console.log(`Database: ${DATABASE_ID}\n`);

  // ─── Database ────────────────────────────────────────────────
  await safeCreateDatabase(DATABASE_ID, 'Prakto');

  // ─── Collection: users ───────────────────────────────────────
  await safeCreateCollection(DATABASE_ID, 'users', 'Users', [
    'read("any")', // Functions/admin need to query; document-level perms + queries restrict access
    'create("users")',
    'update("users")'
  ]);
  await attr(DATABASE_ID, 'users', 'string', 'userId', { required: true, size: 36 });
  await attr(DATABASE_ID, 'users', 'enum', 'role', {
    required: true,
    elements: ['student', 'company', 'education_manager', 'admin']
  });
  await attr(DATABASE_ID, 'users', 'string', 'displayName', { required: true, size: 255 });
  await attr(DATABASE_ID, 'users', 'email', 'email', { required: true });
  await attr(DATABASE_ID, 'users', 'string', 'phone', { size: 20 });
  await attr(DATABASE_ID, 'users', 'url', 'avatarUrl');
  await attr(DATABASE_ID, 'users', 'enum', 'status', {
    elements: ['active', 'pending', 'deactivated'],
    defaultVal: 'active'
  });
  await attr(DATABASE_ID, 'users', 'datetime', 'createdAt', { required: true });
  await attr(DATABASE_ID, 'users', 'datetime', 'updatedAt', { required: true });

  // ─── Collection: students ────────────────────────────────────
  await safeCreateCollection(DATABASE_ID, 'students', 'Students', [
    'read("any")',
    'create("users")',
    'update("users")'
  ]);
  await attr(DATABASE_ID, 'students', 'string', 'userId', { required: true, size: 36 });
  await attr(DATABASE_ID, 'students', 'string', 'school', { required: true, size: 255 });
  await attr(DATABASE_ID, 'students', 'string', 'program', { required: true, size: 255 });
  await attr(DATABASE_ID, 'students', 'enum', 'educationLevel', {
    required: true,
    elements: ['yh', 'university', 'gymnasie', 'other']
  });
  await attr(DATABASE_ID, 'students', 'string', 'internshipType', { size: 50, array: true });
  await attr(DATABASE_ID, 'students', 'string', 'city', { required: true, size: 100 });
  await attr(DATABASE_ID, 'students', 'string', 'skills', { size: 100, array: true });
  await attr(DATABASE_ID, 'students', 'string', 'bio', { size: 2000 });
  await attr(DATABASE_ID, 'students', 'string', 'cvFileId', { size: 36 });
  await attr(DATABASE_ID, 'students', 'url', 'linkedinUrl');
  await attr(DATABASE_ID, 'students', 'string', 'programId', { size: 36 });
  await attr(DATABASE_ID, 'students', 'enum', 'placementStatus', {
    elements: ['searching', 'applied', 'placed', 'completed'],
    defaultVal: 'searching'
  });

  // ─── Collection: companies ───────────────────────────────────
  await safeCreateCollection(DATABASE_ID, 'companies', 'Companies', [
    'read("any")',
    'create("users")',
    'update("users")'
  ]);
  await attr(DATABASE_ID, 'companies', 'string', 'userId', { required: true, size: 36 });
  await attr(DATABASE_ID, 'companies', 'string', 'companyName', { required: true, size: 255 });
  await attr(DATABASE_ID, 'companies', 'string', 'orgNumber', { required: true, size: 20 });
  await attr(DATABASE_ID, 'companies', 'string', 'industry', { required: true, size: 100 });
  await attr(DATABASE_ID, 'companies', 'string', 'description', { size: 5000 });
  await attr(DATABASE_ID, 'companies', 'url', 'website');
  await attr(DATABASE_ID, 'companies', 'string', 'logoFileId', { size: 36 });
  await attr(DATABASE_ID, 'companies', 'string', 'city', { required: true, size: 100 });
  await attr(DATABASE_ID, 'companies', 'email', 'contactEmail', { required: true });
  await attr(DATABASE_ID, 'companies', 'string', 'contactPhone', { size: 20 });
  await attr(DATABASE_ID, 'companies', 'enum', 'approvalStatus', {
    elements: ['pending', 'approved', 'rejected'],
    defaultVal: 'pending'
  });
  await attr(DATABASE_ID, 'companies', 'string', 'approvalNote', { size: 1000 });
  await attr(DATABASE_ID, 'companies', 'string', 'approvedBy', { size: 36 });
  await attr(DATABASE_ID, 'companies', 'datetime', 'approvedAt');

  // ─── Collection: education_managers ──────────────────────────
  await safeCreateCollection(DATABASE_ID, 'education_managers', 'Education Managers', [
    'read("any")',
    'create("users")',
    'update("users")'
  ]);
  await attr(DATABASE_ID, 'education_managers', 'string', 'userId', { required: true, size: 36 });
  await attr(DATABASE_ID, 'education_managers', 'string', 'school', { required: true, size: 255 });
  await attr(DATABASE_ID, 'education_managers', 'string', 'department', { size: 255 });
  await attr(DATABASE_ID, 'education_managers', 'string', 'title', { size: 255 });
  await attr(DATABASE_ID, 'education_managers', 'string', 'phone', { size: 20 });

  // ─── Collection: programs ────────────────────────────────────
  await safeCreateCollection(DATABASE_ID, 'programs', 'Programs', [
    'read("any")',
    'create("users")',
    'update("users")'
  ]);
  await attr(DATABASE_ID, 'programs', 'string', 'managerId', { required: true, size: 36 });
  await attr(DATABASE_ID, 'programs', 'string', 'name', { required: true, size: 255 });
  await attr(DATABASE_ID, 'programs', 'string', 'school', { required: true, size: 255 });
  await attr(DATABASE_ID, 'programs', 'enum', 'internshipType', {
    required: true,
    elements: ['lia', 'vfu', 'apl']
  });
  await attr(DATABASE_ID, 'programs', 'datetime', 'periodStart');
  await attr(DATABASE_ID, 'programs', 'datetime', 'periodEnd');
  await attr(DATABASE_ID, 'programs', 'string', 'inviteCode', { required: true, size: 20 });
  await attr(DATABASE_ID, 'programs', 'datetime', 'createdAt', { required: true });

  // ─── Collection: internships ─────────────────────────────────
  await safeCreateCollection(DATABASE_ID, 'internships', 'Internships', [
    'read("any")',
    'create("users")',
    'update("users")'
  ]);
  await attr(DATABASE_ID, 'internships', 'string', 'companyId', { required: true, size: 36 });
  await attr(DATABASE_ID, 'internships', 'string', 'title', { required: true, size: 200 });
  await attr(DATABASE_ID, 'internships', 'string', 'description', { required: true, size: 3000 });
  await attr(DATABASE_ID, 'internships', 'string', 'responsibilities', { size: 1500 });
  await attr(DATABASE_ID, 'internships', 'string', 'requirements', { size: 1500 });
  await attr(DATABASE_ID, 'internships', 'string', 'preferredQualifications', { size: 1000 });
  await attr(DATABASE_ID, 'internships', 'string', 'field', { required: true, size: 100 });
  await attr(DATABASE_ID, 'internships', 'enum', 'internshipType', {
    required: true,
    elements: ['lia', 'vfu', 'apl']
  });
  await attr(DATABASE_ID, 'internships', 'string', 'city', { required: true, size: 100 });
  await attr(DATABASE_ID, 'internships', 'enum', 'workplaceType', {
    elements: ['on_site', 'remote', 'hybrid'],
    defaultVal: 'on_site'
  });
  await attr(DATABASE_ID, 'internships', 'string', 'duration', { size: 50 });
  await attr(DATABASE_ID, 'internships', 'integer', 'spots', { required: true, min: 1, max: 100 });
  await attr(DATABASE_ID, 'internships', 'datetime', 'startDate');
  await attr(DATABASE_ID, 'internships', 'datetime', 'applicationDeadline');
  await attr(DATABASE_ID, 'internships', 'enum', 'applicationMethod', {
    elements: ['email', 'platform', 'external'],
    defaultVal: 'platform'
  });
  await attr(DATABASE_ID, 'internships', 'email', 'contactEmail');
  await attr(DATABASE_ID, 'internships', 'boolean', 'cvRequired', { defaultVal: true });
  await attr(DATABASE_ID, 'internships', 'boolean', 'coverLetterRequired', { defaultVal: false });
  await attr(DATABASE_ID, 'internships', 'string', 'screeningQuestions', { size: 100, array: true });
  await attr(DATABASE_ID, 'internships', 'string', 'educationLevel', { size: 50 });
  await attr(DATABASE_ID, 'internships', 'string', 'rejectionMessage', { size: 1000 });
  await attr(DATABASE_ID, 'internships', 'enum', 'status', {
    elements: ['draft', 'pending_review', 'published', 'rejected', 'closed'],
    defaultVal: 'draft'
  });
  await attr(DATABASE_ID, 'internships', 'string', 'moderationNote', { size: 500 });
  await attr(DATABASE_ID, 'internships', 'string', 'moderatedBy', { size: 36 });
  await attr(DATABASE_ID, 'internships', 'datetime', 'createdAt', { required: true });
  await attr(DATABASE_ID, 'internships', 'datetime', 'updatedAt', { required: true });
  await attr(DATABASE_ID, 'internships', 'datetime', 'expiresAt');

  // ─── Collection: applications ────────────────────────────────
  await safeCreateCollection(DATABASE_ID, 'applications', 'Applications', [
    'read("any")',
    'create("users")',
    'update("users")'
  ]);
  await attr(DATABASE_ID, 'applications', 'string', 'studentId', { required: true, size: 36 });
  await attr(DATABASE_ID, 'applications', 'string', 'internshipId', { required: true, size: 36 });
  await attr(DATABASE_ID, 'applications', 'string', 'companyId', { required: true, size: 36 });
  await attr(DATABASE_ID, 'applications', 'string', 'cvFileId', { required: true, size: 36 });
  await attr(DATABASE_ID, 'applications', 'string', 'message', { size: 2000 });
  await attr(DATABASE_ID, 'applications', 'enum', 'status', {
    elements: ['submitted', 'reviewed', 'interview', 'accepted', 'rejected', 'withdrawn'],
    defaultVal: 'submitted'
  });
  await attr(DATABASE_ID, 'applications', 'string', 'statusNote', { size: 1000 });
  await attr(DATABASE_ID, 'applications', 'datetime', 'appliedAt', { required: true });
  await attr(DATABASE_ID, 'applications', 'datetime', 'updatedAt', { required: true });

  // ─── Collection: bookmarks ───────────────────────────────────
  await safeCreateCollection(DATABASE_ID, 'bookmarks', 'Bookmarks', [
    'read("any")',
    'create("users")',
    'delete("users")'
  ]);
  await attr(DATABASE_ID, 'bookmarks', 'string', 'studentId', { required: true, size: 36 });
  await attr(DATABASE_ID, 'bookmarks', 'string', 'internshipId', { required: true, size: 36 });
  await attr(DATABASE_ID, 'bookmarks', 'datetime', 'createdAt', { required: true });

  // ─── Collection: notifications ───────────────────────────────
  await safeCreateCollection(DATABASE_ID, 'notifications', 'Notifications', [
    'read("any")',
    'create("users")',
    'update("users")'
  ]);
  await attr(DATABASE_ID, 'notifications', 'string', 'recipientId', { required: true, size: 36 });
  await attr(DATABASE_ID, 'notifications', 'enum', 'type', {
    required: true,
    elements: ['new_application', 'application_status', 'company_approved', 'listing_approved', 'system', 'recommendation']
  });
  await attr(DATABASE_ID, 'notifications', 'string', 'title', { required: true, size: 255 });
  await attr(DATABASE_ID, 'notifications', 'string', 'message', { required: true, size: 1000 });
  await attr(DATABASE_ID, 'notifications', 'string', 'linkUrl', { size: 500 });
  await attr(DATABASE_ID, 'notifications', 'boolean', 'isRead', { required: true, defaultVal: false });
  await attr(DATABASE_ID, 'notifications', 'datetime', 'createdAt', { required: true });

  // ─── Collection: audit_logs ──────────────────────────────────
  await safeCreateCollection(DATABASE_ID, 'audit_logs', 'Audit Logs', [
    'read("any")' // Server-side only writes via API key
  ]);
  await attr(DATABASE_ID, 'audit_logs', 'string', 'adminId', { required: true, size: 36 });
  await attr(DATABASE_ID, 'audit_logs', 'string', 'action', { required: true, size: 100 });
  await attr(DATABASE_ID, 'audit_logs', 'string', 'targetType', { required: true, size: 50 });
  await attr(DATABASE_ID, 'audit_logs', 'string', 'targetId', { required: true, size: 36 });
  await attr(DATABASE_ID, 'audit_logs', 'string', 'details', { size: 5000 });
  await attr(DATABASE_ID, 'audit_logs', 'datetime', 'createdAt', { required: true });

  // ─── Collection: categories ──────────────────────────────────
  await safeCreateCollection(DATABASE_ID, 'categories', 'Categories', [
    'read("any")',
    'create("users")',
    'update("users")',
    'delete("users")'
  ]);
  await attr(DATABASE_ID, 'categories', 'string', 'name', { required: true, size: 100 });
  await attr(DATABASE_ID, 'categories', 'string', 'slug', { required: true, size: 100 });
  await attr(DATABASE_ID, 'categories', 'boolean', 'isActive', { required: true, defaultVal: true });

  // ─── Collection: conversations ─────────────────────────────
  await safeCreateCollection(DATABASE_ID, 'conversations', 'Conversations', [
    'read("any")',
    'create("users")',
    'update("users")'
  ]);
  await attr(DATABASE_ID, 'conversations', 'string', 'companyId', { required: true, size: 36 });
  await attr(DATABASE_ID, 'conversations', 'string', 'studentId', { required: true, size: 36 });
  await attr(DATABASE_ID, 'conversations', 'string', 'internshipId', { size: 36 });
  await attr(DATABASE_ID, 'conversations', 'string', 'applicationId', { size: 36 });
  await attr(DATABASE_ID, 'conversations', 'string', 'studentName', { required: true, size: 255 });
  await attr(DATABASE_ID, 'conversations', 'string', 'studentEmail', { size: 255 });
  await attr(DATABASE_ID, 'conversations', 'string', 'internshipTitle', { size: 255 });
  await attr(DATABASE_ID, 'conversations', 'string', 'lastMessage', { size: 500 });
  await attr(DATABASE_ID, 'conversations', 'string', 'lastSenderId', { size: 36 });
  await attr(DATABASE_ID, 'conversations', 'enum', 'status', {
    elements: ['open', 'snoozed', 'done'],
    defaultVal: 'open'
  });
  await attr(DATABASE_ID, 'conversations', 'boolean', 'isStarred', { defaultVal: false });
  await attr(DATABASE_ID, 'conversations', 'boolean', 'isReadByCompany', { defaultVal: false });
  await attr(DATABASE_ID, 'conversations', 'boolean', 'isReadByStudent', { defaultVal: false });
  await attr(DATABASE_ID, 'conversations', 'integer', 'unreadCount', { min: 0, max: 9999, defaultVal: 0 });
  await attr(DATABASE_ID, 'conversations', 'datetime', 'lastMessageAt', { required: true });
  await attr(DATABASE_ID, 'conversations', 'datetime', 'createdAt', { required: true });

  // ─── Collection: messages ────────────────────────────────────
  await safeCreateCollection(DATABASE_ID, 'messages', 'Messages', [
    'read("any")',
    'create("users")',
    'update("users")'
  ]);
  await attr(DATABASE_ID, 'messages', 'string', 'conversationId', { required: true, size: 36 });
  await attr(DATABASE_ID, 'messages', 'string', 'senderId', { required: true, size: 36 });
  await attr(DATABASE_ID, 'messages', 'string', 'senderName', { required: true, size: 255 });
  await attr(DATABASE_ID, 'messages', 'enum', 'senderRole', {
    required: true,
    elements: ['student', 'company']
  });
  await attr(DATABASE_ID, 'messages', 'string', 'text', { required: true, size: 5000 });
  await attr(DATABASE_ID, 'messages', 'boolean', 'isRead', { defaultVal: false });
  await attr(DATABASE_ID, 'messages', 'string', 'attachmentId', { size: 36 });
  await attr(DATABASE_ID, 'messages', 'string', 'attachmentName', { size: 255 });
  await attr(DATABASE_ID, 'messages', 'datetime', 'createdAt', { required: true });

  // ─── Blog Posts ──────────────────────────────────────────────
  await safeCreateCollection(DATABASE_ID, 'blog_posts', 'Blog Posts', [
    'read("any")',
    'create("users")',
    'update("users")',
    'delete("users")'
  ]);
  await attr(DATABASE_ID, 'blog_posts', 'string', 'title', { required: true, size: 200 });
  await attr(DATABASE_ID, 'blog_posts', 'string', 'slug', { required: true, size: 200 });
  await attr(DATABASE_ID, 'blog_posts', 'string', 'excerpt', { size: 500 });
  await attr(DATABASE_ID, 'blog_posts', 'string', 'content', { required: true, size: 5000 });
  await attr(DATABASE_ID, 'blog_posts', 'enum', 'category', {
    required: true,
    elements: ['tips', 'karriar', 'intervju', 'cv', 'brev', 'inspiration']
  });
  await attr(DATABASE_ID, 'blog_posts', 'string', 'coverImageUrl', { size: 500 });
  await attr(DATABASE_ID, 'blog_posts', 'string', 'authorId', { required: true, size: 50 });
  await attr(DATABASE_ID, 'blog_posts', 'enum', 'status', {
    elements: ['draft', 'published'],
    defaultVal: 'draft'
  });
  await attr(DATABASE_ID, 'blog_posts', 'datetime', 'publishedAt');
  await attr(DATABASE_ID, 'blog_posts', 'datetime', 'createdAt', { required: true });
  await attr(DATABASE_ID, 'blog_posts', 'datetime', 'updatedAt', { required: true });

  // ─── Collection: portfolio ────────────────────────────────────
  await safeCreateCollection(DATABASE_ID, 'portfolio', 'Portfolio', [
    'read("any")',
    'create("users")',
    'update("users")',
    'delete("users")'
  ]);
  await attr(DATABASE_ID, 'portfolio', 'string', 'userId', { required: true, size: 36 });
  await attr(DATABASE_ID, 'portfolio', 'string', 'studentId', { size: 36 });
  await attr(DATABASE_ID, 'portfolio', 'string', 'title', { required: true, size: 200 });
  await attr(DATABASE_ID, 'portfolio', 'string', 'description', { required: true, size: 1000 });
  await attr(DATABASE_ID, 'portfolio', 'enum', 'type', {
    elements: ['project', 'design', 'document', 'other'],
    defaultVal: 'project'
  });
  await attr(DATABASE_ID, 'portfolio', 'url', 'projectUrl');
  await attr(DATABASE_ID, 'portfolio', 'url', 'githubUrl');
  await attr(DATABASE_ID, 'portfolio', 'string', 'fileIds', { size: 36, array: true });
  await attr(DATABASE_ID, 'portfolio', 'string', 'tags', { size: 50, array: true });

  // ─── Collection: calendar_events ─────────────────────────────
  await safeCreateCollection(DATABASE_ID, 'calendar_events', 'Calendar Events', [
    'read("any")',
    'create("users")',
    'update("users")',
    'delete("users")'
  ]);
  await attr(DATABASE_ID, 'calendar_events', 'string', 'userId', { required: true, size: 36 });
  await attr(DATABASE_ID, 'calendar_events', 'string', 'title', { required: true, size: 200 });
  await attr(DATABASE_ID, 'calendar_events', 'string', 'description', { size: 500 });
  await attr(DATABASE_ID, 'calendar_events', 'datetime', 'startTime', { required: true });
  await attr(DATABASE_ID, 'calendar_events', 'datetime', 'endTime', { required: true });
  await attr(DATABASE_ID, 'calendar_events', 'enum', 'type', {
    elements: ['interview', 'meeting', 'reminder', 'other'],
    defaultVal: 'meeting'
  });
  await attr(DATABASE_ID, 'calendar_events', 'enum', 'status', {
    elements: ['scheduled', 'completed', 'cancelled'],
    defaultVal: 'scheduled'
  });
  await attr(DATABASE_ID, 'calendar_events', 'string', 'relatedId', { size: 36 });
  await attr(DATABASE_ID, 'calendar_events', 'string', 'location', { size: 255 });
  await attr(DATABASE_ID, 'calendar_events', 'url', 'meetingUrl');

  // ─── Collection: availability ────────────────────────────────
  await safeCreateCollection(DATABASE_ID, 'availability', 'Availability', [
    'read("any")',
    'create("users")',
    'update("users")',
    'delete("users")'
  ]);
  await attr(DATABASE_ID, 'availability', 'string', 'userId', { required: true, size: 36 });
  await attr(DATABASE_ID, 'availability', 'enum', 'dayOfWeek', {
    required: true,
    elements: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  });
  await attr(DATABASE_ID, 'availability', 'string', 'startTime', { required: true, size: 5 });
  await attr(DATABASE_ID, 'availability', 'string', 'endTime', { required: true, size: 5 });
  await attr(DATABASE_ID, 'availability', 'boolean', 'isRecurring', { required: true, defaultVal: true });

  // ─── Wait for attributes to be processed ─────────────────────
  console.log('\n⏳ Waiting 5s for Appwrite to process attributes...\n');
  await wait(5000);

  // ─── Indexes ─────────────────────────────────────────────────
  console.log('Creating indexes...');

  // users indexes
  await idx(DATABASE_ID, 'users', 'idx_role', 'key', ['role']);
  await idx(DATABASE_ID, 'users', 'idx_status', 'key', ['status']);
  await idx(DATABASE_ID, 'users', 'idx_userId', 'unique', ['userId']);

  // students indexes
  await idx(DATABASE_ID, 'students', 'idx_userId', 'unique', ['userId']);
  await idx(DATABASE_ID, 'students', 'idx_programId', 'key', ['programId']);
  await idx(DATABASE_ID, 'students', 'idx_placementStatus', 'key', ['placementStatus']);

  // companies indexes
  await idx(DATABASE_ID, 'companies', 'idx_userId', 'unique', ['userId']);
  await idx(DATABASE_ID, 'companies', 'idx_approvalStatus', 'key', ['approvalStatus']);

  // education_managers indexes
  await idx(DATABASE_ID, 'education_managers', 'idx_userId', 'unique', ['userId']);

  // programs indexes
  await idx(DATABASE_ID, 'programs', 'idx_managerId', 'key', ['managerId']);
  await idx(DATABASE_ID, 'programs', 'idx_inviteCode', 'unique', ['inviteCode']);

  // internships indexes
  await idx(DATABASE_ID, 'internships', 'idx_companyId', 'key', ['companyId']);
  await idx(DATABASE_ID, 'internships', 'idx_status', 'key', ['status']);
  await idx(DATABASE_ID, 'internships', 'idx_field', 'key', ['field']);
  await idx(DATABASE_ID, 'internships', 'idx_city', 'key', ['city']);
  await idx(DATABASE_ID, 'internships', 'idx_type', 'key', ['internshipType']);

  // applications indexes
  await idx(DATABASE_ID, 'applications', 'idx_studentId', 'key', ['studentId']);
  await idx(DATABASE_ID, 'applications', 'idx_internshipId', 'key', ['internshipId']);
  await idx(DATABASE_ID, 'applications', 'idx_companyId', 'key', ['companyId']);
  await idx(DATABASE_ID, 'applications', 'idx_status', 'key', ['status']);

  // notifications indexes
  await idx(DATABASE_ID, 'notifications', 'idx_recipientId', 'key', ['recipientId']);
  await idx(DATABASE_ID, 'notifications', 'idx_isRead', 'key', ['isRead']);

  // audit_logs indexes
  await idx(DATABASE_ID, 'audit_logs', 'idx_adminId', 'key', ['adminId']);
  await idx(DATABASE_ID, 'audit_logs', 'idx_action', 'key', ['action']);

  // categories indexes
  await idx(DATABASE_ID, 'categories', 'idx_slug', 'unique', ['slug']);

  // conversations indexes
  await idx(DATABASE_ID, 'conversations', 'idx_companyId', 'key', ['companyId']);
  await idx(DATABASE_ID, 'conversations', 'idx_studentId', 'key', ['studentId']);
  await idx(DATABASE_ID, 'conversations', 'idx_status', 'key', ['status']);
  await idx(DATABASE_ID, 'conversations', 'idx_lastMessageAt', 'key', ['lastMessageAt']);
  await idx(DATABASE_ID, 'conversations', 'idx_internshipId', 'key', ['internshipId']);

  // messages indexes
  await idx(DATABASE_ID, 'messages', 'idx_conversationId', 'key', ['conversationId']);
  await idx(DATABASE_ID, 'messages', 'idx_senderId', 'key', ['senderId']);
  await idx(DATABASE_ID, 'messages', 'idx_createdAt', 'key', ['createdAt']);

  // blog_posts indexes
  await idx(DATABASE_ID, 'blog_posts', 'idx_slug', 'unique', ['slug']);
  await idx(DATABASE_ID, 'blog_posts', 'idx_status', 'key', ['status']);
  await idx(DATABASE_ID, 'blog_posts', 'idx_category', 'key', ['category']);
  await idx(DATABASE_ID, 'blog_posts', 'idx_publishedAt', 'key', ['publishedAt']);

  // portfolio indexes
  await idx(DATABASE_ID, 'portfolio', 'idx_userId', 'key', ['userId']);
  await idx(DATABASE_ID, 'portfolio', 'idx_studentId', 'key', ['studentId']);
  await idx(DATABASE_ID, 'portfolio', 'idx_type', 'key', ['type']);

  // calendar_events indexes
  await idx(DATABASE_ID, 'calendar_events', 'idx_userId', 'key', ['userId']);
  await idx(DATABASE_ID, 'calendar_events', 'idx_startTime', 'key', ['startTime']);
  await idx(DATABASE_ID, 'calendar_events', 'idx_type', 'key', ['type']);
  await idx(DATABASE_ID, 'calendar_events', 'idx_status', 'key', ['status']);

  // availability indexes
  await idx(DATABASE_ID, 'availability', 'idx_userId', 'key', ['userId']);
  await idx(DATABASE_ID, 'availability', 'idx_dayOfWeek', 'key', ['dayOfWeek']);

  // ─── Storage Buckets ─────────────────────────────────────────
  console.log('\nCreating storage buckets...');

  await safeCreateBucket('cvs', 'CVs', {
    permissions: ['read("any")', 'create("users")', 'update("users")', 'delete("users")'],
    fileSecurity: true,
    maximumFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileExtensions: ['pdf', 'doc', 'docx']
  });

  await safeCreateBucket('logos', 'Company Logos', {
    permissions: ['read("any")', 'create("users")', 'update("users")', 'delete("users")'],
    fileSecurity: true,
    maximumFileSize: 2 * 1024 * 1024, // 2MB
    allowedFileExtensions: ['png', 'jpg', 'jpeg', 'webp']
  });

  await safeCreateBucket('documents', 'Documents', {
    permissions: ['read("any")', 'create("users")', 'update("users")', 'delete("users")'],
    fileSecurity: true,
    maximumFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileExtensions: ['pdf', 'doc', 'docx']
  });

  await safeCreateBucket('portfolio', 'Portfolio Files', {
    permissions: ['read("any")', 'create("users")', 'update("users")', 'delete("users")'],
    fileSecurity: true,
    maximumFileSize: 25 * 1024 * 1024, // 25MB
    allowedFileExtensions: ['pdf', 'png', 'jpg', 'jpeg', 'zip', 'doc', 'docx']
  });

  await safeCreateBucket('avatars', 'Profile Pictures', {
    permissions: ['read("any")', 'create("users")', 'update("users")', 'delete("users")'],
    fileSecurity: true,
    maximumFileSize: 2 * 1024 * 1024, // 2MB
    allowedFileExtensions: ['png', 'jpg', 'jpeg', 'webp']
  });

  console.log('\n✅ Prakto Appwrite setup complete!\n');
}

main().catch((e) => {
  console.error('Setup failed:', e);
  process.exit(1);
});
