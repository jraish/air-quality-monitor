import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal } from 'react-native';
import { BleManager, State } from 'react-native-ble-plx';

interface BluetoothSettingsProps {
    setConnectedDevice: (device: BluetoothDevice | null) => void;
    bleManager: BleManager;
}

interface BluetoothDevice {
    id: string;
    name: string | null;
    rssi: number | null;
    isConnectable: boolean | null;
}

const BluetoothSettings: React.FC<BluetoothSettingsProps> = ({
    setConnectedDevice,
    bleManager
}) => {
    const [bluetoothState, setBluetoothState] = useState<State>(State.Unknown);
    const [isScanning, setIsScanning] = useState(false);
    const [devices, setDevices] = useState<BluetoothDevice[]>([]);
    const [connectingDeviceId, setConnectingDeviceId] = useState<string | null>(null);

    useEffect(() => {
        const subscription = bleManager.onStateChange((state) => {
            setBluetoothState(state);
        }, true);

        return () => {
            subscription.remove();
        };
    }, [bleManager]);

    const scanForDevices = () => {
        if (bluetoothState !== State.PoweredOn) {
            Alert.alert('Bluetooth Error', 'Bluetooth is not enabled');
            return;
        }

        setIsScanning(true);
        setDevices([]);

        bleManager.startDeviceScan(null, null, (error, device) => {
            if (error) {
                console.error('Scan error:', error);
                setIsScanning(false);
                return;
            }

            if (device) {
                setDevices(existingDevices => {
                    const alreadyScanned = existingDevices.find(d => d.id === device.id);
                    if (!alreadyScanned) {
                        return [...existingDevices, {
                            id: device.id,
                            name: device.name,
                            rssi: device.rssi,
                            isConnectable: device.isConnectable,
                        }];
                    }
                    return existingDevices;
                });
            }
        });

        setTimeout(() => {
            bleManager.stopDeviceScan();
            setIsScanning(false);
        }, 10000);
    };

    const connect = async (device: BluetoothDevice) => {
        setConnectingDeviceId(device.id);

        try {
            const connected = await bleManager.connectToDevice(device.id);
            await connected.discoverAllServicesAndCharacteristics();

            setConnectedDevice(device);
            Alert.alert('Success', `Connected to ${device.name || device.id}`);

            bleManager.stopDeviceScan();
            setIsScanning(false);
        } catch (error) {
            console.error('Connection error:', error);
            Alert.alert('Connection Failed', 'Could not connect');
        } finally {
            setConnectingDeviceId(null);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Bluetooth Setup</Text>
                    <Text style={styles.subtitle}>Scan and connect to a device</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Bluetooth Status</Text>
                    <View style={styles.statusRow}>
                        <Text style={styles.statusLabel}>State:</Text>
                        <Text style={[styles.statusValue, { color: bluetoothState === State.PoweredOn ? '#9C964A' : '#FD6467' }]}>
                            {bluetoothState}
                        </Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Device Scanning</Text>
                    <TouchableOpacity
                        style={[styles.scanButton, isScanning && styles.scanButtonDisabled]}
                        onPress={scanForDevices}
                        disabled={isScanning || bluetoothState !== State.PoweredOn}
                    >
                        {isScanning ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>
                                {devices.length > 0 ? 'Scan Again' : 'Start Scan'}
                            </Text>
                        )}
                    </TouchableOpacity>

                    {isScanning && (
                        <Text style={styles.scanningText}>Scanning for devices...</Text>
                    )}
                </View>

                {devices.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Available Devices ({devices.length})</Text>
                        {devices.map((device) => (
                            <View key={device.id} style={styles.deviceItem}>
                                <View style={styles.deviceInfo}>
                                    <Text style={styles.deviceName}>
                                        {device.name || 'Unknown Device'}
                                    </Text>
                                    <Text style={styles.deviceId}>{device.id}</Text>
                                </View>
                                <TouchableOpacity
                                    style={[styles.connectButton, connectingDeviceId === device.id && styles.connectButtonDisabled]}
                                    onPress={() => connect(device)}
                                    disabled={connectingDeviceId !== null}
                                >
                                    {connectingDeviceId === device.id ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text style={styles.buttonText}>Connect</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>

            <Modal
                transparent={true}
                visible={connectingDeviceId !== null}
                animationType="fade"
            >
                <View style={styles.loadingOverlay}>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#85D4E3" />
                        <Text style={styles.loadingText}>Connecting to device...</Text>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAD77B',
    },
    header: {
        backgroundColor: '#85D4E3',
        padding: 20,
        paddingTop: 60,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: 'Helvetica',
        color: '#fff',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    subtitle: {
        fontSize: 16,
        fontFamily: 'Helvetica',
        color: '#fff',
        textTransform: 'uppercase',
    },
    section: {
        backgroundColor: 'rgba(133, 212, 227, 0.3)',
        margin: 16,
        padding: 16,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'Helvetica',
        color: '#fff',
        marginBottom: 12,
        textTransform: 'uppercase',
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusLabel: {
        fontSize: 16,
        fontFamily: 'Helvetica',
        color: '#fff',
        textTransform: 'uppercase',
    },
    statusValue: {
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'Helvetica',
        textTransform: 'uppercase',
    },
    scanButton: {
        backgroundColor: '#9C964A',
        padding: 12,
        borderRadius: 6,
        alignItems: 'center',
        marginBottom: 8,
    },
    scanButtonDisabled: {
        backgroundColor: '#9E9E9E',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'Helvetica',
        textTransform: 'uppercase',
    },
    scanningText: {
        textAlign: 'center',
        color: '#fff',
        fontStyle: 'italic',
        fontFamily: 'Helvetica',
        textTransform: 'uppercase',
    },
    deviceItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        backgroundColor: 'rgba(244, 181, 189, 0.3)',
        borderRadius: 6,
        marginBottom: 8,
    },
    deviceInfo: {
        flex: 1,
    },
    deviceName: {
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'Helvetica',
        color: '#fff',
        textTransform: 'uppercase',
    },
    deviceId: {
        fontSize: 12,
        fontFamily: 'Helvetica',
        color: '#fff',
        marginTop: 2,
        textTransform: 'uppercase',
    },
    deviceRssi: {
        fontSize: 12,
        fontFamily: 'Helvetica',
        color: '#fff',
        marginTop: 2,
        textTransform: 'uppercase',
    },
    connectButton: {
        backgroundColor: '#F4B5BD',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 4,
    },
    connectButtonDisabled: {
        backgroundColor: '#9E9E9E',
    },
    loadingOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingContainer: {
        backgroundColor: '#fff',
        padding: 30,
        borderRadius: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        fontFamily: 'Helvetica',
        color: '#333',
        textAlign: 'center',
        textTransform: 'uppercase',
    },
});

export default BluetoothSettings; 