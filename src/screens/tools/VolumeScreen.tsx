import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { BaseToolScreen } from '../../components/BaseToolScreen';
import RNFS from 'react-native-fs';
import { adjustVolume } from '../../utils/ffmpeg';

export const VolumeScreen = () => {
    const [volumeMultiplier, setVolumeMultiplier] = useState(1.0);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleProcess = async (file: any) => {
        setIsProcessing(true);
        try {
            const timestamp = Date.now();
            const outputDir = `${RNFS.DocumentDirectoryPath}/volume_session_${timestamp}`;
            await RNFS.mkdir(outputDir);
            const outputPath = `${outputDir}/volume_adjusted.mp4`;

            let inputPath = file.uri;
            if (inputPath.startsWith('file://')) inputPath = inputPath.replace('file://', '');

            const success = await adjustVolume(inputPath, outputPath, volumeMultiplier);
            if (success) {
                Alert.alert('Success', 'Volume adjusted successfully!');
            } else {
                throw new Error('Volume adjustment failed');
            }
        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <BaseToolScreen onProcess={handleProcess} isProcessing={isProcessing} buttonText="Adjust Volume" processingText="Adjusting...">
            <Text style={styles.label}>Volume Multiplier</Text>
            <View style={styles.row}>
                {[0.0, 0.5, 1.0, 1.5, 2.0].map((v) => (
                    <TouchableOpacity
                        key={v}
                        style={[styles.btn, volumeMultiplier === v && styles.activeBtn]}
                        onPress={() => setVolumeMultiplier(v)}
                    >
                        <Text style={[styles.txt, volumeMultiplier === v && styles.activeTxt]}>
                            {v === 0 ? 'Mute' : `${v}x`}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </BaseToolScreen>
    );
};

const styles = StyleSheet.create({
    label: { fontSize: 16, fontWeight: '600', marginBottom: 12, color: '#333' },
    row: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
    btn: { flex: 1, padding: 12, backgroundColor: '#F2F2F7', borderRadius: 8, alignItems: 'center' },
    activeBtn: { backgroundColor: '#007AFF' },
    txt: { fontWeight: '600', color: '#333' },
    activeTxt: { color: '#fff' }
});
