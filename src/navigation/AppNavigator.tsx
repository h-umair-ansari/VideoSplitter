import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DashboardScreen } from '../screens/DashboardScreen';
import { SplitScreen } from '../screens/tools/SplitScreen';
import { TrimScreen } from '../screens/tools/TrimScreen';
import { MergeScreen } from '../screens/tools/MergeScreen';
import { CropScreen } from '../screens/tools/CropScreen';
import { WatermarkScreen } from '../screens/tools/WatermarkScreen';
import { AudioScreen } from '../screens/tools/AudioScreen';
import { VolumeScreen } from '../screens/tools/VolumeScreen';
import { FilterScreen } from '../screens/tools/FilterScreen';
import { ReverseScreen } from '../screens/tools/ReverseScreen';
import { CompressScreen } from '../screens/tools/CompressScreen';
import { SpeedScreen } from '../screens/tools/SpeedScreen';
import { GifScreen } from '../screens/tools/GifScreen';
import { MagicCutScreen } from '../screens/ai_tools/MagicCutScreen';
import { AutoCaptionsScreen } from '../screens/ai_tools/AutoCaptionsScreen';
import { AiRemoveBackgroundScreen } from '../screens/ai_tools/AiRemoveBackgroundScreen';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator 
                initialRouteName="Dashboard"
                screenOptions={{
                    headerStyle: { backgroundColor: '#F2F2F7' },
                    headerTitleStyle: { fontWeight: 'bold' },
                    contentStyle: { backgroundColor: '#fff' },
                }}
            >
                <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Video Toolkit' }} />
                <Stack.Screen name="Split" component={SplitScreen} options={{ title: 'Split Video' }} />
                <Stack.Screen name="Trim" component={TrimScreen} options={{ title: 'Trim Video' }} />
                <Stack.Screen name="Merge" component={MergeScreen} options={{ title: 'Merge Videos' }} />
                <Stack.Screen name="Crop" component={CropScreen} options={{ title: 'Crop Video' }} />
                <Stack.Screen name="Watermark" component={WatermarkScreen} options={{ title: 'Add Watermark' }} />
                <Stack.Screen name="Audio" component={AudioScreen} options={{ title: 'Extract Audio' }} />
                <Stack.Screen name="Volume" component={VolumeScreen} options={{ title: 'Adjust Volume' }} />
                <Stack.Screen name="Filter" component={FilterScreen} options={{ title: 'Color Filters' }} />
                <Stack.Screen name="Reverse" component={ReverseScreen} options={{ title: 'Reverse Video' }} />
                <Stack.Screen name="Compress" component={CompressScreen} options={{ title: 'Compress Video' }} />
                <Stack.Screen name="Speed" component={SpeedScreen} options={{ title: 'Change Speed' }} />
                <Stack.Screen name="Gif" component={GifScreen} options={{ title: 'Convert to GIF' }} />
                
                {/* AI Tools Routes */}
                <Stack.Screen name="MagicCut" component={MagicCutScreen} options={{ title: 'Magic Cut (Silence)' }} />
                <Stack.Screen name="AutoCaptions" component={AutoCaptionsScreen} options={{ title: 'Auto Captions' }} />
                <Stack.Screen name="AiRemoveBg" component={AiRemoveBackgroundScreen} options={{ title: 'Remove Background' }} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};
