"use client";

import React, { useState, useMemo } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { ArrowUpDown, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { EmptyErrorState } from "./empty-error-state";

export interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  totalRows?: number;
  isLoading?: boolean;
  onRowClick?: (row: TData) => void;
  virtualizeRows?: boolean;
  height?: string | number;
  searchPlaceholder?: string;
  searchColumnKey?: string;
  isPermissionDenied?: boolean;
}

export function DataTable<TData>({
  columns,
  data,
  isLoading = false,
  onRowClick,
  height = "auto",
  searchPlaceholder = "Search records...",
  searchColumnKey,
  isPermissionDenied = false,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const filteredRows = table.getRowModel().rows;
  const pageCount = Math.ceil(filteredRows.length / pageSize);
  const paginatedRows = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, pageIndex, pageSize]);

  // Gracefully render Access Denied if 403 / cross-tenant violation without crashing
  if (isPermissionDenied) {
    return (
      <EmptyErrorState
        variant="access-denied"
        title="403 Forbidden: Tenant Isolation Active"
        message="Cross-tenant access attempt was blocked by server authorization policies. No data was leaked."
      />
    );
  }

  return (
    <div className="w-full space-y-3">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={globalFilter ?? ""}
            onChange={(e) => {
              setGlobalFilter(e.target.value);
              setPageIndex(0);
            }}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/70 focus:ring-1 focus:ring-emerald-500/70 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 self-end sm:self-center">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPageIndex(0);
            }}
            className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 focus:outline-none"
          >
            {[5, 10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span className="font-mono text-slate-300 ml-2">
            {filteredRows.length} total records
          </span>
        </div>
      </div>

      {/* Main Table Container */}
      <div
        style={{ maxHeight: height }}
        className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/90 shadow-xl"
      >
        <table className="w-full text-left border-collapse">
          {/* Sticky Header */}
          <thead className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider backdrop-blur-sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3.5 select-none"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1.5 cursor-pointer hover:text-slate-200 transition-colors">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getCanSort() && (
                        <ArrowUpDown className="w-3 h-3 text-slate-500" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-800/80 text-sm text-slate-200 font-normal">
            {isLoading ? (
              // Anti-lag strict skeleton loading
              Array.from({ length: pageSize }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  {columns.map((_, cIdx) => (
                    <td key={cIdx} className="px-4 py-4">
                      <div className="h-4 bg-slate-800 rounded w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedRows.length > 0 ? (
              paginatedRows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick && onRowClick(row.original)}
                  className={cn(
                    "transition-colors hover:bg-slate-800/60",
                    onRowClick ? "cursor-pointer" : ""
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3.5 align-middle">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center">
                  <EmptyErrorState
                    variant="no-orders"
                    title="No records found"
                    message="No entries matched your active filters or search terms."
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between px-2 pt-1 text-xs text-slate-400">
          <div>
            Page <span className="font-mono text-slate-200">{pageIndex + 1}</span> of{" "}
            <span className="font-mono text-slate-200">{pageCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
              disabled={pageIndex === 0}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPageIndex((p) => Math.min(pageCount - 1, p + 1))}
              disabled={pageIndex >= pageCount - 1}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
