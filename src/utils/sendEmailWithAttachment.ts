import * as MailComposer from 'expo-mail-composer';
import * as FileSystem from 'expo-file-system';
import { Alert, Linking } from 'react-native';

// BMC contact email for report notifications
const BMC_EMAIL = 'mohanrajnavalcs232452@gmail.com';

interface EmailWithAttachmentParams {
    category: string;
    description: string;
    latitude?: number;
    longitude?: number;
    /** Local file URI of the captured image to attach */
    imageUri?: string | null;
}

/**
 * Builds a professional municipal complaint subject line.
 */
function buildSubject({ category }: EmailWithAttachmentParams): string {
    return `Civic Issue Report — ${category}`;
}

/**
 * Builds a formal municipal complaint email body.
 */
function buildBody({ description, latitude, longitude }: EmailWithAttachmentParams): string {
    const locationBlock =
        latitude != null && longitude != null
            ? `Location Details:\nLatitude: ${latitude.toFixed(6)}\nLongitude: ${longitude.toFixed(6)}\nGoogle Maps Link:\nhttps://www.google.com/maps?q=${latitude.toFixed(6)},${longitude.toFixed(6)}`
            : `Location Details:\n[Location unavailable — please add manually.]`;

    return `Respected Sir/Madam,

I would like to bring to your attention a civic issue that requires immediate action.

Issue Details:
${description.trim()}

${locationBlock}

Additional Information:
The issue has been observed at the mentioned location and may cause inconvenience to residents and commuters if not addressed promptly.

I kindly request the concerned department to take necessary action at the earliest.

Thank you for your time and assistance.

Regards,
Citizen
Sent via Civic Reporting App`;
}

/**
 * Copies the image to app cache so MailComposer can read it on Android.
 * Returns the cache file:// path, or null if copy fails.
 */
async function copyToCache(uri: string): Promise<string | null> {
    try {
        const cacheDir = (FileSystem as any).cacheDirectory || `${(FileSystem as any).documentDirectory}../cache/`;
        if (!cacheDir) return null;

        const fileName = `civic_report_${Date.now()}.jpg`;
        const destUri = `${cacheDir}${fileName}`;

        await FileSystem.copyAsync({ from: uri, to: destUri });
        return destUri;
    } catch {
        return null;
    }
}

/**
 * Opens the email client with the civic complaint pre-filled and the captured
 * image attached. Uses expo-mail-composer when available, falls back to
 * mailto: link (without attachment) if MailComposer is not available.
 *
 * Gracefully handles all failure cases — never crashes the app.
 */
export async function sendEmailWithAttachment(params: EmailWithAttachmentParams): Promise<void> {
    const subject = buildSubject(params);
    const body = buildBody(params);

    // Try expo-mail-composer first (supports attachments)
    try {
        const isAvailable = await MailComposer.isAvailableAsync();

        if (isAvailable) {
            const options: MailComposer.MailComposerOptions = {
                recipients: [BMC_EMAIL],
                subject,
                body,
            };

            // Attach image — copy to app cache first for Android compatibility
            if (params.imageUri) {
                const cachedUri = await copyToCache(params.imageUri);
                if (cachedUri) {
                    options.attachments = [cachedUri];
                }
            }

            await MailComposer.composeAsync(options);
            return;
        }
    } catch (_err) {
        // MailComposer failed — fall through to mailto: fallback
    }

    // Fallback: mailto: link (no attachment support)
    try {
        const url = `mailto:${BMC_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        await Linking.openURL(url);
    } catch {
        Alert.alert('No Email App', 'No email application was found on this device.');
    }
}
