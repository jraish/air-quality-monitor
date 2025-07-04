import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function PermissionLoadingPage() {
    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#85D4E3" />
            <Text style={styles.loadingText}>Loading permissions...</Text>
            <StatusBar style="auto" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#CDC08C',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        fontFamily: 'Helvetica',
        color: '#fff',
        textAlign: 'center',
        textTransform: 'uppercase',
    },
});
