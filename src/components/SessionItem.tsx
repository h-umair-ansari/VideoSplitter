import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { SplitSession } from '../types';

interface SessionItemProps {
    item: SplitSession;
    onPress: (session: SplitSession) => void;
    onDelete: (session: SplitSession) => void;
}

export const SessionItem: React.FC<SessionItemProps> = ({ item, onPress, onDelete }) => (
    <View style={styles.sessionItem}>
        <TouchableOpacity 
            style={styles.sessionContent}
            onPress={() => onPress(item)}
        >
            {item.thumbnail ? (
                <Image source={{ uri: `file://${item.thumbnail}` }} style={styles.sessionThumb} />
            ) : (
                <View style={[styles.sessionThumb, styles.placeholderThumb]}>
                    <Text style={styles.placeholderText}>🎬</Text>
                </View>
            )}
            <View style={styles.sessionDetails}>
                <Text style={styles.sessionName}>{item.name}</Text>
                <Text style={styles.sessionInfo}>{item.files.length} parts</Text>
            </View>
        </TouchableOpacity>
        <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={() => onDelete(item)}
        >
            <Text style={styles.deleteButtonText}>🗑️</Text>
        </TouchableOpacity>
    </View>
);

const styles = StyleSheet.create({
  sessionItem: {
      backgroundColor: '#fff',
      padding: 12,
      borderRadius: 12,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
  },
  sessionContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
  },
  sessionThumb: {
      width: 50,
      height: 50,
      borderRadius: 8,
      backgroundColor: '#E5E5EA',
      marginRight: 12,
  },
  placeholderThumb: {
      justifyContent: 'center',
      alignItems: 'center',
  },
  placeholderText: {
      fontSize: 24,
  },
  sessionDetails: {
      flex: 1,
  },
  sessionName: {
      fontSize: 16,
      fontWeight: '600',
      color: '#000',
      marginBottom: 2,
  },
  sessionInfo: {
      color: '#8E8E93',
      fontSize: 13,
  },
  deleteButton: {
      padding: 10,
  },
  deleteButtonText: {
      fontSize: 18,
  },
});
