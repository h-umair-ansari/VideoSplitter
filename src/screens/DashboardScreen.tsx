import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
const FEATURES = [
    { id: 'Split', name: 'Split Video', icon: 'scissors-cutting', color: '#FF3B30' },
    { id: 'Trim', name: 'Trim Video', icon: 'movie-open-edit', color: '#FF9500' },
    { id: 'Crop', name: 'Crop Video', icon: 'crop', color: '#FFCC00' },
    { id: 'Merge', name: 'Merge Videos', icon: 'link-variant', color: '#4CD964' },
    { id: 'Audio', name: 'Extract Audio', icon: 'music-note', color: '#5AC8FA' },
    { id: 'Volume', name: 'Adjust Volume', icon: 'volume-high', color: '#007AFF' },
    { id: 'Filter', name: 'Filters', icon: 'palette', color: '#5856D6' },
    { id: 'Reverse', name: 'Reverse', icon: 'rewind', color: '#AF52DE' },
    { id: 'Compress', name: 'Compress', icon: 'file-compress', color: '#FF2D55' },
    { id: 'Gif', name: 'Video to GIF', icon: 'gif', color: '#A2845E' },
    { id: 'Speed', name: 'Change Speed', icon: 'speedometer', color: '#8E8E93' },
    { id: 'Watermark', name: 'Watermark', icon: 'watermark', color: '#3A3A3C' },
];

export const DashboardScreen = () => {
    const navigation = useNavigation<any>();

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.headerTitle}>Video Toolkit</Text>
                <Text style={styles.headerSubtitle}>Select a tool to get started</Text>
                
                <View style={styles.grid}>
                    {FEATURES.map((feature) => (
                        <TouchableOpacity 
                            key={feature.id} 
                            style={styles.card}
                            onPress={() => navigation.navigate(feature.id)}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: feature.color + '20' }]}>
                                <MaterialCommunityIcons name={feature.icon} size={32} color={feature.color} />
                            </View>
                            <Text style={styles.cardTitle}>{feature.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    scrollContent: {
        padding: 20,
    },
    headerTitle: {
        fontSize: 34,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 17,
        color: '#8E8E93',
        marginBottom: 24,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    card: {
        width: '47%',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 20,
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
        textAlign: 'center',
    },
});
