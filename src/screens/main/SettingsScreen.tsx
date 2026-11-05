import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';

type Props = {
    navigation: NavigationProp<RootStackParamList>;
};

export default function SettingsScreen({ navigation }: Props) {
    const { user } = useAuth();
    const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

    const handleLogout = async () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Sign Out',
                style: 'destructive',
                onPress: async () => {
                    const { error } = await supabase.auth.signOut();
                    if (error) Alert.alert('Error', 'Failed to sign out.');
                },
            },
        ]);
    };

    const SettingsItem = ({
        icon,
        label,
        onPress,
        rightElement,
        color = '#1F2937',
    }: {
        icon: keyof typeof Ionicons.glyphMap;
        label: string;
        onPress?: () => void;
        rightElement?: React.ReactNode;
        color?: string;
    }) => (
        <TouchableOpacity
            style={styles.settingsItem}
            onPress={onPress}
            disabled={!onPress && !rightElement}
            activeOpacity={onPress ? 0.6 : 1}
        >
            <View style={styles.settingsItemLeft}>
                <View style={styles.iconContainer}>
                    <Ionicons name={icon} size={20} color={color} />
                </View>
                <Text style={[styles.settingsItemLabel, { color }]}>{label}</Text>
            </View>
            {rightElement || (onPress && <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />)}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Account Section */}
                <Text style={styles.sectionTitle}>Account</Text>
                <View style={styles.card}>
                    <SettingsItem
                        icon="person-outline"
                        label="Edit Profile"
                        onPress={() => navigation.navigate('EditProfile')}
                    />
                    <View style={styles.separator} />
                    <SettingsItem
                        icon="lock-closed-outline"
                        label="Change Password"
                        onPress={() => {
                            Alert.alert(
                                'Change Password',
                                'A password reset email will be sent to your email address.',
                                [
                                    { text: 'Cancel', style: 'cancel' },
                                    {
                                        text: 'Send Email',
                                        onPress: async () => {
                                            if (user?.email) {
                                                const { error } = await supabase.auth.resetPasswordForEmail(user.email);
                                                if (error) {
                                                    Alert.alert('Error', error.message);
                                                } else {
                                                    Alert.alert('Sent!', 'Check your email for the password reset link.');
                                                }
                                            }
                                        },
                                    },
                                ]
                            );
                        }}
                    />
                    <View style={styles.separator} />
                    <SettingsItem
                        icon="mail-outline"
                        label={user?.email || 'Email'}
                        rightElement={
                            <Text style={styles.readOnlyLabel}>Read-only</Text>
                        }
                    />
                    <View style={styles.separator} />
                    <SettingsItem
                        icon="log-out-outline"
                        label="Sign Out"
                        onPress={handleLogout}
                        color="#EF4444"
                    />
                </View>

                {/* App Preferences Section */}
                <Text style={styles.sectionTitle}>App Preferences</Text>
                <View style={styles.card}>
                    <SettingsItem
                        icon="notifications-outline"
                        label="Notifications"
                        rightElement={
                            <Switch
                                value={notificationsEnabled}
                                onValueChange={setNotificationsEnabled}
                                trackColor={{ false: '#D4C9A0', true: '#8A7B47' }}
                                thumbColor="#FFF"
                            />
                        }
                    />
                    <View style={styles.separator} />
                    <SettingsItem
                        icon="language-outline"
                        label="Language"
                        rightElement={
                            <Text style={styles.readOnlyLabel}>English</Text>
                        }
                    />
                </View>

                {/* Support Section */}
                <Text style={styles.sectionTitle}>Support</Text>
                <View style={styles.card}>
                    <SettingsItem
                        icon="help-circle-outline"
                        label="Help & Support"
                        onPress={() => Alert.alert('Help & Support', 'For assistance, email us at support@civicfix.app')}
                    />
                    <View style={styles.separator} />
                    <SettingsItem
                        icon="shield-checkmark-outline"
                        label="Privacy Policy"
                        onPress={() => Alert.alert('Privacy Policy', 'Our full privacy policy is available on our website.')}
                    />
                    <View style={styles.separator} />
                    <SettingsItem
                        icon="information-circle-outline"
                        label="About App"
                        rightElement={
                            <Text style={styles.readOnlyLabel}>v1.0.0</Text>
                        }
                    />
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#6B5E34',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 10,
        marginTop: 16,
        marginLeft: 4,
    },
    card: {
        backgroundColor: '#F3EBD2',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    settingsItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    settingsItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#EDE5C8',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    settingsItemLabel: {
        fontSize: 15,
        fontWeight: '500',
        flex: 1,
    },
    separator: {
        height: 1,
        backgroundColor: '#D4C9A0',
        marginLeft: 66,
    },
    readOnlyLabel: {
        fontSize: 13,
        color: '#9CA3AF',
    },
});
