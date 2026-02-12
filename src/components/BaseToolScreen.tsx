import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { SharedVideoPicker } from './SharedVideoPicker';
import { useVideoPicker } from '../hooks/useVideoPicker';

interface BaseToolScreenProps {
    children: React.ReactNode;
    onProcess: (file: any) => Promise<void>;
    isProcessing: boolean;
    processingText?: string;
    buttonText: string;
    multiSelection?: boolean;
}

export const BaseToolScreen: React.FC<BaseToolScreenProps> = ({
    children,
    onProcess,
    isProcessing,
    processingText = 'Processing...',
    buttonText,
    multiSelection = false
}) => {
    const { selectedFile, selectedFiles, selectedThumbnail, pickVideo } = useVideoPicker(multiSelection);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <SharedVideoPicker 
                onPickVideo={pickVideo} 
                selectedFile={selectedFile} 
                selectedFiles={multiSelection ? selectedFiles : undefined}
                selectedThumbnail={selectedThumbnail} 
            />

            <View style={styles.card}>
                {children}

                <TouchableOpacity 
                    style={[styles.processButton, (isProcessing || (!selectedFile && !selectedFiles?.length)) && styles.disabledButton]}
                    onPress={() => onProcess(multiSelection ? selectedFiles : selectedFile)}
                    disabled={isProcessing || (!selectedFile && !selectedFiles?.length)}
                >
                    {isProcessing ? (
                        <View style={styles.row}>
                            <ActivityIndicator color="#fff" />
                            <Text style={styles.processButtonText}>{processingText}</Text>
                        </View>
                    ) : (
                        <Text style={styles.processButtonText}>{buttonText}</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    content: {
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    processButton: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 24,
    },
    disabledButton: {
        backgroundColor: '#C7C7CC',
    },
    processButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        marginLeft: 8,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    }
});
