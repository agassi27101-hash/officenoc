import { useState } from 'react';
import { AnomalyEvent, NetworkNode } from '../types';
import { Sparkles, ShieldAlert, Cpu, AlertCircle, Play, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';

interface ThreatLabProps {
  nodes: NetworkNode[];
  onInjectAnomaly: (anomaly: AnomalyEvent) => void;
}

export default function ThreatLab({ nodes, onInjectAnomaly }: ThreatLabProps) {
  const [userPrompt, setUserPrompt] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState(nodes[0]?.id || 'node-us-east');
  const [loading, setLoading] = useState(false);
  const [synthesizedAnomaly, setSynthesizedAnomaly] = useState<AnomalyEvent | null>(null);
  const [injectedCount, setInjectedCount] = useState(0);

  const presets = [
    { label: "BGP Hijack Simulator", prompt: "A neighboring autonomous gateway triggers a BGP route leak, pulling US-EAST-1 IP targets." },
    { label: "Malicious Port scan", prompt: "Distributed fleet of darknets probing UDP port boundaries and trying buffer overflow." },
    { label: "Subnet Database Congestion", prompt: "Database connections locked up close to capacity, blocking synchronized log aggregation." },
    { label: "Spontaneous VM Desync", prompt: "Central clocks drifting +0.8s on EU virtualization layers, disrupting replication keys." }
  ];

  const handleSynthesize = async (promptText: string) => {
    setLoading(true);
    setSynthesizedAnomaly(null);
    try {
      const response = await fetch('/api/generate-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPrompt: promptText,
          affectedNode: nodes.find(n => n.id === selectedNodeId)?.name || 'node-us-east'
        })
      });

      const data = await response.json();
      if (data.anomaly) {
        // Ensure standard fields are populated
        const anomaly: AnomalyEvent = {
          ...data.anomaly,
          affectedNodeId: selectedNodeId
        };
        setSynthesizedAnomaly(anomaly);
      } else {
        console.error("Synthesize error:", data.error);
      }
    } catch (err) {
      console.error("Failed to generate scenario:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInject = () => {
    if (!synthesizedAnomaly) return;
    onInjectAnomaly(synthesizedAnomaly);
    setInjectedCount(prev => prev + 1);
    setSynthesizedAnomaly(null);
    setUserPrompt('');
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-rose-50 border-rose-100 text-rose-600';
      case 'high': return 'bg-orange-50 border-orange-100 text-orange-600';
      case 'medium': return 'bg-amber-50 border-amber-100 text-amber-600';
      default: return 'bg-blue-50 border-blue-100 text-blue-600';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="threat-lab-section">
      {/* Left Input Box: Prompt & Presets (7 cols) */}
      <div className="lg:col-span-7 space-y-6">
        <div className="glass-card rounded-2xl p-6 flex flex-col h-full justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="text-purple-600 w-5 h-5 animate-pulse" />
              <h3 className="font-display font-semibold text-lg text-slate-800 tracking-tight">AI Diagnostic Synthesis Lab</h3>
            </div>
            <p className="font-sans text-xs text-slate-400 font-semibold mb-6 leading-relaxed">
              Synthesize sophisticated target vulnerabilities or simulated edge failures. Our server-side Gemini AI compiles telemetry anomalies and builds customized mitigator playbooks.
            </p>

            {/* Presets Grid */}
            <div className="mb-6">
              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">Preset Simulations</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {presets.map((preset, index) => (
                  <button
                    key={`preset-${index}`}
                    onClick={() => {
                      setUserPrompt(preset.prompt);
                      handleSynthesize(preset.prompt);
                    }}
                    className="p-3.5 text-left bg-slate-50 border border-slate-100 hover:border-blue-300 hover:bg-blue-50/10 rounded-xl text-xs leading-relaxed transition-all cursor-pointer group shadow-xs"
                  >
                    <span className="block font-mono font-bold text-blue-600 group-hover:text-blue-700 text-[11px] mb-1">{preset.label}</span>
                    <span className="text-slate-400 font-semibold text-[11px] block text-ellipsis overflow-hidden line-clamp-2">{preset.prompt}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea Input */}
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">Custom Security Incident Prompt</label>
                <textarea
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder="Describe your custom network scenario (e.g. Multiple authentication leaks on Singapore Node accompanied by high bandwidth spikes)..."
                  className="w-full h-24 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 leading-relaxed resize-none shadow-inner"
                />
              </div>

              {/* Node selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">Target Edge Area</label>
                  <select
                    value={selectedNodeId}
                    onChange={(e) => setSelectedNodeId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/55"
                  >
                    {nodes.map(n => (
                      <option key={n.id} value={n.id}>{n.name} ({n.region})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">Status Report Cache</label>
                  <div className="text-[11px] font-mono text-emerald-600 font-bold flex items-center gap-1.5 h-full pt-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>{injectedCount} Threats Synthesized</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex gap-3">
            <button
              onClick={() => handleSynthesize(userPrompt || "Standard router pipeline failure and desync logs.")}
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg hover:shadow-blue-500/10 active:scale-[0.98] border-none rounded-xl text-xs font-mono font-bold disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Cpu className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? "AI Compiling Telemetry..." : "Synthesize Anomaly"}
            </button>
          </div>
        </div>
      </div>

      {/* Right Output Box: AI Result Details (5 cols) */}
      <div className="lg:col-span-5">
        <div className="glass-card rounded-2xl p-6 h-full flex flex-col justify-between min-h-[350px]">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="relative">
                <div className="w-14 h-14 border border-t-blue-600 border-slate-200 rounded-full animate-spin" />
                <Sparkles className="w-5 h-5 text-purple-600 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-mono text-blue-600 font-bold uppercase tracking-widest mb-1">Synthesizing Security Event</p>
                <p className="text-[11px] text-slate-400 font-semibold leading-relaxed font-sans">
                  Querying server-side Gemini AI to generate structural network logs, threat intelligence profiles, and mitigation runbooks...
                </p>
              </div>
            </div>
          ) : synthesizedAnomaly ? (
            <div className="flex-1 flex flex-col justify-between animate-fade-in h-full">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">AI Synthesis Report</span>
                  <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${getSeverityStyle(synthesizedAnomaly.severity)}`}>
                    {synthesizedAnomaly.severity} severity
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold bg-purple-50 border border-purple-100 text-purple-600 px-1.5 py-0.5 rounded-lg">
                      {synthesizedAnomaly.code}
                    </span>
                    <h4 className="text-sm font-sans font-bold text-slate-800 leading-tight">{synthesizedAnomaly.title}</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 font-sans leading-relaxed mt-1.5 font-medium">{synthesizedAnomaly.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <span className="block text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider mb-2">Automated Playbook Generation</span>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {synthesizedAnomaly.mitigationPlaybook.map((step, i) => (
                      <div key={step.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                        <span className="w-4.5 h-4.5 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-mono text-blue-600 shrink-0 font-bold">
                          {i+1}
                        </span>
                        <div>
                          <p className="text-[11px] font-sans font-bold text-slate-700">{step.action}</p>
                          <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4">
                <button
                  onClick={handleInject}
                  className="w-full py-2 bg-rose-600 text-white rounded-xl text-xs font-mono font-bold hover:bg-rose-700 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-md shadow-rose-500/10 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Inject Anomaly to Live Console
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-450 space-y-3">
              <ShieldAlert className="w-10 h-10 text-slate-300" />
              <div>
                <p className="text-xs font-mono text-slate-700 uppercase tracking-wider font-bold">Simulator Chamber Idle</p>
                <p className="text-[11px] max-w-xs leading-relaxed text-slate-400 font-semibold font-sans mt-1">
                  Select a template on the left or write custom operating rules to begin real-time vector synthesis.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
