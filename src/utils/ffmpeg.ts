import { FFmpegKit, ReturnCode, FFprobeKit } from 'ffmpeg-kit-react-native';
import { Platform } from 'react-native';

export const generateThumbnail = async (inputPath: string, outputPath: string): Promise<boolean> => {
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

export const trimVideo = async (
  inputPath: string, 
  outputPath: string, 
  startTime: string, // format HH:MM:SS or seconds
  duration: string   // format HH:MM:SS or seconds
): Promise<boolean> => {
  try {
    // -ss before -i for faster seeking
    const command = `-ss ${startTime} -i "${inputPath}" -t ${duration} -c:v libx264 -preset ultrafast -c:a copy "${outputPath}"`;
    const session = await FFmpegKit.execute(command);
    return ReturnCode.isSuccess(await session.getReturnCode());
  } catch (e) {
    console.log("Trim video error", e);
    return false;
  }
};

export const extractAudio = async (inputPath: string, outputPath: string): Promise<boolean> => {
  try {
    // -vn (no video), -acodec libmp3lame (mp3)
    const command = `-i "${inputPath}" -vn -acodec libmp3lame -q:a 2 "${outputPath}"`;
    const session = await FFmpegKit.execute(command);
    return ReturnCode.isSuccess(await session.getReturnCode());
  } catch (e) {
    console.log("Extract audio error", e);
    return false;
  }
};

export const compressVideo = async (
  inputPath: string, 
  outputPath: string, 
  crf: string
): Promise<boolean> => {
  try {
    const command = `-i "${inputPath}" -c:v libx264 -crf ${crf} -preset ultrafast -c:a copy "${outputPath}"`;
    const session = await FFmpegKit.execute(command);
    return ReturnCode.isSuccess(await session.getReturnCode());
  } catch (e) {
    console.log("Compress video error", e);
    return false;
  }
};

export const mergeVideos = async (listPath: string, outputPath: string): Promise<boolean> => {
  try {
    const command = `-f concat -safe 0 -i "${listPath}" -c copy "${outputPath}"`;
    const session = await FFmpegKit.execute(command);
    return ReturnCode.isSuccess(await session.getReturnCode());
  } catch (e) {
    console.log("Merge video error", e);
    return false;
  }
};

export const convertToGif = async (
  inputPath: string, 
  outputPath: string, 
  fps: number = 10, 
  scale: number = 320
): Promise<boolean> => {
  try {
    const command = `-i "${inputPath}" -vf "fps=${fps},scale=${scale}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -loop 0 "${outputPath}"`;
    const session = await FFmpegKit.execute(command);
    return ReturnCode.isSuccess(await session.getReturnCode());
  } catch (e) {
    console.log("GIF conversion error", e);
    return false;
  }
};

export const changeSpeed = async (
  inputPath: string, 
  outputPath: string, 
  multiplier: number
): Promise<boolean> => {
  try {
    // For video: setpts=PTS/multiplier
    // For audio: atempo=multiplier (atempo limited to 0.5-2.0, so need chaining for higher/lower)
    // Simple implementation for 0.5, 1.5, 2.0
    let audioFilter = `atempo=${multiplier}`;
    if (multiplier > 2.0) audioFilter = `atempo=2.0,atempo=${multiplier/2.0}`;
    if (multiplier < 0.5) audioFilter = `atempo=0.5,atempo=${multiplier/0.5}`;

    const command = `-i "${inputPath}" -filter_complex "[0:v]setpts=${1/multiplier}*PTS[v];[0:a]${audioFilter}[a]" -map "[v]" -map "[a]" "${outputPath}"`;
    const session = await FFmpegKit.execute(command);
    return ReturnCode.isSuccess(await session.getReturnCode());
  } catch (e) {
    console.log("Speed change error", e);
    return false;
  }
};

import { WatermarkConfig, FilterConfig } from '../types';

export const getVideoDimensions = async (path: string): Promise<{width: number, height: number} | null> => {
  const session = await FFprobeKit.getMediaInformation(path);
  const info = session.getMediaInformation();
  const streams = info.getStreams();
  
  // Find video stream
  const videoStream = streams.find((s: any) => s.getType() === 'video');
  if (videoStream) {
      return {
          width: videoStream.getWidth(),
          height: videoStream.getHeight()
      };
  }
  return null;
};

export const cropVideo = async (
  inputPath: string, 
  outputPath: string, 
  w: number, 
  h: number, 
  x: number, 
  y: number
): Promise<boolean> => {
  // -vf "crop=w:h:x:y"
  const command = `-i "${inputPath}" -vf "crop=${w}:${h}:${x}:${y}" -c:v libx264 -preset ultrafast -c:a copy "${outputPath}"`;
  const session = await FFmpegKit.execute(command);
  return ReturnCode.isSuccess(await session.getReturnCode());
};

export const reverseVideo = async (inputPath: string, outputPath: string): Promise<boolean> => {
    // Reverse video and audio
    // Note: This is memory intensive
    const command = `-i "${inputPath}" -vf reverse -af areverse -preset ultrafast "${outputPath}"`;
    const session = await FFmpegKit.execute(command);
    return ReturnCode.isSuccess(await session.getReturnCode());
};

export const adjustVolume = async (inputPath: string, outputPath: string, multiplier: number): Promise<boolean> => {
    // multiplier: 0.0 (mute) to >1.0 (boost)
    const command = `-i "${inputPath}" -filter:a "volume=${multiplier}" -c:v copy "${outputPath}"`;
    const session = await FFmpegKit.execute(command);
    return ReturnCode.isSuccess(await session.getReturnCode());
};

export const applyFilter = async (
    inputPath: string, 
    outputPath: string, 
    config: FilterConfig
): Promise<boolean> => {
    // eq=brightness=B:contrast=C:saturation=S
    const command = `-i "${inputPath}" -vf "eq=brightness=${config.brightness}:contrast=${config.contrast}:saturation=${config.saturation}" -c:a copy -preset ultrafast "${outputPath}"`;
    const session = await FFmpegKit.execute(command);
    return ReturnCode.isSuccess(await session.getReturnCode());
};

export const addWatermark = async (
  inputPath: string, 
  outputPath: string, 
  config: WatermarkConfig
): Promise<boolean> => {
  try {
    // Escape text for ffmpeg
    const escapedText = config.text.replace(/:/g, '\\:').replace(/'/g, ''); 
    
    let fontOption = "";
    if (Platform.OS === 'android') {
        fontOption = "fontfile=/system/fonts/Roboto-Regular.ttf:";
    }

    let position = "x=10:y=H-th-10"; // Default Bottom Left
    switch (config.position) {
        case 'TOP_LEFT': position = "x=10:y=10"; break;
        case 'TOP_RIGHT': position = "x=W-tw-10:y=10"; break;
        case 'CENTER': position = "x=(W-tw)/2:y=(H-th)/2"; break;
        case 'BOTTOM_LEFT': position = "x=10:y=H-th-10"; break;
        case 'BOTTOM_RIGHT': position = "x=W-tw-10:y=H-th-10"; break;
    }

    const color = config.fontColor || 'white';
    const size = config.fontSize || '24';

    // Drawtext filter
    const command = `-i "${inputPath}" -vf "drawtext=${fontOption}text='${escapedText}':${position}:fontsize=${size}:fontcolor=${color}:box=1:boxcolor=black@0.5" -c:a copy "${outputPath}"`;
    const session = await FFmpegKit.execute(command);
    return ReturnCode.isSuccess(await session.getReturnCode());
  } catch (e) {
    console.log("Watermark error", e);
    return false;
  }
};




