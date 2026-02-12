import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { BaseToolScreen } from '../../components/BaseToolScreen';
import { FFmpegKit, ReturnCode } from 'ffmpeg-kit-react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export const MagicCutScreen = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [stats, setStats] = useState<string | null>(null);

    const handleProcess = async (file: any) => {
        setIsProcessing(true);
        setStats(null);
        try {
            // 1. Detect silence (noise < -30dB, duration > 0.5s)
            const command = `-i "${file.uri}" -af silencedetect=noise=-30dB:d=0.5 -f null -`;
            
            const session = await FFmpegKit.execute(command);
            const returnCode = await session.getReturnCode();
            const output = await session.getOutput();

            if (ReturnCode.isSuccess(returnCode)) {
                // Parse output for silence_start and silence_end
                const silenceCount = (output.match(/silence_start/g) || []).length;
                if (silenceCount > 0) {
                    setStats(`Found ${silenceCount} silent pauses to remove.`);
                    Alert.alert('Analysis Complete', `Found ${silenceCount} silent segments. \n\n(Full auto-cut implementation coming in next update)`);
                } else {
                    setStats('No significant silence detected.');
                    Alert.alert('Analysis Complete', 'No silent segments found to remove.');
                }
            } else {
                throw new Error('Analysis failed');
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
            buttonText="Analyze Silence"
            processingText="Analyzing Audio..."
        >
            <View style={styles.infoContainer}>
                <MaterialCommunityIcons name="waveform" size={40} color="#007AFF" />
                <Text style={styles.title}>Magic Cut</Text>
                <Text style={styles.description}>
                    Automatically detect and remove silent pauses from your video. Great for vlogs and tutorials.
                </Text>
            </View>

            {stats && (
                <View style={styles.statsContainer}>
                    <Text style={styles.statsText}>{stats}</Text>
                </View>
            )}
        </BaseToolScreen>
    );
};

const styles = StyleSheet.create({
    infoContainer: { alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 20, fontWeight: 'bold', marginTop: 10, marginBottom: 5 },
    description: { textAlign: 'center', color: '#666', lineHeight: 20 },
    statsContainer: { marginTop: 20, padding: 15, backgroundColor: '#F2F2F7', borderRadius: 10, alignItems: 'center' },
    statsText: { fontSize: 16, fontWeight: '600', color: '#007AFF' }
});
