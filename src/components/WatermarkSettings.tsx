import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { WatermarkConfig, WatermarkPosition } from '../types';

interface WatermarkSettingsProps {
    config: WatermarkConfig;
    onChange: (config: WatermarkConfig) => void;
}

const COLORS = [
    { label: 'White', value: 'white' },
    { label: 'Black', value: 'black' },
    { label: 'Red', value: 'red' },
    { label: 'Blue', value: 'blue' },
    { label: 'Yellow', value: 'yellow' },
    { label: 'Green', value: 'green' },
];

const POSITIONS: { label: string; value: WatermarkPosition }[] = [
    { label: '↖️ Top Left', value: 'TOP_LEFT' },
    { label: '↗️ Top Right', value: 'TOP_RIGHT' },
    { label: '⏺️ Center', value: 'CENTER' },
    { label: '↙️ Bottom Left', value: 'BOTTOM_LEFT' },
    { label: '↘️ Bottom Right', value: 'BOTTOM_RIGHT' },
];

export const WatermarkSettings: React.FC<WatermarkSettingsProps> = ({ config, onChange }) => {

    const updateConfig = (key: keyof WatermarkConfig, value: any) => {
        onChange({ ...config, [key]: value });
    };

    return (
        <View style={styles.container}>
            <View style={styles.section}>
                <Text style={styles.label}>Text</Text>
                <TextInput
                    style={styles.input}
                    value={config.text}
                    onChangeText={(text) => updateConfig('text', text)}
                    placeholder="Enter watermark text..."
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>Position</Text>
                <View style={styles.positionGrid}>
                    {POSITIONS.map((pos) => (
                        <TouchableOpacity
                            key={pos.value}
                            style={[
                                styles.positionButton,
                                config.position === pos.value && styles.activePosition
                            ]}
                            onPress={() => updateConfig('position', pos.value)}
                        >
                            <Text style={[
                                styles.positionText,
                                config.position === pos.value && styles.activePositionText
                            ]}>
                                {pos.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.row}>
                <View style={[styles.section, { flex: 1, marginRight: 10 }]}>
                    <Text style={styles.label}>Size</Text>
                    <TextInput
                        style={styles.input}
                        value={config.fontSize}
                        onChangeText={(text) => updateConfig('fontSize', text)}
                        keyboardType="numeric"
                        placeholder="24"
                    />
                </View>

                <View style={[styles.section, { flex: 2 }]}>
                    <Text style={styles.label}>Color</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {COLORS.map((color) => (
                            <TouchableOpacity
                                key={color.value}
                                style={[
                                    styles.colorButton,
                                    { backgroundColor: color.value },
                                    config.fontColor === color.value && styles.activeColor
                                ]}
                                onPress={() => updateConfig('fontColor', color.value)}
                            />
                        ))}
                    </ScrollView>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 10,
    },
    section: {
        marginBottom: 16,
    },
    row: {
        flexDirection: 'row',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3A3A3C',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E5E5EA',
        borderRadius: 8,
        padding: 10,
        backgroundColor: '#fff',
        fontSize: 16,
    },
    positionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    positionButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#F2F2F7',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    activePosition: {
        backgroundColor: '#E1F0FF',
        borderColor: '#007AFF',
    },
    positionText: {
        fontSize: 12,
        color: '#3A3A3C',
    },
    activePositionText: {
        color: '#007AFF',
        fontWeight: '600',
    },
    colorButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    activeColor: {
        borderWidth: 3,
        borderColor: '#007AFF',
    },
});