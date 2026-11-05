import { supabase } from '../lib/supabase';
import * as FileSystem from 'expo-file-system';

const BUCKET_NAME = 'report-images';

/**
 * Pure JS base64 → ArrayBuffer converter (no external dependency needed).
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

/**
 * Uploads a local image to Supabase Storage and returns the public URL.
 * Returns null on any failure so report submission is never blocked.
 *
 * @param localUri  The local file URI (from device gallery / camera)
 * @param userId    The authenticated user's ID
 * @returns         The public URL string, or null if upload failed
 */
export async function uploadImageToSupabase(
    localUri: string,
    userId: string,
): Promise<string | null> {
    try {
        // 1. Read local file as base64
        const base64 = await FileSystem.readAsStringAsync(localUri, {
            encoding: 'base64' as any,
        });

        // 2. Build a unique filename: userId_timestamp.jpg
        const timestamp = Date.now();
        const fileName = `${userId}_${timestamp}.jpg`;
        const filePath = `reports/${fileName}`;

        // 3. Convert base64 → ArrayBuffer and upload
        const arrayBuffer = base64ToArrayBuffer(base64);

        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, arrayBuffer, {
                contentType: 'image/jpeg',
                upsert: false,
            });

        if (uploadError) {
            return null;
        }

        // 4. Get the public URL
        const { data } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);

        return data?.publicUrl ?? null;
    } catch (_err: any) {
        return null;
    }
}
