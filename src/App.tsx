import { useState, useEffect, useMemo, useCallback } from 'react';
import { SimpleTable, ReactColumnDef } from '@simple-table/react';
import '@simple-table/react/styles.css';
import { fetchAndParseCSV } from './utils/csv';
import { useDebounce } from './hooks/useDebounce';
import { RefreshCw, Search, X } from 'lucide-react';
import type { Theme } from 'simple-table-core';

export default function App() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>('light');
  
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);

  const sheetId = import.meta.env.VITE_GOOGLE_SHEET_ID;
  const sheetName = import.meta.env.VITE_GOOGLE_SHEET_NAME;

  const fetchData = useCallback(async () => {
    if (!sheetId || !sheetName) {
      setError('Missing VITE_GOOGLE_SHEET_ID or VITE_GOOGLE_SHEET_NAME in environment variables.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const parsedData = await fetchAndParseCSV(sheetId, sheetName);
      setData(parsedData);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching data.');
    } finally {
      setLoading(false);
    }
  }, [sheetId, sheetName]);

  // Initial load only
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Generate columns dynamically based on first row of data
  const columns = useMemo(() => {
    if (data.length === 0) return [];
    
    // Extract keys from the first object
    const keys = Object.keys(data[0]);
    
    return keys.map((key) => ({
      label: key,
      accessor: key,
      sortable: true,
      filterable: true,
      width: 150, // default width
    } as ReactColumnDef<any>));
  }, [data]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <h1 className="text-xl font-semibold">Web Pricelist DGI</h1>
        <div className="flex items-center gap-4">
          <select 
            value={theme}
            onChange={(e) => setTheme(e.target.value as Theme)}
            className="text-sm bg-slate-100 border border-slate-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="neutral">Neutral</option>
            <option value="modern-light">Modern Light</option>
            <option value="modern-dark">Modern Dark</option>
          </select>
        </div>
      </header>

      {/* Control Bar */}
      <div className="bg-white px-6 py-3 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-10 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Smart filter (multi-word, quoted phrases...)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <button 
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              onClick={() => setSearchInput('')}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSearchInput('')}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Reset Filters
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-6 relative overflow-hidden">
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md max-w-2xl mx-auto mt-8">
            <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Data</h3>
            <p>{error}</p>
            <div className="mt-4">
              <p className="text-sm text-red-600 font-medium mb-1">Make sure you have set up your environment variables in AI Studio:</p>
              <ul className="list-disc pl-5 text-sm text-red-600">
                <li><code className="bg-red-100 px-1 rounded">VITE_GOOGLE_SHEET_ID</code></li>
                <li><code className="bg-red-100 px-1 rounded">VITE_GOOGLE_SHEET_NAME</code></li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 h-[75vh] w-full relative">
            {loading && data.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
                <div className="flex flex-col items-center">
                  <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mb-2" />
                  <p className="text-slate-600 font-medium">Loading dataset...</p>
                </div>
              </div>
            ) : (
              <SimpleTable
                columns={columns}
                rows={data}
                theme={theme}
                columnReordering={true}
                columnResizing={true}
                selectableCells={true}
                enableColumnEditor={true}
                selectableColumns={false}
                height="75vh"
                quickFilter={{ text: debouncedSearch, mode: 'smart' }}
              />
            )}
            
            {loading && data.length > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 z-10 backdrop-blur-sm transition-opacity duration-300">
                <div className="flex flex-col items-center bg-white p-4 rounded-lg shadow-lg border border-slate-100">
                  <RefreshCw className="h-6 w-6 text-blue-600 animate-spin mb-2" />
                  <p className="text-sm text-slate-700 font-medium">Refreshing...</p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
