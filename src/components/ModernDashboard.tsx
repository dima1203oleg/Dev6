/**
 * Modern Dashboard Component
 * Enhanced visibility and design with Predator API integration
 */

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Activity, 
  Users, 
  Database, 
  Globe,
  BarChart3,
  PieChart,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Search
} from 'lucide-react';

interface DashboardStats {
  total_entities: number;
  total_cards: number;
  total_evidence: number;
  high_risk_entities: number;
  active_ingestion_runs: number;
  sources_connected: number;
}

interface RecentActivity {
  id: string;
  type: 'entity' | 'card' | 'evidence' | 'ingestion';
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
}

interface SourceHealth {
  source_id: string;
  source_name: string;
  status: 'healthy' | 'degraded' | 'down';
  last_sync: string;
  records_processed: number;
}

export function ModernDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    total_entities: 0,
    total_cards: 0,
    total_evidence: 0,
    high_risk_entities: 0,
    active_ingestion_runs: 0,
    sources_connected: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [sourceHealth, setSourceHealth] = useState<SourceHealth[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load stats from Predator API
      const statsResponse = await fetch('/api/v2/predator/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Load recent activity
      const activityResponse = await fetch('/api/v2/predator/activity?limit=10');
      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        setRecentActivity(activityData.activities || []);
      }

      // Load source health
      const healthResponse = await fetch('/api/v2/predator/sources/health');
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        setSourceHealth(healthData.sources || []);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
 trendValue,
    color 
  }: { 
    title: string; 
    value: number | string; 
    icon: any; 
    trend?: 'up' | 'down';
    trendValue?: string;
    color: string;
  }) => (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${
            trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">
        {value}
      </div>
      <div className="text-sm text-slate-500 dark:text-slate-400">
        {title}
      </div>
    </div>
  );

  const ActivityItem = ({ activity }: { activity: RecentActivity }) => {
    const icons = {
      entity: <Users className="w-4 h-4" />,
      card: <Shield className="w-4 h-4" />,
      evidence: <CheckCircle className="w-4 h-4" />,
      ingestion: <Database className="w-4 h-4" />
    };

    const statusColors = {
      success: 'text-green-500',
      warning: 'text-yellow-500',
      error: 'text-red-500'
    };

    return (
      <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
        <div className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-700 ${statusColors[activity.status]}`}>
          {icons[activity.type]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
            {activity.description}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {new Date(activity.timestamp).toLocaleString('uk-UA')}
          </p>
        </div>
      </div>
    );
  };

  const SourceHealthItem = ({ source }: { source: SourceHealth }) => {
    const statusColors = {
      healthy: 'bg-green-500',
      degraded: 'bg-yellow-500',
      down: 'bg-red-500'
    };

    return (
      <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${statusColors[source.status]}`} />
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {source.source_name}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {source.records_processed.toLocaleString()} records
            </p>
          </div>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {new Date(source.last_sync).toLocaleString('uk-UA')}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-slate-50 dark:bg-slate-900 overflow-y-auto">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            PREDATOR Analytics Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Real-time monitoring and analytics for the RDP → PREDATOR pipeline
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Entities"
            value={stats.total_entities.toLocaleString()}
            icon={Users}
            trend="up"
            trendValue="+12.5%"
            color="bg-indigo-500"
          />
          <StatCard
            title="Total Cards"
            value={stats.total_cards.toLocaleString()}
            icon={Shield}
            trend="up"
            trendValue="+8.3%"
            color="bg-purple-500"
          />
          <StatCard
            title="Evidence Records"
            value={stats.total_evidence.toLocaleString()}
            icon={CheckCircle}
            trend="up"
            trendValue="+15.2%"
            color="bg-green-500"
          />
          <StatCard
            title="High Risk Entities"
            value={stats.high_risk_entities.toLocaleString()}
            icon={AlertTriangle}
            trend="down"
            trendValue="-3.1%"
            color="bg-red-500"
          />
          <StatCard
            title="Active Ingestion Runs"
            value={stats.active_ingestion_runs}
            icon={Activity}
            color="bg-blue-500"
          />
          <StatCard
            title="Sources Connected"
            value={stats.sources_connected}
            icon={Globe}
            color="bg-teal-500"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-500" />
                Recent Activity
              </h2>
              <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                View All
              </button>
            </div>
            <div className="space-y-2">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  No recent activity
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))
              )}
            </div>
          </div>

          {/* Source Health */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Globe className="w-5 h-5 text-green-500" />
                Source Health
              </h2>
              <button 
                onClick={loadDashboardData}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Refresh
              </button>
            </div>
            <div className="space-y-3">
              {sourceHealth.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  No source data available
                </div>
              ) : (
                sourceHealth.map((source) => (
                  <SourceHealthItem key={source.source_id} source={source} />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700 rounded-xl p-6 text-white">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
              <Search className="w-5 h-5" />
              <span>Search Entity</span>
            </button>
            <button className="flex items-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
              <Database className="w-5 h-5" />
              <span>Run Ingestion</span>
            </button>
            <button className="flex items-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
              <BarChart3 className="w-5 h-5" />
              <span>View Reports</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
