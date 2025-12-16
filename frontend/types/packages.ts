/**
 * Package management types
 */

export interface PackageInfo {
    name: string;
    version: string;
    description: string;
    status: string; // 'installed', 'upgradable', 'not_installed', etc.
    architecture: string;
}
