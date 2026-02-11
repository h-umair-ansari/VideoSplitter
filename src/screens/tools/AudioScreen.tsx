import React, { useState } from 'react';
import { Alert } from 'react-native';
import { BaseToolScreen } from '../../components/BaseToolScreen';
import RNFS from 'react-native-fs';
import { extractAudio } from '../../utils/ffmpeg';

export const AudioScreen = () => {
    const [isProcessing, setIsProcessing] = useState(false);

    const handleProcess = async (file: any) => {
        setIsProcessing(true);
        try {
            const timestamp = Date.now();
            const outputDir = `${RNFS.DocumentDirectoryPath}/audio_session_${timestamp}`;
            await RNFS.mkdir(outputDir);
            const outputPath = `${outputDir}/audio.mp3`;

            let inputPath = file.uri;
            if (inputPath.startsWith('file://')) inputPath = inputPath.replace('file://', '');

            const success = await extractAudio(inputPath, outputPath);
            if (success) Alert.alert('Success', 'Audio extracted successfully!');
            else throw new Error('Extraction failed');
        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return <BaseToolScreen onProcess={handleProcess} isProcessing={isProcessing} buttonText="Extract Audio" processingText="Extracting..." children={null} />;
};
