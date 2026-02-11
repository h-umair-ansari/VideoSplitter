import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { BaseToolScreen } from '../../components/BaseToolScreen';
import RNFS from 'react-native-fs';
import { cropVideo, getVideoDimensions } from '../../utils/ffmpeg';

export const CropScreen = () => {
    const [cropRatio, setCropRatio] = useState('Original');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleProcess = async (file: any) => {
        if (cropRatio === 'Original') {
            Alert.alert('Error', 'Please select a different aspect ratio');
            return;
        }

        setIsProcessing(true);
        try {
            const timestamp = Date.now();
            const outputDir = `${RNFS.DocumentDirectoryPath}/crop_session_${timestamp}`;
            await RNFS.mkdir(outputDir);
            const outputPath = `${outputDir}/cropped.mp4`;

            let inputPath = file.uri;
            if (inputPath.startsWith('file://')) inputPath = inputPath.replace('file://', '');

            const dims = await getVideoDimensions(inputPath);
            if (!dims) throw new Error("Could not get video dimensions");

            const { width: vw, height: vh } = dims;
            let targetRatio = 0;
            const [rw, rh] = cropRatio.split(':').map(Number);
            targetRatio = rw / rh;

            let w = vw;
            let h = vh;

            if (vw / vh > targetRatio) {
                h = vh;
                w = Math.round(vh * targetRatio);
            } else {
                w = vw;
                h = Math.round(vw / targetRatio);
            }
            
            if (w % 2 !== 0) w -= 1;
            if (h % 2 !== 0) h -= 1;

            const x = Math.round((vw - w) / 2);
            const y = Math.round((vh - h) / 2);

            const success = await cropVideo(inputPath, outputPath, w, h, x, y);

            if (success) {
                Alert.alert('Success', 'Video cropped successfully!');
            } else {
                throw new Error('Crop failed');
            }
        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <BaseToolScreen onProcess={handleProcess} isProcessing={isProcessing} buttonText="Crop Video" processingText="Cropping...">
            <Text style={styles.label}>Aspect Ratio</Text>
            <View style={styles.row}>
                {['1:1', '4:5', '16:9', '9:16'].map((r) => (
                    <TouchableOpacity
                        key={r}
                        style={[styles.ratioButton, cropRatio === r && styles.activeRatio]}
                        onPress={() => setCropRatio(r)}
                    >
                        <Text style={[styles.ratioText, cropRatio === r && styles.activeRatioText]}>{r}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </BaseToolScreen>
    );
};

const styles = StyleSheet.create({
    label: { fontSize: 16, fontWeight: '600', marginBottom: 12, color: '#333' },
    row: { flexDirection: 'row', gap: 8 },
    ratioButton: { flex: 1, padding: 12, backgroundColor: '#F2F2F7', borderRadius: 8, alignItems: 'center' },
    activeRatio: { backgroundColor: '#007AFF' },
    ratioText: { fontWeight: '600', color: '#333' },
    activeRatioText: { color: '#fff' },
});
