import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { PermissionsAndroid, Platform } from 'react-native';
import AirQualityMonitor from './pages/AirQualityMonitorPage';
import PermissionLoadingPage from './pages/PermissionLoadingPage';
import Toast from 'react-native-toast-message';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const requestPermissions = async () => {
      if (Platform.OS === 'android' && Platform.Version >= 23) {
        try {
          const perms = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          ]);

          const allApproved = Object.values(perms).every(
            (status) => status === PermissionsAndroid.RESULTS.GRANTED
          );

          if (!allApproved) {
            Alert.alert('Missing necessary Bluetooth permissions');
          }

          setIsLoading(false);
        } catch (e) {
          console.warn('Error getting permissions');
        }
      }
    }

    requestPermissions();
  }, []);

  return (
    <View style={styles.container}>
      {isLoading ? <PermissionLoadingPage /> : <AirQualityMonitor />}
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
