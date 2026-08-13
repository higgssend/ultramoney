import { insforge } from '../lib/insforge';

export interface StorageObjectItem {
  key: string;
  name: string;
  size: number;
  lastModified: string;
  url: string;
}

/**
 * Uploads a base64 string, Blob, or File to an InsForge Storage Bucket and returns its public URL.
 */
export async function uploadToBucketHelper(
  dataOrFile: Blob | File | string,
  bucket: string,
  folder = 'general'
): Promise<string | null> {
  try {
    let blob: Blob;
    let extension = 'png';

    if (typeof dataOrFile === 'string') {
      if (dataOrFile.startsWith('data:')) {
        const mimeMatch = dataOrFile.match(/data:(.*?);base64,/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/png';
        extension = mime.split('/')[1] || 'png';
        const base64Data = dataOrFile.replace(/^data:.*?;base64,/, '');
        
        // Convert base64 string to Uint8Array for browser/environment compatibility
        const binaryStr = window.atob(base64Data);
        const len = binaryStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        blob = new Blob([bytes], { type: mime });
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

/**
 * Lists all objects stored in an InsForge Storage Bucket.
 */
export async function listBucketFiles(bucket: string): Promise<StorageObjectItem[]> {
  try {
    const res = await insforge.storage.from(bucket).list();
    if (res.error) {
      console.error(`Error listing bucket ${bucket}:`, res.error);
      return [];
    }

    const rawList = Array.isArray(res.data) 
      ? res.data 
      : (Array.isArray((res.data as any)?.data) ? (res.data as any).data : ((res.data as any)?.objects || []));

    return rawList.map((item: any) => {
      const key = item.key || item.name || 'file';
      const publicUrlData = insforge.storage.from(bucket).getPublicUrl(key);
      const url = item.url || publicUrlData?.data?.publicUrl || '';
      return {
        key,
        name: key.split('/').pop() || key,
        size: item.size || 0,
        lastModified: item.uploadedAt || item.uploaded_at || item.created_at || new Date().toISOString(),
        url
      };
    });
  } catch (err) {
    console.error(`Exception listing bucket ${bucket}:`, err);
    return [];
  }
}
