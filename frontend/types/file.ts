/**
 * File system related types
 */

/** File or directory item from file manager */
export interface FileItem {
    name: string;
    path: string;
    isDirectory: boolean;
    size: number;
    permissions: string;
    lastModified: string;
}

/** File information with owner */
export interface FileInfo {
    name: string;
    path: string;
    size: string;
    permissions: string;
    updated: string;
    type: 'file' | 'folder';
    owner: string;
}
