import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert,
    TouchableOpacity,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { Ionicons } from '@expo/vector-icons';

type SignupScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Signup'>;

type Props = {
    navigation: SignupScreenNavigationProp;
};

const PASSWORD_RULES = [
    { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
    { label: 'One uppercase letter (A-Z)', test: (p: string) => /[A-Z]/.test(p) },
    { label: 'One lowercase letter (a-z)', test: (p: string) => /[a-z]/.test(p) },
    { label: 'One number (0-9)', test: (p: string) => /[0-9]/.test(p) },
    { label: 'One special character (!@#$...)', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export default function SignupScreen({ navigation }: Props) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const allRulesPassed = PASSWORD_RULES.every((r) => r.test(password));

    async function signUpWithEmail() {
        if (!name || !email || !password) {
            Alert.alert('Missing Fields', 'Please fill in all fields.');
            return;
        }

        if (!allRulesPassed) {
            Alert.alert('Weak Password', 'Please meet all password requirements listed below.');
            return;
        }

        setLoading(true);
        const {
            data: { session },
            error,
        } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name, // Note: This will be managed by the trigger in the DB
                }
            }
        });

        if (error) {
            Alert.alert('Signup Error', error.message);
        } else {
            // Sign out so the user must login manually
            await supabase.auth.signOut();
            Alert.alert('Account Created!', 'Please sign in with your new credentials.');
            navigation.navigate('Login');
        }
        setLoading(false);
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.formContainer}>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>Join us and start reporting</Text>

                <Input
                    label="Full Name"
                    placeholder="John Doe"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                />

                <Input
                    label="Email"
                    placeholder="email@example.com"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />

                <View style={styles.passwordContainer}>
                    <Input
                        label="Password"
                        placeholder="Create a strong password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                        style={styles.eyeButton}
                        onPress={() => setShowPassword(!showPassword)}
                    >
                        <Ionicons
                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={22}
                            color="#6B7280"
                        />
                    </TouchableOpacity>
                </View>

                {/* Password strength rules */}
                {password.length > 0 && (
                    <View style={styles.rulesContainer}>
                        {PASSWORD_RULES.map((rule, i) => {
                            const passed = rule.test(password);
                            return (
                                <View key={i} style={styles.ruleRow}>
                                    <Ionicons
                                        name={passed ? 'checkmark-circle' : 'close-circle'}
                                        size={16}
                                        color={passed ? '#059669' : '#EF4444'}
                                    />
                                    <Text style={[styles.ruleText, passed && styles.ruleTextPassed]}>
                                        {rule.label}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                )}

                <Button
                    title="Sign Up"
                    onPress={signUpWithEmail}
                    loading={loading}
                    disabled={!allRulesPassed}
                    style={styles.button}
                />

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Already have an account? </Text>
                    <Text
                        style={styles.linkText}
                        onPress={() => navigation.navigate('Login')}
                    >
                        Sign in
                    </Text>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#D6C28A',
    },
    formContainer: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        marginBottom: 24,
    },
    passwordContainer: {
        position: 'relative',
    },
    eyeButton: {
        position: 'absolute',
        right: 12,
        top: 38,
        padding: 4,
    },
    rulesContainer: {
        backgroundColor: '#F3EBD2',
        borderRadius: 10,
        padding: 12,
        marginBottom: 8,
        gap: 6,
    },
    ruleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    ruleText: {
        fontSize: 13,
        color: '#6B7280',
    },
    ruleTextPassed: {
        color: '#059669',
    },
    button: {
        marginTop: 16,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    footerText: {
        color: '#6B7280',
        fontSize: 14,
    },
    linkText: {
        color: '#8A7B47',
        fontWeight: 'bold',
        fontSize: 14,
    },
});
