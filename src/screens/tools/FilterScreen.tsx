import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { BaseToolScreen } from '../../components/BaseToolScreen';
import { FilterConfig } from '../../types';
import RNFS from 'react-native-fs';
import { applyFilter } from '../../utils/ffmpeg';

export const FilterScreen = () => {
    const [config, setConfig] = useState<FilterConfig>({ brightness: 0.0, contrast: 1.0, saturation: 1.0 });
    const [isProcessing, setIsProcessing] = useState(false);

    const handleProcess = async (file: any) => {
        setIsProcessing(true);
        try {
            const timestamp = Date.now();
            const outputDir = `${RNFS.DocumentDirectoryPath}/filter_session_${timestamp}`;
            await RNFS.mkdir(outputDir);
            const outputPath = `${outputDir}/filtered.mp4`;

            let inputPath = file.uri;
            if (inputPath.startsWith('file://')) inputPath = inputPath.replace('file://', '');

            const success = await applyFilter(inputPath, outputPath, config);
            if (success) {
                Alert.alert('Success', 'Filter applied successfully!');
            } else {
                throw new Error('Filter failed');
            }
        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const update = (key: keyof FilterConfig, value: number) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    return (
        <BaseToolScreen onProcess={handleProcess} isProcessing={isProcessing} buttonText="Apply Filter" processingText="Filtering...">
            <View style={styles.controlRow}>
                <Text style={styles.label}>Brightness ({config.brightness.toFixed(1)})</Text>
                <View style={styles.buttons}>
                    <TouchableOpacity onPress={() => update('brightness', Math.max(-1, config.brightness - 0.1))}>
                        <Text style={styles.btnText}>-</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => update('brightness', Math.min(1, config.brightness + 0.1))}>
                        <Text style={styles.btnText}>+</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.controlRow}>
                <Text style={styles.label}>Contrast ({config.contrast.toFixed(1)})</Text>
                <View style={styles.buttons}>
                    <TouchableOpacity onPress={() => update('contrast', Math.max(0, config.contrast - 0.1))}>
                        <Text style={styles.btnText}>-</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => update('contrast', Math.min(2, config.contrast + 0.1))}>
                        <Text style={styles.btnText}>+</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.controlRow}>
                <Text style={styles.label}>Saturation ({config.saturation.toFixed(1)})</Text>
                <View style={styles.buttons}>
                    <TouchableOpacity onPress={() => update('saturation', Math.max(0, config.saturation - 0.1))}>
                        <Text style={styles.btnText}>-</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => update('saturation', Math.min(3, config.saturation + 0.1))}>
                        <Text style={styles.btnText}>+</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </BaseToolScreen>
    );
};

const styles = StyleSheet.create({
    controlRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        backgroundColor: '#F9F9F9',
        padding: 12,
        borderRadius: 8
    },
    label: { fontWeight: '600', color: '#333' },
    buttons: { flexDirection: 'row', gap: 15 },
    btnText: { fontSize: 24, color: '#007AFF', fontWeight: 'bold', paddingHorizontal: 10 }
});
