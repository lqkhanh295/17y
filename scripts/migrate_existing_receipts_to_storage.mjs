import { supabase } from '../server/supabase.js';

async function migrateReceipts() {
  if (!supabase) {
    console.error('Supabase not initialized');
    process.exit(1);
  }

  console.log('Fetching registrations from Supabase...');
  const { data: registrations, error } = await supabase.from('registrations').select('*');
  if (error || !registrations) {
    console.error('Error fetching registrations:', error);
    process.exit(1);
  }

  let migratedCount = 0;

  for (const reg of registrations) {
    let updated = false;
    const updates = {};

    // Check Phase 1
    if (reg.receiptPhase1Url && reg.receiptPhase1Url.startsWith('data:image/')) {
      const matches = reg.receiptPhase1Url.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches) {
        const contentType = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        const ext = contentType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
        const fileName = `receipt_phase1_${reg.id}_${Date.now()}.${ext}`;

        const { data: upData, error: upError } = await supabase.storage.from('receipts').upload(fileName, buffer, {
          contentType,
          upsert: true
        });

        if (!upError && upData) {
          const { data: pubData } = supabase.storage.from('receipts').getPublicUrl(fileName);
          updates.receiptPhase1Url = pubData.publicUrl;
          updated = true;
          console.log(`Migrated receiptPhase1 for ${reg.id} (${reg.fullName}): ${pubData.publicUrl}`);
        } else {
          console.error(`Failed to upload receiptPhase1 for ${reg.id}:`, upError);
        }
      }
    }

    // Check Phase 2
    if (reg.receiptPhase2Url && reg.receiptPhase2Url.startsWith('data:image/')) {
      const matches = reg.receiptPhase2Url.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches) {
        const contentType = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        const ext = contentType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
        const fileName = `receipt_phase2_${reg.id}_${Date.now()}.${ext}`;

        const { data: upData, error: upError } = await supabase.storage.from('receipts').upload(fileName, buffer, {
          contentType,
          upsert: true
        });

        if (!upError && upData) {
          const { data: pubData } = supabase.storage.from('receipts').getPublicUrl(fileName);
          updates.receiptPhase2Url = pubData.publicUrl;
          updated = true;
          console.log(`Migrated receiptPhase2 for ${reg.id} (${reg.fullName}): ${pubData.publicUrl}`);
        } else {
          console.error(`Failed to upload receiptPhase2 for ${reg.id}:`, upError);
        }
      }
    }

    if (updated) {
      const { error: updateError } = await supabase.from('registrations').update(updates).eq('id', reg.id);
      if (!updateError) {
        migratedCount++;
      } else {
        console.error(`Failed to update DB for ${reg.id}:`, updateError);
      }
    }
  }

  console.log(`Finished migrating receipts to Supabase Storage! Total updated: ${migratedCount}`);
}

migrateReceipts();
