import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { BaseToolScreen } from '../../components/BaseToolScreen';
import { WatermarkSettings } from '../../components/WatermarkSettings';
import { WatermarkConfig } from '../../types';
import RNFS from 'react-native-fs';
import { addWatermark } from '../../utils/ffmpeg';

export const WatermarkScreen = () => {
    const [config, setConfig] = useState<WatermarkConfig>({
        text: '',
        position: 'BOTTOM_RIGHT',
        fontSize: '24',
        fontColor: 'white'
    });
    const [isProcessing, setIsProcessing] = useState(false);

    const handleProcess = async (file: any) => {
        if (!config.text || config.text.trim().length === 0) {
            Alert.alert('Error', 'Please enter watermark text');
            return;
        }

        setIsProcessing(true);
        try {
            const timestamp = Date.now();
            const outputDir = `${RNFS.DocumentDirectoryPath}/watermark_session_${timestamp}`;
            await RNFS.mkdir(outputDir);
            const outputPath = `${outputDir}/watermarked.mp4`;

            let inputPath = file.uri;
            if (inputPath.startsWith('file://')) inputPath = inputPath.replace('file://', '');

            const success = await addWatermark(inputPath, outputPath, config);

            if (success) {
                Alert.alert('Success', 'Watermark added successfully!');
            } else {
                throw new Error('Watermark failed');
            }
        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <BaseToolScreen onProcess={handleProcess} isProcessing={isProcessing} buttonText="Add Watermark" processingText="Adding Watermark...">
            <WatermarkSettings config={config} onChange={setConfig} />
        </BaseToolScreen>
    );
};
