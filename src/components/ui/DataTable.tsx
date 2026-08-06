import React, { useState, useMemo, useCallback } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Download, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// ── Types ──────────────────────────────────────────────
export interface DataTableColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T, index: number) => React.ReactNode;
  getValue?: (row: T) => any;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  pageSize?: number;
  searchable?: boolean;
  exportable?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T, index: number) => void;
  rowClassName?: (row: T, index: number) => string;
  stickyHeader?: boolean;
  compact?: boolean;
}

type SortDirection = 'asc' | 'desc' | null;

// ── Component ──────────────────────────────────────────
export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  pageSize = 20,
  searchable = true,
  exportable = true,
  emptyMessage = "Записів не знайдено",
  onRowClick,
  rowClassName,
  stickyHeader = true,
  compact = false,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  // ── Get cell value ──
  const getCellValue = useCallback((row: T, col: DataTableColumn<T>) => {
    if (col.getValue) return col.getValue(row);
    return (row as any)[col.key];
  }, []);

  // ── Filtered data ──
  const filteredData = useMemo(() => {
    let result = [...data];

    // Global search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(row =>
        columns.some(col => {
          const val = getCellValue(row, col);
          return val != null && String(val).toLowerCase().includes(q);
        })
      );
    }

    // Column filters
    Object.entries(columnFilters).forEach(([key, filterVal]) => {
      if (!(filterVal as string).trim()) return;
      const col = columns.find(c => c.key === key);
      if (!col) return;
      const fq = (filterVal as string).toLowerCase();
      result = result.filter(row => {
        const val = getCellValue(row, col);
        return val != null && String(val).toLowerCase().includes(fq);
      });
    });

    return result;
  }, [data, searchQuery, columnFilters, columns, getCellValue]);

  // ── Sorted data ──
  const sortedData = useMemo(() => {
    if (!sortKey || !sortDir) return filteredData;
    const col = columns.find(c => c.key === sortKey);
    if (!col) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = getCellValue(a, col);
      const bVal = getCellValue(b, col);
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      let cmp: number;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        cmp = aVal - bVal;
      } else {
        cmp = String(aVal).localeCompare(String(bVal), 'uk');
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });
  }, [filteredData, sortKey, sortDir, columns, getCellValue]);

  // ── Pagination ──
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = currentPage * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // ── Sort handler ──
  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc');
      else if (sortDir === 'desc') { setSortKey(null); setSortDir(null); }
      else setSortDir('asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setCurrentPage(0);
  };

  // ── CSV Export ──
  const handleExport = () => {
    const headers = columns.map(c => c.label).join(',');
    const rows = sortedData.map(row =>
      columns.map(col => {
        const val = getCellValue(row, col);
        const str = val == null ? '' : String(val);
        return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `export_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const py = compact ? 'py-2' : 'py-3.5';
  const px = compact ? 'px-3' : 'px-4';

  return (
    <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl overflow-hidden">
      {/* ── Toolbar ── */}
      <div className="px-4 py-3 border-b border-slate-800/60 flex items-center gap-3 flex-wrap">
        {searchable && (
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(0); }}
              placeholder="Пошук у таблиці..."
              className="w-full pl-9 pr-3 py-2 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                aria-label="Очистити пошук"
                title="Очистити пошук"
              >
                <X size={12} />
              </button>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
              showFilters
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border-slate-700/60 hover:border-slate-600'
            }`}
            aria-expanded={showFilters}
            aria-controls="column-filters"
          >
            <Filter size={12} />
            Фільтри
          </button>

          {exportable && (
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:border-slate-600 font-medium transition-all cursor-pointer"
            >
              <Download size={12} />
              CSV
            </button>
          )}

          <span className="text-[10px] text-slate-600 font-mono px-2">
            {sortedData.length} з {data.length}
          </span>
        </div>
      </div>

      {/* ── Column Filters Row ── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden border-b border-slate-800/40"
          >
            <div className="px-4 py-2 flex gap-2 flex-wrap bg-slate-900/40">
              {columns.filter(c => c.filterable !== false).map(col => (
                <input
                  key={col.key}
                  type="text"
                  value={columnFilters[col.key] || ''}
                  onChange={(e) => {
                    setColumnFilters(prev => ({ ...prev, [col.key]: e.target.value }));
                    setCurrentPage(0);
                  }}
                  placeholder={col.label}
                  className="px-2.5 py-1.5 bg-slate-800/80 border border-slate-700/50 rounded-lg text-[10px] text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/40 transition-colors w-32"
                />
              ))}
              {Object.values(columnFilters).some(v => v) && (
                <button
                  onClick={() => { setColumnFilters({}); setCurrentPage(0); }}
                  className="px-2.5 py-1.5 text-[10px] text-red-400 hover:text-red-300 font-medium cursor-pointer"
                >
                  Скинути
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Table ── */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className={`bg-slate-800/40 text-slate-500 font-mono text-[10px] uppercase tracking-widest ${stickyHeader ? 'sticky top-0 z-10' : ''}`}>
            <tr>
              {columns.map(col => (
                <th
                  className={`${px} ${py} ${col.width ? '' : ''} ${col.sortable !== false ? 'cursor-pointer select-none hover:text-slate-300 transition-colors' : ''}`}
                  style={{ width: col.width, textAlign: col.align || 'left' }}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  onKeyDown={(e) => {
                    if (col.sortable !== false && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      handleSort(col.key);
                    }
                  }}
                  tabIndex={col.sortable !== false ? 0 : undefined}
                  role={col.sortable !== false ? 'columnheader button' : 'columnheader'}
                  aria-sort={
                    sortKey === col.key
                      ? sortDir === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                >
                  <div className={`flex items-center gap-1.5 ${col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : ''}`}>
                    {col.label}
                    {col.sortable !== false && (
                      <span className="opacity-40">
                        {sortKey === col.key ? (
                          sortDir === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />
                        ) : (
                          <ArrowUpDown size={10} />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center text-slate-500 text-sm">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, i) => {
                const globalIdx = currentPage * pageSize + i;
                return (
                  <tr
                    key={globalIdx}
                    onClick={() => onRowClick?.(row, globalIdx)}
                    onKeyDown={(e) => {
                      if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        onRowClick(row, globalIdx);
                      }
                    }}
                    tabIndex={onRowClick ? 0 : undefined}
                    role={onRowClick ? 'button' : 'row'}
                    className={`hover:bg-slate-800/30 transition-colors ${
                      onRowClick ? 'cursor-pointer' : ''
                    } ${rowClassName?.(row, globalIdx) || ''}`}
                  >
                    {columns.map(col => (
                      <td
                        key={col.key}
                        className={`${px} ${py} ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}`}
                      >
                        {col.render
                          ? col.render(getCellValue(row, col), row, globalIdx)
                          : <span className="text-slate-300">{getCellValue(row, col) ?? '—'}</span>
                        }
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-slate-800/40 flex items-center justify-between">
          <span className="text-[10px] text-slate-600 font-mono">
            {currentPage * pageSize + 1}–{Math.min((currentPage + 1) * pageSize, sortedData.length)} з {sortedData.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 7) {
                pageNum = i;
              } else if (currentPage < 3) {
                pageNum = i;
              } else if (currentPage > totalPages - 4) {
                pageNum = totalPages - 7 + i;
              } else {
                pageNum = currentPage - 3 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-7 h-7 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                      : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {pageNum + 1}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
