import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Alert,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/Button';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

export default function ProfileScreen({ navigation }: any) {
    const { user } = useAuth();
    const [profileName, setProfileName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [reportCount, setReportCount] = useState(0);

    const fetchData = useCallback(async () => {
        if (!user) return;
        try {
            const [profileRes, countRes] = await Promise.all([
                supabase
                    .from('profiles')
                    .select('name, avatar_url')
                    .eq('id', user.id)
                    .single(),
                supabase
                    .from('reports')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id),
            ]);

            const profile = profileRes.data as { name: string | null; avatar_url: string | null } | null;
            if (profile) {
                setProfileName(profile.name || '');
                setAvatarUrl(profile.avatar_url || null);
            }
            setReportCount(countRes.count ?? 0);
        } catch (e) {
            console.error('Profile fetch error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user]);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            setRefreshing(true);
            fetchData();
        });
        return unsubscribe;
    }, [navigation, fetchData]);

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) Alert.alert('Error', 'Failed to log out');
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [fetchData]);

    const initials = (profileName || user?.email || '?').charAt(0).toUpperCase();

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#8A7B47" />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8A7B47']} />}
        >
            {/* Profile Card */}
            <View style={styles.profileCard}>
                {/* Avatar with image or initials */}
                {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                ) : (
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                )}

                <Text style={styles.name}>{profileName || 'Citizen'}</Text>
                <Text style={styles.email}>{user?.email}</Text>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Ionicons name="document-text" size={20} color="#8A7B47" />
                        <Text style={styles.statNumber}>{reportCount}</Text>
                        <Text style={styles.statLabel}>Reports</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <Button
                    title="Sign Out"
                    variant="outline"
                    onPress={handleLogout}
                    style={styles.signOutBtn}
                />
            </View>

            {/* Civic Illustration */}
            <View style={styles.illustrationCard}>
                <Image
                    source={require('../../../assets/civic-cleanup.png')}
                    style={styles.illustration}
                    resizeMode="cover"
                />
                <Text style={styles.illustrationTitle}>Together for a Cleaner City</Text>
                <Text style={styles.illustrationSubtext}>
                    Every report you submit helps make our community a better place to live.
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#D6C28A' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#D6C28A' },
    scrollContent: { padding: 16, paddingBottom: 32 },


    // Profile Card
    profileCard: {
        backgroundColor: '#F3EBD2',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 4,
    },
    avatar: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: '#EDE5C8',
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 12,
    },
    avatarImage: {
        width: 80, height: 80, borderRadius: 40,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#EDE5C8',
    },
    avatarText: { fontSize: 32, fontWeight: 'bold', color: '#6B5E34' },
    name: { fontSize: 20, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
    email: { fontSize: 14, color: '#6B7280', marginBottom: 16 },

    // Stats
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 16,
    },
    statItem: {
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    statNumber: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1F2937',
        marginTop: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },

    divider: { height: 1, backgroundColor: '#D4C9A0', width: '100%', marginBottom: 20 },
    signOutBtn: { width: '100%' },

    // Illustration Card
    illustrationCard: {
        backgroundColor: '#F3EBD2',
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 4,
    },
    illustration: {
        width: '100%',
        height: 200,
    },
    illustrationTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        textAlign: 'center',
        marginTop: 16,
        paddingHorizontal: 20,
    },
    illustrationSubtext: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 24,
        paddingBottom: 20,
        marginTop: 8,
    },
});
