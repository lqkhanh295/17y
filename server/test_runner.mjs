import http from 'http';
import app from './api.js';
import { supabase } from './supabase.js';

// Minimal 1x1 pixel JPEG in base64
const VALID_JPEG_BASE64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

async function runTests() {
  console.log('=====================================================');
  console.log('   CSG 17Y - REGISTRATION EDGE CASES TEST RUNNER    ');
  console.log('=====================================================\n');

  // Start temporary server on random port
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Test server running at ${baseUrl}\n`);

  const createdRegIds = [];
  const createdCharIds = [];
  const createdWishIds = [];

  let passed = 0;
  let failed = 0;

  async function testCase(name, fn) {
    try {
      await fn();
      console.log(`  ✓ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ [FAIL] ${name}`);
      console.error(`     Error: ${err.message}`);
      failed++;
    }
  }

  function assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }

  async function postReg(payload) {
    const res = await fetch(`${baseUrl}/api/registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json().catch(() => ({}));
    if (json.data?.id) {
      createdRegIds.push(json.data.id);
    }
    return { status: res.status, body: json };
  }

  // --- SUITE 1: Phone Formatting & Validation Edge Cases ---
  console.log('\n--- SUITE 1: Phone Formatting & Validation Edge Cases ---');

  await testCase('Phone with spaces: "090 123 4561" -> normalized to "0901234561"', async () => {
    const res = await postReg({
      fullName: 'Test Spaces Phone',
      mssv: 'EDGE01',
      role: 'ACTIVE',
      gmail: 'edge01@csg.com',
      personalPhone: '090 123 4561',
      emergencyPhone: '091 234 5678',
      stayOvernight: true,
      receiptImage: VALID_JPEG_BASE64
    });
    assert(res.status === 200, `Expected 200, got ${res.status}: ${res.body.message}`);
    assert(res.body.data.personalPhone === '0901234561', `Stored phone mismatch: ${res.body.data.personalPhone}`);
    assert(res.body.data.emergencyPhone === '0912345678', `Stored emergency phone mismatch: ${res.body.data.emergencyPhone}`);
  });

  await testCase('Phone with dots: "0901.234.562" -> normalized to "0901234562"', async () => {
    const res = await postReg({
      fullName: 'Test Dots Phone',
      mssv: 'EDGE02',
      role: 'ACTIVE',
      gmail: 'edge02@csg.com',
      personalPhone: '0901.234.562',
      emergencyPhone: '0911.222.333',
      stayOvernight: false,
      receiptImage: VALID_JPEG_BASE64
    });
    assert(res.status === 200, `Expected 200, got ${res.status}: ${res.body.message}`);
    assert(res.body.data.personalPhone === '0901234562', `Expected 0901234562, got ${res.body.data.personalPhone}`);
  });

  await testCase('Phone with dashes: "090-123-4563" -> normalized to "0901234563"', async () => {
    const res = await postReg({
      fullName: 'Test Dash Phone',
      mssv: 'EDGE03',
      role: 'ACTIVE',
      gmail: 'edge03@csg.com',
      personalPhone: '090-123-4563',
      emergencyPhone: '091-222-3333',
      stayOvernight: true,
      receiptImage: VALID_JPEG_BASE64
    });
    assert(res.status === 200, `Expected 200, got ${res.status}: ${res.body.message}`);
    assert(res.body.data.personalPhone === '0901234563', `Expected 0901234563, got ${res.body.data.personalPhone}`);
  });

  await testCase('Phone with parentheses: "(090) 123-4564" -> normalized to "0901234564"', async () => {
    const res = await postReg({
      fullName: 'Test Parentheses Phone',
      mssv: 'EDGE04',
      role: 'ACTIVE',
      gmail: 'edge04@csg.com',
      personalPhone: '(090) 123-4564',
      emergencyPhone: '(091) 999-8888',
      stayOvernight: false,
      receiptImage: VALID_JPEG_BASE64
    });
    assert(res.status === 200, `Expected 200, got ${res.status}: ${res.body.message}`);
    assert(res.body.data.personalPhone === '0901234564', `Expected 0901234564, got ${res.body.data.personalPhone}`);
  });

  await testCase('Phone with +84 country code: "+84 901 234 565" -> normalized to "0901234565"', async () => {
    const res = await postReg({
      fullName: 'Test Plus84 Phone',
      mssv: 'EDGE05',
      role: 'ACTIVE',
      gmail: 'edge05@csg.com',
      personalPhone: '+84 901 234 565',
      emergencyPhone: '+84 912 345 678',
      stayOvernight: true,
      receiptImage: VALID_JPEG_BASE64
    });
    assert(res.status === 200, `Expected 200, got ${res.status}: ${res.body.message}`);
    assert(res.body.data.personalPhone === '0901234565', `Expected 0901234565, got ${res.body.data.personalPhone}`);
    assert(res.body.data.emergencyPhone === '0912345678', `Expected 0912345678, got ${res.body.data.emergencyPhone}`);
  });

  await testCase('Phone with 84 prefix without plus: "84901234566" -> normalized to "0901234566"', async () => {
    const res = await postReg({
      fullName: 'Test 84 Phone',
      mssv: 'EDGE06',
      role: 'ACTIVE',
      gmail: 'edge06@csg.com',
      personalPhone: '84901234566',
      emergencyPhone: '84912345678',
      stayOvernight: true,
      receiptImage: VALID_JPEG_BASE64
    });
    assert(res.status === 200, `Expected 200, got ${res.status}: ${res.body.message}`);
    assert(res.body.data.personalPhone === '0901234566', `Expected 0901234566, got ${res.body.data.personalPhone}`);
  });

  await testCase('Invalid phone "12345" (too short) -> Rejected 400', async () => {
    const res = await postReg({
      fullName: 'Test Too Short Phone',
      mssv: 'EDGE07',
      role: 'ACTIVE',
      gmail: 'edge07@csg.com',
      personalPhone: '12345',
      emergencyPhone: '0912345678',
      stayOvernight: true,
      receiptImage: VALID_JPEG_BASE64
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    assert(res.body.message.includes('Số điện thoại'), `Unexpected message: ${res.body.message}`);
  });

  await testCase('Invalid phone "090abcdefg" (alphabet chars) -> Rejected 400', async () => {
    const res = await postReg({
      fullName: 'Test Alpha Phone',
      mssv: 'EDGE08',
      role: 'ACTIVE',
      gmail: 'edge08@csg.com',
      personalPhone: '090abcdefg',
      emergencyPhone: '0912345678',
      stayOvernight: true,
      receiptImage: VALID_JPEG_BASE64
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  await testCase('Invalid emergency phone "999" -> Rejected 400', async () => {
    const res = await postReg({
      fullName: 'Test Invalid Emer Phone',
      mssv: 'EDGE09',
      role: 'ACTIVE',
      gmail: 'edge09@csg.com',
      personalPhone: '0901234567',
      emergencyPhone: '999',
      stayOvernight: true,
      receiptImage: VALID_JPEG_BASE64
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    assert(res.body.message.includes('người thân'), `Unexpected message: ${res.body.message}`);
  });

  // --- SUITE 2: MSSV & Role Edge Cases ---
  console.log('\n--- SUITE 2: MSSV & Role Edge Cases ---');

  await testCase('MSSV with lowercase "se160123" -> normalized to "SE160123"', async () => {
    const res = await postReg({
      fullName: 'Test Lowercase MSSV',
      mssv: 'se160123',
      role: 'ACTIVE',
      gmail: 'edge10@csg.com',
      personalPhone: '0902223331',
      emergencyPhone: '0912345678',
      stayOvernight: false,
      receiptImage: VALID_JPEG_BASE64
    });
    assert(res.status === 200, `Expected 200, got ${res.status}: ${res.body.message}`);
    assert(res.body.data.mssv === 'SE160123', `Expected SE160123, got ${res.body.data.mssv}`);
  });

  await testCase('MSSV with internal and boundary spaces "  SE 160123  " -> normalized to "SE160123"', async () => {
    const res = await postReg({
      fullName: 'Test Spaced MSSV',
      mssv: '  SE 160124  ',
      role: 'ACTIVE',
      gmail: 'edge11@csg.com',
      personalPhone: '0902223332',
      emergencyPhone: '0912345678',
      stayOvernight: false,
      receiptImage: VALID_JPEG_BASE64
    });
    assert(res.status === 200, `Expected 200, got ${res.status}: ${res.body.message}`);
    assert(res.body.data.mssv === 'SE160124', `Expected SE160124, got ${res.body.data.mssv}`);
  });

  await testCase('Alumni code with spaces "K14 FPT" -> normalized to "K14FPT"', async () => {
    const res = await postReg({
      fullName: 'Alumni K14 Member',
      mssv: 'K14 FPT',
      role: 'ALUMNI',
      gmail: 'edge12@csg.com',
      personalPhone: '0902223333',
      emergencyPhone: '0912345678',
      stayOvernight: true,
      receiptImage: VALID_JPEG_BASE64
    });
    assert(res.status === 200, `Expected 200, got ${res.status}: ${res.body.message}`);
    assert(res.body.data.mssv === 'K14FPT', `Expected K14FPT, got ${res.body.data.mssv}`);
    assert(res.body.data.totalRequired === 389000, `Expected 389000 for Alumni, got ${res.body.data.totalRequired}`);
  });

  await testCase('Short generation code "K14" (3 chars) -> Accepted', async () => {
    const res = await postReg({
      fullName: 'Alumni Short Gen',
      mssv: 'K14',
      role: 'ALUMNI',
      gmail: 'edge13@csg.com',
      personalPhone: '0902223334',
      emergencyPhone: '0912345678',
      stayOvernight: true,
      receiptImage: VALID_JPEG_BASE64
    });
    assert(res.status === 200, `Expected 200, got ${res.status}: ${res.body.message}`);
    assert(res.body.data.mssv === 'K14', `Expected K14, got ${res.body.data.mssv}`);
  });

  await testCase('System generated attendee "CSG-887766" -> Accepted', async () => {
    const res = await postReg({
      fullName: 'Custom Attendee',
      mssv: 'CSG-887766',
      role: 'ACTIVE',
      gmail: 'edge14@csg.com',
      personalPhone: '0902223335',
      emergencyPhone: '0912345678',
      stayOvernight: false,
      receiptImage: VALID_JPEG_BASE64
    });
    assert(res.status === 200, `Expected 200, got ${res.status}: ${res.body.message}`);
    assert(res.body.data.mssv === 'CSG-887766', `Expected CSG-887766, got ${res.body.data.mssv}`);
  });

  await testCase('Invalid MSSV "!@#$%^" (special characters) -> Rejected 400', async () => {
    const res = await postReg({
      fullName: 'Bad MSSV User',
      mssv: '!@#$%^',
      role: 'ACTIVE',
      gmail: 'edge15@csg.com',
      personalPhone: '0902223336',
      emergencyPhone: '0912345678',
      stayOvernight: false,
      receiptImage: VALID_JPEG_BASE64
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  await testCase('Role ACTIVE with DEPOSIT_150 plan -> 349k total, 150k paid, 199k remaining', async () => {
    const res = await postReg({
      fullName: 'Deposit 150 Active',
      mssv: 'EDGE16',
      role: 'ACTIVE',
      plan: 'DEPOSIT_150',
      gmail: 'edge16@csg.com',
      personalPhone: '0902223337',
      emergencyPhone: '0912345678',
      stayOvernight: true,
      receiptImage: VALID_JPEG_BASE64
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.data.totalRequired === 349000, `Expected 349000, got ${res.body.data.totalRequired}`);
    assert(res.body.data.paidAmount === 150000, `Expected 150000, got ${res.body.data.paidAmount}`);
    assert(res.body.data.remainingAmount === 199000, `Expected 199000, got ${res.body.data.remainingAmount}`);
    assert(res.body.data.paymentStatus === 'PARTIAL', `Expected PARTIAL, got ${res.body.data.paymentStatus}`);
  });

  await testCase('Role GUEST with FULL plan -> 389k total, 389k paid, 0 remaining', async () => {
    const res = await postReg({
      fullName: 'Guest VIP Attendee',
      mssv: 'GUEST-99',
      role: 'GUEST',
      plan: 'FULL',
      gmail: 'edge17@csg.com',
      personalPhone: '0902223338',
      emergencyPhone: '0912345678',
      stayOvernight: false,
      receiptImage: VALID_JPEG_BASE64
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.data.totalRequired === 389000, `Expected 389000, got ${res.body.data.totalRequired}`);
    assert(res.body.data.paidAmount === 389000, `Expected 389000, got ${res.body.data.paidAmount}`);
    assert(res.body.data.remainingAmount === 0, `Expected 0, got ${res.body.data.remainingAmount}`);
  });

  // --- SUITE 3: Email / Gmail Edge Cases ---
  console.log('\n--- SUITE 3: Email / Gmail Edge Cases ---');

  await testCase('Uppercase email "USER_TEST@GMAIL.COM" -> normalized to lowercase', async () => {
    const res = await postReg({
      fullName: 'Upper Email User',
      mssv: 'EDGE18',
      role: 'ACTIVE',
      gmail: 'USER_TEST@GMAIL.COM',
      personalPhone: '0903334441',
      emergencyPhone: '0912345678',
      stayOvernight: true,
      receiptImage: VALID_JPEG_BASE64
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.data.gmail === 'user_test@gmail.com', `Expected lowercase email, got ${res.body.data.gmail}`);
  });

  await testCase('Email with plus tag "user+csg17y@gmail.com" -> Accepted and preserved', async () => {
    const res = await postReg({
      fullName: 'Plus Tag Email User',
      mssv: 'EDGE19',
      role: 'ACTIVE',
      gmail: 'user+csg17y@gmail.com',
      personalPhone: '0903334442',
      emergencyPhone: '0912345678',
      stayOvernight: true,
      receiptImage: VALID_JPEG_BASE64
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.data.gmail === 'user+csg17y@gmail.com', `Expected tag email preserved, got ${res.body.data.gmail}`);
  });

  await testCase('FPT university domain "ducnmse160000@fpt.edu.vn" -> Accepted', async () => {
    const res = await postReg({
      fullName: 'FPT Edu Email User',
      mssv: 'EDGE20',
      role: 'ACTIVE',
      gmail: 'ducnmse160000@fpt.edu.vn',
      personalPhone: '0903334443',
      emergencyPhone: '0912345678',
      stayOvernight: false,
      receiptImage: VALID_JPEG_BASE64
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await testCase('Invalid email "notanemail" -> Rejected 400', async () => {
    const res = await postReg({
      fullName: 'Invalid Email User',
      mssv: 'EDGE21',
      role: 'ACTIVE',
      gmail: 'notanemail',
      personalPhone: '0903334444',
      emergencyPhone: '0912345678',
      stayOvernight: false,
      receiptImage: VALID_JPEG_BASE64
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  // --- SUITE 4: stayOvernight Options ---
  console.log('\n--- SUITE 4: stayOvernight Options ---');

  await testCase('stayOvernight: true -> stored as boolean true in DB', async () => {
    const res = await postReg({
      fullName: 'Stay True User',
      mssv: 'EDGE22',
      role: 'ACTIVE',
      gmail: 'edge22@csg.com',
      personalPhone: '0904445551',
      emergencyPhone: '0912345678',
      stayOvernight: true,
      receiptImage: VALID_JPEG_BASE64
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.data.stayOvernight === true, `Expected true, got ${res.body.data.stayOvernight}`);

    // Verify directly in Supabase
    const { data: dbRow } = await supabase.from('registrations').select('stayOvernight').eq('id', res.body.data.id).single();
    assert(dbRow && dbRow.stayOvernight === true, `Supabase row stayOvernight is not true: ${dbRow?.stayOvernight}`);
  });

  await testCase('stayOvernight: false -> stored as boolean false in DB', async () => {
    const res = await postReg({
      fullName: 'Stay False User',
      mssv: 'EDGE23',
      role: 'ACTIVE',
      gmail: 'edge23@csg.com',
      personalPhone: '0904445552',
      emergencyPhone: '0912345678',
      stayOvernight: false,
      receiptImage: VALID_JPEG_BASE64
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.data.stayOvernight === false, `Expected false, got ${res.body.data.stayOvernight}`);

    const { data: dbRow } = await supabase.from('registrations').select('stayOvernight').eq('id', res.body.data.id).single();
    assert(dbRow && dbRow.stayOvernight === false, `Supabase row stayOvernight is not false: ${dbRow?.stayOvernight}`);
  });

  await testCase('stayOvernight: "true" (string) -> coerced to boolean true', async () => {
    const res = await postReg({
      fullName: 'Stay String True User',
      mssv: 'EDGE24',
      role: 'ACTIVE',
      gmail: 'edge24@csg.com',
      personalPhone: '0904445553',
      emergencyPhone: '0912345678',
      stayOvernight: 'true',
      receiptImage: VALID_JPEG_BASE64
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.data.stayOvernight === true, `Expected true, got ${res.body.data.stayOvernight}`);
  });

  // --- SUITE 5: Wishes, Unicode & Stage Characters ---
  console.log('\n--- SUITE 5: Wishes, Unicode & Stage Characters ---');

  await testCase('Vietnamese accented text + Emojis in wish -> Saved intact', async () => {
    const wishText = 'Chúc Cóc Sài Gòn sinh nhật 17 năm rực rỡ, bùng cháy & mãi đỉnh! 🐸🎉🎂';
    const expectedWish = 'Chúc Cóc Sài Gòn sinh nhật 17 năm rực rỡ, bùng cháy &amp; mãi đỉnh! 🐸🎉🎂';
    const res = await postReg({
      fullName: 'Nguyễn Phương Thảo',
      mssv: 'EDGE25',
      role: 'ACTIVE',
      gmail: 'edge25@csg.com',
      personalPhone: '0905556661',
      emergencyPhone: '0912345678',
      stayOvernight: true,
      wishes: wishText,
      receiptImage: VALID_JPEG_BASE64
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.data.wishes === expectedWish, `Wish mismatch: ${res.body.data.wishes}`);

    // Verify in Supabase registrations table
    const { data: dbReg } = await supabase.from('registrations').select('wishes').eq('id', res.body.data.id).single();
    assert(dbReg && dbReg.wishes === expectedWish, `Supabase registrations.wishes mismatch`);

    // Verify character and wish created in characters & wishes table
    const { data: dbChar } = await supabase.from('characters').select('*').eq('registrationId', res.body.data.id);
    assert(dbChar && dbChar.length > 0, 'No character created for registrant on stage');
    if (dbChar[0]?.id) createdCharIds.push(dbChar[0].id);

    const { data: dbWish } = await supabase.from('wishes').select('*').eq('registrationId', res.body.data.id);
    assert(dbWish && dbWish.length > 0, 'No wish record created in wishes table');
    if (dbWish[0]?.id) createdWishIds.push(dbWish[0].id);
  });

  await testCase('HTML injection in wish "<script>alert(1)</script>" -> Escaped cleanly', async () => {
    const rawWish = '<script>alert("hack")</script><b>Bold Wish</b>';
    const res = await postReg({
      fullName: 'XSS Test User',
      mssv: 'EDGE26',
      role: 'ACTIVE',
      gmail: 'edge26@csg.com',
      personalPhone: '0905556662',
      emergencyPhone: '0912345678',
      stayOvernight: false,
      wishes: rawWish,
      receiptImage: VALID_JPEG_BASE64
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(!res.body.data.wishes.includes('<script>'), 'Unescaped <script> found in stored wish');
    assert(res.body.data.wishes.includes('&lt;script&gt;'), 'Expected escaped HTML entities');
  });

  await testCase('Empty wish "" -> Registrant still gets mascot frog on stage with joyful default wish', async () => {
    const res = await postReg({
      fullName: 'No Wish User',
      mssv: 'EDGE27',
      role: 'ACTIVE',
      gmail: 'edge27@csg.com',
      personalPhone: '0905556663',
      emergencyPhone: '0912345678',
      stayOvernight: true,
      wishes: '',
      receiptImage: VALID_JPEG_BASE64
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const { data: dbChar } = await supabase.from('characters').select('*').eq('registrationId', res.body.data.id);
    assert(dbChar && dbChar.length > 0, 'No mascot frog created for attendee without custom wish');
    assert(dbChar[0].wish.length > 0, 'Mascot frog wish should have joyful default text');
    if (dbChar[0]?.id) createdCharIds.push(dbChar[0].id);
  });

  // --- SUITE 6: Duplicate Detection ---
  console.log('\n--- SUITE 6: Duplicate Detection ---');

  await testCase('Duplicate MSSV -> Rejected with 409 Conflict', async () => {
    const res = await postReg({
      fullName: 'Duplicate MSSV User',
      mssv: 'EDGE01', // already registered in first test case
      role: 'ACTIVE',
      gmail: 'diff_email@csg.com',
      personalPhone: '0907778881',
      emergencyPhone: '0912345678',
      stayOvernight: true,
      receiptImage: VALID_JPEG_BASE64
    });
    assert(res.status === 409, `Expected 409 Conflict, got ${res.status}`);
    assert(res.body.alreadyRegistered === true, 'Expected alreadyRegistered: true');
  });

  await testCase('Duplicate Gmail -> Rejected with 409 Conflict', async () => {
    const res = await postReg({
      fullName: 'Duplicate Gmail User',
      mssv: 'EDGE99',
      role: 'ACTIVE',
      gmail: 'edge01@csg.com', // already registered in first test case
      personalPhone: '0907778882',
      emergencyPhone: '0912345678',
      stayOvernight: true,
      receiptImage: VALID_JPEG_BASE64
    });
    assert(res.status === 409, `Expected 409 Conflict, got ${res.status}`);
    assert(res.body.alreadyRegistered === true, 'Expected alreadyRegistered: true');
  });

  await testCase('Duplicate Phone formatted "090 123 4561" vs stored "0901234561" -> Rejected with 409 Conflict', async () => {
    const res = await postReg({
      fullName: 'Duplicate Phone User',
      mssv: 'EDGE98',
      role: 'ACTIVE',
      gmail: 'diff_email2@csg.com',
      personalPhone: '090 123 4561', // same digits as edge01
      emergencyPhone: '0912345678',
      stayOvernight: true,
      receiptImage: VALID_JPEG_BASE64
    });
    assert(res.status === 409, `Expected 409 Conflict, got ${res.status}`);
    assert(res.body.alreadyRegistered === true, 'Expected alreadyRegistered: true');
  });

  // --- SUITE 7: Lookup Endpoint Edge Cases ---
  console.log('\n--- SUITE 7: Lookup Endpoint Edge Cases ---');

  await testCase('Lookup by MSSV (case-insensitive) -> Returns registration record', async () => {
    const res = await fetch(`${baseUrl}/api/registrations/lookup?query=edge01`);
    const json = await res.json();
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(json.found === true, 'Expected found: true');
    assert(json.data.mssv === 'EDGE01', `Expected EDGE01, got ${json.data.mssv}`);
  });

  await testCase('Lookup by Phone with spaces "090 123 4561" -> Returns matching registration record', async () => {
    const res = await fetch(`${baseUrl}/api/registrations/lookup?query=${encodeURIComponent('090 123 4561')}`);
    const json = await res.json();
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(json.found === true, `Expected found: true for spaced phone, got ${json.found}`);
    assert(json.data.personalPhone === '0901234561', `Expected 0901234561, got ${json.data?.personalPhone}`);
  });

  await testCase('Security check: Emergency phone is masked in lookup result', async () => {
    const res = await fetch(`${baseUrl}/api/registrations/lookup?query=EDGE01`);
    const json = await res.json();
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(json.data.emergencyPhone.includes('****'), `Emergency phone must be masked, got ${json.data.emergencyPhone}`);
  });

  await testCase('Lookup non-existent query "UNKNOWN_999" -> Returns found: false without 500', async () => {
    const res = await fetch(`${baseUrl}/api/registrations/lookup?query=UNKNOWN_999`);
    const json = await res.json();
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(json.found === false, 'Expected found: false');
    assert(json.data === null, 'Expected data: null');
  });

  // --- SUITE 8: Missing Fields & Corrupt Image Validation ---
  console.log('\n--- SUITE 8: Missing Fields & Corrupt Image Validation ---');

  await testCase('Missing required field "receiptImage" -> Rejected 400', async () => {
    const res = await postReg({
      fullName: 'No Receipt User',
      mssv: 'EDGE30',
      role: 'ACTIVE',
      gmail: 'edge30@csg.com',
      personalPhone: '0908889991',
      emergencyPhone: '0912345678',
      stayOvernight: true
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    assert(res.body.message.includes('biên lai'), `Unexpected message: ${res.body.message}`);
  });

  await testCase('Missing required field "fullName" -> Rejected 400', async () => {
    const res = await postReg({
      mssv: 'EDGE31',
      role: 'ACTIVE',
      gmail: 'edge31@csg.com',
      personalPhone: '0908889992',
      emergencyPhone: '0912345678',
      stayOvernight: true,
      receiptImage: VALID_JPEG_BASE64
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  await testCase('Corrupt/fake receipt image (magic bytes mismatch) -> Handled safely', async () => {
    const FAKE_BASE64_IMAGE = 'data:image/jpeg;base64,bm90YW5pbWFnZWNvbnRlbnRhdGFsbA==';
    const res = await postReg({
      fullName: 'Fake Image User',
      mssv: 'EDGE32',
      role: 'ACTIVE',
      gmail: 'edge32@csg.com',
      personalPhone: '0908889993',
      emergencyPhone: '0912345678',
      stayOvernight: false,
      receiptImage: FAKE_BASE64_IMAGE
    });
    assert(res.status === 500 || res.status === 400, `Expected rejection, got ${res.status}`);
    assert(res.body.message.includes('hình ảnh'), `Expected image error message, got ${res.body.message}`);
  });

  // --- SUITE 9: Re-registration after REJECTED Status ---
  console.log('\n--- SUITE 9: Re-registration after REJECTED Status ---');

  await testCase('Re-registration with same MSSV when previous record was REJECTED -> Allowed 200 OK', async () => {
    // 1. Register first record
    const res1 = await postReg({
      fullName: 'Rejected Member',
      mssv: 'REJECT01',
      role: 'ACTIVE',
      gmail: 'reject01@csg.com',
      personalPhone: '0908889994',
      emergencyPhone: '0912345678',
      stayOvernight: false,
      receiptImage: VALID_JPEG_BASE64
    });
    assert(res1.status === 200, `Expected 200, got ${res1.status}`);

    // 2. Admin sets status to REJECTED in Supabase
    const { error: updErr } = await supabase
      .from('registrations')
      .update({ status: 'REJECTED' })
      .eq('id', res1.body.data.id);
    assert(!updErr, `Failed to set REJECTED: ${updErr?.message}`);

    // 3. User re-registers with same MSSV and Gmail
    const res2 = await postReg({
      fullName: 'Rejected Member Re-register',
      mssv: 'REJECT01',
      role: 'ACTIVE',
      gmail: 'reject01@csg.com',
      personalPhone: '0908889995',
      emergencyPhone: '0912345678',
      stayOvernight: true,
      receiptImage: VALID_JPEG_BASE64
    });
    assert(res2.status === 200, `Expected 200 for re-registration after rejection, got ${res2.status}: ${res2.body.message}`);
  });

  // --- CLEANUP ---
  console.log('\n--- CLEANING UP TEST DATA FROM SUPABASE ---');
  if (createdRegIds.length > 0) {
    console.log(`Deleting ${createdRegIds.length} test registrations from Supabase...`);
    const { error: delRegErr } = await supabase.from('registrations').delete().in('id', createdRegIds);
    if (delRegErr) console.warn('Clean registrations error:', delRegErr);
    else console.log('✓ Cleaned registrations');
  }
  if (createdCharIds.length > 0) {
    const { error: delCharErr } = await supabase.from('characters').delete().in('id', createdCharIds);
    if (delCharErr) console.warn('Clean characters error:', delCharErr);
    else console.log('✓ Cleaned characters');
  }
  if (createdWishIds.length > 0) {
    const { error: delWishErr } = await supabase.from('wishes').delete().in('id', createdWishIds);
    if (delWishErr) console.warn('Clean wishes error:', delWishErr);
    else console.log('✓ Cleaned wishes');
  }

  // Also remove created test registrations from local db.json
  try {
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const dbPath = path.resolve(__dirname, 'data', 'db.json');
    if (fs.existsSync(dbPath)) {
      const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      const idSet = new Set(createdRegIds);
      db.registrations = (db.registrations || []).filter(r => !idSet.has(r.id));
      db.characters = (db.characters || []).filter(c => !idSet.has(c.registrationId));
      db.wishes = (db.wishes || []).filter(w => !idSet.has(w.registrationId));
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
      console.log('✓ Cleaned local db.json test records');
    }
  } catch (err) {
    console.warn('Local cleanup warning:', err);
  }

  server.close();

  console.log('\n=====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('=====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
