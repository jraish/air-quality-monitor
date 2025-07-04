import React, { useState, useEffect } from 'react';
import { BleManager, State } from 'react-native-ble-plx';
import AirQualityData from '../components/AirQualityData';
import BluetoothSettings from '../components/BluetoothSettings';

interface BluetoothDevice {
    id: string;
    name: string | null;
    rssi: number | null;
    isConnectable: boolean | null;
}

const AirQualityMonitor: React.FC = () => {
    const [bleManager] = useState(() => new BleManager());
    const [connectedDevice, setConnectedDevice] = useState<BluetoothDevice | null>(null);

    useEffect(() => {
        return () => {
            bleManager.destroy();
        };
    }, [bleManager]);

    return connectedDevice ? (
        <AirQualityData
            setConnectedDevice={setConnectedDevice}
            bleManager={bleManager}
            connectedDevice={connectedDevice}
        />
    ) : (<BluetoothSettings
        setConnectedDevice={setConnectedDevice}
        bleManager={bleManager}
    />)
};

export default AirQualityMonitor; 