import { useState } from 'react';
import { Alert } from 'react-native';
import { pick, keepLocalCopy, types, errorCodes, isErrorWithCode } from '@react-native-documents/picker';
import RNFS from 'react-native-fs';
import { generateThumbnail } from '../utils/ffmpeg';

export const useVideoPicker = (multiSelection: boolean = false) => {
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [selectedThumbnail, setSelectedThumbnail] = useState<string | null>(null);

  const pickVideo = async () => {
    try {
      const results = await pick({
        type: [types.video],
        mode: 'import',
        allowMultiSelection: multiSelection,
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
      setSelectedFiles(results);
      setSelectedThumbnail(null);

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

  return { selectedFile, selectedFiles, selectedThumbnail, pickVideo };
};
