import { MainChannels } from '@onlook/models/constants';
import { ipcMain } from 'electron';

export function sendAnalytics(_event: string, _data?: Record<string, any>) {
    // Local-only app: analytics disabled
}

class Analytics {
    private static instance: Analytics;

    private constructor() {}

    public static getInstance(): Analytics {
        if (!Analytics.instance) {
            Analytics.instance = new Analytics();
        }
        return Analytics.instance;
    }

    public toggleSetting(_enable: boolean) {
        // No-op
    }

    public track(_event: string, _data?: Record<string, any>, _callback?: () => void) {
        // No-op
    }

    public trackError(_message: string, _data?: Record<string, any>) {
        // No-op
    }

    public identify(_user: any) {
        // No-op
    }

    public updateUserMetadata(_user: any) {
        // No-op
    }

    public signOut() {
        // No-op
    }
}

export default Analytics.getInstance();
