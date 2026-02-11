import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import RNFS from 'react-native-fs';

const App = () => {
    useEffect(() => {
        const createDirs = async () => {
            try {
                // Ensure base directories exist
                const dirs = [
                    `${RNFS.DocumentDirectoryPath}/split_parts`,
                    `${RNFS.DocumentDirectoryPath}/processed`
                ];
                for (const dir of dirs) {
                    if (!(await RNFS.exists(dir))) {
                        await RNFS.mkdir(dir);
                    }
                }
            } catch (error) {
                console.error('Failed to create directories:', error);
            }
        };
        createDirs();
    }, []);

    return (
        <SafeAreaProvider>
            <AppNavigator />
        </SafeAreaProvider>
    );
};

export default App;
