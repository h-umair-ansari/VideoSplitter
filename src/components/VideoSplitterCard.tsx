import React from 'react';
import { View, Text, TouchableOpacity, Image, TextInput, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import { ProcessingMode, CompressionLevel, WatermarkConfig, FilterConfig } from '../types';
import { WatermarkSettings } from './WatermarkSettings';

interface VideoSplitterCardProps {
    onPickVideo: () => void;
    selectedFile: any;
    selectedThumbnail: string | null;
    
    // Split Mode Props
    splitDuration: string;
    setSplitDuration: (duration: string) => void;
    
    // New Props for Advanced Features
    mode: ProcessingMode;
    setMode: (mode: ProcessingMode) => void;
    trimStart: string;
    setTrimStart: (val: string) => void;
    trimEnd: string;
    setTrimEnd: (val: string) => void;
    compressionLevel: CompressionLevel;
    setCompressionLevel: (level: CompressionLevel) => void;
    
    // Newest Props
    gifFps: string;
    setGifFps: (val: string) => void;
    gifScale: string;
    setGifScale: (val: string) => void;
    speedMultiplier: number;
    setSpeedMultiplier: (val: number) => void;
    watermarkConfig: WatermarkConfig;
    setWatermarkConfig: (val: WatermarkConfig) => void;
    
    // New Professional Features
    cropRatio: string;
    setCropRatio: (val: string) => void;
    volumeMultiplier: number;
    setVolumeMultiplier: (val: number) => void;
    filterConfig: FilterConfig;
    setFilterConfig: (val: FilterConfig) => void;

    selectedFiles?: any[];

    isProcessing: boolean;
    statusMessage: string;
    onProcessVideo: () => void; // Renamed from onSplitVideo
}

const SOCIAL_PRESETS = [
    { id: 'whatsapp', name: 'WhatsApp', duration: 30, icon: '🟢' },
    { id: 'insta_story', name: 'Story', duration: 15, icon: '📸' },
    { id: 'tiktok', name: 'TikTok', duration: 60, icon: '🎵' },
];

export const VideoSplitterCard: React.FC<VideoSplitterCardProps> = ({
    onPickVideo,
    selectedFile,
    selectedThumbnail,
    splitDuration,
    setSplitDuration,
    mode,
    setMode,
    trimStart,
    setTrimStart,
    trimEnd,
    setTrimEnd,
    compressionLevel,
    setCompressionLevel,
    gifFps,
    setGifFps,
    gifScale,
    setGifScale,
    speedMultiplier,
    setSpeedMultiplier,
    watermarkConfig,
    setWatermarkConfig,
    cropRatio,
    setCropRatio,
    volumeMultiplier,
    setVolumeMultiplier,
    filterConfig,
    setFilterConfig,
    selectedFiles,
    isProcessing,
    statusMessage,
    onProcessVideo
}) => {
    
    const renderModeSelector = () => (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modeScroll} contentContainerStyle={styles.modeContainer}>
            {(['SPLIT', 'TRIM', 'CROP', 'MERGE', 'AUDIO', 'VOLUME', 'FILTER', 'REVERSE', 'COMPRESS', 'GIF', 'SPEED', 'WATERMARK'] as ProcessingMode[]).map((m) => (
                <TouchableOpacity
                    key={m}
                    style={[styles.modeButton, mode === m && styles.activeModeButton]}
                    onPress={() => setMode(m)}
                >
                    <Text style={[styles.modeText, mode === m && styles.activeModeText]}>
                        {m === 'SPLIT' ? '✂️ Split' : 
                         m === 'TRIM' ? '🎞️ Trim' : 
                         m === 'CROP' ? '📐 Crop' :
                         m === 'AUDIO' ? '🎵 Audio' : 
                         m === 'VOLUME' ? '🔊 Volume' :
                         m === 'FILTER' ? '🎨 Filter' :
                         m === 'REVERSE' ? '⏪ Reverse' :
                         m === 'COMPRESS' ? '📉 Compress' :
                         m === 'MERGE' ? '🔗 Merge' :
                         m === 'GIF' ? '👾 GIF' :
                         m === 'SPEED' ? '⏩ Speed' : '💧 Watermark'}
                    </Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );

    const renderSplitOptions = () => (
        <View>
            <Text style={styles.label}>Social Presets</Text>
            <View style={styles.presetContainer}>
                {SOCIAL_PRESETS.map(preset => (
                    <TouchableOpacity
                        key={preset.id}
                        style={[styles.presetButton, splitDuration === preset.duration.toString() && styles.activePreset]}
                        onPress={() => setSplitDuration(preset.duration.toString())}
                    >
                        <Text style={styles.presetIcon}>{preset.icon}</Text>
                        <Text style={[styles.presetText, splitDuration === preset.duration.toString() && styles.activePresetText]}>
                            {preset.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.label}>Custom Split Interval (Seconds)</Text>
            <View style={styles.durationContainer}>
                {[10, 30, 60].map(d => (
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
        </View>
    );

    const renderTrimOptions = () => (
        <View>
            <Text style={styles.label}>Trim Range (HH:MM:SS)</Text>
            <View style={styles.row}>
                <View style={styles.inputGroup}>
                    <Text style={styles.subLabel}>Start Time</Text>
                    <TextInput
                        style={styles.timeInput}
                        value={trimStart}
                        onChangeText={setTrimStart}
                        placeholder="00:00:00"
                    />
                </View>
                <Text style={styles.toText}>to</Text>
                <View style={styles.inputGroup}>
                    <Text style={styles.subLabel}>End Time</Text>
                    <TextInput
                        style={styles.timeInput}
                        value={trimEnd}
                        onChangeText={setTrimEnd}
                        placeholder="00:00:10"
                    />
                </View>
            </View>
        </View>
    );

    const renderCompressOptions = () => (
        <View>
            <Text style={styles.label}>Compression Quality</Text>
            <View style={styles.row}>
                {[
                    { label: 'High', value: CompressionLevel.HIGH },
                    { label: 'Medium', value: CompressionLevel.MEDIUM },
                    { label: 'Low', value: CompressionLevel.LOW }
                ].map((opt) => (
                    <TouchableOpacity
                        key={opt.label}
                        style={[styles.compressButton, compressionLevel === opt.value && styles.activeCompress]}
                        onPress={() => setCompressionLevel(opt.value)}
                    >
                        <Text style={[styles.compressText, compressionLevel === opt.value && styles.activeCompressText]}>
                            {opt.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const renderGifOptions = () => (
        <View>
             <View style={styles.row}>
                <View style={styles.inputGroup}>
                    <Text style={styles.subLabel}>FPS</Text>
                    <TextInput
                        style={styles.timeInput}
                        value={gifFps}
                        onChangeText={setGifFps}
                        keyboardType="numeric"
                        placeholder="10"
                    />
                </View>
                <View style={[styles.inputGroup, { marginLeft: 10 }]}>
                    <Text style={styles.subLabel}>Width (px)</Text>
                    <TextInput
                        style={styles.timeInput}
                        value={gifScale}
                        onChangeText={setGifScale}
                        keyboardType="numeric"
                        placeholder="320"
                    />
                </View>
            </View>
        </View>
    );

    const renderSpeedOptions = () => (
        <View>
            <Text style={styles.label}>Playback Speed</Text>
            <View style={styles.row}>
                {[0.5, 1.5, 2.0, 4.0].map((s) => (
                    <TouchableOpacity
                        key={s}
                        style={[styles.compressButton, speedMultiplier === s && styles.activeCompress]}
                        onPress={() => setSpeedMultiplier(s)}
                    >
                        <Text style={[styles.compressText, speedMultiplier === s && styles.activeCompressText]}>
                            {s}x
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const renderWatermarkOptions = () => (
        <WatermarkSettings 
            config={watermarkConfig}
            onChange={setWatermarkConfig}
        />
    );

    const renderCropOptions = () => (
        <View>
            <Text style={styles.label}>Aspect Ratio</Text>
            <View style={styles.row}>
                {['Original', '1:1', '4:5', '16:9', '9:16'].map((r) => (
                    <TouchableOpacity
                        key={r}
                        style={[styles.compressButton, cropRatio === r && styles.activeCompress]}
                        onPress={() => setCropRatio(r)}
                    >
                        <Text style={[styles.compressText, cropRatio === r && styles.activeCompressText]}>
                            {r}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const renderVolumeOptions = () => (
        <View>
            <Text style={styles.label}>Volume Multiplier</Text>
            <View style={styles.row}>
                {[0.0, 0.5, 1.0, 1.5, 2.0].map((v) => (
                    <TouchableOpacity
                        key={v}
                        style={[styles.compressButton, volumeMultiplier === v && styles.activeCompress]}
                        onPress={() => setVolumeMultiplier(v)}
                    >
                        <Text style={[styles.compressText, volumeMultiplier === v && styles.activeCompressText]}>
                            {v === 0 ? 'Mute' : `${v}x`}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const renderFilterOptions = () => (
        <View>
            <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Brightness ({filterConfig.brightness.toFixed(1)})</Text>
                <View style={styles.filterControls}>
                    <TouchableOpacity onPress={() => setFilterConfig({...filterConfig, brightness: Math.max(-1.0, filterConfig.brightness - 0.1)})} style={styles.filterBtn}><Text>-</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => setFilterConfig({...filterConfig, brightness: Math.min(1.0, filterConfig.brightness + 0.1)})} style={styles.filterBtn}><Text>+</Text></TouchableOpacity>
                </View>
            </View>
            <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Contrast ({filterConfig.contrast.toFixed(1)})</Text>
                <View style={styles.filterControls}>
                    <TouchableOpacity onPress={() => setFilterConfig({...filterConfig, contrast: Math.max(0.0, filterConfig.contrast - 0.1)})} style={styles.filterBtn}><Text>-</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => setFilterConfig({...filterConfig, contrast: Math.min(2.0, filterConfig.contrast + 0.1)})} style={styles.filterBtn}><Text>+</Text></TouchableOpacity>
                </View>
            </View>
            <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Saturation ({filterConfig.saturation.toFixed(1)})</Text>
                <View style={styles.filterControls}>
                    <TouchableOpacity onPress={() => setFilterConfig({...filterConfig, saturation: Math.max(0.0, filterConfig.saturation - 0.1)})} style={styles.filterBtn}><Text>-</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => setFilterConfig({...filterConfig, saturation: Math.min(3.0, filterConfig.saturation + 0.1)})} style={styles.filterBtn}><Text>+</Text></TouchableOpacity>
                </View>
            </View>
        </View>
    );

    const getActionButtonText = () => {
        if (isProcessing) return statusMessage;
        switch (mode) {
            case 'SPLIT': return '✂️ Split Video';
            case 'TRIM': return '🎞️ Trim Video';
            case 'AUDIO': return '🎵 Extract Audio';
            case 'COMPRESS': return '📉 Compress Video';
            case 'MERGE': return '🔗 Merge Videos';
            case 'GIF': return '👾 Create GIF';
            case 'SPEED': return '⏩ Change Speed';
            case 'WATERMARK': return '💧 Add Watermark';
            case 'CROP': return '📐 Crop Video';
            case 'REVERSE': return '⏪ Reverse Video';
            case 'VOLUME': return '🔊 Adjust Volume';
            case 'FILTER': return '🎨 Apply Filter';
            default: return 'Process';
        }
    };

    return (
        <View style={styles.card}>
            <TouchableOpacity style={styles.pickButton} onPress={onPickVideo}>
                <Text style={styles.pickButtonText}>
                    {mode === 'MERGE' ? 'Select Videos (Multiple) 📂' : 'Select Video 📂'}
                </Text>
            </TouchableOpacity>

            {selectedFiles && selectedFiles.length > 1 ? (
                <View style={styles.selectedContainer}>
                    <View style={[styles.previewThumb, styles.placeholderThumb]}>
                        <Text style={styles.placeholderText}>📚</Text>
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
                            <Text style={styles.placeholderText}>🎬</Text>
                        </View>
                    )}
                    <View style={styles.fileDetails}>
                        <Text style={styles.fileName} numberOfLines={1}>{selectedFile.name}</Text>
                        <Text style={styles.fileSub}>Ready to process</Text>
                    </View>
                </View>
            )}

            {renderModeSelector()}

            <View style={styles.optionsContainer}>
                {mode === 'SPLIT' && renderSplitOptions()}
                {mode === 'TRIM' && renderTrimOptions()}
                {mode === 'COMPRESS' && renderCompressOptions()}
                {mode === 'GIF' && renderGifOptions()}
                {mode === 'SPEED' && renderSpeedOptions()}
                {mode === 'WATERMARK' && renderWatermarkOptions()}
                {mode === 'CROP' && renderCropOptions()}
                {mode === 'VOLUME' && renderVolumeOptions()}
                {mode === 'FILTER' && renderFilterOptions()}
                {mode === 'REVERSE' && (
                    <Text style={styles.infoText}>
                        Reverses video and audio playback. (Note: May take longer for large videos)
                    </Text>
                )}
                {mode === 'MERGE' && (
                    <Text style={styles.infoText}>
                        Select multiple videos to merge them into one file.
                    </Text>
                )}
                {mode === 'AUDIO' && (
                    <Text style={styles.infoText}>
                        Extract audio track from the video as an MP3 file.
                    </Text>
                )}
            </View>

            <TouchableOpacity 
                style={[styles.mainButton, ((!selectedFile && (!selectedFiles || selectedFiles.length === 0)) || isProcessing) ? styles.disabledButton : null]}
                onPress={onProcessVideo}
                disabled={(!selectedFile && (!selectedFiles || selectedFiles.length === 0)) || isProcessing}
            >
                {isProcessing ? (
                    <View style={styles.processingContainer}>
                        <ActivityIndicator color="#fff" />
                        <Text style={styles.processingText}>{statusMessage}</Text>
                    </View>
                ) : (
                    <Text style={styles.mainButtonText}>{getActionButtonText()}</Text>
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
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
  // Mode Selector
  modeScroll: {
      marginBottom: 20,
  },
  modeContainer: {
      flexDirection: 'row',
      gap: 10,
  },
  modeButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      backgroundColor: '#F2F2F7',
      marginRight: 8,
  },
  activeModeButton: {
      backgroundColor: '#007AFF',
  },
  modeText: {
      color: '#3A3A3C',
      fontWeight: '600',
  },
  activeModeText: {
      color: '#fff',
  },
  // Options
  optionsContainer: {
      marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    color: '#3A3A3C',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Presets
  presetContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
  },
  presetButton: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: '#F2F2F7',
      padding: 10,
      borderRadius: 10,
      marginHorizontal: 4,
  },
  activePreset: {
      backgroundColor: '#E1F0FF',
      borderWidth: 1,
      borderColor: '#007AFF',
  },
  presetIcon: {
      fontSize: 20,
      marginBottom: 4,
  },
  presetText: {
      fontSize: 12,
      fontWeight: '500',
      color: '#3A3A3C',
  },
  activePresetText: {
      color: '#007AFF',
      fontWeight: '700',
  },
  // Duration
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  // Trim
  row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
  },
  inputGroup: {
      flex: 1,
  },
  subLabel: {
      fontSize: 12,
      color: '#8E8E93',
      marginBottom: 4,
  },
  timeInput: {
      borderWidth: 1,
      borderColor: '#E5E5EA',
      borderRadius: 8,
      padding: 10,
      backgroundColor: '#fff',
      textAlign: 'center',
  },
  toText: {
      marginHorizontal: 12,
      color: '#8E8E93',
  },
  // Compress
  compressButton: {
      flex: 1,
      padding: 12,
      backgroundColor: '#F2F2F7',
      borderRadius: 8,
      marginHorizontal: 4,
      alignItems: 'center',
  },
  activeCompress: {
      backgroundColor: '#007AFF',
  },
  compressText: {
      fontWeight: '600',
      color: '#3A3A3C',
  },
  activeCompressText: {
      color: '#fff',
  },
  infoText: {
      color: '#8E8E93',
      fontStyle: 'italic',
      textAlign: 'center',
      marginVertical: 10,
  },
  // Main Button
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
  processingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  processingText: {
      color: '#fff',
      marginLeft: 8,
      fontWeight: '600',
  },
  filterRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
      backgroundColor: '#F2F2F7',
      padding: 10,
      borderRadius: 8,
  },
  filterLabel: {
      fontWeight: '600',
      color: '#3A3A3C',
  },
  filterControls: {
      flexDirection: 'row',
      gap: 10,
  },
  filterBtn: {
      backgroundColor: '#fff',
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#E5E5EA',
  },
  mainButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});