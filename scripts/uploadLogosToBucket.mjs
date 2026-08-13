import { createClient } from '@insforge/sdk';
import fs from 'fs';
import path from 'path';

const insforge = createClient({
  baseUrl: 'https://sxwv82iw.us-east.insforge.app',
  anonKey: 'ik_12002a3fd3274a14e562bcce4a015fee'
});

const banksDir = path.resolve('public/banks');
const files = fs.readdirSync(banksDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));

console.log(`Found ${files.length} bank logo files to upload...`);

const uploadedUrls = {};

async function run() {
  for (const file of files) {
    const filePath = path.join(banksDir, file);
    const buffer = fs.readFileSync(filePath);
    const blob = new Blob([buffer], { type: 'image/jpeg' });
    
    const key = `logos/${file}`;
    console.log(`Uploading ${file} to bank-logos bucket...`);
    const { data, error } = await insforge.storage.from('bank-logos').upload(key, blob);
    
    if (error) {
      console.error(`Error uploading ${file}:`, error);
    } else {
      const publicUrl = `https://sxwv82iw.us-east.insforge.app/storage/v1/object/public/bank-logos/${key}`;
      uploadedUrls[file] = publicUrl;
      console.log(`Uploaded ${file} -> ${publicUrl}`);
    }
  }

  fs.writeFileSync('utils/bankLogoUrls.json', JSON.stringify(uploadedUrls, null, 2));
  console.log('Finished uploading bank logos! Saved mapping to utils/bankLogoUrls.json');
}

run();
