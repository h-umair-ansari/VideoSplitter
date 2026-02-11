import React from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, Image, StyleSheet } from 'react-native';
import { SplitSession, SplitFile } from '../types';

interface SessionDetailsModalProps {
    session: SplitSession | null;
    onClose: () => void;
    onDelete: (session: SplitSession) => void;
    onSaveAll: (files: SplitFile[]) => void;
    onPreview: (path: string) => void;
    onSaveOne: (path: string) => void;
}

export const SessionDetailsModal: React.FC<SessionDetailsModalProps> = ({ 
    session, onClose, onDelete, onSaveAll, onPreview, onSaveOne 
}) => {
    return (
        <Modal
            visible={!!session}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{session?.name}</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>

                {session && (
                    <View style={styles.modalContent}>
                         <View style={styles.modalActions}>
                            <TouchableOpacity 
                                style={[styles.actionButton, styles.shareAllButton, { backgroundColor: '#34C759', marginTop: 8 }]} 
                                onPress={() => onSaveAll(session.files)}
                            >
                                <Text style={styles.actionButtonText}>💾 Save All</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.actionButton, styles.deleteActionButton, { marginTop: 8 }]} 
                                onPress={() => onDelete(session)}
                            >
                                <Text style={styles.actionButtonText}>🗑️ Delete</Text>
                            </TouchableOpacity>
                         </View>

                        <Text style={styles.sectionHeader}>Files ({session.files.length})</Text>

                        <FlatList
                            data={session.files}
                            keyExtractor={(item) => item.path}
                            renderItem={({ item, index }) => (
                                <View style={styles.fileItem}>
                                    <Image 
                                        source={item.thumbnail ? { uri: `file://${item.thumbnail}` } : undefined} 
                                        style={styles.fileIcon} 
                                    />
                                    <Text style={styles.fileNameItem}>Part {index + 1}</Text>
                                    <TouchableOpacity 
                                        style={[styles.miniButton, styles.previewButton]}
                                        onPress={() => onPreview(item.path)}
                                    >
                                        <Text style={styles.miniButtonText}>Preview</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[styles.miniButton, { marginLeft: 8 }]}
                                        onPress={() => onSaveOne(item.path)}
                                    >
                                        <Text style={styles.miniButtonText}>💾 Save</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                            style={styles.fileList}
                        />
                    </View>
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
  modalContainer: {
      flex: 1,
      backgroundColor: '#F2F2F7',
  },
  modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      backgroundColor: '#fff',
      borderBottomWidth: 1,
      borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
      fontSize: 17,
      fontWeight: '600',
  },
  closeButton: {
      padding: 4,
  },
  closeButtonText: {
      color: '#007AFF',
      fontSize: 17,
  },
  modalContent: {
      flex: 1,
      padding: 16,
  },
  modalActions: {
      flexDirection: 'column',
      marginBottom: 20,
      width: '100%',
  },
  actionButton: {
      padding: 12,
      borderRadius: 10,
      alignItems: 'center',
      width: '100%',
  },
  shareAllButton: {
      backgroundColor: '#007AFF',
  },
  deleteActionButton: {
      backgroundColor: '#FF3B30',
  },
  actionButtonText: {
      color: '#fff',
      fontWeight: '600',
      fontSize: 16,
  },
  sectionHeader: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 12,
      color: '#000',
  },
  fileList: {
      width: '100%',
      flex: 1,
  },
  fileItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      backgroundColor: '#F2F2F7',
      borderRadius: 10,
      marginBottom: 8,
  },
  fileIcon: {
      width: 40,
      height: 40,
      backgroundColor: '#E5E5EA',
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
  },
  fileNameItem: {
      flex: 1,
      fontSize: 15,
      fontWeight: '500',
  },
  miniButton: {
      backgroundColor: '#E5E5EA',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 14,
  },
  miniButtonText: {
      color: '#007AFF',
      fontSize: 13,
      fontWeight: '500',
  },
  previewButton: {
      marginRight: 8,
      backgroundColor: '#E5E5EA',
  },
});
