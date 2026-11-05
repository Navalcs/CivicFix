import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    StyleSheet,
    Modal,
    Pressable,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';

/**
 * Small profile avatar shown in the header of all screens (except Profile).
 * On tap, shows a popup with Settings and Logout options.
 */
export function HeaderAvatar() {
    const { user } = useAuth();
    const navigation = useNavigation<any>();
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [profileName, setProfileName] = useState('');
    const [menuVisible, setMenuVisible] = useState(false);

    const fetchProfile = useCallback(async () => {
        if (!user) return;
        try {
            const { data } = await supabase
                .from('profiles')
                .select('name, avatar_url')
                .eq('id', user.id)
                .single();

            const profile = data as { name: string | null; avatar_url: string | null } | null;
            if (profile) {
                setProfileName(profile.name || '');
                setAvatarUrl(profile.avatar_url || null);
            }
        } catch (e) {
            // silently fail — avatar just shows initials
        }
    }, [user]);

    useEffect(() => { fetchProfile(); }, [fetchProfile]);

    // Refetch when screen focuses
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', fetchProfile);
        return unsubscribe;
    }, [navigation, fetchProfile]);

    const initials = (profileName || user?.email || '?').charAt(0).toUpperCase();

    const handleLogout = () => {
        setMenuVisible(false);
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Sign Out',
                style: 'destructive',
                onPress: async () => {
                    await supabase.auth.signOut();
                },
            },
        ]);
    };

    const handleSettings = () => {
        setMenuVisible(false);
        navigation.navigate('Settings');
    };

    return (
        <>
            <TouchableOpacity
                style={styles.avatarButton}
                onPress={() => setMenuVisible(true)}
                activeOpacity={0.7}
            >
                {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                )}
            </TouchableOpacity>

            {/* Dropdown popup */}
            <Modal
                visible={menuVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setMenuVisible(false)}
            >
                <Pressable style={styles.overlay} onPress={() => setMenuVisible(false)}>
                    <View style={styles.menuContainer}>
                        {/* User info */}
                        <View style={styles.menuHeader}>
                            {avatarUrl ? (
                                <Image source={{ uri: avatarUrl }} style={styles.menuAvatar} />
                            ) : (
                                <View style={styles.menuAvatarPlaceholder}>
                                    <Text style={styles.menuAvatarText}>{initials}</Text>
                                </View>
                            )}
                            <View style={styles.menuUserInfo}>
                                <Text style={styles.menuName} numberOfLines={1}>
                                    {profileName || 'Citizen'}
                                </Text>
                                <Text style={styles.menuEmail} numberOfLines={1}>
                                    {user?.email}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.menuDivider} />

                        {/* Settings */}
                        <TouchableOpacity style={styles.menuItem} onPress={handleSettings}>
                            <View style={styles.menuIconBg}>
                                <Ionicons name="settings-outline" size={18} color="#6B5E34" />
                            </View>
                            <Text style={styles.menuItemText}>Settings</Text>
                            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                        </TouchableOpacity>

                        {/* Logout */}
                        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                            <View style={[styles.menuIconBg, { backgroundColor: '#FEE2E2' }]}>
                                <Ionicons name="log-out-outline" size={18} color="#EF4444" />
                            </View>
                            <Text style={[styles.menuItemText, { color: '#EF4444' }]}>Logout</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    // Header avatar button
    avatarButton: {
        marginRight: 12,
    },
    avatarImage: {
        width: 34,
        height: 34,
        borderRadius: 17,
        borderWidth: 2,
        borderColor: '#F3EBD2',
    },
    avatarPlaceholder: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#EDE5C8',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#F3EBD2',
    },
    avatarText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#6B5E34',
    },

    // Dropdown
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
    },
    menuContainer: {
        marginTop: 90,
        marginRight: 12,
        backgroundColor: '#F3EBD2',
        borderRadius: 16,
        padding: 12,
        width: 260,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },

    // User info header
    menuHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    menuAvatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        borderWidth: 2,
        borderColor: '#EDE5C8',
    },
    menuAvatarPlaceholder: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#EDE5C8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuAvatarText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#6B5E34',
    },
    menuUserInfo: {
        marginLeft: 12,
        flex: 1,
    },
    menuName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1F2937',
    },
    menuEmail: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },

    menuDivider: {
        height: 1,
        backgroundColor: '#D4C9A0',
        marginVertical: 8,
    },

    // Menu items
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 4,
    },
    menuIconBg: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#EDE5C8',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    menuItemText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#1F2937',
        flex: 1,
    },
});
