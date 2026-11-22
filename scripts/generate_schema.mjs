import fs from 'fs';

const db = JSON.parse(fs.readFileSync('server/data/db.json', 'utf8'));

function escapeSql(val) {
  if (val === null || val === undefined) return 'NULL';
  return `'` + String(val).replace(/'/g, `''`) + `'`;
}

let sql = `-- CSG 17Y Anniversary - Supabase Database Schema & Seed Data
-- Run this script in Supabase Dashboard -> SQL Editor -> New Query -> Run!

BEGIN;

-- 1. MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.members (
    "id" TEXT PRIMARY KEY,
    "mssv" TEXT,
    "fullName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "honorific" TEXT,
    "generation" TEXT,
    "department" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- 2. MEMORIES TABLE
CREATE TABLE IF NOT EXISTS public.memories (
    "id" TEXT PRIMARY KEY,
    "season" TEXT,
    "year" TEXT,
    "title" TEXT NOT NULL,
    "caption" TEXT,
    "imagePath" TEXT,
    "tag" TEXT,
    "likes" INTEGER DEFAULT 0,
    "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- 3. REGISTRATIONS TABLE
CREATE TABLE IF NOT EXISTS public.registrations (
    "id" TEXT PRIMARY KEY,
    "memberId" TEXT,
    "fullName" TEXT NOT NULL,
    "mssv" TEXT,
    "role" TEXT,
    "honorific" TEXT,
    "gmail" TEXT,
    "personalPhone" TEXT,
    "emergencyPhone" TEXT,
    "allergies" JSONB DEFAULT '[]'::jsonb,
    "allergyNote" TEXT DEFAULT '',
    "wishes" TEXT DEFAULT '',
    "package" TEXT,
    "totalRequired" NUMERIC DEFAULT 0,
    "paidAmount" NUMERIC DEFAULT 0,
    "remainingAmount" NUMERIC DEFAULT 0,
    "plan" TEXT,
    "paymentPlan" TEXT,
    "status" TEXT DEFAULT 'PENDING',
    "paymentStatus" TEXT DEFAULT 'PENDING',
    "isApproved100" BOOLEAN DEFAULT FALSE,
    "isPublicConsent" BOOLEAN DEFAULT TRUE,
    "receiptPhase1Url" TEXT,
    "receiptPhase2Url" TEXT,
    "ticketCode" TEXT,
    "ticketToken" TEXT,
    "paymentHistory" JSONB DEFAULT '[]'::jsonb,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMPTZ,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMPTZ,
    "rejectReason" TEXT,
    "isEmailSent" BOOLEAN DEFAULT FALSE,
    "isCheckedIn" BOOLEAN DEFAULT FALSE,
    "checkedInAt" TIMESTAMPTZ,
    "checkedInBy" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 4. WISHES TABLE
CREATE TABLE IF NOT EXISTS public.wishes (
    "id" TEXT PRIMARY KEY,
    "registrationId" TEXT,
    "authorName" TEXT NOT NULL,
    "role" TEXT,
    "content" TEXT NOT NULL,
    "isPublic" BOOLEAN DEFAULT TRUE,
    "moderationStatus" TEXT DEFAULT 'APPROVED',
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CHARACTERS TABLE
CREATE TABLE IF NOT EXISTS public.characters (
    "id" TEXT PRIMARY KEY,
    "registrationId" TEXT,
    "name" TEXT NOT NULL,
    "honorific" TEXT,
    "role" TEXT,
    "wish" TEXT,
    "x" NUMERIC,
    "y" NUMERIC,
    "scale" NUMERIC DEFAULT 1,
    "direction" INTEGER DEFAULT 1,
    "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- 6. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    "id" TEXT PRIMARY KEY,
    "action" TEXT NOT NULL,
    "targetId" TEXT,
    "adminUser" TEXT,
    "details" TEXT,
    "timestamp" TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE ROW LEVEL SECURITY & OPEN POLICIES
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public full access on members" ON public.members;
CREATE POLICY "Public full access on members" ON public.members FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access on memories" ON public.memories;
CREATE POLICY "Public full access on memories" ON public.memories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access on registrations" ON public.registrations;
CREATE POLICY "Public full access on registrations" ON public.registrations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access on wishes" ON public.wishes;
CREATE POLICY "Public full access on wishes" ON public.wishes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access on characters" ON public.characters;
CREATE POLICY "Public full access on characters" ON public.characters FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access on audit_logs" ON public.audit_logs;
CREATE POLICY "Public full access on audit_logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

`;

// Seed Members
if (db.members && db.members.length) {
  sql += '\n-- SEED MEMBERS\n';
  for (const m of db.members) {
    sql += `INSERT INTO public.members ("id", "mssv", "fullName", "role", "honorific", "generation", "department")\n`;
    sql += `VALUES (${escapeSql(m.id)}, ${escapeSql(m.mssv)}, ${escapeSql(m.fullName)}, ${escapeSql(m.role)}, ${escapeSql(m.honorific)}, ${escapeSql(m.generation)}, ${escapeSql(m.department)})\n`;
    sql += `ON CONFLICT ("id") DO UPDATE SET "fullName" = EXCLUDED."fullName", "role" = EXCLUDED."role";\n`;
  }
}

// Seed Memories
if (db.memories && db.memories.length) {
  sql += '\n-- SEED MEMORIES\n';
  for (const m of db.memories) {
    sql += `INSERT INTO public.memories ("id", "season", "year", "title", "caption", "imagePath", "tag", "likes")\n`;
    sql += `VALUES (${escapeSql(m.id)}, ${escapeSql(m.season)}, ${escapeSql(m.year)}, ${escapeSql(m.title)}, ${escapeSql(m.caption)}, ${escapeSql(m.imagePath)}, ${escapeSql(m.tag)}, ${m.likes || 0})\n`;
    sql += `ON CONFLICT ("id") DO NOTHING;\n`;
  }
}

// Seed Wishes
if (db.wishes && db.wishes.length) {
  sql += '\n-- SEED WISHES\n';
  for (const w of db.wishes) {
    sql += `INSERT INTO public.wishes ("id", "registrationId", "authorName", "role", "content", "isPublic", "moderationStatus", "createdAt")\n`;
    sql += `VALUES (${escapeSql(w.id)}, ${escapeSql(w.registrationId)}, ${escapeSql(w.authorName)}, ${escapeSql(w.role)}, ${escapeSql(w.content)}, ${w.isPublic !== false}, ${escapeSql(w.moderationStatus || 'APPROVED')}, ${escapeSql(w.createdAt || new Date().toISOString())})\n`;
    sql += `ON CONFLICT ("id") DO NOTHING;\n`;
  }
}

// Seed Characters
if (db.characters && db.characters.length) {
  sql += '\n-- SEED CHARACTERS\n';
  for (const c of db.characters) {
    sql += `INSERT INTO public.characters ("id", "registrationId", "name", "honorific", "role", "wish", "x", "y", "direction")\n`;
    sql += `VALUES (${escapeSql(c.id)}, ${escapeSql(c.registrationId)}, ${escapeSql(c.name)}, ${escapeSql(c.honorific)}, ${escapeSql(c.role)}, ${escapeSql(c.wish)}, ${c.x || 50}, ${c.y || 50}, ${c.direction || 1})\n`;
    sql += `ON CONFLICT ("id") DO NOTHING;\n`;
  }
}

sql += '\nCOMMIT;\n';

fs.writeFileSync('supabase_schema.sql', sql, 'utf8');
console.log('Successfully generated supabase_schema.sql! Total size:', sql.length, 'bytes');
