import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';

import { useAuth, AuthProvider } from '../hooks/useAuth';
import { AuthStackParamList, MainTabParamList, RootStackParamList } from './types';

// Screens
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import DashboardScreen from '../screens/main/DashboardScreen';
import ReportIssueScreen from '../screens/main/ReportIssueScreen';
import MyReportsScreen from '../screens/main/MyReportsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import ComplaintDetailScreen from '../screens/main/ComplaintDetailScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';
import { HeaderAvatar } from '../components/HeaderAvatar';
import { ActivityIndicator, View } from 'react-native';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

function AuthNavigator() {
    return (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
            <AuthStack.Screen name="Login" component={LoginScreen} />
            <AuthStack.Screen name="Signup" component={SignupScreen} />
        </AuthStack.Navigator>
    );
}

function MainNavigator() {
    return (
        <MainTab.Navigator
            screenOptions={({ route }: { route: import('@react-navigation/native').RouteProp<MainTabParamList> }): BottomTabNavigationOptions => ({
                tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
                    let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';
                    if (route.name === 'Dashboard') iconName = focused ? 'home' : 'home-outline';
                    else if (route.name === 'Report') iconName = focused ? 'add-circle' : 'add-circle-outline';
                    else if (route.name === 'MyReports') iconName = focused ? 'list' : 'list-outline';
                    else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
                    return <Ionicons name={iconName} color={color} size={size} />;
                },
                tabBarActiveTintColor: '#1F2937',
                tabBarInactiveTintColor: '#4B5563',
                tabBarStyle: { backgroundColor: '#E5D8B0', borderTopColor: '#D4C9A0' },
                headerShown: true,
                headerStyle: { backgroundColor: '#A88C6C' },
                headerTintColor: '#1F2937',
                headerTitleStyle: { fontWeight: 'bold' },
                headerRight: () => <HeaderAvatar />,
            })}
        >
            <MainTab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{ headerShown: false }}
            />
            <MainTab.Screen
                name="Report"
                component={ReportIssueScreen}
                options={{ title: 'New Report' }}
            />
            <MainTab.Screen
                name="MyReports"
                component={MyReportsScreen}
                options={{ title: 'Reports' }}
            />
            <MainTab.Screen
                name="Profile"
                component={ProfileScreen}
                options={({ navigation: nav }) => ({
                    headerRight: () => (
                        <Ionicons
                            name="settings-outline"
                            size={24}
                            color="#1F2937"
                            style={{ marginRight: 12 }}
                            onPress={() => nav.getParent()?.navigate('Settings')}
                        />
                    ),
                })}
            />
        </MainTab.Navigator>
    );
}

function RootNavigator() {
    const { session, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#D6C28A' }}>
                <ActivityIndicator size="large" color="#8A7B47" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <RootStack.Navigator screenOptions={{ headerShown: false }}>
                {session ? (
                    <>
                        <RootStack.Screen name="Main" component={MainNavigator} />
                        <RootStack.Screen name="ReportDetail" component={ComplaintDetailScreen} />
                        <RootStack.Screen name="Settings" component={SettingsScreen} />
                        <RootStack.Screen name="EditProfile" component={EditProfileScreen} />
                    </>
                ) : (
                    <RootStack.Screen name="Auth" component={AuthNavigator} />
                )}
            </RootStack.Navigator>
        </NavigationContainer>
    );
}

export default function Navigation() {
    return (
        <AuthProvider>
            <RootNavigator />
        </AuthProvider>
    );
}
