import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { BaseToolScreen } from '../../components/BaseToolScreen';
import RNFS from 'react-native-fs';
import { FFmpegKit, ReturnCode } from 'ffmpeg-kit-react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const SOCIAL_PRESETS = [
    { id: 'whatsapp', name: 'WhatsApp', duration: 30, icon: 'whatsapp' },
    { id: 'insta_story', name: 'Story', duration: 15, icon: 'instagram' },
    { id: 'tiktok', name: 'TikTok', duration: 60, icon: 'music-note' },
];

export const SplitScreen = () => {
    const [splitDuration, setSplitDuration] = useState('30');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleProcess = async (file: any) => {
        const duration = parseInt(splitDuration);
        if (isNaN(duration) || duration <= 0) {
            Alert.alert('Error', 'Please enter a valid duration');
            return;
        }

        setIsProcessing(true);
        try {
            const timestamp = Date.now();
            const outputDir = `${RNFS.DocumentDirectoryPath}/split_parts_${timestamp}`;
            await RNFS.mkdir(outputDir);
            const outputPathPattern = `${outputDir}/part_%03d.mp4`;

            let inputPath = file.uri;
            if (inputPath.startsWith('file://')) {
                inputPath = inputPath.replace('file://', '');
            }

            const command = `-i "${inputPath}" -c:v libx264 -preset ultrafast -crf 22 -c:a aac -map 0 -segment_time ${duration} -f segment -reset_timestamps 1 "${outputPathPattern}"`;
            
            const session = await FFmpegKit.execute(command);
            const success = ReturnCode.isSuccess(await session.getReturnCode());

            if (success) {
                Alert.alert('Success', 'Video split successfully!');
            } else {
                throw new Error('Split failed');
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
            buttonText="Split Video"
            processingText="Splitting..."
        >
            <Text style={styles.label}>Split Interval (Seconds)</Text>
            <View style={styles.presetContainer}>
                {SOCIAL_PRESETS.map(preset => (
                    <TouchableOpacity
                        key={preset.id}
                        style={[styles.presetButton, splitDuration === preset.duration.toString() && styles.activePreset]}
                        onPress={() => setSplitDuration(preset.duration.toString())}
                    >
                        <MaterialCommunityIcons name={preset.icon} size={20} color={splitDuration === preset.duration.toString() ? '#fff' : '#333'} />
                        <Text style={[styles.presetText, splitDuration === preset.duration.toString() && styles.activePresetText]}>
                            {preset.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
            <TextInput
                style={styles.input}
                value={splitDuration}
                onChangeText={setSplitDuration}
                keyboardType="numeric"
                placeholder="Custom Duration"
            />
        </BaseToolScreen>
    );
};

const styles = StyleSheet.create({
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
        color: '#333',
    },
    presetContainer: {
        flexDirection: 'row',
        marginBottom: 16,
        gap: 8,
    },
    presetButton: {
        flex: 1,
        padding: 12,
        backgroundColor: '#F2F2F7',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    activePreset: {
        backgroundColor: '#007AFF',
    },
    presetText: {
        color: '#333',
        fontWeight: '500',
        fontSize: 12,
    },
    activePresetText: {
        color: '#fff',
        fontWeight: '700',
    },
    input: {
        backgroundColor: '#F2F2F7',
        padding: 12,
        borderRadius: 8,
        fontSize: 16,
    },
});
