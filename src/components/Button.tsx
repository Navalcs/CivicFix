import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacityProps,
} from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    loading?: boolean;
    variant?: 'primary' | 'secondary' | 'outline';
}

export function Button({
    title,
    loading = false,
    variant = 'primary',
    style,
    disabled,
    ...props
}: ButtonProps) {
    const getContainerStyle = () => {
        switch (variant) {
            case 'secondary':
                return styles.secondaryContainer;
            case 'outline':
                return styles.outlineContainer;
            default:
                return styles.primaryContainer;
        }
    };

    const getTextStyle = () => {
        switch (variant) {
            case 'secondary':
                return styles.secondaryText;
            case 'outline':
                return styles.outlineText;
            default:
                return styles.primaryText;
        }
    };

    return (
        <TouchableOpacity
            style={[
                styles.container,
                getContainerStyle(),
                disabled || loading ? styles.disabled : null,
                style,
            ]}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'outline' ? '#8A7B47' : '#FFFFFF'} />
            ) : (
                <Text style={[styles.text, getTextStyle()]}>{title}</Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    primaryContainer: {
        backgroundColor: '#8A7B47',
    },
    secondaryContainer: {
        backgroundColor: '#D4C9A0',
    },
    outlineContainer: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#8A7B47',
    },
    disabled: {
        opacity: 0.6,
    },
    text: {
        fontSize: 16,
        fontWeight: '600',
    },
    primaryText: {
        color: '#FFFFFF',
    },
    secondaryText: {
        color: '#374151',
    },
    outlineText: {
        color: '#8A7B47',
    },
});
