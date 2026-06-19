import { TelemetryMetrics, NetworkNode } from '../types';
import { Database, ShieldCheck, Heart, Radio, ShieldAlert } from 'lucide-react';

interface MetricCardsProps {
  metrics: TelemetryMetrics;
  nodes: NetworkNode[];
  onOpenAudit: () => void;
}

export default function MetricCards({ metrics, nodes, onOpenAudit }: MetricCardsProps) {
  const activeCount = nodes.filter(n => n.status === 'active').length;
  const congestedCount = nodes.filter(n => n.status === 'congested').length;
  const compromisedCount = nodes.filter(n => n.status === 'compromised').length;

  return (
    <div className="space-y-6" id="dashboard-metrics-summary">
      {/* 3-Col Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 flex items-center justify-between group hover:border-blue-500/25 transition-all shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-on-surface-variant uppercase tracking-widest block font-bold">Active Nodes</span>
            <span className="text-2xl font-mono font-black text-slate-800 leading-none">{nodes.length} / 1,422</span>
            <div className="flex items-center gap-2 text-[9px] font-mono mt-1.5 font-bold">
              <span className="text-emerald-600">● {activeCount} ok</span>
              {congestedCount > 0 && <span className="text-amber-500">● {congestedCount} busy</span>}
              {compromisedCount > 0 && <span className="text-rose-500 animate-pulse">● {compromisedCount} threat</span>}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-100/50 text-blue-600 group-hover:scale-105 transition-transform">
            <Database className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 flex items-center justify-between group hover:border-purple-500/25 transition-all shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-on-surface-variant uppercase tracking-widest block font-bold">Threats Blocked</span>
            <span className="text-2xl font-mono font-black text-slate-800 leading-none">{metrics.threatsBlocked}</span>
            <p className="text-[10px] text-on-surface-variant mt-1">24 Hour Deep Scrub Inspection</p>
          </div>
          <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-100/50 text-purple-600 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 flex items-center justify-between group hover:border-emerald-500/25 transition-all shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-on-surface-variant uppercase tracking-widest block font-bold">Up-time</span>
            <span className="text-2xl font-mono font-black text-slate-800 leading-none">{metrics.upTime}</span>
            <p className="text-[10px] text-on-surface-variant mt-1">99.9% Core Target Carrier Level</p>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100/50 text-emerald-600 group-hover:scale-105 transition-transform animate-pulse">
            <Heart className="w-5 h-5 fill-current" />
          </div>
        </div>
      </div>

      {/* Footer Channels bar */}
      <div className="flex flex-wrap items-center gap-4 py-4 border-t border-slate-100" id="active-channels-section">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">Active Channels</span>
        
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-slate-100 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          <span className="text-[10px] font-mono text-slate-700 font-bold">CH_ALPHA_01</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-slate-100 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          <span className="text-[10px] font-mono text-slate-700 font-bold">CH_BRAVO_09</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-slate-100 opacity-60 hover:opacity-100 transition-opacity">
          <span className="w-2 h-2 rounded-full bg-slate-400" />
          <span className="text-[10px] font-mono text-slate-500 font-medium">CH_GAMMA_02 (Idle)</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-slate-100 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          <span className="text-[10px] font-mono text-slate-700 font-bold">CH_DELTA_14</span>
        </div>

        {compromisedCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="text-[10px] font-mono font-bold">ATTACK DETECTED IN CH_SEC</span>
          </div>
        )}

        <div className="sm:ml-auto flex items-center gap-4 text-[10px] font-mono select-none">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-bold">SECURE_ENCRYPTION:</span>
            <span className="text-blue-600 font-black">AES-256 GCM</span>
          </div>
          <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
            <span className="text-slate-400 font-bold">GEO_LOCATION:</span>
            <span className="text-purple-600 font-black">MULTI-NODE CLOUD</span>
          </div>
        </div>
      </div>
    </div>
  );
}
