import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    TouchableOpacity,
    ActivityIndicator,
    Image,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

type TabType = 'my' | 'global';

export default function MyReportsScreen({ navigation }: any) {
    const { user } = useAuth();
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('my');

    const fetchMyReports = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('reports')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    };

    const fetchGlobalReports = async () => {
        const { data, error } = await supabase
            .from('reports')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(30);

        if (error) throw error;
        return data || [];
    };

    const loadReports = useCallback(async (tab?: TabType) => {
        const currentTab = tab ?? activeTab;
        try {
            setLoading(true);
            const data = currentTab === 'my'
                ? await fetchMyReports()
                : await fetchGlobalReports();
            setReports(data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeTab, user]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadReports();
        });
        return unsubscribe;
    }, [navigation, loadReports]);

    useEffect(() => {
        loadReports(activeTab);
    }, [activeTab]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadReports();
    }, [loadReports]);

    const handleTabSwitch = (tab: TabType) => {
        if (tab === activeTab) return;
        setReports([]);
        setActiveTab(tab);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pending': return '#8A7B47';
            case 'In Progress': return '#8A6B47';
            case 'Resolved': return '#059669';
            default: return '#6B7280';
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ReportDetail', { id: item.id })}
        >
            {item.local_image_uri ? (
                <Image source={{ uri: item.local_image_uri }} style={styles.cardImage} />
            ) : (
                <View style={styles.imagePlaceholder} />
            )}
            <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                    <Text style={styles.category}>{item.category}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '30' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                    </View>
                </View>

                <Text style={styles.description} numberOfLines={2}>
                    {item.description}
                </Text>

                <View style={styles.cardFooter}>
                    <View style={styles.footerItem}>
                        <Ionicons name="time-outline" size={14} color="#9CA3AF" />
                        <Text style={styles.footerText}>
                            {format(new Date(item.created_at), 'MMM d, yyyy • h:mm a')}
                        </Text>
                    </View>
                    <View style={styles.footerItem}>
                        <Ionicons name="location-outline" size={14} color="#9CA3AF" />
                        <Text style={styles.footerText}>Location saved</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderTabBar = () => (
        <View style={styles.tabContainer}>
            <TouchableOpacity
                style={[
                    styles.tabButton,
                    activeTab === 'my' ? styles.tabButtonActive : styles.tabButtonInactive,
                ]}
                onPress={() => handleTabSwitch('my')}
            >
                <Ionicons
                    name="person-outline"
                    size={16}
                    color={activeTab === 'my' ? '#FFFFFF' : '#8A7B47'}
                    style={styles.tabIcon}
                />
                <Text style={activeTab === 'my' ? styles.tabTextActive : styles.tabTextInactive}>
                    My Reports
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[
                    styles.tabButton,
                    activeTab === 'global' ? styles.tabButtonActive : styles.tabButtonInactive,
                ]}
                onPress={() => handleTabSwitch('global')}
            >
                <Ionicons
                    name="globe-outline"
                    size={16}
                    color={activeTab === 'global' ? '#FFFFFF' : '#8A7B47'}
                    style={styles.tabIcon}
                />
                <Text style={activeTab === 'global' ? styles.tabTextActive : styles.tabTextInactive}>
                    Global Reports
                </Text>
            </TouchableOpacity>
        </View>
    );

    const emptyMessage = activeTab === 'my'
        ? 'You have not submitted any reports yet.'
        : 'No civic reports available.';

    return (
        <View style={styles.container}>
            {renderTabBar()}
            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#8A7B47" />
                </View>
            ) : (
                <FlatList
                    data={reports}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons
                                name={activeTab === 'my' ? 'document-text-outline' : 'globe-outline'}
                                size={48}
                                color="#9CA3AF"
                                style={{ marginBottom: 12 }}
                            />
                            <Text style={styles.emptyText}>{emptyMessage}</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        flex: 1,
        backgroundColor: '#D6C28A',
    },
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
        gap: 10,
    },
    tabButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 24,
    },
    tabButtonActive: {
        backgroundColor: '#8A7B47',
    },
    tabButtonInactive: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: '#8A7B47',
    },
    tabIcon: {
        marginRight: 6,
    },
    tabTextActive: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    tabTextInactive: {
        color: '#8A7B47',
        fontSize: 14,
        fontWeight: '600',
    },
    listContainer: {
        padding: 16,
    },
    card: {
        backgroundColor: '#F3EBD2',
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        flexDirection: 'row',
        overflow: 'hidden',
    },
    cardImage: {
        width: 100,
        height: '100%',
        backgroundColor: '#D4C9A0',
    },
    imagePlaceholder: {
        width: 100,
        height: '100%',
        backgroundColor: '#EDE5C8',
    },
    cardContent: {
        flex: 1,
        padding: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    category: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    description: {
        fontSize: 14,
        color: '#4B5563',
        marginBottom: 12,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    footerText: {
        fontSize: 12,
        color: '#6B7280',
    },
    emptyContainer: {
        padding: 32,
        alignItems: 'center',
    },
    emptyText: {
        color: '#6B7280',
        fontSize: 16,
        textAlign: 'center',
    },
});
