import { AnnouncementModal } from './Announcement';
import { QuittingModal } from './Quitting';
import { SettingsModal } from './Settings';

export const Modals = () => {
    return (
        <>
            <SettingsModal />
            <QuittingModal />
            <AnnouncementModal />
        </>
    );
};
