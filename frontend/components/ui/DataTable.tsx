import React, { ReactNode, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

// ==================== Types ====================

export interface DataTableColumn<T> {
    /** Column unique key */
    key: string;
    /** Column header label */
    header: string;
    /** Column width (CSS value) */
    width?: string;
    /** Text alignment */
    align?: 'left' | 'center' | 'right';
    /** Custom cell renderer */
    render?: (item: T, index: number) => ReactNode;
    /** Simple accessor for string/number values */
    accessor?: keyof T;
    /** Apply monospace font */
    mono?: boolean;
}

export interface DataTableProps<T> {
    /** Table data */
    data: T[];
    /** Column definitions */
    columns: DataTableColumn<T>[];
    /** Row key extractor */
    rowKey: (item: T, index: number) => string | number;
    /** Empty state message */
    emptyMessage?: string;
    /** Optional group header (for collapsible sections) */
    groupHeader?: string;
    /** Optional count to show in group header */
    groupCount?: number;
    /** Start collapsed? */
    defaultCollapsed?: boolean;
    /** Custom row class */
    rowClassName?: string | ((item: T, index: number) => string);
}

// ==================== DataTable Component ====================

export function DataTable<T>({
    data,
    columns,
    rowKey,
    emptyMessage = 'No data available',
    groupHeader,
    groupCount,
    defaultCollapsed = false,
    rowClassName,
}: DataTableProps<T>) {
    const [collapsed, setCollapsed] = useState(defaultCollapsed);

    const renderCell = (column: DataTableColumn<T>, item: T, index: number): ReactNode => {
        if (column.render) {
            return column.render(item, index);
        }
        if (column.accessor) {
            return String(item[column.accessor] ?? '');
        }
        return null;
    };

    const getRowClass = (item: T, index: number): string => {
        if (typeof rowClassName === 'function') {
            return rowClassName(item, index);
        }
        return rowClassName || '';
    };

    const tableContent = (
        <div className="overflow-x-auto">
            {data.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-sm">
                    {emptyMessage}
                </div>
            ) : (
                <table className="w-full text-left border-collapse table-fixed">
                    <thead>
                        <tr className="bg-zinc-900/50 border-t border-border text-xs uppercase text-zinc-500">
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={`p-3 font-medium ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}`}
                                    style={col.width ? { width: col.width } : undefined}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-border">
                        {data.map((item, index) => (
                            <tr
                                key={rowKey(item, index)}
                                className={`hover:bg-zinc-800/50 transition-colors ${getRowClass(item, index)}`}
                            >
                                {columns.map((col) => (
                                    <td
                                        key={col.key}
                                        className={`p-3 ${col.mono ? 'font-mono text-xs' : ''} ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''} text-zinc-300`}
                                    >
                                        {renderCell(col, item, index)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );

    // Render with group header (collapsible)
    if (groupHeader) {
        return (
            <div className="border border-border rounded-lg overflow-hidden">
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900 hover:bg-zinc-800/80 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        {collapsed ? (
                            <ChevronRight size={16} className="text-zinc-500" />
                        ) : (
                            <ChevronDown size={16} className="text-zinc-500" />
                        )}
                        <span className="font-medium text-zinc-200">{groupHeader}</span>
                        {groupCount !== undefined && (
                            <span className="text-zinc-500 text-sm">({groupCount} items)</span>
                        )}
                    </div>
                </button>
                {!collapsed && tableContent}
            </div>
        );
    }

    // Render without group header
    return (
        <div className="border border-border rounded-lg overflow-hidden">
            {tableContent}
        </div>
    );
}

// ==================== Cell Renderers (Utility) ====================

/** Badge cell renderer for status/type columns */
export const badgeCell = (
    value: string,
    colorMap?: Record<string, string>
): ReactNode => {
    const defaultColors: Record<string, string> = {
        ACCEPT: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        DROP: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
        REJECT: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        running: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        stopped: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
        exited: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    };

    const colors = colorMap || defaultColors;
    const colorClass = colors[value] || 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';

    return (
        <span className={`px-2 py-0.5 rounded text-xs font-bold border ${colorClass}`}>
            {value}
        </span>
    );
};

/** Monospace text cell */
export const monoCell = (value: string | number): ReactNode => (
    <span className="font-mono text-xs text-zinc-400">{value}</span>
);

export default DataTable;
