import { createClient } from '@supabase/supabase-js';
import ExcelJS from 'exceljs';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY in environment.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

const EXCEL_PATH = process.env.EXCEL_PATH || './members.xlsx';

function getHonorific() {
  return 'Bạn';
}

function getGeneration(mssv, memberCode) {
  if (mssv) {
    const m2 = mssv.match(/^[A-Z]{2}(\d{2})\d{4}$/i);
    if (m2) return 'K' + m2[1];
    
    const m1 = mssv.match(/^[A-Z]{2}(\d{1})\d{4}$/i);
    if (m1) return 'K' + m1[1];

    const mg = mssv.match(/^[A-Z]{2}(\d{1,2})/i);
    if (mg) return 'K' + mg[1];
  }
  
  if (memberCode) {
    const m = memberCode.match(/CSG(\d{2})/i);
    if (m) return 'Gen ' + parseInt(m[1], 10);
  }
  return 'CSG';
}

async function main() {
  console.log('Loading Excel workbook from:', EXCEL_PATH);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(EXCEL_PATH);

  const sheet = wb.getWorksheet('DSTV-RAW');
  if (!sheet) {
    throw new Error('Worksheet DSTV-RAW not found!');
  }

  const members = [];
  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const nameVal = row.getCell(3).value;
    if (!nameVal || typeof nameVal !== 'string' || !nameVal.trim()) continue;

    const memberCode = String(row.getCell(17).value || `CSG-ROW-${r}`).trim();
    const rawMssv = row.getCell(4).value || row.getCell(1).value?.result || row.getCell(1).value || '';
    const mssv = String(rawMssv).trim().toUpperCase();
    
    const term = row.getCell(11).value;
    const isAlumni = term !== null && term !== undefined && String(term).trim().length > 0;
    const role = isAlumni ? 'ALUMNI' : 'ACTIVE';
    const cleanName = nameVal.trim();
    const honorific = getHonorific(cleanName, role);
    const gen = getGeneration(mssv, memberCode);
    const campus = row.getCell(12).value ? String(row.getCell(12).value).trim() : 'CSG - HCM CAMPUS';
    const dept = isAlumni ? `Cựu thành viên (${campus})` : `Thành viên (${campus})`;

    members.push({
      id: memberCode,
      mssv,
      fullName: cleanName,
      role,
      honorific,
      generation: gen,
      department: dept
    });
  }

  console.log(`Parsed ${members.length} members from DSTV-RAW.`);
  const alumniCount = members.filter(m => m.role === 'ALUMNI').length;
  const activeCount = members.filter(m => m.role === 'ACTIVE').length;
  console.log(`  - Alumni (Tô đỏ/Terminated): ${alumniCount}`);
  console.log(`  - Active (Không tô đỏ/Hiện tại): ${activeCount}`);

  // 1. Remove old mock records like 'm-001' .. 'm-020'
  console.log('Removing mock members (id like m-%)...');
  const { error: delErr } = await supabase
    .from('members')
    .delete()
    .like('id', 'm-%');
  if (delErr) {
    console.warn('Warning deleting mock members:', delErr.message);
  }

  // 2. Batch upsert members into Supabase
  console.log('Upserting members into Supabase in batches of 100...');
  const batchSize = 100;
  for (let i = 0; i < members.length; i += batchSize) {
    const batch = members.slice(i, i + batchSize);
    const { error: upsertErr } = await supabase
      .from('members')
      .upsert(batch, { onConflict: 'id' });

    if (upsertErr) {
      console.error(`Error in batch ${i} - ${i + batch.length}:`, upsertErr);
      throw upsertErr;
    }
    console.log(`  ✓ Upserted ${Math.min(i + batchSize, members.length)} / ${members.length}`);
  }

  // 3. Verify total in database
  const { count, error: countErr } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true });

  if (countErr) {
    console.error('Count error:', countErr);
  } else {
    console.log(`\n🎉 Success! Total members in Supabase table "members": ${count}`);
  }
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
