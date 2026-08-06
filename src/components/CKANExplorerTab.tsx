import React, { useState, useEffect } from 'react';
import { Search, Database, FileText, Table, AlertCircle, Loader, HardDrive, RefreshCw, Activity, CheckCircle2 } from 'lucide-react';
import { useToast } from './ToastProvider';
import { ckanConnector, ConnectorHealthStatus } from '../services/ConnectorSDK';

export default function CKANExplorerTab() {
  const { showToast } = useToast();
  const [query, setQuery] = useState('реєстр підприємств');
  const [loading, setLoading] = useState(false);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<any | null>(null);
  const [selectedResource, setSelectedResource] = useState<any | null>(null);
  const [schema, setSchema] = useState<any | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [healthStatus, setHealthStatus] = useState<ConnectorHealthStatus | null>(null);

  const connectorMeta = ckanConnector.metadata();

  const checkConnectorHealth = async () => {
    const status = await ckanConnector.health();
    setHealthStatus(status);
  };

  useEffect(() => {
    checkConnectorHealth();
  }, []);

  const searchDatasets = async () => {
    if (!query) return;
    setLoading(true);
    setDatasets([]);
    setSelectedDataset(null);
    setSelectedResource(null);
    try {
      const result = await ckanConnector.search({ query, limit: 15 });
      if (!result.success || result.error) throw new Error(result.error || 'Не вдалося завантажити набори даних');
      setDatasets(result.items);
      showToast(`Знайдено ${result.items.length} наборів даних через ${connectorMeta.name}`, 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadResource = async (resource: any) => {
    setSelectedResource(resource);
    setSchema(null);
    setRecords([]);
    setLoading(true);
    try {
      if (resource.datastore_active) {
        // Load schema via SDK
        const schemaRes = await ckanConnector.fetchResourceSchema(resource.resource_id);
        if (schemaRes.success && schemaRes.schema) {
          setSchema(schemaRes.schema);
        }

        // Load records via SDK
        const dataRes = await ckanConnector.fetchResourceData(resource.resource_id, 50);
        if (dataRes.success && dataRes.records) {
          setRecords(dataRes.records);
          showToast('Дані успішно завантажено та нормалізовано з DataStore SDK', 'success');
        } else if (dataRes.error) {
          throw new Error(dataRes.error);
        }
      } else {
        showToast('Цей ресурс не підтримує DataStore (лише завантаження файлу)', 'warning');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-end border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-bold uppercase">
              SDK: {connectorMeta.id} (v{connectorMeta.version})
            </span>
            {healthStatus && (
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1 font-bold ${
                healthStatus.status === 'ONLINE' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}>
                <Activity className="w-3 h-3 animate-pulse" />
                {healthStatus.status} ({healthStatus.latencyMs}ms)
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 sm:gap-3 leading-tight">
            <Database className="w-6 h-6 text-indigo-400 shrink-0" />
            {connectorMeta.name}
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-1">
            {connectorMeta.description}. Нормалізація типів даних та розпізнавання схем через `ConnectorSDK`.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchDatasets()}
            placeholder="Шукати набори даних..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm sm:text-base"
          />
        </div>
        <button
          onClick={searchDatasets}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 w-full sm:w-auto"
        >
          {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          Знайти
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 lg:overflow-hidden overflow-y-auto">
        {/* Datasets List */}
        <div className="w-full lg:w-1/3 bg-slate-900 border border-slate-800 rounded-xl overflow-y-auto max-h-[400px] lg:max-h-none shrink-0 lg:shrink">
          <div className="p-4 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center sticky top-0 z-10">
            <h3 className="font-medium text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              Набори даних
            </h3>
            <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded-full">{datasets.length}</span>
          </div>
          <div className="divide-y divide-slate-800/50">
            {datasets.map(dataset => (
              <div
                key={dataset.dataset_id}
                onClick={() => setSelectedDataset(dataset)}
                className={`p-4 cursor-pointer hover:bg-slate-800 transition-colors ${selectedDataset?.dataset_id === dataset.dataset_id ? 'bg-slate-800 border-l-2 border-indigo-500' : ''}`}
              >
                <h4 className="text-sm font-medium text-white line-clamp-2">{dataset.title}</h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-1">{dataset.organization}</p>
                <div className="flex gap-2 mt-3">
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
                    {dataset.resources_count} ресурсів
                  </span>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
                    {new Date(dataset.metadata_modified).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
            {!loading && datasets.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-sm">
                Немає результатів. Виконайте пошук.
              </div>
            )}
            {loading && datasets.length === 0 && (
              <div className="p-8 flex justify-center">
                <Loader className="w-6 h-6 text-indigo-500 animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Resources & Data */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6 overflow-visible lg:overflow-hidden min-h-[500px] lg:min-h-0">
          {selectedDataset ? (
            <>
              {/* Resources */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shrink-0">
                <div className="p-4 border-b border-slate-800 bg-slate-800/50">
                  <h3 className="font-medium text-white flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-emerald-400" />
                    Ресурси ({selectedDataset.title})
                  </h3>
                </div>
                <div className="p-4 flex gap-3 overflow-x-auto">
                  {selectedDataset.resources.map((res: any) => (
                    <button
                      key={res.resource_id}
                      onClick={() => loadResource(res)}
                      className={`flex flex-col gap-1 p-3 rounded-lg border text-left min-w-[200px] max-w-[250px] transition-colors ${selectedResource?.resource_id === res.resource_id ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${res.format === 'JSON' || res.format === 'CSV' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-300'}`}>
                          {res.format || 'FILE'}
                        </span>
                        {res.datastore_active && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Database className="w-3 h-3" /> DataStore
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-slate-200 line-clamp-2 mt-1">{res.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* DataStore Preview */}
              {selectedResource && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl flex-1 flex flex-col min-h-[400px] lg:min-h-0">
                  <div className="p-4 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center">
                    <h3 className="font-medium text-white flex items-center gap-2">
                      <Table className="w-4 h-4 text-blue-400" />
                      Попередній перегляд (DataStore)
                    </h3>
                    {schema && (
                      <span className="text-xs text-slate-400">
                        Всього записів: <strong className="text-slate-200">{schema.total_records.toLocaleString()}</strong>
                      </span>
                    )}
                  </div>
                  
                  {loading && !schema ? (
                    <div className="p-8 flex flex-col items-center justify-center flex-1">
                      <Loader className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
                      <p className="text-slate-400 text-sm">Вилучення метаданих та записів...</p>
                    </div>
                  ) : selectedResource.datastore_active ? (
                    <div className="flex-1 overflow-auto">
                      {records.length > 0 ? (
                        <table className="w-full text-sm text-left">
                          <thead className="text-xs text-slate-400 uppercase bg-slate-800/50 sticky top-0">
                            <tr>
                              {schema?.fields.map((field: any) => (
                                <th key={field.name} className="px-4 py-3 font-medium whitespace-nowrap">
                                  {field.name}
                                  <span className="block text-[9px] text-slate-500 lowercase mt-0.5">{field.type}</span>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                            {records.map((record: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-800/30">
                                {schema?.fields.map((field: any) => (
                                  <td key={field.name} className="px-4 py-3 text-slate-300 max-w-[150px] sm:max-w-[200px] lg:max-w-[300px] truncate" title={String(record[field.name] || '')}>
                                    {String(record[field.name] || '-')}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="p-8 flex flex-col items-center justify-center h-full text-slate-500">
                          <AlertCircle className="w-8 h-8 mb-3 opacity-50" />
                          <p>Немає даних у DataStore або сталася помилка.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-8 flex flex-col items-center justify-center flex-1 text-slate-500">
                      <AlertCircle className="w-8 h-8 mb-3 opacity-50" />
                      <p>Цей ресурс не підтримує CKAN DataStore.</p>
                      <p className="text-sm mt-2">Системі потрібно завантажити файл ({selectedResource.format}) для парсингу, що потребує налаштування Pipeline.</p>
                      <a href={selectedResource.url} target="_blank" rel="noreferrer" className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm font-medium">
                        Завантажити файл напряму
                      </a>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl flex-1 flex flex-col items-center justify-center text-slate-500 p-8">
              <Database className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-lg">Виберіть набір даних для перегляду</p>
              <p className="text-sm mt-2 w-full text-center opacity-70">
                Конектор автоматично виявляє ресурси та схеми, підключаючись до API data.gov.ua
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
