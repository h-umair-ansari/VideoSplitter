import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export const AutoCaptionsScreen = () => {
    return (
        <View style={styles.container}>
            <MaterialCommunityIcons name="subtitles-outline" size={80} color="#FF9500" />
            <Text style={styles.title}>Auto Captions</Text>
            <Text style={styles.description}>
                Generate subtitles automatically using AI.
            </Text>
            <View style={styles.badge}>
                <Text style={styles.badgeText}>COMING SOON</Text>
            </View>
            <Text style={styles.techInfo}>
                Requires: OpenAI Whisper Model (On-Device)
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
    title: { fontSize: 24, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
    description: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30 },
    badge: { backgroundColor: '#FF9500', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 20, marginBottom: 20 },
    badgeText: { color: '#fff', fontWeight: 'bold' },
    techInfo: { fontSize: 12, color: '#999', marginTop: 20 }
});
