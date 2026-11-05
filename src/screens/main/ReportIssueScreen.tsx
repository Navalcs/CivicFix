import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Linking, BackHandler } from 'react-native';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    Alert,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Camera, CameraView as RNCameraView, useCameraPermissions, CameraViewProps } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as Location from 'expo-location';

import Toast from 'react-native-toast-message';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/supabase';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { generateDescription } from '../../utils/Groq';
import { detectCivicIssue } from '../../utils/aiDetectIssue';
import { sendEmailWithAttachment } from '../../utils/sendEmailWithAttachment';
import { uploadImageToSupabase } from '../../utils/uploadToSupabase';

// Workaround for React 18 + expo-camera type incompatibility
const CameraView = RNCameraView as unknown as React.ComponentClass<CameraViewProps>;

const CATEGORIES = [
    'Pothole',
    'Garbage',
    'Water Leakage',
    'Streetlight',
    'Sewage',
    'Road Damage',
    'Others',
];

export default function ReportIssueScreen({ navigation }: any) {
    const { user } = useAuth();

    // Permissions
    const [cameraPermission, requestCameraPermission] = useCameraPermissions();
    const [mediaLibraryPermission, requestMediaLibraryPermission] = MediaLibrary.usePermissions();

    // Form State
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [description, setDescription] = useState('');

    // Media State
    // use any so the ref works regardless of cast alias vs original class type
    const cameraRef = useRef<any>(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [imageUri, setImageUri] = useState<string | null>(null);
    // Original file:// URI from camera (for email attachment — MediaLibrary URIs don't work)
    const [originalPhotoUri, setOriginalPhotoUri] = useState<string | null>(null);

    // Location State
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [locationError, setLocationError] = useState('');

    // Submission
    const [submitting, setSubmitting] = useState(false);

    // AI description generation
    const [aiGenerating, setAiGenerating] = useState(false);

    // AI issue detection
    const [aiDetecting, setAiDetecting] = useState(false);
    const [detectedCategory, setDetectedCategory] = useState<string | null>(null);

    /** Category mapping from AI response → CATEGORIES value */
    const CATEGORY_MAP: Record<string, string> = {
        pothole: 'Pothole',
        garbage: 'Garbage',
        'water leakage': 'Water Leakage',
        streetlight: 'Streetlight',
        sewage: 'Sewage',
        'road damage': 'Road Damage',
    };

    /** Reset all form fields to initial state */
    const resetForm = useCallback(() => {
        setImageUri(null);
        setOriginalPhotoUri(null);
        setCategory(CATEGORIES[0]);
        setDescription('');
        setDetectedCategory(null);
        setAiDetecting(false);
        setAiGenerating(false);
    }, []);

    // Fetch location on mount
    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setLocationError('Permission to access location was denied');
                return;
            }

            let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            setLocation(loc);
        })();
    }, []);

    // Handle Android hardware back button — reset form instead of navigating away
    useEffect(() => {
        const backAction = () => {
            resetForm();
            return true; // prevent default back navigation
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
        return () => backHandler.remove();
    }, [resetForm]);


    /** Sends current description text to Gemini and replaces it with AI output */
    const handleGenerateWithAI = async () => {
        if (!description.trim()) return;
        setAiGenerating(true);
        try {
            const result = await generateDescription(description);
            setDescription(result);
            Toast.show({
                type: 'success',
                text1: 'Description generated! ✨',
                text2: 'AI has crafted a professional description.',
                position: 'top',
                topOffset: 60,
                visibilityTime: 2500,
            });
        } catch (_err: any) {
            // Silently ignore — just stop the spinner
        } finally {
            setAiGenerating(false);
        }
    };

    const handleCapturePhoto = async () => {
        if (!cameraPermission?.granted) await requestCameraPermission();
        if (!mediaLibraryPermission?.granted) await requestMediaLibraryPermission();

        if (!cameraPermission?.granted || !mediaLibraryPermission?.granted) {
            Alert.alert('Permissions needed', 'Camera and Media Library permissions are required.');
            return;
        }

        setIsCameraActive(true);
    };

    const takePicture = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.8,
                });

                if (photo?.uri) {
                    // Save to device gallery
                    await MediaLibrary.createAssetAsync(photo.uri);
                    // Use the raw file:// URI for both preview and state
                    // (MediaLibrary asset.uri returns content:// which doesn't render in <Image> on some Android devices)
                    setImageUri(photo.uri);
                    setOriginalPhotoUri(photo.uri);
                    setIsCameraActive(false);

                    // Run AI category detection on the captured photo
                    runAiDetection(photo.uri);
                }
            } catch (err) {
                console.error(err);
                Alert.alert('Error', 'Failed to capture photo.');
            }
        }
    };

    const handleRetakePhoto = () => {
        setImageUri(null);
        setOriginalPhotoUri(null);
        setDetectedCategory(null);
    };

    /** Pick an image from the device gallery */
    const pickImageFromGallery = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Permission needed', 'Gallery permission is required to upload images.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.7,
        });

        if (!result.canceled) {
            const uri = result.assets[0].uri;
            setImageUri(uri);
            setOriginalPhotoUri(uri);
            runAiDetection(uri);
        }
    };

    /** Run AI civic issue detection on the given image URI */
    const runAiDetection = async (uri: string) => {
        setAiDetecting(true);
        setDetectedCategory(null);
        try {
            const result = await detectCivicIssue(uri);

            if (!result) {
                // AI failed
                Toast.show({
                    type: 'info',
                    text1: 'AI Detection Unavailable',
                    text2: 'Unable to detect issue automatically. Please select category manually.',
                    position: 'top',
                    topOffset: 60,
                    visibilityTime: 3500,
                });
                return;
            }

            const cleaned = result.toLowerCase().trim();

            if (cleaned.includes('not a civic problem')) {
                Alert.alert(
                    'Not a Civic Issue',
                    'This image does not appear to contain a civic problem. Please upload a valid issue photo.',
                );
                setImageUri(null);
                setOriginalPhotoUri(null);
                return;
            }

            // Try to match to a known category
            const matched = CATEGORY_MAP[cleaned];
            if (matched) {
                setCategory(matched);
                setDetectedCategory(matched);
                Toast.show({
                    type: 'success',
                    text1: `Detected: ${matched}`,
                    text2: 'Category auto-selected by AI. You can change it if needed.',
                    position: 'top',
                    topOffset: 60,
                    visibilityTime: 3000,
                });
            } else {
                // Unknown category — default to Others
                setCategory('Others');
                setDetectedCategory('Others');
                Toast.show({
                    type: 'info',
                    text1: 'Category set to Others',
                    text2: 'AI could not match a specific category. Please adjust if needed.',
                    position: 'top',
                    topOffset: 60,
                    visibilityTime: 3000,
                });
            }
        } catch (err) {
            console.log('AI detection error', err);
            Toast.show({
                type: 'info',
                text1: 'AI Detection Unavailable',
                text2: 'Unable to detect issue automatically. Please select category manually.',
                position: 'top',
                topOffset: 60,
                visibilityTime: 3500,
            });
        } finally {
            setAiDetecting(false);
        }
    };

    const handleCopyLocation = async () => {
        if (location) {
            const text = `${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`;
            await Clipboard.setStringAsync(text);
            Toast.show({
                type: 'success',
                text1: 'Copied',
                text2: 'Coordinates copied to clipboard',
                position: 'top',
                visibilityTime: 2000,
            });
        }
    };

    const handleRetryLocation = async () => {
        setLocationError('');
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setLocationError('Permission to access location was denied');
                return;
            }
            let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            setLocation(loc);
        } catch (error) {
            setLocationError('Failed to fetch location. Please ensure GPS is on.');
        }
    };

    const handleSubmit = async () => {
        if (!imageUri) {
            Alert.alert('Error', 'Please capture a photo of the issue.');
            return;
        }
        if (!location) {
            Alert.alert('Error', 'Waiting for location. Please ensure GPS is enabled.');
            return;
        }
        if (!description.trim()) {
            Alert.alert('Error', 'Please provide a description.');
            return;
        }

        if (!user?.id) {
            Alert.alert('Error', 'You must be logged in to submit a report.');
            return;
        }

        setSubmitting(true);
        try {
            // Upload image to Supabase Storage (returns null if upload fails)
            const imageUrl = await uploadImageToSupabase(imageUri, user.id);

            const insertData: any = {
                user_id: user.id,
                category,
                description,
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                local_image_uri: imageUri,
                image_url: imageUrl,
                status: 'Pending',
            };
            const { error } = await supabase.from('reports').insert(insertData);

            if (error) throw error;

            // Save values before form reset
            const savedImageUri = originalPhotoUri || imageUri;
            const emailParams = {
                category,
                description,
                latitude: location?.coords.latitude,
                longitude: location?.coords.longitude,
                imageUri: savedImageUri,
            };

            // Reset form
            setImageUri(null);
            setOriginalPhotoUri(null);
            setDescription('');
            setCategory(CATEGORIES[0]);

            // Open email app with image attached, then navigate
            await sendEmailWithAttachment(emailParams);
            navigation.navigate('Dashboard');

        } catch (err: any) {
            console.error(err);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: err.message || 'Failed to submit report.',
                position: 'top',
                topOffset: 60,
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (isCameraActive) {
        return (
            <View style={styles.cameraContainer}>
                <CameraView style={styles.camera} facing='back' ref={cameraRef}>
                    <View style={styles.cameraButtonContainer}>
                        <TouchableOpacity style={styles.closeButton} onPress={() => setIsCameraActive(false)}>
                            <Text style={styles.closeText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                            <View style={styles.captureInner} />
                        </TouchableOpacity>
                    </View>
                </CameraView>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>

                <Text style={styles.sectionTitle}>1. Capture Photo</Text>
                {imageUri ? (
                    <View style={styles.imagePreviewContainer}>
                        <Image source={{ uri: imageUri }} style={styles.imagePreview} />

                        {aiDetecting && (
                            <View style={styles.analyzingOverlay}>
                                <ActivityIndicator size="small" color="#FFF" />
                                <Text style={styles.analyzingText}>Analyzing image…</Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.retakeButton}
                            onPress={handleRetakePhoto}
                        >
                            <Text style={styles.retakeText}>Retake Photo</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.photoUploadBox}>
                        <TouchableOpacity style={{ alignItems: 'center' }} onPress={handleCapturePhoto}>
                            <Ionicons name="camera-outline" size={48} color="#9CA3AF" />
                            <Text style={styles.uploadText}>Tap to open camera</Text>
                        </TouchableOpacity>
                        <Text style={styles.orText}>or</Text>
                        <TouchableOpacity style={{ alignItems: 'center' }} onPress={pickImageFromGallery}>
                            <Ionicons name="images-outline" size={28} color="#8A7B47" />
                            <Text style={[styles.uploadText, { color: '#8A7B47', fontSize: 14, marginTop: 4 }]}>Upload from Gallery</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {detectedCategory && imageUri && (
                    <View style={styles.detectionBanner}>
                        <View style={styles.detectionIconRow}>
                            <Ionicons name="sparkles" size={16} color="#8A7B47" />
                            <Text style={styles.detectionLabel}>AI Detected</Text>
                        </View>
                        <Text style={styles.detectionCategory}>{detectedCategory}</Text>
                        <Text style={styles.detectionHint}>Category auto-selected. You can change it below if needed.</Text>
                    </View>
                )}


                <Text style={styles.sectionTitle}>2. Issue Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                    {CATEGORIES.map((cat) => (
                        <TouchableOpacity
                            key={cat}
                            style={[
                                styles.categoryPill,
                                category === cat && styles.categoryPillActive,
                            ]}
                            onPress={() => setCategory(cat)}
                        >
                            <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>
                                {cat}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <Text style={styles.sectionTitle}>3. Location</Text>
                <View style={styles.locationCard}>
                    {location ? (
                        <View style={styles.coordsDisplayContainer}>
                            <View style={styles.coordHeader}>
                                <Ionicons name="location" size={24} color="#10B981" />
                                <Text style={styles.coordTitle}>Location Acquired</Text>
                            </View>

                            <View style={styles.coordDataBox}>
                                <View style={styles.coordDataRow}>
                                    <Text style={styles.coordDataLabel}>Latitude:</Text>
                                    <Text style={styles.coordDataValue}>{location.coords.latitude.toFixed(6)}</Text>
                                </View>
                                <View style={styles.coordDataRow}>
                                    <Text style={styles.coordDataLabel}>Longitude:</Text>
                                    <Text style={styles.coordDataValue}>{location.coords.longitude.toFixed(6)}</Text>
                                </View>
                            </View>

                            <TouchableOpacity style={styles.copyBtn} onPress={handleCopyLocation}>
                                <Ionicons name="copy-outline" size={16} color="#8A7B47" />
                                <Text style={styles.copyBtnText}>Copy Coordinates</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.locationPlaceholder}>
                            {!locationError ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color="#8A7B47" />
                                    <Text style={styles.loadingText}>Fetching your location...</Text>
                                    <Text style={styles.loadingSubText}>Please ensure GPS is enabled</Text>
                                </View>
                            ) : (
                                <View style={styles.errorContainer}>
                                    <Ionicons name="warning-outline" size={36} color="#EF4444" />
                                    <Text style={styles.errorTitle}>Location Error</Text>
                                    <Text style={styles.errorText}>{locationError}</Text>
                                    <TouchableOpacity style={styles.retryBtn} onPress={handleRetryLocation}>
                                        <Text style={styles.retryBtnText}>Retry</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    )}
                </View>

                <Text style={styles.sectionTitle}>4. Description</Text>
                <Input
                    label=""
                    placeholder="Type a brief note (e.g. 'deep pothole near school gate')…"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={4}
                    style={styles.textArea}
                />

                {/* ── AI Generate Button ── */}
                <TouchableOpacity
                    style={[
                        styles.aiButton,
                        (!description.trim() || aiGenerating) && styles.aiButtonDisabled,
                    ]}
                    onPress={handleGenerateWithAI}
                    disabled={!description.trim() || aiGenerating}
                    activeOpacity={0.8}
                >
                    {aiGenerating ? (
                        <>
                            <ActivityIndicator size="small" color="#8A7B47" />
                            <Text style={styles.aiButtonText}>Generating…</Text>
                        </>
                    ) : (
                        <>
                            <Ionicons name="sparkles-outline" size={18} color="#8A7B47" />
                            <Text style={styles.aiButtonText}>Generate Description with AI</Text>
                        </>
                    )}
                </TouchableOpacity>

                <Button
                    title="Submit Report"
                    onPress={handleSubmit}
                    loading={submitting}
                    style={styles.submitButton}
                />

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#D6C28A',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#374151',
        marginTop: 20,
        marginBottom: 8,
    },
    photoUploadBox: {
        height: 200,
        backgroundColor: '#F3EBD2',
        borderWidth: 2,
        borderColor: '#D4C9A0',
        borderStyle: 'dashed',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadText: {
        marginTop: 12,
        fontSize: 16,
        fontWeight: '600',
        color: '#4B5563',
    },
    orText: {
        fontSize: 13,
        color: '#9CA3AF',
        fontWeight: '600',
        marginVertical: 6,
    },
    subUploadText: {
        marginTop: 4,
        fontSize: 12,
        color: '#9CA3AF',
    },
    imagePreviewContainer: {
        height: 160,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
    },
    retakeButton: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    retakeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    // ── Analyzing Overlay ────────────────────────────────────────────────────────
    analyzingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        gap: 10,
    },
    analyzingText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '700',
    },
    // ── Detection Result Banner ──────────────────────────────────────────────────
    detectionBanner: {
        marginTop: 12,
        backgroundColor: '#EDE5C8',
        borderWidth: 1,
        borderColor: '#D4C9A0',
        borderRadius: 12,
        padding: 14,
    },
    detectionIconRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    detectionLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B5E34',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    detectionCategory: {
        fontSize: 20,
        fontWeight: '800',
        color: '#6B5E34',
        marginBottom: 8,
    },
    confidenceBarContainer: {
        height: 6,
        backgroundColor: '#D4C9A0',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 6,
    },
    confidenceBarFill: {
        height: '100%',
        backgroundColor: '#8A7B47',
        borderRadius: 3,
    },
    confidenceText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B5E34',
    },
    detectionHint: {
        fontSize: 11,
        color: '#6B5E34',
        marginTop: 4,
        fontStyle: 'italic',
    },
    // ── Camera ───────────────────────────────────────────────────────────────────
    cameraContainer: {
        flex: 1,
    },
    camera: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    cameraButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        paddingBottom: 40,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    closeButton: {
        padding: 12,
    },
    closeText: {
        color: 'white',
        fontSize: 16,
    },
    captureButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureInner: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: '#FFF',
    },
    // ── Category Pills ───────────────────────────────────────────────────────────
    categoryScroll: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    categoryPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#EDE5C8',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#D4C9A0',
    },
    categoryPillActive: {
        backgroundColor: '#EDE5C8',
        borderColor: '#8A7B47',
    },
    categoryPillAiDetected: {
        borderWidth: 2,
        borderColor: '#8A7B47',
    },
    categoryText: {
        color: '#4B5563',
        fontWeight: '600',
    },
    categoryTextActive: {
        color: '#6B5E34',
    },
    // ── Location ─────────────────────────────────────────────────────────────────
    locationCard: {
        backgroundColor: '#F3EBD2',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#D4C9A0',
        overflow: 'hidden',
        minHeight: 140,
    },
    locationPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#EDE5C8',
    },
    loadingContainer: {
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 15,
        fontWeight: '600',
        color: '#374151',
    },
    loadingSubText: {
        marginTop: 4,
        fontSize: 13,
        color: '#6B7280',
    },
    errorContainer: {
        alignItems: 'center',
    },
    errorTitle: {
        marginTop: 8,
        fontSize: 16,
        fontWeight: '600',
        color: '#EF4444',
    },
    errorText: {
        marginTop: 4,
        fontSize: 13,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 16,
    },
    retryBtn: {
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    retryBtnText: {
        color: '#EF4444',
        fontWeight: '600',
        fontSize: 13,
    },
    coordsDisplayContainer: {
        padding: 16,
    },
    coordHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8,
    },
    coordTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    coordDataBox: {
        backgroundColor: '#EDE5C8',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
    },
    coordDataRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    coordDataLabel: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    coordDataValue: {
        fontSize: 14,
        color: '#111827',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        fontWeight: '600',
    },
    copyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: '#EDE5C8',
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#8A7B47',
    },
    copyBtnText: {
        color: '#8A7B47',
        fontSize: 14,
        fontWeight: '600',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    submitButton: {
        marginTop: 24,
    },
    // ── AI Generate Button ─────────────────────────────────────────────────────
    aiButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#EDE5C8',
        borderWidth: 1.5,
        borderColor: '#8A7B47',
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    aiButtonDisabled: {
        opacity: 0.45,
    },
    aiButtonText: {
        color: '#8A7B47',
        fontSize: 14,
        fontWeight: '700',
    },
});
