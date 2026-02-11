import React, { useState } from 'react';
import { Alert, Text, StyleSheet } from 'react-native';
import { BaseToolScreen } from '../../components/BaseToolScreen';
import RNFS from 'react-native-fs';
import { mergeVideos } from '../../utils/ffmpeg';
import { createConcatFile } from '../../utils/fileSystem';

export const MergeScreen = () => {
    const [isProcessing, setIsProcessing] = useState(false);

    const handleProcess = async (files: any) => {
        if (!Array.isArray(files) || files.length < 2) {
            Alert.alert('Error', 'Please select at least 2 videos to merge');
            return;
        }

        setIsProcessing(true);
        try {
            const timestamp = Date.now();
            const outputDir = `${RNFS.DocumentDirectoryPath}/merge_session_${timestamp}`;
            await RNFS.mkdir(outputDir);
            const outputPath = `${outputDir}/merged.mp4`;
            const listPath = `${outputDir}/list.txt`;

            const cachedPaths = [];
            for (const f of files) {
                let path = f.uri;
                if (path.startsWith('file://')) path = path.replace('file://', '');
                cachedPaths.push(path);
            }

            await createConcatFile(cachedPaths, listPath);
            const success = await mergeVideos(listPath, outputPath);

            if (success) {
                Alert.alert('Success', 'Videos merged successfully!');
            } else {
                throw new Error('Merge failed');
            }
        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <BaseToolScreen 
            onProcess={handleProcess} 
            isProcessing={isProcessing} 
            buttonText="Merge Videos" 
            processingText="Merging..."
            multiSelection={true}
        >
            <Text style={styles.infoText}>Select multiple videos to merge them into one file.</Text>
        </BaseToolScreen>
    );
};

const styles = StyleSheet.create({
    infoText: { color: '#8E8E93', fontStyle: 'italic', textAlign: 'center', marginVertical: 10 },
});
