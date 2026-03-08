import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useMachineStore, useAlertStore } from '../store';

const socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:3001');

export function useWebSocket() {
    const [isConnected, setIsConnected] = useState(socket.connected);
    const updateMachineReading = useMachineStore((state) => state.updateMachineReading);
    const updateMachineStatus = useMachineStore((state) => state.updateMachineStatus);
    const addAlert = useAlertStore((state) => state.addAlert);
    const resolveAlert = useAlertStore((state) => state.resolveAlert);

    useEffect(() => {
        function onConnect() {
            setIsConnected(true);
            console.log('--- [IMMS WS] Connected ---');
        }

        function onDisconnect() {
            setIsConnected(false);
            console.log('--- [IMMS WS] Disconnected ---');
        }

        function onSensorReading(data) {
            updateMachineReading(data.machine_id, data);
        }

        function onNewAlert(alert) {
            addAlert(alert);
            // Play sound for critical alerts
            if (alert.severity === 'critical') {
                const audio = new Audio('/alert.mp3');
                audio.play().catch(() => { });
            }
        }

        function onAlertResolved(data) {
            resolveAlert(data.alert_id);
        }

        function onMachineStatus(data) {
            updateMachineStatus(data.machine_id, data.status);
        }

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('sensor:reading', onSensorReading);
        socket.on('alert:new', onNewAlert);
        socket.on('alert:resolved', onAlertResolved);
        socket.on('machine:status', onMachineStatus);

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('sensor:reading', onSensorReading);
            socket.off('alert:new', onNewAlert);
            socket.off('alert:resolved', onAlertResolved);
            socket.off('machine:status', onMachineStatus);
        };
    }, [updateMachineReading, addAlert, resolveAlert, updateMachineStatus]);

    return { isConnected, socket };
}
