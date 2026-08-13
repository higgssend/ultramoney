import { createClient } from '@insforge/sdk';

const insforgeUrl = 'https://sxwv82iw.us-east.insforge.app';
const insforgeKey = 'ik_12002a3fd3274a14e562bcce4a015fee';

const insforge = createClient({ baseUrl: insforgeUrl, anonKey: insforgeKey });

export async function uploadToBucketHelper(dataOrFile: Blob | File | string, bucket: string, folder = 'general'): Promise<string | null> {
  try {
    let blob: Blob;
    let extension = 'png';

    if (typeof dataOrFile === 'string') {
      if (dataOrFile.startsWith('data:')) {
        const mimeMatch = dataOrFile.match(/data:(.*?);base64,/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/png';
        extension = mime.split('/')[1] || 'png';
        const base64Data = dataOrFile.replace(/^data:.*?;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        blob = new Blob([buffer], { type: mime });
      } else if (dataOrFile.startsWith('http://') || dataOrFile.startsWith('https://')) {
        return dataOrFile; // Already a URL
      } else {
        blob = new Blob([dataOrFile], { type: 'text/plain' });
        extension = 'txt';
      }
    } else {
      blob = dataOrFile;
      const name = (dataOrFile as File).name || 'file.png';
      extension = name.split('.').pop() || 'png';
    }

    const filename = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;
    const { data: uploadData, error } = await insforge.storage.from(bucket).upload(filename, blob);

    if (error) {
      console.error(`Error uploading to bucket ${bucket}:`, error);
      return null;
    }

    const { data: urlData } = insforge.storage.from(bucket).getPublicUrl(filename);
    return urlData?.publicUrl || (uploadData as any)?.url || null;
  } catch (err) {
    console.error(`Exception uploading to bucket ${bucket}:`, err);
    return null;
  }
}

async function testHelper() {
  console.log("--- Testing Storage Helper ---");

  // Test Base64 upload to client-photos
  const dummyBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  const photoUrl = await uploadToBucketHelper(dummyBase64, 'client-photos', 'avatars');
  console.log("Uploaded base64 photo URL:", photoUrl);

  // Test Backups List
  const backupsRes = await insforge.storage.from('backups').list();
  const rawList = (backupsRes as any)?.data?.data || (backupsRes as any)?.data || [];
  console.log("Raw backups list length:", rawList.length, "items:", rawList);
}

testHelper();
