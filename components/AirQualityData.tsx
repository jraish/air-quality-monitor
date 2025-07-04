import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { BleManager, State } from 'react-native-ble-plx';
import Toast from 'react-native-toast-message';

interface AirQualityDataProps {
    setConnectedDevice: (device: BluetoothDevice | null) => void;
    bleManager: BleManager;
    connectedDevice: BluetoothDevice;
}

interface BluetoothDevice {
    id: string;
    name: string | null;
    rssi: number | null;
    isConnectable: boolean | null;
}

interface IncomingData {
    characteristicUUID: string;
    serviceUUID: string;
    rawValue: string;
    timestamp: Date;
}

const AirQualityData: React.FC<AirQualityDataProps> = ({
    setConnectedDevice,
    bleManager,
    connectedDevice
}) => {
    const [bluetoothState, setBluetoothState] = useState<State>(State.Unknown);
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamData, setStreamData] = useState<IncomingData[]>([]);

    useEffect(() => {
        const subscription = bleManager.onStateChange((state) => {
            setBluetoothState(state);
        }, true);

        const disconnectionListener = bleManager.onDeviceDisconnected(connectedDevice?.id || '', (error, device) => {
            if (error) {
                console.error('Device disconnection error:', error);
            } else {
                console.log('Device disconnected:', device?.id);
                setConnectedDevice(null);
            }
        });

        return () => {
            subscription.remove();
            disconnectionListener.remove();
        };
    }, [bleManager, connectedDevice, setConnectedDevice]);

    useEffect(() => {
        if (!connectedDevice && isStreaming) {
            console.log('Device disconnected, stopping stream');
            setIsStreaming(false);
            setStreamData([]);
        }
    }, [connectedDevice, isStreaming]);

    const startDataStreaming = async () => {
        if (!connectedDevice) return;

        setIsStreaming(true);
        setStreamData([]);

        try {
            const services = await bleManager.servicesForDevice(connectedDevice.id);

            console.log('Available services:', services.map(s => s.uuid));

            let monitoringCount = 0;

            for (const service of services) {
                const characteristics = await service.characteristics();
                console.log(`Service ${service.uuid} characteristics:`, characteristics.map(c => ({
                    uuid: c.uuid,
                    isNotifiable: c.isNotifiable,
                    isReadable: c.isReadable,
                    isWritableWithResponse: c.isWritableWithResponse,
                    isWritableWithoutResponse: c.isWritableWithoutResponse
                })));

                for (const char of characteristics) {
                    if (char.isNotifiable) {
                        console.log(`Setting up streaming for: ${char.uuid}`);
                        monitoringCount++;

                        bleManager.monitorCharacteristicForDevice(
                            connectedDevice.id,
                            service.uuid,
                            char.uuid,
                            (error, characteristic) => {
                                if (error) {
                                    return;
                                }

                                if (characteristic?.value) {
                                    console.log(`Streamed data from ${char.uuid}:`, characteristic.value);
                                    const newData: IncomingData = {
                                        characteristicUUID: char.uuid,
                                        serviceUUID: service.uuid,
                                        rawValue: characteristic.value,
                                        timestamp: new Date(),
                                    };

                                    setStreamData(prev => [newData, ...prev.slice(0, 99)]);
                                }
                            }
                        );
                    }
                }
            }

            if (monitoringCount === 0) {
                Toast.show({
                    type: 'info',
                    text1: 'No Streaming Available',
                    text2: 'This device has no notifiable characteristics'
                });
            } else {
                Toast.show({
                    type: 'success',
                    text1: 'Streaming Started',
                    text2: `Monitoring ${monitoringCount} notifiable characteristics`
                });
            }
        } catch (error) {
            console.error('Error streaming data:', error);
            Toast.show({
                type: 'error',
                text1: 'Streaming Error',
                text2: 'Failed to stream data'
            });
            setIsStreaming(false);
        }
    };

    const stopDataStreaming = () => {
        console.log('Stopping data streaming...');

        bleManager.cancelTransaction('all');
        setIsStreaming(false);

        Toast.show({
            type: 'info',
            text1: 'Streaming Stopped',
            text2: 'Data streaming has been stopped'
        });
    };



    const disconnectDevice = async () => {
        if (connectedDevice) {
            try {
                if (isStreaming) {
                    stopDataStreaming();
                }

                await bleManager.cancelDeviceConnection(connectedDevice.id);
                setConnectedDevice(null);
                setStreamData([]);

                Toast.show({
                    type: 'success',
                    text1: 'Disconnected',
                    text2: 'Device disconnected successfully'
                });
            } catch (error) {
                console.error('Error:', error);
                Toast.show({
                    type: 'error',
                    text1: 'Disconnect Error',
                    text2: 'Failed to disconnect device'
                });
            }
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Air Quality Data</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Connection Status</Text>
                <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>Bluetooth:</Text>
                    <Text style={[styles.statusValue, { color: bluetoothState === State.PoweredOn ? '#9C964A' : '#FD6467' }]}>
                        {bluetoothState}
                    </Text>
                </View>

                <View style={styles.connectedDevice}>
                    <View style={styles.controls}>
                        {!isStreaming ? (
                            <TouchableOpacity style={styles.startButton} onPress={startDataStreaming}>
                                <Text style={styles.buttonText}>Start Streaming</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={styles.stopButton} onPress={stopDataStreaming}>
                                <Text style={styles.buttonText}>Stop Streaming</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity style={styles.disconnectButton} onPress={disconnectDevice}>
                            <Text style={styles.buttonText}>Disconnect</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Incoming Data ({streamData.length})</Text>
                {streamData.length === 0 ? (
                    <Text style={styles.noDataText}>No data received yet. Start streaming to see data.</Text>
                ) : (
                    streamData.map((data, index) => {
                        console.log(`Rendering data item ${index}:`, data.characteristicUUID, data.timestamp.toLocaleTimeString());
                        return (
                            <View key={`${data.characteristicUUID}-${data.timestamp.getTime()}`} style={styles.dataCard}>
                                <View style={styles.dataHeader}>
                                    <Text style={styles.timestamp}>{data.timestamp.toLocaleTimeString()}</Text>
                                    <Text style={styles.characteristicUUID}>Char: {data.characteristicUUID.slice(-8)}</Text>
                                </View>
                                <Text style={styles.serviceUUID}>Service: {data.serviceUUID.slice(-8)}</Text>
                                <Text style={styles.rawValue}>Raw Data: {data.rawValue}</Text>
                            </View>
                        );
                    })
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F4B5BD',
    },
    header: {
        backgroundColor: '#9C964A',
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
        backgroundColor: 'rgba(156, 150, 74, 0.3)',
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
        marginBottom: 15,
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
    connectedDevice: {
        backgroundColor: 'rgba(250, 215, 123, 0.4)',
        padding: 15,
        borderRadius: 8,
        marginTop: 10,
    },
    connectedLabel: {
        fontSize: 14,
        fontFamily: 'Helvetica',
        color: '#fff',
        textTransform: 'uppercase',
    },
    connectedName: {
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'Helvetica',
        color: '#fff',
        marginTop: 5,
        textTransform: 'uppercase',
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 15,
        gap: 10,
    },
    startButton: {
        backgroundColor: '#9C964A',
        padding: 10,
        borderRadius: 5,
        flex: 1,
        alignItems: 'center',
    },
    stopButton: {
        backgroundColor: '#F1BB7B',
        padding: 10,
        borderRadius: 5,
        flex: 1,
        alignItems: 'center',
    },
    disconnectButton: {
        backgroundColor: '#FD6467',
        padding: 10,
        borderRadius: 5,
        flex: 1,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: 'Helvetica',
        textTransform: 'uppercase',
    },
    streamingIndicator: {
        backgroundColor: 'rgba(253, 100, 103, 0.2)',
        padding: 10,
        borderRadius: 5,
        marginTop: 10,
        alignItems: 'center',
    },
    streamingText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: 'Helvetica',
        textTransform: 'uppercase',
    },
    noDataText: {
        fontSize: 14,
        color: '#fff',
        fontStyle: 'italic',
        fontFamily: 'Helvetica',
        textAlign: 'center',
        padding: 20,
        textTransform: 'uppercase',
    },
    dataCard: {
        backgroundColor: 'rgba(133, 212, 227, 0.2)',
        padding: 12,
        marginBottom: 8,
        borderRadius: 6,
        borderLeftWidth: 4,
        borderLeftColor: '#9C964A',
    },
    dataHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    timestamp: {
        fontSize: 12,
        color: '#fff',
        fontWeight: 'bold',
        fontFamily: 'Helvetica',
        textTransform: 'uppercase',
    },
    characteristicUUID: {
        fontSize: 12,
        color: '#fff',
        fontWeight: 'bold',
        fontFamily: 'Helvetica',
        textTransform: 'uppercase',
    },
    serviceUUID: {
        fontSize: 11,
        color: '#fff',
        fontFamily: 'Helvetica',
        marginBottom: 5,
        textTransform: 'uppercase',
    },
    rawValue: {
        fontSize: 12,
        color: '#fff',
        fontFamily: 'Helvetica',
        backgroundColor: 'rgba(156, 150, 74, 0.4)',
        padding: 8,
        borderRadius: 4,
        textTransform: 'uppercase',
    },
});

export default AirQualityData; 