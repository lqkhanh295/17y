-- CSG 17Y Anniversary - Supabase Database Schema & Seed Data
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
    "stayOvernight" BOOLEAN DEFAULT FALSE,
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

-- HARDENED ROW LEVEL SECURITY POLICIES
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Public read-only for directory and public assets
DROP POLICY IF EXISTS "Allow public read-only on members" ON public.members;
CREATE POLICY "Allow public read-only on members" ON public.members FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public read-only on memories" ON public.memories;
CREATE POLICY "Allow public read-only on memories" ON public.memories FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public read-only on characters" ON public.characters;
CREATE POLICY "Allow public read-only on characters" ON public.characters FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public read-only on approved wishes" ON public.wishes;
CREATE POLICY "Allow public read-only on approved wishes" ON public.wishes FOR SELECT TO anon, authenticated USING ("moderationStatus" = 'APPROVED' AND "isPublic" = true);

-- 2. Sensitive tables (registrations, audit_logs) are completely DENIED for anon/public direct access.
-- All registration, payment updates, and audit logging must be executed strictly through the Backend server via SUPABASE_SECRET_KEY (service_role).

-- 3. Storage bucket 'receipts' policies for attendee payment receipt uploads
-- Receipts bucket is strictly append-only (INSERT) for attendees; updates/overwrites are forbidden.
DROP POLICY IF EXISTS "Allow public uploads to receipts" ON storage.objects;
CREATE POLICY "Allow public uploads to receipts" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'receipts');

DROP POLICY IF EXISTS "Allow public read from receipts" ON storage.objects;
CREATE POLICY "Allow public read from receipts" ON storage.objects FOR SELECT TO public USING (bucket_id = 'receipts');

-- Prevent any public update or overwrite of submitted receipts
DROP POLICY IF EXISTS "Allow public update in receipts" ON storage.objects;


-- SEED MEMBERS
INSERT INTO public.members ("id", "mssv", "fullName", "role", "honorific", "generation", "department")
VALUES ('m-001', 'SE120101', 'Huỳnh Tấn Phát', 'ALUMNI', 'Anh', 'K12', 'Cựu Chủ nhiệm')
ON CONFLICT ("id") DO UPDATE SET "fullName" = EXCLUDED."fullName", "role" = EXCLUDED."role";
INSERT INTO public.members ("id", "mssv", "fullName", "role", "honorific", "generation", "department")
VALUES ('m-002', 'SE130245', 'Trần Thảo My', 'ALUMNI', 'Chị', 'K13', 'Cựu Phó Chủ nhiệm')
ON CONFLICT ("id") DO UPDATE SET "fullName" = EXCLUDED."fullName", "role" = EXCLUDED."role";
INSERT INTO public.members ("id", "mssv", "fullName", "role", "honorific", "generation", "department")
VALUES ('m-003', 'SE140512', 'Nguyễn Đăng Khoa', 'ALUMNI', 'Anh', 'K14', 'Ban Kỹ Thuật')
ON CONFLICT ("id") DO UPDATE SET "fullName" = EXCLUDED."fullName", "role" = EXCLUDED."role";
INSERT INTO public.members ("id", "mssv", "fullName", "role", "honorific", "generation", "department")
VALUES ('m-004', 'SE140889', 'Lê Hoàng Yến', 'ALUMNI', 'Chị', 'K14', 'Ban Nội Dung')
ON CONFLICT ("id") DO UPDATE SET "fullName" = EXCLUDED."fullName", "role" = EXCLUDED."role";
INSERT INTO public.members ("id", "mssv", "fullName", "role", "honorific", "generation", "department")
VALUES ('m-005', 'SE150334', 'Phạm Minh Quân', 'ALUMNI', 'Anh', 'K15', 'Ban Sự Kiện')
ON CONFLICT ("id") DO UPDATE SET "fullName" = EXCLUDED."fullName", "role" = EXCLUDED."role";
INSERT INTO public.members ("id", "mssv", "fullName", "role", "honorific", "generation", "department")
VALUES ('m-006', 'SE150772', 'Đặng Ngọc Trâm', 'ALUMNI', 'Chị', 'K15', 'Ban Thiết Kế')
ON CONFLICT ("id") DO UPDATE SET "fullName" = EXCLUDED."fullName", "role" = EXCLUDED."role";
INSERT INTO public.members ("id", "mssv", "fullName", "role", "honorific", "generation", "department")
VALUES ('m-007', 'SE160105', 'Vũ Đức Duy', 'ALUMNI', 'Anh', 'K16', 'Cựu Trưởng Ban KT')
ON CONFLICT ("id") DO UPDATE SET "fullName" = EXCLUDED."fullName", "role" = EXCLUDED."role";
INSERT INTO public.members ("id", "mssv", "fullName", "role", "honorific", "generation", "department")
VALUES ('m-008', 'SE160450', 'Bùi Kim Ngân', 'ALUMNI', 'Chị', 'K16', 'Ban Nhân Sự')
ON CONFLICT ("id") DO UPDATE SET "fullName" = EXCLUDED."fullName", "role" = EXCLUDED."role";
INSERT INTO public.members ("id", "mssv", "fullName", "role", "honorific", "generation", "department")
VALUES ('m-009', 'SE160890', 'Đỗ Thành Đạt', 'ALUMNI', 'Anh', 'K16', 'Ban Nhiếp Ảnh')
ON CONFLICT ("id") DO UPDATE SET "fullName" = EXCLUDED."fullName", "role" = EXCLUDED."role";
INSERT INTO public.members ("id", "mssv", "fullName", "role", "honorific", "generation", "department")
VALUES ('m-010', 'SE170112', 'Nguyễn Phúc An', 'ACTIVE', 'Bạn', 'K17', 'Chủ nhiệm đương nhiệm')
ON CONFLICT ("id") DO UPDATE SET "fullName" = EXCLUDED."fullName", "role" = EXCLUDED."role";
INSERT INTO public.members ("id", "mssv", "fullName", "role", "honorific", "generation", "department")
VALUES ('m-011', 'SE170321', 'Trần Gia Hân', 'ACTIVE', 'Bạn', 'K17', 'Phó Chủ nhiệm')
ON CONFLICT ("id") DO UPDATE SET "fullName" = EXCLUDED."fullName", "role" = EXCLUDED."role";
INSERT INTO public.members ("id", "mssv", "fullName", "role", "honorific", "generation", "department")
VALUES ('m-012', 'SE170994', 'Lý Quốc Bảo', 'ACTIVE', 'Bạn', 'K17', 'Trưởng Ban Kỹ Thuật')
ON CONFLICT ("id") DO UPDATE SET "fullName" = EXCLUDED."fullName", "role" = EXCLUDED."role";
INSERT INTO public.members ("id", "mssv", "fullName", "role", "honorific", "generation", "department")
VALUES ('m-013', 'SE180215', 'Võ Minh Thư', 'ACTIVE', 'Bạn', 'K18', 'Trưởng Ban Truyền Thông')
ON CONFLICT ("id") DO UPDATE SET "fullName" = EXCLUDED."fullName", "role" = EXCLUDED."role";
INSERT INTO public.members ("id", "mssv", "fullName", "role", "honorific", "generation", "department")
VALUES ('m-014', 'SE180633', 'Hoàng Nhật Minh', 'ACTIVE', 'Bạn', 'K18', 'Trưởng Ban Sự Kiện')
ON CONFLICT ("id") DO UPDATE SET "fullName" = EXCLUDED."fullName", "role" = EXCLUDED."role";
INSERT INTO public.members ("id", "mssv", "fullName", "role", "honorific", "generation", "department")
VALUES ('m-015', 'SE180902', 'Ngô Khánh Linh', 'ACTIVE', 'Bạn', 'K18', 'Ban Thiết Kế')
ON CONFLICT ("id") DO UPDATE SET "fullName" = EXCLUDED."fullName", "role" = EXCLUDED."role";
INSERT INTO public.members ("id", "mssv", "fullName", "role", "honorific", "generation", "department")
VALUES ('m-016', 'SE190145', 'Trịnh Gia Huy', 'ACTIVE', 'Bạn', 'K19', 'Ban Kỹ Thuật')
ON CONFLICT ("id") DO UPDATE SET "fullName" = EXCLUDED."fullName", "role" = EXCLUDED."role";
INSERT INTO public.members ("id", "mssv", "fullName", "role", "honorific", "generation", "department")
VALUES ('m-017', 'SE190558', 'Phan Bảo Trân', 'ACTIVE', 'Bạn', 'K19', 'Ban Đối Ngoại')
ON CONFLICT ("id") DO UPDATE SET "fullName" = EXCLUDED."fullName", "role" = EXCLUDED."role";
INSERT INTO public.members ("id", "mssv", "fullName", "role", "honorific", "generation", "department")
VALUES ('m-018', 'SE190820', 'Đinh Tuấn Kiệt', 'ACTIVE', 'Bạn', 'K19', 'Ban Nhiếp Ảnh')
ON CONFLICT ("id") DO UPDATE SET "fullName" = EXCLUDED."fullName", "role" = EXCLUDED."role";
INSERT INTO public.members ("id", "mssv", "fullName", "role", "honorific", "generation", "department")
VALUES ('m-019', 'SE200031', 'Cao Phương Uyên', 'ACTIVE', 'Bạn', 'K20', 'Tập sự K20')
ON CONFLICT ("id") DO UPDATE SET "fullName" = EXCLUDED."fullName", "role" = EXCLUDED."role";
INSERT INTO public.members ("id", "mssv", "fullName", "role", "honorific", "generation", "department")
VALUES ('m-020', 'SE200199', 'Lâm Tuấn Khải', 'ACTIVE', 'Bạn', 'K20', 'Tập sự K20')
ON CONFLICT ("id") DO UPDATE SET "fullName" = EXCLUDED."fullName", "role" = EXCLUDED."role";

-- SEED MEMORIES
INSERT INTO public.memories ("id", "season", "year", "title", "caption", "imagePath", "tag", "likes")
VALUES ('mem-1', 'Sinh nhật 16Y', '2025', 'Đêm Hoàng Kim Cóc 16 Tuổi', 'Hơn 120 Cóc Vàng tề tựu trong không gian ấm áp tại Sài Gòn, cùng thổi nến mừng 16 năm trưởng thành.', 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80', '16Y', 184)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO public.memories ("id", "season", "year", "title", "caption", "imagePath", "tag", "likes")
VALUES ('mem-2', 'Sinh nhật 15Y', '2024', 'Dấu Ấn Tròn 15 Năm Bứt Phá', 'Chiếc bánh kem 3 tầng khổng lồ và màn tri ân các thế hệ tiền bối đã đặt nền móng cho CLB.', 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=800&q=80', '15Y', 242)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO public.memories ("id", "season", "year", "title", "caption", "imagePath", "tag", "likes")
VALUES ('mem-3', 'Teambuilding', '2025', 'Sóng Biển Vũng Tàu & Màu Áo Vàng', 'Cháy hết mình với các trò chơi gắn kết bãi biển, nơi những người xa lạ thành anh em một nhà.', 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80', 'TEAMBUILDING', 195)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO public.memories ("id", "season", "year", "title", "caption", "imagePath", "tag", "likes")
VALUES ('mem-4', 'Sinh nhật 14Y', '2023', 'Gala Night 14Y: Ký Ức Rực Rỡ', 'Sân khấu âm nhạc sôi động với các tiết mục ''cây nhà lá vườn'' đậm chất Cóc Sài Gòn.', 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80', '14Y', 167)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO public.memories ("id", "season", "year", "title", "caption", "imagePath", "tag", "likes")
VALUES ('mem-5', 'Hoạt động', '2025', 'Hậu trường Tác nghiệp Sự kiện', 'Những đêm thức trắng dựng clip, chỉnh ảnh để kịp lên bài cho những sự kiện nghìn người.', 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80', 'ACTIVITY', 210)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO public.memories ("id", "season", "year", "title", "caption", "imagePath", "tag", "likes")
VALUES ('mem-6', 'Hoạt động', '2024', 'Chào Đón Tân Binh Khóa Mới', 'Nụ cười rạng rỡ của các bạn Gen mới khi lần đầu tiên khoác lên mình chiếc áo thun vàng thương hiệu.', 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=800&q=80', 'ACTIVITY', 289)
ON CONFLICT ("id") DO NOTHING;

-- SEED WISHES
INSERT INTO public.wishes ("id", "registrationId", "authorName", "role", "content", "isPublic", "moderationStatus", "createdAt")
VALUES ('w-1795283174531', 'CSG26-637159', 'Bạn gay', 'ACTIVE', 'im gay', true, 'APPROVED', '2026-11-21T17:46:14.531Z')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO public.wishes ("id", "registrationId", "authorName", "role", "content", "isPublic", "moderationStatus", "createdAt")
VALUES ('w-1795282792591', 'CSG26-603742', 'Bạn Nguyễn Tiến Cường', 'ACTIVE', 'Chúc mừng 17 năm Cóc Sài Gòn luôn rực rỡ và vững bước!', true, 'APPROVED', '2026-11-21T17:39:52.591Z')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO public.wishes ("id", "registrationId", "authorName", "role", "content", "isPublic", "moderationStatus", "createdAt")
VALUES ('w-001', 'reg-001', 'Anh Huỳnh Tấn Phát', 'ALUMNI', 'Chúc Cóc Sài Gòn mãi là ngôi nhà ấm áp của bao thế hệ! 💛', true, 'APPROVED', '2026-11-14T10:35:00Z')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO public.wishes ("id", "registrationId", "authorName", "role", "content", "isPublic", "moderationStatus", "createdAt")
VALUES ('w-002', 'reg-002', 'Bạn Nguyễn Phúc An', 'ACTIVE', 'Đêm nay Cóc cháy hết mình nha anh em ơi! 🔥', true, 'APPROVED', '2026-11-14T14:25:00Z')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO public.wishes ("id", "registrationId", "authorName", "role", "content", "isPublic", "moderationStatus", "createdAt")
VALUES ('w-003', 'reg-003', 'Chị Trần Thảo My', 'ALUMNI', 'Hẹn gặp lại các em tại đêm tiệc 17Y hoành tráng! ✨', true, 'APPROVED', '2026-11-15T08:15:00Z')
ON CONFLICT ("id") DO NOTHING;

-- SEED CHARACTERS
INSERT INTO public.characters ("id", "registrationId", "name", "honorific", "role", "wish", "x", "y", "direction")
VALUES ('char-1', 'reg-001', 'Huỳnh Tấn Phát', 'Anh', 'ALUMNI', 'Chúc Cóc Sài Gòn mãi là ngôi nhà ấm áp của bao thế hệ! 💛', 20, 78, 1)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO public.characters ("id", "registrationId", "name", "honorific", "role", "wish", "x", "y", "direction")
VALUES ('char-2', 'reg-002', 'Nguyễn Phúc An', 'Bạn', 'ACTIVE', 'Đêm nay Cóc cháy hết mình nha anh em ơi! 🔥', 48, 82, -1)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO public.characters ("id", "registrationId", "name", "honorific", "role", "wish", "x", "y", "direction")
VALUES ('char-3', 'reg-003', 'Trần Thảo My', 'Chị', 'ALUMNI', 'Hẹn gặp lại các em tại đêm tiệc 17Y hoành tráng! ✨', 75, 75, 1)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO public.characters ("id", "registrationId", "name", "honorific", "role", "wish", "x", "y", "direction")
VALUES ('char-1795282792591', 'CSG26-603742', 'Nguyễn Tiến Cường', 'Bạn', 'ACTIVE', 'Chúc mừng 17 năm Cóc Sài Gòn luôn rực rỡ và vững bước!', 54, 82, 1)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO public.characters ("id", "registrationId", "name", "honorific", "role", "wish", "x", "y", "direction")
VALUES ('char-1795283174531', 'CSG26-637159', 'gay', 'Bạn', 'ACTIVE', 'im gay', 71, 73, 1)
ON CONFLICT ("id") DO NOTHING;

COMMIT;
