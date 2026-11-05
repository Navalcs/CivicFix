// ─────────────────────────────────────────────────────────────────────────────
// AI Civic Issue Detection – Groq Vision Model
// ─────────────────────────────────────────────────────────────────────────────
// Analyses a photo and returns one of the allowed civic-issue categories,
// "not a civic problem", or null on failure.
// ─────────────────────────────────────────────────────────────────────────────

import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

const GROQ_API_KEY = "groq_api_key";
const GROQ_VISION_MODEL = 'llama-3.2-11b-vision-preview';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/** Maximum image size (bytes) before we compress */
const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB

/**
 * Compress the image if it exceeds MAX_IMAGE_BYTES.
 * Returns the (possibly new) URI to use.
 */
async function compressIfNeeded(uri: string): Promise<string> {
    try {
        const info = await FileSystem.getInfoAsync(uri);
        if (info.exists && (info as any).size && (info as any).size > MAX_IMAGE_BYTES) {
            const manipulated = await ImageManipulator.manipulateAsync(
                uri,
                [{ resize: { width: 1024 } }],
                { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG },
            );
            return manipulated.uri;
        }
    } catch {
        // If we can't check size, just proceed with original
    }
    return uri;
}

/**
 * Convert a local image URI to a data-URL string
 * (data:image/jpeg;base64,<data>) suitable for the Groq vision API.
 */
async function toBase64DataUrl(uri: string): Promise<string> {
    const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
    });
    return `data:image/jpeg;base64,${base64}`;
}

/**
 * Analyse an image and detect whether it contains a civic issue.
 *
 * @returns One of the allowed category strings, `"not a civic problem"`, or
 *          `null` when the API call fails.
 */
export async function detectCivicIssue(imageUri: string): Promise<string | null> {
    try {
        const compressed = await compressIfNeeded(imageUri);
        const dataUrl = await toBase64DataUrl(compressed);

        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: GROQ_VISION_MODEL,
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: `Analyze this image and detect if it contains a civic problem.

Allowed categories:
pothole
garbage
water leakage
streetlight
sewage
road damage

If none apply return:
not a civic problem

Return ONLY one category from the list above (lowercase) or "not a civic problem". Do not add any other text.`,
                            },
                            {
                                type: 'image_url',
                                image_url: { url: dataUrl },
                            },
                        ],
                    },
                ],
                temperature: 0.2,
                max_tokens: 30,
            }),
        });

        if (!response.ok) {
            console.log('AI detection HTTP error', response.status);
            return null;
        }

        const data = await response.json();
        const raw: string | undefined = data?.choices?.[0]?.message?.content?.trim().toLowerCase();
        if (!raw) return null;
        return raw;
    } catch (error) {
        console.log('AI detection error', error);
        return null;
    }
}
