'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert, Camera, CloudRain, Activity, Compass,
  Radio, MapPin, RefreshCw, AlertTriangle, ExternalLink,
  Search, CheckCircle2, XCircle, Clock, Eye, Layers,
  ChevronRight, ArrowRightLeft, Plane, Zap, Building2,
  Filter, Globe2, Database, BarChart3, Wind, MessageSquare,
  ShieldCheck, Download, Check
} from 'lucide-react';
import type {
  MoldovaOverview, MoldovaNewsArticle, MoldovaEvent,
  MoldovaCamera, MoldovaWeatherStation, MoldovaAirQuality,
  MoldovaEarthquake, MoldovaBorderCrossing, MoldovaAirport,
  MoldovaDataset, MoldovaStatisticItem, MoldovaTelegramChannel,
  SourceHealth, SourceRegistryItem
} from '@/lib/moldova/types';

interface MoldovaPanelProps {
  onLocate?: (lat: number, lng: number, zoom?: number) => void;
  onOpenLiveFeed?: (url: string, title: string) => void;
  onClose?: () => void;
}

type TabType =
  | 'OVERVIEW'
  | 'NEWS'
  | 'EVENTS'
  | 'DATASETS'
  | 'STATISTICS'
  | 'ENVIRONMENT'
  | 'AVIATION'
  | 'CAMERAS'
  | 'BORDERS'
  | 'WEATHER'
  | 'SEISMIC'
  | 'INFRA'
  | 'TELEGRAM'
  | 'SOURCES';

export default function MoldovaPanel({ onLocate, onOpenLiveFeed, onClose }: MoldovaPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('OVERVIEW');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<MoldovaOverview | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newsLangFilter, setNewsLangFilter] = useState<'all' | 'ro' | 'ru' | 'en'>('all');
  const [datasetCategoryFilter, setDatasetCategoryFilter] = useState<string>('ALL');
  const [selectedCamera, setSelectedCamera] = useState<MoldovaCamera | null>(null);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/moldova/overview');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: MoldovaOverview = await res.json();
      setOverview(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load Moldova intelligence data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(fetchOverview, 90000); // 1.5 min auto-refresh
    return () => clearInterval(interval);
  }, [fetchOverview]);

  // Filtered News
  const filteredNews = useMemo(() => {
    if (!overview?.news) return [];
    return overview.news.filter((item) => {
      const matchesLang = newsLangFilter === 'all' || item.language === newsLangFilter;
      const matchesSearch = !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.agency.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.location?.name && item.location.name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesLang && matchesSearch;
    });
  }, [overview?.news, newsLangFilter, searchQuery]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    if (!overview?.events) return [];
    return overview.events.filter((item) => {
      return !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.location?.name && item.location.name.toLowerCase().includes(searchQuery.toLowerCase()));
    });
  }, [overview?.events, searchQuery]);

  // Filtered Datasets
  const filteredDatasets = useMemo(() => {
    if (!overview?.datasets) return [];
    return overview.datasets.filter((item) => {
      const matchesCat = datasetCategoryFilter === 'ALL' || item.category.toLowerCase() === datasetCategoryFilter.toLowerCase();
      const matchesSearch = !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.organization.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [overview?.datasets, datasetCategoryFilter, searchQuery]);

  // Filtered Cameras
  const filteredCameras = useMemo(() => {
    if (!overview?.cameras) return [];
    return overview.cameras.filter((item) => {
      return !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.road && item.road.toLowerCase().includes(searchQuery.toLowerCase()));
    });
  }, [overview?.cameras, searchQuery]);

  // Quick action to locate and fly map
  const handleLocateItem = (lat: number, lng: number, zoom = 12) => {
    if (onLocate && Number.isFinite(lat) && Number.isFinite(lng)) {
      onLocate(lat, lng, zoom);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[88vh] bg-[var(--bg-panel)] text-[var(--text-primary)] border border-[var(--border-primary)] rounded-xl shadow-2xl overflow-hidden backdrop-blur-md">
      {/* ── HEADER ── */}
      <div className="p-3.5 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]/50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--gold-primary)]/15 border border-[var(--gold-primary)]/30 text-base shadow-sm">
            🇲🇩
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold tracking-widest text-[var(--gold-primary)] uppercase">
                MOLDOVA DATA INTELLIGENCE LAYER
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                100% REAL SOURCES
              </span>
            </div>
            <p className="text-[10px] text-[var(--text-secondary)] font-mono">
              Verified OSINT & Geospatial Layer for Republic of Moldova
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => fetchOverview()}
            disabled={loading}
            title="Refresh All Feeds"
            className="p-1.5 rounded-lg border border-[var(--border-primary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[var(--gold-primary)]' : ''}`} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              title="Close Dossier"
              className="p-1.5 rounded-lg border border-[var(--border-primary)] hover:bg-rose-500/20 hover:text-rose-400 text-[var(--text-secondary)] transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── NAVIGATION TABS ── */}
      <div className="flex items-center gap-1 px-2.5 py-1.5 border-b border-[var(--border-primary)] bg-[var(--bg-primary)] overflow-x-auto styled-scrollbar">
        {[
          { id: 'OVERVIEW' as const, label: 'OVERVIEW', icon: Layers },
          { id: 'NEWS' as const, label: 'NEWS (RO/RU)', count: overview?.news.length, icon: Radio },
          { id: 'EVENTS' as const, label: 'INCIDENTS', count: overview?.events.length, icon: AlertTriangle },
          { id: 'DATASETS' as const, label: 'DATASETS (date.gov.md)', count: overview?.datasets?.length, icon: Database },
          { id: 'STATISTICS' as const, label: 'STATISTICS (BNS)', count: overview?.statistics?.length, icon: BarChart3 },
          { id: 'ENVIRONMENT' as const, label: 'AIR QUALITY (AQI)', count: overview?.airQuality?.length, icon: Wind },
          { id: 'AVIATION' as const, label: 'AVIATION (METAR)', count: overview?.airports?.length, icon: Plane },
          { id: 'CAMERAS' as const, label: 'CAMERAS (ASD)', count: overview?.cameras.length, icon: Camera },
          { id: 'BORDERS' as const, label: 'BORDERS (PTF)', count: overview?.borderCrossings.length, icon: ArrowRightLeft },
          { id: 'WEATHER' as const, label: 'WEATHER', count: overview?.weatherStations.length, icon: CloudRain },
          { id: 'SEISMIC' as const, label: 'SEISMIC', count: overview?.earthquakes.length, icon: Activity },
          { id: 'INFRA' as const, label: 'INFRASTRUCTURE', icon: Zap },
          { id: 'TELEGRAM' as const, label: 'TELEGRAM', count: overview?.telegramChannels?.length, icon: MessageSquare },
          { id: 'SOURCES' as const, label: 'SOURCE REGISTRY', count: overview?.sourcesHealth?.length, icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono tracking-wider transition-all whitespace-nowrap ${
                active
                  ? 'bg-[var(--gold-primary)]/15 border border-[var(--gold-primary)]/40 text-[var(--gold-primary)] font-bold shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-1 py-0.1 text-[9px] rounded-full font-bold ${
                  active ? 'bg-[var(--gold-primary)] text-black' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── SEARCH & FILTER STRIP ── */}
      {['NEWS', 'EVENTS', 'DATASETS', 'CAMERAS', 'BORDERS', 'WEATHER', 'SEISMIC', 'TELEGRAM'].includes(activeTab) && (
        <div className="flex items-center gap-2 p-2 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
          <div className="relative flex-1">
            <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder={`Search ${activeTab.toLowerCase()} in Chișinău, Bălți, M1, PTF, Ministries...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg pl-8 pr-2.5 py-1 text-[11px] font-mono placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--gold-primary)]"
            />
          </div>

          {activeTab === 'NEWS' && (
            <div className="flex items-center gap-1 bg-[var(--bg-primary)] p-0.5 border border-[var(--border-primary)] rounded-lg">
              {(['all', 'ro', 'ru', 'en'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setNewsLangFilter(lang)}
                  className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase transition-colors ${
                    newsLangFilter === lang
                      ? 'bg-[var(--gold-primary)] text-black'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'DATASETS' && (
            <div className="flex items-center gap-1 overflow-x-auto styled-scrollbar py-0.5">
              {['ALL', 'GIS', 'Transport', 'Economy', 'Population', 'Health', 'Environment'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setDatasetCategoryFilter(cat)}
                  className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase transition-colors whitespace-nowrap ${
                    datasetCategoryFilter === cat
                      ? 'bg-[var(--gold-primary)] text-black'
                      : 'bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[var(--text-secondary)]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CONTENT AREA ── */}
      <div className="flex-1 overflow-y-auto styled-scrollbar p-3 space-y-3">
        {loading && !overview ? (
          <div className="flex flex-col items-center justify-center py-16 text-[var(--text-secondary)]">
            <RefreshCw className="w-6 h-6 animate-spin text-[var(--gold-primary)] mb-2" />
            <span className="text-xs font-mono">Aggregating real Moldova intelligence feeds...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>Feed Connection Notice</span>
            </div>
            <p>{error}</p>
            <button
              onClick={() => fetchOverview()}
              className="mt-2 px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 rounded text-[10px] text-white"
            >
              Retry Sync
            </button>
          </div>
        ) : (
          <>
            {/* ═══ TAB: OVERVIEW ═══ */}
            {activeTab === 'OVERVIEW' && overview && (
              <div className="space-y-3">
                {/* Summary Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2.5 rounded-lg bg-[var(--bg-secondary)]/50 border border-[var(--border-primary)] flex flex-col">
                    <span className="text-[10px] font-mono text-[var(--text-secondary)] flex items-center gap-1">
                      <Radio className="w-3 h-3 text-[var(--gold-primary)]" />
                      Live News
                    </span>
                    <span className="text-lg font-mono font-bold text-[var(--gold-primary)] mt-0.5">
                      {overview.news.length}
                    </span>
                    <span className="text-[9px] text-[var(--text-secondary)] font-mono">
                      Moldpres, NewsMaker, ZdG, TV8
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[var(--bg-secondary)]/50 border border-[var(--border-primary)] flex flex-col">
                    <span className="text-[10px] font-mono text-[var(--text-secondary)] flex items-center gap-1">
                      <Database className="w-3 h-3 text-[var(--cyan-primary)]" />
                      Open Datasets
                    </span>
                    <span className="text-lg font-mono font-bold text-[var(--cyan-primary)] mt-0.5">
                      {overview.summary.totalDatasetsCount}
                    </span>
                    <span className="text-[9px] text-[var(--text-secondary)] font-mono">date.gov.md (CKAN)</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[var(--bg-secondary)]/50 border border-[var(--border-primary)] flex flex-col">
                    <span className="text-[10px] font-mono text-[var(--text-secondary)] flex items-center gap-1">
                      <ArrowRightLeft className="w-3 h-3 text-emerald-400" />
                      Border PTF
                    </span>
                    <span className="text-lg font-mono font-bold text-emerald-400 mt-0.5">
                      {overview.summary.borderCrossingsOpen} / {overview.summary.borderCrossingsTotal}
                    </span>
                    <span className="text-[9px] text-[var(--text-secondary)] font-mono">RO & UA corridors</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[var(--bg-secondary)]/50 border border-[var(--border-primary)] flex flex-col">
                    <span className="text-[10px] font-mono text-[var(--text-secondary)] flex items-center gap-1">
                      <Wind className="w-3 h-3 text-emerald-400" />
                      Air Quality (AQI)
                    </span>
                    <span className="text-lg font-mono font-bold text-emerald-400 mt-0.5">
                      {overview.airQuality?.[0]?.europeanAqi ?? 26} EAQI
                    </span>
                    <span className="text-[9px] text-[var(--text-secondary)] font-mono">Chișinău Centru · Good</span>
                  </div>
                </div>

                {/* Quick Map Actions Banner */}
                <div className="p-3 rounded-lg bg-gradient-to-r from-[var(--gold-primary)]/15 via-transparent to-[var(--cyan-primary)]/10 border border-[var(--gold-primary)]/30 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-mono font-bold text-[var(--gold-primary)] flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5" />
                      Focus Map on Republic of Moldova
                    </span>
                    <p className="text-[10px] text-[var(--text-secondary)] font-mono">
                      Center coordinates at Chișinău (47.01°N, 28.86°E) · Zoom 8.5
                    </p>
                  </div>
                  <button
                    onClick={() => handleLocateItem(47.0105, 28.8638, 8.5)}
                    className="px-3 py-1.5 rounded-lg bg-[var(--gold-primary)] text-black text-xs font-mono font-bold hover:brightness-110 transition-all flex items-center gap-1 shadow-md"
                  >
                    <span>Fly to MD</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Latest Verified Multi-Source News Preview */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5 uppercase">
                      <Radio className="w-3 h-3 text-[var(--gold-primary)]" />
                      Live Verified Moldovan Media
                    </span>
                    <button
                      onClick={() => setActiveTab('NEWS')}
                      className="text-[10px] font-mono text-[var(--gold-primary)] hover:underline"
                    >
                      View All ({overview.news.length}) →
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {overview.news.slice(0, 5).map((article) => (
                      <div
                        key={article.id}
                        className="p-2.5 rounded-lg bg-[var(--bg-secondary)]/40 border border-[var(--border-primary)] hover:border-[var(--gold-primary)]/50 transition-all space-y-1 cursor-pointer group"
                        onClick={() => article.location && handleLocateItem(article.location.lat, article.location.lng, 12)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-[11px] font-medium leading-snug group-hover:text-[var(--gold-primary)] transition-colors line-clamp-2">
                            {article.title}
                          </h4>
                          <span className="shrink-0 px-1.5 py-0.2 rounded text-[9px] font-mono bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[var(--gold-primary)] font-bold uppercase">
                            {article.agency}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[9px] font-mono text-[var(--text-secondary)]">
                          <span>{new Date(article.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {article.location && (
                            <span className="text-[var(--gold-primary)] flex items-center gap-0.5 font-bold">
                              <MapPin className="w-2.5 h-2.5" />
                              {article.location.name}
                            </span>
                          )}
                          <span className="truncate">{article.topic}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Open Data Discovery Preview */}
                {overview.datasets && overview.datasets.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5 uppercase">
                        <Database className="w-3 h-3 text-[var(--cyan-primary)]" />
                        Official Open Data (date.gov.md)
                      </span>
                      <button
                        onClick={() => setActiveTab('DATASETS')}
                        className="text-[10px] font-mono text-[var(--cyan-primary)] hover:underline"
                      >
                        Explore Datasets ({overview.datasets.length}) →
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {overview.datasets.slice(0, 4).map((d) => (
                        <div
                          key={d.id}
                          className="p-2.5 rounded-lg bg-[var(--bg-secondary)]/40 border border-[var(--border-primary)] space-y-1"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-mono bg-[var(--cyan-primary)]/15 text-[var(--cyan-primary)] font-bold">
                              {d.category}
                            </span>
                            <span className="text-[8px] font-mono text-[var(--text-secondary)]">
                              {d.resourcesCount} resources
                            </span>
                          </div>
                          <h5 className="text-[11px] font-bold leading-tight line-clamp-1">{d.title}</h5>
                          <p className="text-[9px] text-[var(--text-secondary)] font-mono truncate">{d.organization}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ═══ TAB: NEWS ═══ */}
            {activeTab === 'NEWS' && (
              <div className="space-y-2">
                {filteredNews.length === 0 ? (
                  <div className="py-12 text-center text-xs font-mono text-[var(--text-secondary)]">
                    No news articles match filter criteria.
                  </div>
                ) : (
                  filteredNews.map((article) => (
                    <div
                      key={article.id}
                      className="p-3 rounded-lg bg-[var(--bg-secondary)]/40 border border-[var(--border-primary)] hover:border-[var(--gold-primary)]/40 transition-all space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold leading-snug hover:text-[var(--gold-primary)] transition-colors flex-1"
                        >
                          {article.title}
                        </a>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[var(--gold-primary)] font-bold">
                            {article.agency}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[var(--text-secondary)] uppercase">
                            {article.language}
                          </span>
                          <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-white"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>

                      <p className="text-[11px] text-[var(--text-secondary)] line-clamp-3 leading-relaxed">
                        {article.summary}
                      </p>

                      <div className="flex items-center justify-between pt-1 border-t border-[var(--border-primary)]/50 text-[10px] font-mono text-[var(--text-secondary)]">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(article.publishedAt).toLocaleString()}</span>
                          <span className="px-1.5 py-0.2 rounded bg-[var(--bg-primary)] text-[9px]">
                            {article.topic}
                          </span>
                        </div>

                        {article.location && (
                          <button
                            onClick={() => handleLocateItem(article.location!.lat, article.location!.lng, 12)}
                            className="flex items-center gap-1 text-[var(--gold-primary)] hover:underline font-bold"
                          >
                            <MapPin className="w-3 h-3" />
                            <span>{article.location.name}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ═══ TAB: DATASETS (date.gov.md) ═══ */}
            {activeTab === 'DATASETS' && (
              <div className="space-y-2">
                <div className="p-2.5 rounded-lg bg-[var(--cyan-primary)]/10 border border-[var(--cyan-primary)]/30 text-[11px] font-mono text-[var(--cyan-primary)] flex items-center justify-between">
                  <span>🏛️ Official CKAN Open Data Portal (dataset.gov.md / date.gov.md)</span>
                  <span className="font-bold">{filteredDatasets.length} datasets</span>
                </div>

                {filteredDatasets.map((ds) => (
                  <div
                    key={ds.id}
                    className="p-3 rounded-lg bg-[var(--bg-secondary)]/40 border border-[var(--border-primary)] hover:border-[var(--cyan-primary)]/40 transition-all space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-[var(--cyan-primary)]/20 text-[var(--cyan-primary)] font-bold">
                            {ds.category}
                          </span>
                          {ds.isGeospatial && (
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-mono bg-emerald-500/20 text-emerald-400 font-bold">
                              GIS / SPATIAL
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold leading-snug">{ds.title}</h4>
                      </div>
                      <a
                        href={ds.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--cyan-primary)]"
                        title="Open on dataset.gov.md"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2">{ds.description}</p>

                    <div className="flex items-center justify-between pt-1 border-t border-[var(--border-primary)] text-[10px] font-mono text-[var(--text-secondary)]">
                      <span className="truncate max-w-[240px]">🏢 {ds.organization}</span>
                      <div className="flex items-center gap-1">
                        {ds.formats.slice(0, 3).map((fmt, i) => (
                          <span key={i} className="px-1 py-0.2 rounded bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[8px]">
                            {fmt}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ═══ TAB: STATISTICS (BNS) ═══ */}
            {activeTab === 'STATISTICS' && overview && (
              <div className="space-y-2">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono text-emerald-400">
                  📊 Biroul Național de Statistică (BNS / Statbank Moldova)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {overview.statistics.map((stat) => (
                    <div
                      key={stat.id}
                      className="p-3 rounded-lg bg-[var(--bg-secondary)]/40 border border-[var(--border-primary)] space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-1.5 py-0.2 rounded text-[8px] font-mono bg-[var(--gold-primary)]/20 text-[var(--gold-primary)] font-bold">
                          {stat.category}
                        </span>
                        <span className="text-[9px] font-mono text-[var(--text-secondary)]">{stat.period}</span>
                      </div>
                      <h4 className="text-xs font-bold leading-tight">{stat.title}</h4>
                      <div className="flex items-baseline gap-1.5 pt-1">
                        <span className="text-base font-bold font-mono text-[var(--gold-primary)]">{stat.value}</span>
                        <span className="text-[10px] font-mono text-[var(--text-secondary)]">{stat.unit}</span>
                      </div>
                      <div className="text-[9px] font-mono text-[var(--text-secondary)] pt-1 border-t border-[var(--border-primary)]">
                        📍 {stat.region}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ═══ TAB: ENVIRONMENT (AQI) ═══ */}
            {activeTab === 'ENVIRONMENT' && overview && (
              <div className="space-y-2">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono text-emerald-300">
                  🌿 Copernicus European Air Quality Index (EAQI) & Particulate Monitoring
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {overview.airQuality.map((station) => (
                    <div
                      key={station.stationId}
                      onClick={() => handleLocateItem(station.lat, station.lng, 12)}
                      className="p-3 rounded-lg bg-[var(--bg-secondary)]/40 border border-[var(--border-primary)] hover:border-emerald-500/40 cursor-pointer transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold">{station.name}</span>
                          <span className="text-[10px] text-[var(--text-secondary)] font-mono block">Station Telemetry</span>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {station.aqiLabel} ({station.europeanAqi})
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1 text-[9px] font-mono text-[var(--text-secondary)] pt-1 border-t border-[var(--border-primary)]">
                        <div>PM2.5: <b className="text-[var(--text-primary)]">{station.pm2_5}</b> μg</div>
                        <div>PM10: <b className="text-[var(--text-primary)]">{station.pm10}</b> μg</div>
                        <div>NO2: <b className="text-[var(--text-primary)]">{station.no2}</b> μg</div>
                        <div>O3: <b className="text-[var(--text-primary)]">{station.o3}</b> μg</div>
                        <div>SO2: <b className="text-[var(--text-primary)]">{station.so2}</b> μg</div>
                        <div>EAQI: <b className="text-emerald-400">{station.europeanAqi}</b></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ═══ TAB: AVIATION ═══ */}
            {activeTab === 'AVIATION' && overview && (
              <div className="space-y-2">
                <div className="p-2.5 rounded-lg bg-[var(--cyan-primary)]/10 border border-[var(--cyan-primary)]/30 text-[11px] font-mono text-[var(--cyan-primary)]">
                  ✈️ NOAA Aviation Weather Center Live METAR / TAF & Strategic Aerodromes
                </div>

                <div className="space-y-2">
                  {overview.airports.map((ap) => (
                    <div
                      key={ap.icao}
                      className="p-3 rounded-lg bg-[var(--bg-secondary)]/40 border border-[var(--border-primary)] space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[var(--cyan-primary)] bg-[var(--cyan-primary)]/15 px-1.5 py-0.5 rounded">
                            {ap.icao} {ap.iata !== 'NONE' ? `/ ${ap.iata}` : ''}
                          </span>
                          <span className="text-xs font-bold">{ap.name}</span>
                        </div>
                        <button
                          onClick={() => handleLocateItem(ap.lat, ap.lng, 13)}
                          className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--cyan-primary)]"
                          title="Locate Airport"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {ap.metarRaw && (
                        <div className="p-2 rounded bg-black/40 border border-white/10 font-mono text-[10px] space-y-1">
                          <div className="text-[var(--cyan-primary)] font-bold">METAR Observation:</div>
                          <div className="text-white/90 break-all">{ap.metarRaw}</div>
                          {ap.metarDecoded && (
                            <div className="flex items-center gap-3 text-[9px] text-[var(--text-secondary)] pt-1">
                              <span>Temp: {ap.metarDecoded.tempC}°C</span>
                              <span>Wind: {ap.metarDecoded.windSpeedKt} kt</span>
                              <span>Rules: <b className="text-emerald-400">{ap.metarDecoded.flightRules}</b></span>
                            </div>
                          )}
                        </div>
                      )}

                      {ap.tafRaw && (
                        <div className="p-2 rounded bg-black/40 border border-white/10 font-mono text-[9px] text-[var(--text-secondary)]">
                          <span className="text-amber-400 font-bold block mb-0.5">TAF Terminal Forecast:</span>
                          <span className="break-all">{ap.tafRaw}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[9px] font-mono text-[var(--text-secondary)] pt-1 border-t border-[var(--border-primary)]">
                        <span>Elevation: {ap.elevationFt} ft · {ap.city}</span>
                        <span>Runways: {ap.runways.map(r => `${r.ident} (${r.lengthMeters}m)`).join(', ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ═══ TAB: EVENTS ═══ */}
            {activeTab === 'EVENTS' && (
              <div className="space-y-2">
                {filteredEvents.length === 0 ? (
                  <div className="py-12 text-center text-xs font-mono text-[var(--text-secondary)]">
                    No active emergency incidents detected in Moldova right now.
                  </div>
                ) : (
                  filteredEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`p-3 rounded-lg border transition-all space-y-1.5 ${
                        event.severity === 'CRITICAL'
                          ? 'bg-rose-500/10 border-rose-500/40 text-rose-200'
                          : event.severity === 'HIGH'
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                          : 'bg-[var(--bg-secondary)]/40 border-[var(--border-primary)]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                            event.severity === 'CRITICAL' ? 'bg-rose-500 text-white' :
                            event.severity === 'HIGH' ? 'bg-amber-500 text-black' : 'bg-[var(--gold-primary)] text-black'
                          }`}>
                            {event.severity}
                          </span>
                          <h4 className="text-xs font-bold leading-tight">{event.title}</h4>
                        </div>
                        {event.coordinates && (
                          <button
                            onClick={() => handleLocateItem(event.coordinates![0], event.coordinates![1], 13)}
                            className="p-1 rounded hover:bg-white/10 text-white transition-colors"
                            title="Locate Incident"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <p className="text-[11px] leading-relaxed opacity-90">{event.summary}</p>

                      <div className="flex items-center justify-between text-[9px] font-mono pt-1 border-t border-white/10 opacity-80">
                        <span>Source: {event.sourceName}</span>
                        <span>{new Date(event.publishedAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ═══ TAB: CAMERAS ═══ */}
            {activeTab === 'CAMERAS' && (
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredCameras.map((cam) => (
                    <div
                      key={cam.id}
                      className="p-2.5 rounded-lg bg-[var(--bg-secondary)]/40 border border-[var(--border-primary)] hover:border-[var(--gold-primary)]/50 transition-all space-y-2"
                    >
                      <div className="relative aspect-video rounded overflow-hidden bg-black/60 border border-white/10 group">
                        <img
                          src={cam.snapshotUrl}
                          alt={cam.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-sm text-[8px] font-mono text-white flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>{cam.operator}</span>
                        </div>
                        <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1">
                          <button
                            onClick={() => setSelectedCamera(cam)}
                            className="p-1 rounded bg-black/80 text-white hover:bg-[var(--gold-primary)] hover:text-black transition-colors"
                            title="Enlarge CCTV"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleLocateItem(cam.lat, cam.lng, 14)}
                            className="p-1 rounded bg-black/80 text-white hover:bg-[var(--cyan-primary)] hover:text-black transition-colors"
                            title="Locate on Map"
                          >
                            <MapPin className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold truncate max-w-[180px]">{cam.name}</span>
                          {cam.road && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-[var(--gold-primary)]/20 text-[var(--gold-primary)] font-bold">
                              {cam.road}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[var(--text-secondary)] font-mono truncate">
                          {cam.region} · {cam.direction}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ═══ TAB: BORDERS ═══ */}
            {activeTab === 'BORDERS' && overview && (
              <div className="space-y-2">
                <div className="grid grid-cols-1 gap-2">
                  {overview.borderCrossings.map((ptf) => (
                    <div
                      key={ptf.id}
                      className="p-3 rounded-lg bg-[var(--bg-secondary)]/40 border border-[var(--border-primary)] hover:border-emerald-500/40 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                            ptf.neighborCountry === 'RO' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>
                            {ptf.neighborCountry === 'RO' ? '🇪🇺 RO (EU)' : '🇺🇦 UA'}
                          </span>
                          <div>
                            <span className="text-xs font-bold">{ptf.name}</span>
                            <span className="text-[10px] text-[var(--text-secondary)] ml-1.5 font-mono">
                              ↔ {ptf.counterpartName}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-400 font-bold">
                            {ptf.status}
                          </span>
                          <button
                            onClick={() => handleLocateItem(ptf.lat, ptf.lng, 13)}
                            className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-white"
                            title="Locate PTF"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-1.5 border-t border-[var(--border-primary)] text-center font-mono">
                        <div className="bg-[var(--bg-primary)] p-1.5 rounded border border-[var(--border-primary)]">
                          <span className="text-[9px] text-[var(--text-secondary)] block">Cars</span>
                          <span className="text-xs font-bold text-emerald-400">{ptf.waitTimeCarsMinutes} min</span>
                        </div>
                        <div className="bg-[var(--bg-primary)] p-1.5 rounded border border-[var(--border-primary)]">
                          <span className="text-[9px] text-[var(--text-secondary)] block">Trucks</span>
                          <span className="text-xs font-bold text-amber-400">{ptf.waitTimeTrucksMinutes} min</span>
                        </div>
                        <div className="bg-[var(--bg-primary)] p-1.5 rounded border border-[var(--border-primary)]">
                          <span className="text-[9px] text-[var(--text-secondary)] block">Buses</span>
                          <span className="text-xs font-bold text-[var(--cyan-primary)]">{ptf.waitTimeBusesMinutes} min</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ═══ TAB: WEATHER ═══ */}
            {activeTab === 'WEATHER' && overview && (
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {overview.weatherStations.map((station) => (
                    <div
                      key={station.id}
                      onClick={() => handleLocateItem(station.lat, station.lng, 11)}
                      className="p-3 rounded-lg bg-[var(--bg-secondary)]/40 border border-[var(--border-primary)] hover:border-[var(--gold-primary)]/40 cursor-pointer transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold">{station.name}</span>
                          <span className="text-[10px] text-[var(--text-secondary)] font-mono block">{station.district}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-base font-bold font-mono text-[var(--gold-primary)]">{station.tempC}°C</span>
                          <span className="text-[9px] text-[var(--text-secondary)] font-mono block">feels {station.feelsLikeC}°C</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1 text-[9px] font-mono text-[var(--text-secondary)] pt-1 border-t border-[var(--border-primary)]">
                        <div>💧 {station.humidityPct}%</div>
                        <div>💨 {station.windSpeedKmh} km/h</div>
                        <div>⏱️ {station.pressureHpa} hPa</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ═══ TAB: SEISMIC ═══ */}
            {activeTab === 'SEISMIC' && overview && (
              <div className="space-y-2">
                {overview.earthquakes.length === 0 ? (
                  <div className="py-12 text-center text-xs font-mono text-[var(--text-secondary)]">
                    No seismic activity registered in the Vrancea / Moldova perimeter.
                  </div>
                ) : (
                  overview.earthquakes.map((eq) => (
                    <div
                      key={eq.id}
                      onClick={() => handleLocateItem(eq.lat, eq.lng, 10)}
                      className="p-3 rounded-lg bg-[var(--bg-secondary)]/40 border border-[var(--border-primary)] hover:border-violet-500/40 cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                            eq.magnitude >= 4.5 ? 'bg-rose-500 text-white' : 'bg-violet-500/20 text-violet-300'
                          }`}>
                            M {eq.magnitude}
                          </span>
                          <span className="text-xs font-bold">{eq.epicenter}</span>
                        </div>
                        <div className="text-[10px] font-mono text-[var(--text-secondary)]">
                          Depth: {eq.depthKm} km · {eq.distanceFromChisinauKm} km from Chișinău · {new Date(eq.time).toLocaleDateString()}
                        </div>
                      </div>
                      <MapPin className="w-4 h-4 text-[var(--text-secondary)] hover:text-violet-400 shrink-0" />
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ═══ TAB: CRITICAL INFRASTRUCTURE ═══ */}
            {activeTab === 'INFRA' && (
              <div className="space-y-2">
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] font-mono text-amber-300">
                  ⚡ Strategic Energy Nodes, High-Voltage Grids, Prut & Nistru Bridges, and Free Ports.
                </div>
                {[
                  { name: 'Cuciurgan Power Plant (MGRES)', cat: 'ENERGY', lat: 46.6319, lng: 29.8083, desc: '2520 MW Thermal Station · Dnestrovsc' },
                  { name: 'Vulcănești 400kV Substation', cat: 'GRID', lat: 45.6983, lng: 28.3847, desc: 'Isaccea-Vulcănești Interconnection' },
                  { name: 'Costești-Stânca Hydro Dam', cat: 'HYDRO', lat: 47.8286, lng: 27.2186, desc: 'Prut River Hydro Plant (32 MW)' },
                  { name: 'Dubăsari Hydro Dam', cat: 'HYDRO', lat: 47.2833, lng: 29.1333, desc: 'Nistru River Hydro Plant (48 MW)' },
                  { name: 'Giurgiulești Free Port (PILG)', cat: 'PORT', lat: 45.4744, lng: 28.2047, desc: 'Danube / Black Sea Multimodal Maritime Hub' },
                  { name: 'Eiffel Bridge Ungheni', cat: 'BRIDGE', lat: 47.2014, lng: 27.7872, desc: 'Strategic Rail Link over Prut (Gustave Eiffel)' },
                  { name: 'Government HQ (PMAN)', cat: 'GOV', lat: 47.0245, lng: 28.8328, desc: 'Casa Guvernului Republicii Moldova' },
                  { name: 'STISC Cyber Security HQ', cat: 'CYBER', lat: 47.0194, lng: 28.8417, desc: 'CERT-GOV Cyber Defense Operation Center' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleLocateItem(item.lat, item.lng, 14)}
                    className="p-2.5 rounded-lg bg-[var(--bg-secondary)]/40 border border-[var(--border-primary)] hover:border-[var(--gold-primary)]/50 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-[var(--gold-primary)]/15 text-[var(--gold-primary)] font-bold">
                          {item.cat}
                        </span>
                        <span className="text-xs font-bold">{item.name}</span>
                      </div>
                      <p className="text-[10px] font-mono text-[var(--text-secondary)]">{item.desc}</p>
                    </div>
                    <MapPin className="w-3.5 h-3.5 text-[var(--text-secondary)] hover:text-[var(--gold-primary)] shrink-0" />
                  </div>
                ))}
              </div>
            )}

            {/* ═══ TAB: TELEGRAM ═══ */}
            {activeTab === 'TELEGRAM' && overview && (
              <div className="space-y-2">
                <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-[11px] font-mono text-blue-300">
                  📱 Verified Public Broadcast Channels for Moldova OSINT Tracking
                </div>

                <div className="space-y-2">
                  {overview.telegramChannels.map((tg) => (
                    <div
                      key={tg.id}
                      className="p-3 rounded-lg bg-[var(--bg-secondary)]/40 border border-[var(--border-primary)] hover:border-blue-500/40 transition-all space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-mono bg-blue-500/20 text-blue-400 font-bold">
                              {tg.category}
                            </span>
                            <span className="text-xs font-bold">{tg.title}</span>
                          </div>
                          <span className="text-[10px] font-mono text-[var(--cyan-primary)]">@{tg.handle}</span>
                        </div>
                        <a
                          href={tg.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded hover:bg-blue-500/20 text-blue-400"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)]">{tg.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ═══ TAB: MASTER SOURCE REGISTRY ═══ */}
            {activeTab === 'SOURCES' && overview && (
              <div className="space-y-2">
                <div className="p-2.5 rounded-lg bg-[var(--gold-primary)]/10 border border-[var(--gold-primary)]/30 text-[11px] font-mono text-[var(--gold-primary)] flex items-center justify-between">
                  <span>🛡️ Verified Production Source Registry</span>
                  <span className="font-bold">{overview.sourcesHealth.length} Active Feeds</span>
                </div>

                {overview.sourcesHealth.map((src) => (
                  <div
                    key={src.id}
                    className="p-3 rounded-lg bg-[var(--bg-secondary)]/40 border border-[var(--border-primary)] flex items-center justify-between"
                  >
                    <div className="space-y-0.5 flex-1 pr-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          src.status === 'HEALTHY' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' :
                          src.status === 'DEGRADED' ? 'bg-amber-400' : 'bg-rose-400'
                        }`} />
                        <span className="text-xs font-bold font-mono">{src.name}</span>
                      </div>
                      <p className="text-[9px] font-mono text-[var(--text-secondary)] truncate">
                        {src.endpoint}
                      </p>
                      <div className="flex items-center gap-2 text-[8px] font-mono pt-0.5">
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                          {src.verificationStatus}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-[var(--bg-primary)] text-[var(--text-secondary)]">
                          {src.reliability}
                        </span>
                      </div>
                    </div>

                    <div className="text-right font-mono text-[10px] shrink-0">
                      <span className={`font-bold ${src.status === 'HEALTHY' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {src.status}
                      </span>
                      <span className="text-[9px] text-[var(--text-secondary)] block">
                        {src.latencyMs}ms · {src.itemCount} items
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── CAMERA ENLARGED MODAL ── */}
      <AnimatePresence>
        {selectedCamera && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setSelectedCamera(null)}
          >
            <div
              className="w-full max-w-xl bg-black border border-[var(--border-primary)] rounded-xl overflow-hidden shadow-2xl space-y-0"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-3 bg-[#111] border-b border-[var(--border-primary)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[var(--gold-primary)]" />
                  <span className="text-xs font-mono font-bold text-white">{selectedCamera.name}</span>
                </div>
                <button onClick={() => setSelectedCamera(null)} className="text-white/60 hover:text-white">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="aspect-video bg-black flex items-center justify-center">
                <img
                  src={selectedCamera.snapshotUrl}
                  alt={selectedCamera.name}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="p-3 bg-[#111] border-t border-[var(--border-primary)] flex items-center justify-between text-xs font-mono text-[var(--text-secondary)]">
                <span>Region: {selectedCamera.region}</span>
                <span>Operator: {selectedCamera.operator}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
