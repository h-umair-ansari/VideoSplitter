import { useState, useEffect } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
  FlatList,
  Modal,
  Image,
  Dimensions,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { pick, keepLocalCopy, types, errorCodes, isErrorWithCode } from '@react-native-documents/picker';
import { FFmpegKit, ReturnCode } from 'ffmpeg-kit-react-native';
import RNFS from 'react-native-fs';
import Video from 'react-native-video';

interface SplitFile {
  path: string;
  thumbnail?: string;
}

interface SplitSession {
  id: string;
  name: string;
  date: number;
  path: string;
  files: SplitFile[];
  thumbnail?: string;
}

const { width } = Dimensions.get('window');

const App = () => {
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState<string | null>(null);
  const [splitDuration, setSplitDuration] = useState('5');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);
  
  // History state
  const [sessions, setSessions] = useState<SplitSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<SplitSession | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const docDir = RNFS.DocumentDirectoryPath;
      const items = await RNFS.readDir(docDir);
      
      const sessionList: SplitSession[] = [];
      
      for (const item of items) {
        if (item.isDirectory() && item.name.startsWith('split_parts_')) {
          const timestamp = parseInt(item.name.replace('split_parts_', ''));
          const dirFiles = await RNFS.readDir(item.path);
          
          const videoFiles = dirFiles
            .filter(f => f.name.endsWith('.mp4'))
            .map(f => {
                // Check if corresponding thumbnail exists
                // Convention: part_001.mp4 -> part_001.jpg
                const thumbName = f.name.replace('.mp4', '.jpg');
                const thumbFile = dirFiles.find(df => df.name === thumbName);
                return {
                    path: f.path,
                    thumbnail: thumbFile ? thumbFile.path : undefined
                };
            });
          
          const thumbFile = dirFiles.find(f => f.name === 'thumbnail.jpg');

          if (videoFiles.length > 0) {
            sessionList.push({
              id: item.name,
              name: new Date(timestamp).toLocaleString(),
              date: timestamp,
              path: item.path,
              files: videoFiles,
              thumbnail: thumbFile ? thumbFile.path : undefined,
            });
          }
        }
      }
      
      // Sort by date new to old
      sessionList.sort((a, b) => b.date - a.date);
      setSessions(sessionList);
    } catch (e) {
      console.log('Error loading sessions', e);
    }
  };

  const generateThumbnail = async (inputPath: string, outputPath: string): Promise<boolean> => {
      try {
        // -ss 1 means grab frame at 1 second. -vframes 1 means 1 frame.
        const command = `-ss 00:00:01 -i "${inputPath}" -vframes 1 -q:v 2 "${outputPath}" -y`;
        const session = await FFmpegKit.execute(command);
        return ReturnCode.isSuccess(await session.getReturnCode());
      } catch (e) {
          console.log("Thumbnail generation error", e);
          return false;
      }
  };

  const pickVideo = async () => {
    try {
      const [file] = await pick({
        type: [types.video],
        mode: 'import',
      });

      if (!file) return;

      const fileName = file.name ?? `video_${Date.now()}.mp4`;
      let uri = file.uri;

      // Cache the file locally
      try {
        const [localCopy] = await keepLocalCopy({
          files: [{ uri: file.uri, fileName }],
          destination: 'cachesDirectory',
        });

        if (localCopy && localCopy.status === 'success') {
          uri = localCopy.localUri;
        }
      } catch {}

      setSelectedFile({ ...file, name: fileName, uri });
      setSelectedThumbnail(null);
      setLogs([]);
      setStatusMessage('');

      // Generate preview thumbnail
      const thumbName = `preview_${Date.now()}.jpg`;
      const thumbPath = `${RNFS.CachesDirectoryPath}/${thumbName}`;
      const success = await generateThumbnail(uri, thumbPath);
      if (success) {
          setSelectedThumbnail(thumbPath);
      }

    } catch (err) {
      if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) return;
      Alert.alert('Error', 'Unknown error: ' + JSON.stringify(err));
    }
  };

  const splitVideo = async () => {
    if (!selectedFile) {
      Alert.alert('Error', 'Please select a video first');
      return;
    }

    const duration = parseInt(splitDuration);
    if (isNaN(duration) || duration <= 0) {
      Alert.alert('Error', 'Please enter a valid duration');
      return;
    }

    setIsProcessing(true);
    setLogs([]);
    setStatusMessage('Preparing video...');

    try {
      // 1. Prepare input path
      let inputPath = selectedFile.uri;
      if (inputPath.startsWith('content://')) {
        const fileName = selectedFile.name || 'temp_video.mp4';
        const destPath = `${RNFS.CachesDirectoryPath}/${fileName}`;
        
        setStatusMessage('Copying file to cache...');
        
        try {
            if (await RNFS.exists(destPath)) {
                await RNFS.unlink(destPath);
            }
            await RNFS.copyFile(inputPath, destPath);
            inputPath = destPath;
        } catch (copyError: any) {
            console.log("Copy failed, trying to use direct URI", copyError);
            setLogs(prev => [...prev, `Copy failed (${copyError.message}), trying direct URI...`]);
        }
      } else if (inputPath.startsWith('file://')) {
        inputPath = inputPath.replace('file://', '');
      }

      // 2. Prepare output directory
      const timestamp = Date.now();
      const outputDir = `${RNFS.DocumentDirectoryPath}/split_parts_${timestamp}`;
      await RNFS.mkdir(outputDir);
      const outputPathPattern = `${outputDir}/part_%03d.mp4`;

      setStatusMessage(`Splitting video every ${duration}s...`);
      setLogs(prev => [...prev, `Splitting video every ${duration} seconds...`]);

      // 3. Execute FFmpeg
      // Use re-encoding for accurate splitting (slower but precise)
      // -c:v libx264: Re-encode video using H.264
      // -preset ultrafast: Maximize encoding speed
      // -crf 22: Balance quality and size
      // -c:a aac: Re-encode audio
      // -force_key_frames: Ensure keyframes at split points (optional but helpful)
      // Note: segment_time is approximate with -c copy, but precise with re-encoding
      const command = `-i "${inputPath}" -c:v libx264 -preset ultrafast -crf 22 -c:a aac -map 0 -segment_time ${duration} -f segment -reset_timestamps 1 "${outputPathPattern}"`;

      console.log('Running FFmpeg command:', command);
      
      const session = await FFmpegKit.execute(command);
      const returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        setStatusMessage('Generating thumbnails...');
        setLogs(prev => [...prev, 'Generating thumbnails...']);

        // Generate session thumbnail
        const thumbPath = `${outputDir}/thumbnail.jpg`;
        await generateThumbnail(inputPath, thumbPath);

        // Generate thumbnails for each part
        const files = await RNFS.readDir(outputDir);
        const videoFiles = files.filter(f => f.name.endsWith('.mp4'));
        
        for (const file of videoFiles) {
             const partThumbPath = file.path.replace('.mp4', '.jpg');
             await generateThumbnail(file.path, partThumbPath);
        }

        setLogs(prev => [...prev, 'Split successful!']);
        setStatusMessage('Done!');
        Alert.alert('Success', `Video split successfully!`);
        await loadSessions();
      } else {
        const logs = await session.getLogs();
        const failLog = logs[logs.length - 1]?.getMessage();
        setLogs(prev => [...prev, `Split failed: ${failLog}`]);
        Alert.alert('Error', 'Split failed. Check logs.');
      }

    } catch (error: any) {
      setLogs(prev => [...prev, `Error: ${error.message}`]);
      Alert.alert('Error', error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteSession = (session: SplitSession) => {
    Alert.alert(
        "Delete Session",
        "Are you sure you want to delete this session? This cannot be undone.",
        [
            { text: "Cancel", style: "cancel" },
            { 
                text: "Delete", 
                style: "destructive",
                onPress: async () => {
                    try {
                        await RNFS.unlink(session.path);
                        loadSessions();
                    } catch (e) {
                        Alert.alert("Error", "Failed to delete session");
                    }
                }
            }
        ]
    );
  };

  const saveToDownloads = async (filePath: string) => {
    try {
      // Check/Request Permissions for Android < 11
      if (Platform.OS === 'android' && Platform.Version < 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: "Storage Permission",
            message: "App needs access to save video to your device",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK"
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
           Alert.alert('Permission Denied', 'Storage permission is required to save to Downloads.');
           return;
        }
      }

      const fileName = filePath.split('/').pop() || `video_${Date.now()}.mp4`;
      const destPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
      
      try {
          // Try direct copy first (Works on Android < 10, and sometimes 10)
          if (await RNFS.exists(destPath)) {
             await RNFS.unlink(destPath);
          }
          await RNFS.copyFile(filePath, destPath);
          // Scan file so it shows up in Gallery/Downloads
          try {
            await RNFS.scanFile(destPath);
          } catch (e) {}
          
          Alert.alert('Saved', `Video saved to Downloads folder:\n${fileName}`);

      } catch (copyError: any) {
          console.log("Direct copy failed", copyError);
          Alert.alert('Error', 'Failed to save video: ' + copyError.message);
      }
    } catch (error: any) {
        console.log("Save error", error);
        Alert.alert('Error', 'Failed to save video: ' + error.message);
    }
  };


  const saveAllToDownloads = async (files: SplitFile[]) => {
    let successCount = 0;
    try {
      for (const file of files) {
        const filePath = file.path;
        const fileName = filePath.split('/').pop() || `video_${Date.now()}.mp4`;
        const destPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
        await RNFS.copyFile(filePath, destPath);
        successCount++;
      }
      Alert.alert('Success', `${successCount} videos saved to Downloads folder.`);
    } catch (e: any) {
        Alert.alert('Error', 'Failed to save all videos: ' + e.message);
    }
  };


  const renderSessionItem = ({ item }: { item: SplitSession }) => (
    <View style={styles.sessionItem}>
        <TouchableOpacity 
            style={styles.sessionContent}
            onPress={() => setSelectedSession(item)}
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
            onPress={() => deleteSession(item)}
        >
            <Text style={styles.deleteButtonText}>🗑️</Text>
        </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.content}>
        <Text style={styles.title}>Video Splitter Pro</Text>

        <View style={styles.card}>
            <TouchableOpacity style={styles.pickButton} onPress={pickVideo}>
                <Text style={styles.pickButtonText}>Select Video 📂</Text>
            </TouchableOpacity>

            {selectedFile && (
                <View style={styles.selectedContainer}>
                    {selectedThumbnail ? (
                        <Image source={{ uri: `file://${selectedThumbnail}` }} style={styles.previewThumb} />
                    ) : (
                        <View style={[styles.previewThumb, styles.placeholderThumb]}>
                            <Text style={styles.placeholderText}>🎬</Text>
                        </View>
                    )}
                    <View style={styles.fileDetails}>
                        <Text style={styles.fileName} numberOfLines={1}>{selectedFile.name}</Text>
                        <Text style={styles.fileSub}>Ready to split</Text>
                    </View>
                </View>
            )}

            <Text style={styles.label}>Split Interval</Text>
            <View style={styles.durationContainer}>
                {[5, 10, 15, 30].map(d => (
                    <TouchableOpacity 
                    key={d} 
                    style={[styles.durationButton, splitDuration === d.toString() && styles.activeDuration]}
                    onPress={() => setSplitDuration(d.toString())}
                    >
                    <Text style={[styles.durationText, splitDuration === d.toString() && styles.activeDurationText]}>{d}s</Text>
                    </TouchableOpacity>
                ))}
                <TextInput
                    style={styles.input}
                    value={splitDuration}
                    onChangeText={setSplitDuration}
                    keyboardType="numeric"
                    placeholder="Custom"
                />
            </View>

            <TouchableOpacity 
                style={[styles.mainButton, (!selectedFile || isProcessing) && styles.disabledButton]} 
                onPress={splitVideo}
                disabled={!selectedFile || isProcessing}
            >
                {isProcessing ? (
                    <View style={styles.processingContainer}>
                        <ActivityIndicator color="#fff" />
                        <Text style={styles.processingText}>{statusMessage}</Text>
                    </View>
                ) : (
                    <Text style={styles.mainButtonText}>✂️ Split Video</Text>
                )}
            </TouchableOpacity>
        </View>

        <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Your Library</Text>
            {logs.length > 0 && (
                <TouchableOpacity onPress={() => setShowLogs(!showLogs)}>
                    <Text style={styles.logsToggle}>{showLogs ? 'Hide Logs' : 'Show Logs'}</Text>
                </TouchableOpacity>
            )}
        </View>

        {showLogs && logs.length > 0 && (
             <View style={styles.logsPreview}>
                <ScrollView style={styles.logsScroll}>
                    {logs.map((log, index) => (
                        <Text key={index} style={styles.logText}>{log}</Text>
                    ))}
                </ScrollView>
             </View>
        )}

        <FlatList
            data={sessions}
            renderItem={renderSessionItem}
            keyExtractor={item => item.id}
            style={styles.historyList}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>📭</Text>
                    <Text style={styles.emptyText}>No saved sessions yet.</Text>
                </View>
            }
        />
        
        {/* Modal for Session Details */}
        <Modal
            visible={!!selectedSession}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setSelectedSession(null)}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{selectedSession?.name}</Text>
                    <TouchableOpacity onPress={() => setSelectedSession(null)} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>

                {selectedSession && (
                    <View style={styles.modalContent}>
                         <View style={styles.modalActions}>
                            <TouchableOpacity 
                                style={[styles.actionButton, styles.shareAllButton, { backgroundColor: '#34C759', marginTop: 8 }]} 
                                onPress={() => saveAllToDownloads(selectedSession.files)}
                            >
                                <Text style={styles.actionButtonText}>💾 Save All</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.actionButton, styles.deleteActionButton, { marginTop: 8 }]} 
                                onPress={() => {
                                    deleteSession(selectedSession);
                                    setSelectedSession(null);
                                }}
                            >
                                <Text style={styles.actionButtonText}>🗑️ Delete</Text>
                            </TouchableOpacity>
                         </View>

                        <Text style={styles.sectionHeader}>Files ({selectedSession.files.length})</Text>

                        <FlatList
                            data={selectedSession.files}
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
                                        onPress={() => setPreviewVideo(item.path)}
                                    >
                                        <Text style={styles.miniButtonText}>Preview</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[styles.miniButton, { marginLeft: 8 }]}
                                        onPress={() => saveToDownloads(item.path)}
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

        {/* Video Preview Modal */}
        <Modal
            visible={!!previewVideo}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={() => setPreviewVideo(null)}
        >
            <SafeAreaView style={styles.videoModalContainer}>
                <View style={styles.videoHeader}>
                    <TouchableOpacity onPress={() => setPreviewVideo(null)} style={styles.closeButton}>
                        <Text style={[styles.closeButtonText, { color: '#fff' }]}>Close</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.videoWrapper}>
                    {previewVideo && (
                        <Video
                            source={{ uri: `file://${previewVideo}` }}
                            style={styles.fullScreenVideo}
                            controls={true}
                            resizeMode="contain"
                            onError={(e) => Alert.alert('Video Error', JSON.stringify(e))}
                        />
                    )}
                </View>
            </SafeAreaView>
        </Modal>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7', // iOS grouped background color
  },
  content: {
    padding: 16,
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 20,
    color: '#1C1C1E',
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
    elevation: 3,
  },
  pickButton: {
    backgroundColor: '#E5E5EA',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  pickButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  selectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#F9F9F9',
    padding: 10,
    borderRadius: 10,
  },
  previewThumb: {
      width: 60,
      height: 60,
      borderRadius: 8,
      marginRight: 12,
      backgroundColor: '#000',
  },
  placeholderThumb: {
      justifyContent: 'center',
      alignItems: 'center',
  },
  placeholderText: {
      fontSize: 24,
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#3A3A3C',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  durationButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    minWidth: 50,
    alignItems: 'center',
  },
  activeDuration: {
    backgroundColor: '#007AFF',
  },
  durationText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  activeDurationText: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 8,
    width: 70,
    textAlign: 'center',
    backgroundColor: '#fff',
  },
  mainButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#C7C7CC',
    shadowOpacity: 0,
  },
  mainButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  processingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  processingText: {
      color: '#fff',
      marginLeft: 10,
      fontWeight: '600',
  },
  historyHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
  },
  historyTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#1C1C1E',
  },
  logsToggle: {
      color: '#007AFF',
      fontSize: 14,
  },
  historyList: {
      flex: 1,
  },
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
  emptyContainer: {
      alignItems: 'center',
      marginTop: 40,
  },
  emptyIcon: {
      fontSize: 48,
      marginBottom: 10,
  },
  emptyText: {
      color: '#8E8E93',
      fontSize: 16,
  },
  logsPreview: {
    height: 120,
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  logsScroll: {
      flex: 1,
  },
  logText: {
    fontSize: 11,
    marginBottom: 2,
    fontFamily: 'monospace',
    color: '#30D158',
  },
  // Modal Styles
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
});

export default App;
