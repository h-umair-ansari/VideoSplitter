import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { BaseToolScreen } from '../../components/BaseToolScreen';
import RNFS from 'react-native-fs';
import { changeSpeed } from '../../utils/ffmpeg';

export const SpeedScreen = () => {
    const [speed, setSpeed] = useState('1.0');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleProcess = async (file: any) => {
        setIsProcessing(true);
        try {
            const timestamp = Date.now();
            const outputDir = `${RNFS.DocumentDirectoryPath}/speed_session_${timestamp}`;
            await RNFS.mkdir(outputDir);
            const outputPath = `${outputDir}/speed_adjusted.mp4`;

            let inputPath = file.uri;
            if (inputPath.startsWith('file://')) inputPath = inputPath.replace('file://', '');

            const success = await changeSpeed(inputPath, outputPath, parseFloat(speed) || 1.0);
            if (success) Alert.alert('Success', 'Speed adjusted successfully!');
            else throw new Error('Speed adjustment failed');
        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <BaseToolScreen onProcess={handleProcess} isProcessing={isProcessing} buttonText="Change Speed" processingText="Processing...">
            <Text style={styles.label}>Playback Speed</Text>
            <View style={styles.row}>
                {['0.5', '1.0', '1.5', '2.0'].map((s) => (
                    <TouchableOpacity key={s} style={[styles.btn, speed === s && styles.activeBtn]} onPress={() => setSpeed(s)}>
                        <Text style={[styles.txt, speed === s && styles.activeTxt]}>{s}x</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </BaseToolScreen>
    );
};
const styles = StyleSheet.create({
    label: { fontSize: 16, fontWeight: '600', marginBottom: 12, color: '#333' },
    row: { flexDirection: 'row', gap: 8 },
    btn: { flex: 1, padding: 12, backgroundColor: '#F2F2F7', borderRadius: 8, alignItems: 'center' },
    activeBtn: { backgroundColor: '#007AFF' },
    txt: { fontWeight: '600', color: '#333' },
    activeTxt: { color: '#fff' }
});
