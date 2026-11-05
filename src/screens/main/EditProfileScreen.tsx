import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { pickAndUploadProfileImage } from '../../utils/uploadProfileImage';
import { NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';

type Props = {
    navigation: NavigationProp<RootStackParamList>;
};

export default function EditProfileScreen({ navigation }: Props) {
    const { user } = useAuth();
    const [fullName, setFullName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [localImageUri, setLocalImageUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    // Fetch current profile data
    useEffect(() => {
        async function fetchProfile() {
            if (!user) return;
            try {
                const { data } = await supabase
                    .from('profiles')
                    .select('name, avatar_url')
                    .eq('id', user.id)
                    .single();

                const profile = data as { name: string | null; avatar_url: string | null } | null;
                if (profile) {
                    setFullName(profile.name || '');
                    setAvatarUrl(profile.avatar_url || null);
                }
            } catch (e) {
                console.error('Fetch profile error:', e);
            } finally {
                setLoading(false);
            }
        }
        fetchProfile();
    }, [user]);

    const handlePickImage = async () => {
        if (!user) return;
        setUploadingImage(true);
        try {
            const publicUrl = await pickAndUploadProfileImage(user.id);
            if (publicUrl) {
                setAvatarUrl(publicUrl);
                setLocalImageUri(publicUrl);
            }
        } catch (error: any) {
            Alert.alert('Image Error', error.message || 'Failed to pick or upload image.');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        if (!fullName.trim()) {
            Alert.alert('Validation', 'Please enter your full name.');
            return;
        }

        setSaving(true);
        try {
            const updates: { name: string; avatar_url?: string } = {
                name: fullName.trim(),
            };

            if (avatarUrl) {
                updates.avatar_url = avatarUrl;
            }

            // @ts-ignore — Supabase type inference resolves Update to 'never' in some client versions
            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id);

            if (error) throw error;

            Alert.alert('Success', 'Profile updated successfully!');
            navigation.goBack();
        } catch (error: any) {
            Alert.alert('Save Error', error.message || 'Failed to save profile changes.');
        } finally {
            setSaving(false);
        }
    };

    const displayImage = localImageUri || avatarUrl;
    const initials = (fullName || user?.email || '?').charAt(0).toUpperCase();

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#8A7B47" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Avatar Section */}
                <View style={styles.avatarSection}>
                    <TouchableOpacity style={styles.avatarContainer} onPress={handlePickImage} disabled={uploadingImage}>
                        {displayImage ? (
                            <Image source={{ uri: displayImage }} style={styles.avatarImage} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>{initials}</Text>
                            </View>
                        )}

                        {/* Edit overlay */}
                        <View style={styles.editOverlay}>
                            {uploadingImage ? (
                                <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                                <Ionicons name="camera" size={16} color="#FFF" />
                            )}
                        </View>
                    </TouchableOpacity>

                    <Text style={styles.changePhotoText}>
                        {uploadingImage ? 'Uploading...' : 'Tap to change photo'}
                    </Text>
                </View>

                {/* Form */}
                <View style={styles.formCard}>
                    <Input
                        label="Full Name"
                        placeholder="Enter your full name"
                        value={fullName}
                        onChangeText={setFullName}
                        autoCapitalize="words"
                    />

                    <View style={styles.readOnlyField}>
                        <Text style={styles.readOnlyLabel}>Email</Text>
                        <View style={styles.readOnlyInput}>
                            <Ionicons name="lock-closed" size={14} color="#9CA3AF" />
                            <Text style={styles.readOnlyValue}>{user?.email}</Text>
                        </View>
                    </View>
                </View>

                <Button
                    title={saving ? 'Saving...' : 'Save Changes'}
                    onPress={handleSave}
                    loading={saving}
                    style={styles.saveButton}
                />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#D6C28A',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#D6C28A',
    },
    header: {
        paddingTop: 50,
        paddingBottom: 16,
        paddingHorizontal: 16,
        backgroundColor: '#A88C6C',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#D4C9A0',
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    scrollContent: {
        padding: 16,
    },

    // Avatar
    avatarSection: {
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 8,
    },
    avatarContainer: {
        width: 110,
        height: 110,
        borderRadius: 55,
        position: 'relative',
    },
    avatarImage: {
        width: 110,
        height: 110,
        borderRadius: 55,
        borderWidth: 3,
        borderColor: '#F3EBD2',
    },
    avatarPlaceholder: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: '#EDE5C8',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#F3EBD2',
    },
    avatarText: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#6B5E34',
    },
    editOverlay: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#8A7B47',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#D6C28A',
    },
    changePhotoText: {
        marginTop: 10,
        fontSize: 14,
        color: '#8A7B47',
        fontWeight: '600',
    },

    // Form
    formCard: {
        backgroundColor: '#F3EBD2',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    readOnlyField: {
        marginTop: 4,
    },
    readOnlyLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 6,
    },
    readOnlyInput: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#EDE5C8',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: '#D4C9A0',
    },
    readOnlyValue: {
        fontSize: 15,
        color: '#9CA3AF',
    },
    saveButton: {
        marginTop: 4,
    },
});
