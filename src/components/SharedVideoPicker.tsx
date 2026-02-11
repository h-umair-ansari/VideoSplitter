import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface SharedVideoPickerProps {
    onPickVideo: () => void;
    selectedFile: any;
    selectedThumbnail: string | null;
    selectedFiles?: any[]; // For merge mode
}

export const SharedVideoPicker: React.FC<SharedVideoPickerProps> = ({
    onPickVideo,
    selectedFile,
    selectedThumbnail,
    selectedFiles
}) => {
    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.pickButton} onPress={onPickVideo}>
                <MaterialCommunityIcons name="folder-open" size={24} color="#007AFF" />
                <Text style={styles.pickButtonText}>
                    {selectedFiles ? 'Select Videos (Multiple)' : 'Select Video'}
                </Text>
            </TouchableOpacity>

            {selectedFiles && selectedFiles.length > 0 ? (
                <View style={styles.selectedContainer}>
                    <View style={[styles.previewThumb, styles.placeholderThumb]}>
                        <MaterialCommunityIcons name="animation-play" size={30} color="#333" />
                    </View>
                    <View style={styles.fileDetails}>
                        <Text style={styles.fileName} numberOfLines={1}>{selectedFiles.length} files selected</Text>
                        <Text style={styles.fileSub}>Ready to merge</Text>
                    </View>
                </View>
            ) : selectedFile && (
                <View style={styles.selectedContainer}>
                    {selectedThumbnail ? (
                        <Image source={{ uri: `file://${selectedThumbnail}` }} style={styles.previewThumb} />
                    ) : (
                        <View style={[styles.previewThumb, styles.placeholderThumb]}>
                            <MaterialCommunityIcons name="video" size={30} color="#333" />
                        </View>
                    )}
                    <View style={styles.fileDetails}>
                        <Text style={styles.fileName} numberOfLines={1}>{selectedFile.name}</Text>
                        <Text style={styles.fileSub}>Ready to process</Text>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    pickButton: {
        backgroundColor: '#E5E5EA',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
    },
    pickButtonText: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '600',
    },
    selectedContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9F9F9',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    previewThumb: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 12,
        backgroundColor: '#eee',
    },
    placeholderThumb: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    fileDetails: {
        flex: 1,
    },
    fileName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
        marginBottom: 2,
    },
    fileSub: {
        fontSize: 13,
        color: '#8E8E93',
    },
});
