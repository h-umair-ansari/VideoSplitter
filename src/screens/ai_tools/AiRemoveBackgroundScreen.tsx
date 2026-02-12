import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export const AiRemoveBackgroundScreen = () => {
    return (
        <View style={styles.container}>
            <MaterialCommunityIcons name="account-box-outline" size={80} color="#AF52DE" />
            <Text style={styles.title}>Remove Background</Text>
            <Text style={styles.description}>
                Remove video background without a green screen.
            </Text>
            <View style={styles.badge}>
                <Text style={styles.badgeText}>COMING SOON</Text>
            </View>
            <Text style={styles.techInfo}>
                Requires: TensorFlow Lite / Google ML Kit
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
    title: { fontSize: 24, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
    description: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30 },
    badge: { backgroundColor: '#AF52DE', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 20, marginBottom: 20 },
    badgeText: { color: '#fff', fontWeight: 'bold' },
    techInfo: { fontSize: 12, color: '#999', marginTop: 20 }
});
