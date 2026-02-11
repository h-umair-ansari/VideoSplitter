import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert } from 'react-native';
import { BaseToolScreen } from '../../components/BaseToolScreen';
import RNFS from 'react-native-fs';
import { convertToGif } from '../../utils/ffmpeg';

export const GifScreen = () => {
    const [fps, setFps] = useState('10');
    const [width, setWidth] = useState('320');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleProcess = async (file: any) => {
        setIsProcessing(true);
        try {
            const timestamp = Date.now();
            const outputDir = `${RNFS.DocumentDirectoryPath}/gif_session_${timestamp}`;
            await RNFS.mkdir(outputDir);
            const outputPath = `${outputDir}/output.gif`;

            let inputPath = file.uri;
            if (inputPath.startsWith('file://')) inputPath = inputPath.replace('file://', '');

            const success = await convertToGif(inputPath, outputPath, parseInt(fps) || 10, parseInt(width) || 320);
            if (success) Alert.alert('Success', 'GIF created successfully!');
            else throw new Error('GIF conversion failed');
        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <BaseToolScreen onProcess={handleProcess} isProcessing={isProcessing} buttonText="Convert to GIF" processingText="Converting...">
            <View style={styles.row}>
                <View style={styles.grp}>
                    <Text style={styles.label}>FPS</Text>
                    <TextInput style={styles.input} value={fps} onChangeText={setFps} keyboardType="numeric" />
                </View>
                <View style={styles.grp}>
                    <Text style={styles.label}>Width (px)</Text>
                    <TextInput style={styles.input} value={width} onChangeText={setWidth} keyboardType="numeric" />
                </View>
            </View>
        </BaseToolScreen>
    );
};
const styles = StyleSheet.create({
    row: { flexDirection: 'row', gap: 16 },
    grp: { flex: 1 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#333' },
    input: { borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 8, padding: 12, backgroundColor: '#F2F2F7' }
});
