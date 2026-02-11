import React, { useState, useEffect } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  View,
  Alert,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { pick, keepLocalCopy, types, errorCodes, isErrorWithCode } from '@react-native-documents/picker';
import RNFS from 'react-native-fs';
import { FFmpegKit, ReturnCode } from 'ffmpeg-kit-react-native';

import { SplitSession, SplitFile, ProcessingMode, CompressionLevel, WatermarkConfig, FilterConfig } from '../types';
import { generateThumbnail, trimVideo, extractAudio, compressVideo, mergeVideos, convertToGif, changeSpeed, addWatermark, cropVideo, reverseVideo, adjustVolume, applyFilter, getVideoDimensions } from '../utils/ffmpeg';
import { loadSessions, deleteSessionDirectory, saveFileToDownloads, createConcatFile } from '../utils/fileSystem';
import { SessionItem } from '../components/SessionItem';
import { VideoSplitterCard } from '../components/VideoSplitterCard';
import { LogViewer } from '../components/LogViewer';
import { SessionDetailsModal } from '../components/SessionDetailsModal';
import { VideoPreviewModal } from '../components/VideoPreviewModal';

export const HomeScreen = () => {
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [selectedThumbnail, setSelectedThumbnail] = useState<string | null>(null);
  const [splitDuration, setSplitDuration] = useState('5');
  
  // Advanced Features State
  const [mode, setMode] = useState<ProcessingMode>('SPLIT');
  const [trimStart, setTrimStart] = useState('00:00:00');
  const [trimEnd, setTrimEnd] = useState('00:00:10');
  const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>(CompressionLevel.MEDIUM);
  
  // Newest Features State
  const [gifFps, setGifFps] = useState('10');
  const [gifScale, setGifScale] = useState('320');
  const [speedMultiplier, setSpeedMultiplier] = useState(1.5);
  const [watermarkConfig, setWatermarkConfig] = useState<WatermarkConfig>({
      text: '',
      position: 'BOTTOM_RIGHT',
      fontSize: '24',
      fontColor: 'white'
  });
  
  // Professional Features State
  const [cropRatio, setCropRatio] = useState('Original');
  const [volumeMultiplier, setVolumeMultiplier] = useState(1.0);
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({
      brightness: 0.0,
      contrast: 1.0,
      saturation: 1.0
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);
  
  // History state
  const [sessions, setSessions] = useState<SplitSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<SplitSession | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
      const data = await loadSessions();
      setSessions(data);
  };

  const pickVideo = async () => {
    try {
      const results = await pick({
        type: [types.video],
        mode: 'import',
        allowMultiSelection: true,
      });

      if (!results || results.length === 0) return;

      const firstFile = results[0];
      const fileName = firstFile.name ?? `video_${Date.now()}.mp4`;
      let uri = firstFile.uri;

      // Cache the first file locally (for preview)
      try {
        const [localCopy] = await keepLocalCopy({
          files: [{ uri: firstFile.uri, fileName }],
          destination: 'cachesDirectory',
        });

        if (localCopy && localCopy.status === 'success') {
          uri = localCopy.localUri;
        }
      } catch {}

      setSelectedFile({ ...firstFile, name: fileName, uri });
      setSelectedFiles(results); // Store all files
      setSelectedThumbnail(null);
      setLogs([]);
      setStatusMessage('');

      // Generate preview thumbnail for first file
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

  const parseTimeSeconds = (timeStr: string): number => {
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parts[0];
  };

  const processVideo = async () => {
    if (!selectedFile && (!selectedFiles || selectedFiles.length === 0)) {
      Alert.alert('Error', 'Please select a video first');
      return;
    }

    if (mode === 'SPLIT') {
        const duration = parseInt(splitDuration);
        if (isNaN(duration) || duration <= 0) {
            Alert.alert('Error', 'Please enter a valid duration');
            return;
        }
    } else if (mode === 'TRIM') {
        const start = parseTimeSeconds(trimStart);
        const end = parseTimeSeconds(trimEnd);
        if (isNaN(start) || isNaN(end) || end <= start) {
            Alert.alert('Error', 'Please enter valid start and end times (End > Start)');
            return;
        }
    } else if (mode === 'MERGE') {
        if (selectedFiles.length < 2) {
            Alert.alert('Error', 'Please select at least 2 videos to merge');
            return;
        }
    } else if (mode === 'GIF') {
        const fps = parseInt(gifFps);
        const scale = parseInt(gifScale);
        if (isNaN(fps) || fps <= 0 || fps > 30) {
            Alert.alert('Error', 'Please enter a valid FPS (1-30)');
            return;
        }
        if (isNaN(scale) || scale <= 0) {
            Alert.alert('Error', 'Please enter a valid width');
            return;
        }
    } else if (mode === 'WATERMARK') {
        if (!watermarkConfig.text || watermarkConfig.text.trim().length === 0) {
            Alert.alert('Error', 'Please enter watermark text');
            return;
        }
    } else if (mode === 'CROP') {
        if (cropRatio === 'Original') {
            Alert.alert('Error', 'Please select a different aspect ratio');
            return;
        }
    }

    setIsProcessing(true);
    setLogs([]);
    setStatusMessage('Preparing video...');

    try {
      // 1. Prepare input path(s)
      let inputPath = selectedFile.uri;
      
      // Helper to cache a single file
      const cacheFile = async (fileObj: any) => {
          if (fileObj.uri.startsWith('content://')) {
              const fName = fileObj.name || `temp_${Date.now()}.mp4`;
              const dPath = `${RNFS.CachesDirectoryPath}/${fName}`;
              try {
                  if (await RNFS.exists(dPath)) await RNFS.unlink(dPath);
                  await RNFS.copyFile(fileObj.uri, dPath);
                  return dPath;
              } catch (e) {
                  return fileObj.uri;
              }
          } else if (fileObj.uri.startsWith('file://')) {
              return fileObj.uri.replace('file://', '');
          }
          return fileObj.uri;
      };

      if (mode !== 'MERGE') {
         inputPath = await cacheFile(selectedFile);
      }

      // 2. Prepare output directory based on mode
      const timestamp = Date.now();
      let outputDir = '';
      let success = false;

      if (mode === 'SPLIT') {
          outputDir = `${RNFS.DocumentDirectoryPath}/split_parts_${timestamp}`;
          await RNFS.mkdir(outputDir);
          const outputPathPattern = `${outputDir}/part_%03d.mp4`;
          const duration = parseInt(splitDuration);

          setStatusMessage(`Splitting video every ${duration}s...`);
          setLogs(prev => [...prev, `Splitting video every ${duration} seconds...`]);

          const command = `-i "${inputPath}" -c:v libx264 -preset ultrafast -crf 22 -c:a aac -map 0 -segment_time ${duration} -f segment -reset_timestamps 1 "${outputPathPattern}"`;
          console.log('Running FFmpeg command:', command);
          const session = await FFmpegKit.execute(command);
          success = ReturnCode.isSuccess(await session.getReturnCode());
          
          if (!success) {
               const logs = await session.getLogs();
               const failLog = logs[logs.length - 1]?.getMessage();
               throw new Error(`Split failed: ${failLog}`);
          }

      } else if (mode === 'TRIM') {
          outputDir = `${RNFS.DocumentDirectoryPath}/trim_session_${timestamp}`;
          await RNFS.mkdir(outputDir);
          const outputPath = `${outputDir}/trimmed.mp4`;
          
          const startSec = parseTimeSeconds(trimStart);
          const endSec = parseTimeSeconds(trimEnd);
          const duration = endSec - startSec;
          
          setStatusMessage(`Trimming video...`);
          setLogs(prev => [...prev, `Trimming from ${trimStart} for ${duration}s...`]);
          
          success = await trimVideo(inputPath, outputPath, trimStart, duration.toString());

      } else if (mode === 'AUDIO') {
          outputDir = `${RNFS.DocumentDirectoryPath}/audio_session_${timestamp}`;
          await RNFS.mkdir(outputDir);
          const outputPath = `${outputDir}/audio.mp3`;

          setStatusMessage(`Extracting audio...`);
          setLogs(prev => [...prev, `Extracting audio...`]);
          
          success = await extractAudio(inputPath, outputPath);

      } else if (mode === 'COMPRESS') {
          outputDir = `${RNFS.DocumentDirectoryPath}/compress_session_${timestamp}`;
          await RNFS.mkdir(outputDir);
          const outputPath = `${outputDir}/compressed.mp4`;

          setStatusMessage(`Compressing video...`);
          setLogs(prev => [...prev, `Compressing video (Level: ${compressionLevel})...`]);
          
          success = await compressVideo(inputPath, outputPath, compressionLevel);

      } else if (mode === 'MERGE') {
          outputDir = `${RNFS.DocumentDirectoryPath}/merge_session_${timestamp}`;
          await RNFS.mkdir(outputDir);
          const outputPath = `${outputDir}/merged.mp4`;
          const listPath = `${outputDir}/list.txt`;

          setStatusMessage(`Preparing files for merge...`);
          // Cache all files
          const cachedPaths = [];
          for (const f of selectedFiles) {
              cachedPaths.push(await cacheFile(f));
          }

          await createConcatFile(cachedPaths, listPath);
          
          setStatusMessage(`Merging ${selectedFiles.length} videos...`);
          setLogs(prev => [...prev, `Merging ${selectedFiles.length} videos...`]);

          success = await mergeVideos(listPath, outputPath);

      } else if (mode === 'GIF') {
          outputDir = `${RNFS.DocumentDirectoryPath}/gif_session_${timestamp}`;
          await RNFS.mkdir(outputDir);
          const outputPath = `${outputDir}/animation.gif`;

          setStatusMessage(`Converting to GIF...`);
          setLogs(prev => [...prev, `Converting to GIF (${gifFps} fps)...`]);
          
          success = await convertToGif(inputPath, outputPath, parseInt(gifFps), parseInt(gifScale));

      } else if (mode === 'SPEED') {
          outputDir = `${RNFS.DocumentDirectoryPath}/speed_session_${timestamp}`;
          await RNFS.mkdir(outputDir);
          const outputPath = `${outputDir}/speed_${speedMultiplier}x.mp4`;

          setStatusMessage(`Changing speed...`);
          setLogs(prev => [...prev, `Changing speed to ${speedMultiplier}x...`]);
          
          success = await changeSpeed(inputPath, outputPath, speedMultiplier);

      } else if (mode === 'WATERMARK') {
          outputDir = `${RNFS.DocumentDirectoryPath}/watermark_session_${timestamp}`;
          await RNFS.mkdir(outputDir);
          const outputPath = `${outputDir}/watermarked.mp4`;

          setStatusMessage(`Adding watermark...`);
          setLogs(prev => [...prev, `Adding watermark "${watermarkConfig.text}"...`]);
          
          success = await addWatermark(inputPath, outputPath, watermarkConfig);

      } else if (mode === 'CROP') {
          outputDir = `${RNFS.DocumentDirectoryPath}/crop_session_${timestamp}`;
          await RNFS.mkdir(outputDir);
          const outputPath = `${outputDir}/cropped.mp4`;

          setStatusMessage(`Cropping video...`);
          setLogs(prev => [...prev, `Cropping to ${cropRatio}...`]);

          // Calculate Crop Dimensions
          const dims = await getVideoDimensions(inputPath);
          if (!dims) throw new Error("Could not get video dimensions");

          const { width: vw, height: vh } = dims;
          let targetRatio = 0;
          const [rw, rh] = cropRatio.split(':').map(Number);
          targetRatio = rw / rh;

          let w = vw;
          let h = vh;

          // If video is wider than target, crop width
          if (vw / vh > targetRatio) {
              h = vh;
              w = Math.round(vh * targetRatio);
          } else {
              // Video is taller than target, crop height
              w = vw;
              h = Math.round(vw / targetRatio);
          }
          
          // Ensure even dimensions for some codecs
          if (w % 2 !== 0) w -= 1;
          if (h % 2 !== 0) h -= 1;

          const x = Math.round((vw - w) / 2);
          const y = Math.round((vh - h) / 2);

          success = await cropVideo(inputPath, outputPath, w, h, x, y);

      } else if (mode === 'REVERSE') {
          outputDir = `${RNFS.DocumentDirectoryPath}/reverse_session_${timestamp}`;
          await RNFS.mkdir(outputDir);
          const outputPath = `${outputDir}/reversed.mp4`;

          setStatusMessage(`Reversing video...`);
          setLogs(prev => [...prev, `Reversing video...`]);
          
          success = await reverseVideo(inputPath, outputPath);

      } else if (mode === 'VOLUME') {
          outputDir = `${RNFS.DocumentDirectoryPath}/volume_session_${timestamp}`;
          await RNFS.mkdir(outputDir);
          const outputPath = `${outputDir}/volume_adjusted.mp4`;

          setStatusMessage(`Adjusting volume...`);
          setLogs(prev => [...prev, `Setting volume to ${volumeMultiplier}x...`]);
          
          success = await adjustVolume(inputPath, outputPath, volumeMultiplier);

      } else if (mode === 'FILTER') {
          outputDir = `${RNFS.DocumentDirectoryPath}/filter_session_${timestamp}`;
          await RNFS.mkdir(outputDir);
          const outputPath = `${outputDir}/filtered.mp4`;

          setStatusMessage(`Applying filters...`);
          setLogs(prev => [...prev, `Applying filters (B:${filterConfig.brightness.toFixed(1)}, C:${filterConfig.contrast.toFixed(1)}, S:${filterConfig.saturation.toFixed(1)})...`]);
          
          success = await applyFilter(inputPath, outputPath, filterConfig);
      }

      if (success) {
        setStatusMessage('Generating thumbnails...');
        setLogs(prev => [...prev, 'Generating thumbnails...']);

        // Generate session thumbnail
        const thumbPath = `${outputDir}/thumbnail.jpg`;
        // For audio/gif, use input video for thumbnail if possible
        if (mode === 'MERGE') {
             await generateThumbnail(selectedFiles[0].uri, thumbPath); // Use first video
        } else {
             await generateThumbnail(inputPath, thumbPath);
        }

        // Generate thumbnails for output files (skip .mp3, .gif might need special handling but generateThumbnail is for video)
        const files = await RNFS.readDir(outputDir);
        const videoFiles = files.filter(f => f.name.endsWith('.mp4'));
        
        for (const file of videoFiles) {
             const partThumbPath = file.path.replace('.mp4', '.jpg');
             await generateThumbnail(file.path, partThumbPath);
        }

        setLogs(prev => [...prev, 'Processing successful!']);
        setStatusMessage('Done!');
        Alert.alert('Success', `Video processed successfully!`);
        await fetchSessions();
      } else {
        throw new Error('Processing failed. Check logs.');
      }

    } catch (error: any) {
      setLogs(prev => [...prev, `Error: ${error.message}`]);
      Alert.alert('Error', error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteSession = (session: SplitSession) => {
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
                        await deleteSessionDirectory(session.path);
                        fetchSessions();
                    } catch (e) {
                        Alert.alert("Error", "Failed to delete session");
                    }
                }
            }
        ]
    );
  };

  const handleSaveToDownloads = async (filePath: string) => {
      try {
          await saveFileToDownloads(filePath);
          const fileName = filePath.split('/').pop();
          Alert.alert('Saved', `Video saved to Downloads folder:\n${fileName}`);
      } catch (error: any) {
          console.log("Save error", error);
          Alert.alert('Error', 'Failed to save video: ' + error.message);
      }
  };

  const handleSaveAllToDownloads = async (files: SplitFile[]) => {
    let successCount = 0;
    try {
      for (const file of files) {
        // We use the same helper but we might want to suppress individual alerts or handle differently
        // But the helper doesn't alert, so we are good.
        await saveFileToDownloads(file.path);
        successCount++;
      }
      Alert.alert('Success', `${successCount} videos saved to Downloads folder.`);
    } catch (e: any) {
        Alert.alert('Error', 'Failed to save all videos: ' + e.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <FlatList
        data={sessions}
        ListHeaderComponent={
            <View>
                <Text style={styles.title}>Video Splitter Pro</Text>

                <VideoSplitterCard
                    onPickVideo={pickVideo}
                    selectedFile={selectedFile}
                    selectedFiles={selectedFiles}
                    selectedThumbnail={selectedThumbnail}
                    splitDuration={splitDuration}
                    setSplitDuration={setSplitDuration}
                    mode={mode}
                    setMode={setMode}
                    trimStart={trimStart}
                    setTrimStart={setTrimStart}
                    trimEnd={trimEnd}
                    setTrimEnd={setTrimEnd}
                    compressionLevel={compressionLevel}
                    setCompressionLevel={setCompressionLevel}
                    gifFps={gifFps}
                    setGifFps={setGifFps}
                    gifScale={gifScale}
                    setGifScale={setGifScale}
                    speedMultiplier={speedMultiplier}
                    setSpeedMultiplier={setSpeedMultiplier}
                    watermarkConfig={watermarkConfig}
            setWatermarkConfig={setWatermarkConfig}
            cropRatio={cropRatio}
            setCropRatio={setCropRatio}
            volumeMultiplier={volumeMultiplier}
            setVolumeMultiplier={setVolumeMultiplier}
            filterConfig={filterConfig}
            setFilterConfig={setFilterConfig}
            isProcessing={isProcessing}
                    statusMessage={statusMessage}
                    onProcessVideo={processVideo}
                />

                <View style={styles.historyHeader}>
                    <Text style={styles.historyTitle}>Your Library</Text>
                    {logs.length > 0 && (
                        <TouchableOpacity onPress={() => setShowLogs(!showLogs)}>
                            <Text style={styles.logsToggle}>{showLogs ? 'Hide Logs' : 'Show Logs'}</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <LogViewer logs={logs} visible={showLogs} />
            </View>
        }
        renderItem={({ item }) => (
            <SessionItem 
                item={item} 
                onPress={setSelectedSession} 
                onDelete={handleDeleteSession} 
            />
        )}
        keyExtractor={item => item.id}
        style={styles.historyList}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyText}>No saved sessions yet.</Text>
            </View>
        }
      />
        
      <SessionDetailsModal
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
        onDelete={(s) => {
            handleDeleteSession(s);
            setSelectedSession(null);
        }}
        onSaveAll={handleSaveAllToDownloads}
        onPreview={setPreviewVideo}
        onSaveOne={handleSaveToDownloads}
      />

      <VideoPreviewModal
        visible={!!previewVideo}
        videoPath={previewVideo}
        onClose={() => setPreviewVideo(null)}
      />

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
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 20,
    color: '#1C1C1E',
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
});