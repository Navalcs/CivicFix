import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from '../lib/supabase';

/**
 * Opens the device gallery, lets user pick an image,
 * compresses it if needed, and uploads to Supabase Storage.
 * Returns the public URL of the uploaded image, or null on failure.
 */
export async function pickAndUploadProfileImage(userId: string): Promise<string | null> {
    try {
        // 1. Request permission
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            throw new Error('Gallery permission is required to change your profile picture.');
        }

        // 2. Open gallery
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (result.canceled || !result.assets?.[0]) {
            return null; // user cancelled
        }

        let imageUri = result.assets[0].uri;
        const fileSize = result.assets[0].fileSize ?? 0;

        // 3. Compress if > 2MB
        if (fileSize > 2 * 1024 * 1024) {
            const manipulated = await ImageManipulator.manipulateAsync(
                imageUri,
                [{ resize: { width: 800 } }],
                { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
            );
            imageUri = manipulated.uri;
        }

        // 4. Upload to Supabase Storage
        const timestamp = Date.now();
        const filePath = `${userId}_${timestamp}.jpg`;

        // Read image as blob
        const response = await fetch(imageUri);
        const blob = await response.blob();

        // Convert blob to ArrayBuffer for Supabase upload
        const arrayBuffer = await new Response(blob).arrayBuffer();

        const { error: uploadError } = await supabase.storage
            .from('profile-images')
            .upload(filePath, arrayBuffer, {
                contentType: 'image/jpeg',
                upsert: true,
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            throw new Error('Failed to upload profile picture.');
        }

        // 5. Get public URL
        const { data } = supabase.storage
            .from('profile-images')
            .getPublicUrl(filePath);

        return data.publicUrl;
    } catch (error: any) {
        console.error('Profile image upload error:', error);
        throw error;
    }
}
