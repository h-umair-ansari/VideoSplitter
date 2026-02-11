import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { BaseToolScreen } from '../../components/BaseToolScreen';
import RNFS from 'react-native-fs';
import { compressVideo } from '../../utils/ffmpeg';

export const CompressScreen = () => {
    const [quality, setQuality] = useState('medium');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleProcess = async (file: any) => {
        setIsProcessing(true);
        try {
            const timestamp = Date.now();
            const outputDir = `${RNFS.DocumentDirectoryPath}/compress_session_${timestamp}`;
            await RNFS.mkdir(outputDir);
            const outputPath = `${outputDir}/compressed.mp4`;

            let inputPath = file.uri;
            if (inputPath.startsWith('file://')) inputPath = inputPath.replace('file://', '');

            const getCrf = (q: string) => {
                switch(q) {
                    case 'high': return '23';
                    case 'medium': return '28';
                    case 'low': return '35';
                    default: return '28';
                }
            };
            const success = await compressVideo(inputPath, outputPath, getCrf(quality));
            if (success) Alert.alert('Success', 'Video compressed successfully!');
            else throw new Error('Compression failed');
        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <BaseToolScreen onProcess={handleProcess} isProcessing={isProcessing} buttonText="Compress Video" processingText="Compressing...">
            <Text style={styles.label}>Quality Preset</Text>
            <View style={styles.row}>
                {['low', 'medium', 'high'].map((q) => (
                    <TouchableOpacity key={q} style={[styles.btn, quality === q && styles.activeBtn]} onPress={() => setQuality(q)}>
                        <Text style={[styles.txt, quality === q && styles.activeTxt]}>{q.toUpperCase()}</Text>
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
