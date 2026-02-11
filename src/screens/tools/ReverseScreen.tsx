import React, { useState } from 'react';
import { Alert } from 'react-native';
import { BaseToolScreen } from '../../components/BaseToolScreen';
import RNFS from 'react-native-fs';
import { reverseVideo } from '../../utils/ffmpeg';

export const ReverseScreen = () => {
    const [isProcessing, setIsProcessing] = useState(false);

    const handleProcess = async (file: any) => {
        setIsProcessing(true);
        try {
            const timestamp = Date.now();
            const outputDir = `${RNFS.DocumentDirectoryPath}/reverse_session_${timestamp}`;
            await RNFS.mkdir(outputDir);
            const outputPath = `${outputDir}/reversed.mp4`;

            let inputPath = file.uri;
            if (inputPath.startsWith('file://')) inputPath = inputPath.replace('file://', '');

            const success = await reverseVideo(inputPath, outputPath);
            if (success) Alert.alert('Success', 'Video reversed successfully!');
            else throw new Error('Reverse failed');
        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return <BaseToolScreen onProcess={handleProcess} isProcessing={isProcessing} buttonText="Reverse Video" processingText="Reversing..." children={null} />;
};
