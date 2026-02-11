import React from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';

interface LogViewerProps {
    logs: string[];
    visible: boolean;
}

export const LogViewer: React.FC<LogViewerProps> = ({ logs, visible }) => {
    if (!visible || logs.length === 0) return null;

    return (
        <View style={styles.logsPreview}>
            <ScrollView style={styles.logsScroll}>
                {logs.map((log, index) => (
                    <Text key={index} style={styles.logText}>{log}</Text>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
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
});
