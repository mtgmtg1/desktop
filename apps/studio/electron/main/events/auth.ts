// [Flow: Register local auth IPC handlers -> Bridge to local auth module]
import { MainChannels } from '@onlook/models/constants';
import { ipcMain } from 'electron';
import {
    changePassword,
    createAccount,
    deleteAccount,
    listAccounts,
    signIn,
    signOut,
} from '../auth';

export function listenForAuthMessages() {
    ipcMain.handle(MainChannels.LOCAL_SIGN_IN, (e: Electron.IpcMainInvokeEvent, args) => {
        return signIn(args.email, args.password);
    });

    ipcMain.handle(MainChannels.LOCAL_SIGN_OUT, () => {
        return signOut();
    });

    ipcMain.handle(MainChannels.LOCAL_CREATE_ACCOUNT, (e: Electron.IpcMainInvokeEvent, args) => {
        return createAccount(args.email, args.password, args.isAdmin);
    });

    ipcMain.handle(MainChannels.LOCAL_CHANGE_PASSWORD, (e: Electron.IpcMainInvokeEvent, args) => {
        return changePassword(args.email, args.newPassword);
    });

    ipcMain.handle(MainChannels.LOCAL_LIST_ACCOUNTS, () => {
        return listAccounts();
    });

    ipcMain.handle(MainChannels.LOCAL_DELETE_ACCOUNT, (e: Electron.IpcMainInvokeEvent, args) => {
        return deleteAccount(args.email);
    });
}
