import { create } from 'zustand';

export const useMachineStore = create((set) => ({
    machines: [],
    summary: {
        total_machines: 0,
        online: 0,
        active_alerts: { warning: 0, critical: 0 },
        uptime_percent: 0,
        last_updated: null
    },

    setMachines: (machines) => set({ machines }),

    setSummary: (summary) => set({ summary }),

    updateMachineReading: (machine_id, reading) => set((state) => ({
        machines: state.machines.map((m) =>
            m.id === machine_id ? { ...m, latest: reading } : m
        ),
    })),

    updateMachineStatus: (machine_id, status) => set((state) => ({
        machines: state.machines.map((m) =>
            m.id === machine_id ? { ...m, status } : m
        ),
    })),
}));

export const useAlertStore = create((set) => ({
    alerts: [],

    setAlerts: (alerts) => set({ alerts }),

    addAlert: (alert) => set((state) => {
        // Deduplicate in UI state if needed
        const exists = state.alerts.find(a => a.id === alert.id);
        if (exists) return state;

        return {
            alerts: [alert, ...state.alerts].slice(0, 100)
        };
    }),

    acknowledgeAlert: (id, engineerName) => set((state) => ({
        alerts: state.alerts.map((a) =>
            a.id === id ? { ...a, acknowledged: true, acknowledged_by: engineerName } : a
        ),
    })),

    resolveAlert: (id) => set((state) => ({
        alerts: state.alerts.map((a) =>
            a.id === id ? { ...a, resolved_at: new Date().toISOString() } : a
        ),
    })),
}));

export const useAuthStore = create((set) => ({
    token: localStorage.getItem('imms_token') || null,
    user: JSON.parse(localStorage.getItem('imms_user')) || null,

    setAuth: (token, user) => {
        localStorage.setItem('imms_token', token);
        localStorage.setItem('imms_user', JSON.stringify(user));
        set({ token, user });
    },

    logout: () => {
        localStorage.removeItem('imms_token');
        localStorage.removeItem('imms_user');
        set({ token: null, user: null });
    }
}));
