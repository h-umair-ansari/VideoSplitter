import React from 'react';
import { Modal, View, Text, TouchableOpacity, SafeAreaView, Alert, StyleSheet } from 'react-native';
import Video from 'react-native-video';

interface VideoPreviewModalProps {
    visible: boolean;
    videoPath: string | null;
    onClose: () => void;
}

export const VideoPreviewModal: React.FC<VideoPreviewModalProps> = ({ visible, videoPath, onClose }) => {
    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.videoModalContainer}>
                <View style={styles.videoHeader}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Text style={[styles.closeButtonText, { color: '#fff' }]}>Close</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.videoWrapper}>
                    {videoPath && (
                        <Video
                            source={{ uri: `file://${videoPath}` }}
                            style={styles.fullScreenVideo}
                            controls={true}
                            resizeMode="contain"
                            onError={(e) => Alert.alert('Video Error', JSON.stringify(e))}
                        />
                    )}
                </View>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
  videoModalContainer: {
      flex: 1,
      backgroundColor: '#000',
  },
  videoHeader: {
      padding: 16,
      flexDirection: 'row',
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 10,
  },
  videoWrapper: {
      flex: 1,
      justifyContent: 'center',
      backgroundColor: '#000',
  },
  fullScreenVideo: {
      width: '100%',
      height: '100%',
  },
  closeButton: {
      padding: 4,
  },
  closeButtonText: {
      color: '#007AFF',
      fontSize: 17,
  },
});
