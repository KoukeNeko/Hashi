/**
 * Update-related types
 */

/** Update channel types */
export type UpdateChannel = 'stable' | 'beta' | 'dev';

/** Update information from backend API */
export interface UpdateInfo {
    currentVersion: string;
    latestVersion: string;
    updateAvailable: boolean;
    channel: UpdateChannel;
    releaseNotes: string;
    downloadUrl: string;
    lastChecked: string;
}
