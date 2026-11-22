import fs from 'fs';
import { supabase } from '../server/supabase.js';

async function migrate() {
  if (!supabase) {
    console.error('Supabase not initialized');
    process.exit(1);
  }

  const db = JSON.parse(fs.readFileSync('server/data/db.json', 'utf8'));

  // 1. Members
  if (db.members && db.members.length) {
    const { error } = await supabase.from('members').upsert(db.members, { onConflict: 'id' });
    console.log('Members migration:', error ? error.message : `OK (${db.members.length})`);
  }

  // 2. Memories
  if (db.memories && db.memories.length) {
    const { error } = await supabase.from('memories').upsert(db.memories, { onConflict: 'id' });
    console.log('Memories migration:', error ? error.message : `OK (${db.memories.length})`);
  }

  // 3. Registrations
  if (db.registrations && db.registrations.length) {
    // Map registrations so json types match
    const cleanRegs = db.registrations.map(r => ({
      id: r.id,
      memberId: r.memberId,
      fullName: r.fullName,
      mssv: r.mssv,
      role: r.role,
      honorific: r.honorific,
      gmail: r.gmail,
      personalPhone: r.personalPhone,
      emergencyPhone: r.emergencyPhone,
      allergies: r.allergies || [],
      allergyNote: r.allergyNote || '',
      wishes: r.wishes || '',
      package: r.package || r.role,
      totalRequired: r.totalRequired || 0,
      paidAmount: r.paidAmount || 0,
      remainingAmount: r.remainingAmount || 0,
      plan: r.plan,
      paymentPlan: r.paymentPlan,
      status: r.status,
      paymentStatus: r.paymentStatus,
      isApproved100: !!r.isApproved100,
      isPublicConsent: r.isPublicConsent !== false,
      receiptPhase1Url: r.receiptPhase1Url,
      receiptPhase2Url: r.receiptPhase2Url || null,
      ticketCode: r.ticketCode,
      ticketToken: r.ticketToken,
      paymentHistory: r.paymentHistory || [],
      verifiedBy: r.verifiedBy || null,
      verifiedAt: r.verifiedAt || null,
      approvedBy: r.approvedBy || null,
      approvedAt: r.approvedAt || null,
      rejectReason: r.rejectReason || null,
      isEmailSent: !!r.isEmailSent,
      isCheckedIn: !!r.isCheckedIn,
      checkedInAt: r.checkedInAt || null,
      checkedInBy: r.checkedInBy || null,
      createdAt: r.createdAt || new Date().toISOString()
    }));

    const { error } = await supabase.from('registrations').upsert(cleanRegs, { onConflict: 'id' });
    console.log('Registrations migration:', error ? error.message : `OK (${cleanRegs.length})`);
  }

  // 4. Wishes
  if (db.wishes && db.wishes.length) {
    const cleanWishes = db.wishes.map(w => ({
      id: w.id,
      registrationId: w.registrationId || null,
      authorName: w.authorName,
      role: w.role || 'ACTIVE',
      content: w.content,
      isPublic: w.isPublic !== false,
      moderationStatus: w.moderationStatus || 'APPROVED',
      createdAt: w.createdAt || new Date().toISOString()
    }));
    const { error } = await supabase.from('wishes').upsert(cleanWishes, { onConflict: 'id' });
    console.log('Wishes migration:', error ? error.message : `OK (${cleanWishes.length})`);
  }

  // 5. Characters
  if (db.characters && db.characters.length) {
    const cleanChars = db.characters.map(c => ({
      id: c.id,
      registrationId: c.registrationId || null,
      name: c.name,
      honorific: c.honorific || 'Bạn',
      role: c.role || 'ACTIVE',
      wish: c.wish || '',
      x: c.x || 50,
      y: c.y || 75,
      scale: c.scale || 1,
      direction: c.direction || 1
    }));
    const { error } = await supabase.from('characters').upsert(cleanChars, { onConflict: 'id' });
    console.log('Characters migration:', error ? error.message : `OK (${cleanChars.length})`);
  }

  // 6. Audit logs
  if (db.auditLogs && db.auditLogs.length) {
    const cleanLogs = db.auditLogs.map(l => ({
      id: l.id,
      action: l.action,
      targetId: l.targetId || null,
      adminUser: l.adminUser || 'BTC_Admin',
      details: l.details || '',
      timestamp: l.timestamp || new Date().toISOString()
    }));
    const { error } = await supabase.from('audit_logs').upsert(cleanLogs, { onConflict: 'id' });
    console.log('Audit logs migration:', error ? error.message : `OK (${cleanLogs.length})`);
  }

  console.log('All migrations completed!');
}

migrate();
