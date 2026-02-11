import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert } from 'react-native';
import { BaseToolScreen } from '../../components/BaseToolScreen';
import RNFS from 'react-native-fs';
import { trimVideo } from '../../utils/ffmpeg';

export const TrimScreen = () => {
    const [trimStart, setTrimStart] = useState('00:00:00');
    const [trimEnd, setTrimEnd] = useState('00:00:10');
    const [isProcessing, setIsProcessing] = useState(false);

    const parseTimeSeconds = (timeStr: string): number => {
        const parts = timeStr.split(':').map(Number);
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        return parts[0];
    };

    const handleProcess = async (file: any) => {
        const startSec = parseTimeSeconds(trimStart);
        const endSec = parseTimeSeconds(trimEnd);
        if (isNaN(startSec) || isNaN(endSec) || endSec <= startSec) {
            Alert.alert('Error', 'Please enter valid start and end times (End > Start)');
            return;
        }

        setIsProcessing(true);
        try {
            const timestamp = Date.now();
            const outputDir = `${RNFS.DocumentDirectoryPath}/trim_session_${timestamp}`;
            await RNFS.mkdir(outputDir);
            const outputPath = `${outputDir}/trimmed.mp4`;

            let inputPath = file.uri;
            if (inputPath.startsWith('file://')) inputPath = inputPath.replace('file://', '');

            const duration = endSec - startSec;
            const success = await trimVideo(inputPath, outputPath, trimStart, duration.toString());

            if (success) {
                Alert.alert('Success', 'Video trimmed successfully!');
            } else {
                throw new Error('Trim failed');
            }
        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <BaseToolScreen onProcess={handleProcess} isProcessing={isProcessing} buttonText="Trim Video" processingText="Trimming...">
            <Text style={styles.label}>Trim Range (HH:MM:SS)</Text>
            <View style={styles.row}>
                <View style={styles.inputGroup}>
                    <Text style={styles.subLabel}>Start Time</Text>
                    <TextInput style={styles.timeInput} value={trimStart} onChangeText={setTrimStart} placeholder="00:00:00" />
                </View>
                <Text style={styles.toText}>to</Text>
                <View style={styles.inputGroup}>
                    <Text style={styles.subLabel}>End Time</Text>
                    <TextInput style={styles.timeInput} value={trimEnd} onChangeText={setTrimEnd} placeholder="00:00:10" />
                </View>
            </View>
        </BaseToolScreen>
    );
};

const styles = StyleSheet.create({
    label: { fontSize: 16, fontWeight: '600', marginBottom: 12, color: '#333' },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    inputGroup: { flex: 1 },
    subLabel: { fontSize: 12, color: '#8E8E93', marginBottom: 4 },
    timeInput: { borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 8, padding: 10, backgroundColor: '#F2F2F7', textAlign: 'center' },
    toText: { marginHorizontal: 12, color: '#8E8E93' },
});
