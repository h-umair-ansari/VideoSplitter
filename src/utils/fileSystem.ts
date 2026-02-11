import RNFS from 'react-native-fs';
import { Platform, PermissionsAndroid } from 'react-native';
import { SplitSession } from '../types';

export const loadSessions = async (): Promise<SplitSession[]> => {
    try {
      const docDir = RNFS.DocumentDirectoryPath;
      const items = await RNFS.readDir(docDir);
      
      const sessionList: SplitSession[] = [];
      
      for (const item of items) {
        if (item.isDirectory() && (
          item.name.startsWith('split_parts_') || 
          item.name.startsWith('trim_session_') || 
          item.name.startsWith('audio_session_') || 
          item.name.startsWith('compress_session_') ||
          item.name.startsWith('merge_session_') ||
          item.name.startsWith('gif_session_') ||
          item.name.startsWith('speed_session_') ||
          item.name.startsWith('watermark_session_')
        )) {
          const timestamp = parseInt(item.name.split('_').pop() || '0');
          const dirFiles = await RNFS.readDir(item.path);
          
          const files = dirFiles
            .filter(f => f.name.endsWith('.mp4') || f.name.endsWith('.mp3') || f.name.endsWith('.gif'))
            .map(f => {
                const thumbName = f.name.replace(/\.(mp4|mp3|gif)$/, '.jpg');
                const thumbFile = dirFiles.find(df => df.name === thumbName);
                return {
                    path: f.path,
                    thumbnail: thumbFile ? thumbFile.path : undefined
                };
            });
          
          const thumbFile = dirFiles.find(f => f.name === 'thumbnail.jpg');

          if (files.length > 0) {
            let sessionName = new Date(timestamp).toLocaleString();
            if (item.name.startsWith('trim_')) sessionName += ' (Trim)';
            else if (item.name.startsWith('audio_')) sessionName += ' (Audio)';
            else if (item.name.startsWith('compress_')) sessionName += ' (Compress)';
            else if (item.name.startsWith('merge_')) sessionName += ' (Merge)';
            else if (item.name.startsWith('gif_')) sessionName += ' (GIF)';
            else if (item.name.startsWith('speed_')) sessionName += ' (Speed)';
            else if (item.name.startsWith('watermark_')) sessionName += ' (Watermark)';

            sessionList.push({
              id: item.name,
              name: sessionName,
              date: timestamp,
              path: item.path,
              files: files,
              thumbnail: thumbFile ? thumbFile.path : undefined,
            });
          }
        }
      }
      
      // Sort by date new to old
      sessionList.sort((a, b) => b.date - a.date);
      return sessionList;
    } catch (e) {
      console.log('Error loading sessions', e);
      return [];
    }
};

export const deleteSessionDirectory = async (path: string): Promise<void> => {
    await RNFS.unlink(path);
};

export const saveFileToDownloads = async (filePath: string): Promise<void> => {
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
        throw new Error('Storage permission is required to save to Downloads.');
    }
    }

    const fileName = filePath.split('/').pop() || `video_${Date.now()}.mp4`;
    const destPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
    
    // Try direct copy first (Works on Android < 10, and sometimes 10)
    if (await RNFS.exists(destPath)) {
        await RNFS.unlink(destPath);
    }
    await RNFS.copyFile(filePath, destPath);
    // Scan file so it shows up in Gallery/Downloads
    try {
        await RNFS.scanFile(destPath);
    } catch (e) {}
};

export const createConcatFile = async (filePaths: string[], outputPath: string): Promise<void> => {
    // Format: file '/path/to/file.mp4'
    const content = filePaths.map(p => `file '${p}'`).join('\n');
    await RNFS.writeFile(outputPath, content, 'utf8');
};