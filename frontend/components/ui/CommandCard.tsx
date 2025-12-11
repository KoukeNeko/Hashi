import React, { useState } from 'react';
import { Copy, CheckCircle } from 'lucide-react';

// ==================== Types ====================

export interface CommandStep {
    /** Step title/description */
    title: string;
    /** Command to copy */
    command: string;
}

export interface CommandCardProps {
    /** Step number (1-indexed) */
    stepNumber?: number;
    /** Step title */
    title: string;
    /** Command to execute */
    command: string;
}

export interface CommandListProps {
    /** List of command steps */
    commands: CommandStep[];
}

// ==================== CommandCard Component ====================

/**
 * A card displaying a terminal command with a copy button.
 * Used in setup guides for Docker, Libvirt, Nginx, etc.
 */
export const CommandCard: React.FC<CommandCardProps> = ({ stepNumber, title, command }) => {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(command);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className="bg-zinc-900 rounded-lg overflow-hidden border border-border">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-zinc-800/50">
                <span className="text-xs text-zinc-400 font-medium">
                    {stepNumber !== undefined ? `${stepNumber}. ${title}` : title}
                </span>
                <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                    {copied ? (
                        <>
                            <CheckCircle size={12} className="text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                        </>
                    ) : (
                        <>
                            <Copy size={12} />
                            <span>Copy</span>
                        </>
                    )}
                </button>
            </div>
            <div className="p-4">
                <code className="text-sm font-mono text-emerald-400 break-all">{command}</code>
            </div>
        </div>
    );
};

// ==================== CommandList Component ====================

/**
 * A list of command cards, automatically numbered.
 */
export const CommandList: React.FC<CommandListProps> = ({ commands }) => {
    return (
        <div className="space-y-4">
            {commands.map((item, index) => (
                <CommandCard
                    key={index}
                    stepNumber={index + 1}
                    title={item.title}
                    command={item.command}
                />
            ))}
        </div>
    );
};

export default CommandCard;
