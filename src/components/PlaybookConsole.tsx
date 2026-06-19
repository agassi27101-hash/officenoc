import { useState } from 'react';
import { AnomalyEvent, PlaybookStep, NetworkNode } from '../types';
import { Terminal, Shield, Play, RotateCcw, AlertCircle, ShieldAlert, CheckCircle2, ChevronRight, Activity, Sparkles } from 'lucide-react';

interface PlaybookConsoleProps {
  anomalies: AnomalyEvent[];
  selectedAnomaly: AnomalyEvent | null;
  onSelectAnomaly: (anomaly: AnomalyEvent) => void;
  onUpdateAnomalyPlaybook: (anomalyId: string, steps: PlaybookStep[]) => void;
  onResolveAnomaly: (anomalyId: string) => void;
  onAcknowledgeAnomaly: (anomalyId: string) => void;
  nodes: NetworkNode[];
}

export default function PlaybookConsole({
  anomalies,
  selectedAnomaly,
  onSelectAnomaly,
  onUpdateAnomalyPlaybook,
  onResolveAnomaly,
  onAcknowledgeAnomaly,
  nodes
}: PlaybookConsoleProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [activeStepRunning, setActiveStepRunning] = useState<string | null>(null);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);

  const activeAlerts = anomalies.filter(a => a.status !== 'resolved');

  // Trigger Gemini AI Anomaly Analysis and expand playbook details
  const handleAIEvaluation = async () => {
    if (!selectedAnomaly) return;
    setAnalyzing(true);
    setConsoleLogs([
      `[INFO] Establishing SSL diagnostic connection to Antigravity AI Cloud...`,
      `[INFO] Transmitting packet buffers of ${selectedAnomaly.code}...`
    ]);

    try {
      const res = await fetch('/api/analyze-anomaly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: selectedAnomaly.code,
          title: selectedAnomaly.title,
          description: selectedAnomaly.description,
          severity: selectedAnomaly.severity
        })
      });

      const data = await res.json();
      
      const newLogs = [
        ...consoleLogs,
        `[SUCCESS] AI Diagnostics obtained. Model score assigned: ${selectedAnomaly.severity === 'critical' ? '0.98' : '0.74'}`,
        `[INFO] Ingested security brief. Runbook compiled. READY.`
      ];
      setConsoleLogs(newLogs);

      // Mutate the state of the active anomaly with expanded details and steps
      const updatedAnomaly: AnomalyEvent = {
        ...selectedAnomaly,
        details: data.analysis,
        mitigationPlaybook: data.updatedPlaybook,
        status: 'investigating'
      };
      
      onUpdateAnomalyPlaybook(selectedAnomaly.id, data.updatedPlaybook);
      onSelectAnomaly(updatedAnomaly);

    } catch (err: any) {
      console.error(err);
      setConsoleLogs(prev => [...prev, `[ERROR] Secure proxy connection handshake failed.`]);
    } finally {
      setAnalyzing(false);
    }
  };

  // Simulate terminal log outputs during running mitigation actions
  const runMitigationStep = (step: PlaybookStep) => {
    if (activeStepRunning) return;
    setActiveStepRunning(step.id);
    
    let currentProgress = 0;
    const terminalLogs = [
      `[SOP-EXEC] Initializing Playbook Protocol: "${step.action}"`,
      `[PING] Testing node coordinates for target boundary protection...`,
      `[TLS] Resetting ephemeral cluster transport session variables...`
    ];
    setConsoleLogs(terminalLogs);

    const interval = setInterval(() => {
      currentProgress += 25;
      if (currentProgress === 25) {
        setConsoleLogs(prev => [...prev, `[AUDIT] Authenticating engineer token (Admin_X01: TIER-1)... Approved.`]);
      } else if (currentProgress === 50) {
        setConsoleLogs(prev => [...prev, `[COMM] Sending byte sequence: ${step.description}...`]);
      } else if (currentProgress === 75) {
        setConsoleLogs(prev => [...prev, `[CORE] Flushing routing tables. Filtering invalid packet structures.`]);
      } else if (currentProgress === 100) {
        clearInterval(interval);
        setActiveStepRunning(null);
        setConsoleLogs(prev => [...prev, `[SUCCESS] Protocol complete. Subnet report status marked SUCCESS.`, `-----------------------`]);

        // Mark the action step as completed
        if (selectedAnomaly) {
          const updatedSteps = selectedAnomaly.mitigationPlaybook.map(s => 
            s.id === step.id ? { ...s, status: 'completed' as const } : s
          );
          onUpdateAnomalyPlaybook(selectedAnomaly.id, updatedSteps);
        }
      }
    }, 600);
  };

  const isPlaybookCompleted = () => {
    if (!selectedAnomaly || !selectedAnomaly.mitigationPlaybook.length) return false;
    return selectedAnomaly.mitigationPlaybook.every(step => step.status === 'completed');
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-rose-50 border-rose-100 text-rose-600';
      case 'high': return 'bg-orange-50 border-orange-100 text-orange-600';
      case 'medium': return 'bg-amber-50 border-amber-100 text-amber-600';
      default: return 'bg-blue-50 border-blue-100 text-blue-600';
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter" id="playbook-console-grid">
      
      {/* 1. Alerts Feed Sidebar (4 Columns) */}
      <div className="xl:col-span-4 flex flex-col space-y-4">
        <div className="glass-card rounded-2xl p-5 flex-1 flex flex-col justify-between max-h-[600px] overflow-hidden">
          <div>
            <h3 className="font-display font-semibold text-base text-slate-800 flex items-center gap-2 mb-1">
              <ShieldAlert className="text-rose-600 w-5 h-5 animate-pulse" />
              Active Anomalies
            </h3>
            <p className="font-sans text-xs text-slate-400 font-semibold mb-4">Click incident telemetry to open remediation playbooks</p>

            <div className="space-y-2.5 overflow-y-auto max-h-[460px] pr-1.5">
              {activeAlerts.length === 0 ? (
                <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center space-y-2 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-80" />
                  <span className="text-xs font-mono font-bold text-slate-500">Mesh network clean. No incidents mapped.</span>
                </div>
              ) : (
                activeAlerts.map((alert) => {
                  const nodeName = nodes.find(n => n.id === alert.affectedNodeId)?.name || 'Global edge';
                  return (
                    <div
                      key={alert.id}
                      onClick={() => onSelectAnomaly(alert)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        selectedAnomaly?.id === alert.id
                          ? 'bg-blue-50/50 border-blue-500/30 shadow-xs'
                          : 'bg-white border-slate-100 hover:bg-slate-50/60 hover:border-slate-200/80'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-bold tracking-wide text-slate-700">
                          {alert.code}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 font-medium">{alert.timestamp}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 mb-1">{alert.title}</h4>
                      <p className="text-[10px] text-slate-500 font-medium line-clamp-2 leading-relaxed mb-2 font-sans">
                        {alert.description}
                      </p>
                      
                      <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-100">
                        <span className="text-[9px] font-mono text-slate-400 font-bold">NODE: {nodeName}</span>
                        <span className={`text-[9px] font-mono font-black uppercase ${
                          alert.severity === 'critical' ? 'text-rose-600' : alert.severity === 'high' ? 'text-amber-500' : 'text-blue-600'
                        }`}>
                          {alert.severity}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
          <div className="pt-3 border-t border-slate-100 text-[10px] font-mono text-slate-400 font-bold flex items-center justify-between mt-4">
            <span>UNRESOLVED: {activeAlerts.length}</span>
            <span>PROTECTION LEVEL: 99.8%</span>
          </div>
        </div>
      </div>

      {/* 2 Remediator Playbook Canvas (8 Columns) */}
      <div className="xl:col-span-8">
        <div className="glass-card rounded-2xl p-5 md:p-6 min-h-[500px] flex flex-col justify-between">
          {selectedAnomaly ? (
            <div className="flex-1 flex flex-col justify-between h-full space-y-6">
              
              {/* Header Details */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold bg-blue-50 border border-blue-100/50 text-blue-600 px-2 py-0.5 rounded-lg">
                      {selectedAnomaly.code}
                    </span>
                    <div>
                      <h3 className="font-display font-semibold text-base text-slate-800 tracking-tight leading-none mb-1">Remediator Playbook Console</h3>
                      <p className="font-sans text-xs text-slate-400 font-semibold">Targeting: {selectedAnomaly.title}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {selectedAnomaly.status === 'active' && (
                      <button 
                        onClick={() => onAcknowledgeAnomaly(selectedAnomaly.id)}
                        className="py-1 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-xs font-mono text-slate-600 font-bold rounded-xl transition-colors shadow-xs"
                      >
                        Acknowledge
                      </button>
                    )}
                    <span className={`px-3 py-1 rounded-xl text-xs font-mono font-bold uppercase border ${getSeverityBadge(selectedAnomaly.severity)}`}>
                      {selectedAnomaly.severity} Level
                    </span>
                  </div>
                </div>

                {/* AI Brief and Playbook action split */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left: AI Assessment details */}
                  <div className="space-y-3.5">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold block flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" /> AI Threat Intelligence Assessment
                    </span>
                    
                    {analyzing ? (
                      <div className="p-6 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-center space-y-3 min-h-[160px]">
                        <div className="w-8 h-8 border-2 border-t-blue-600 border-slate-200 rounded-full animate-spin" />
                        <span className="text-[11px] font-mono text-blue-600 font-bold">Extracting heuristic routing matrices...</span>
                      </div>
                    ) : selectedAnomaly.details ? (
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 max-h-64 overflow-y-auto font-sans text-xs leading-relaxed text-slate-600 select-text select-all">
                        {/* Render simple custom parsed markdown blocks */}
                        <div className="whitespace-pre-wrap font-sans prose prose-slate">
                          {selectedAnomaly.details}
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 rounded-xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-3 min-h-[160px]">
                        <AlertCircle className="w-7 h-7 text-slate-300" />
                        <div>
                          <p className="text-xs font-mono font-bold text-slate-700">No AI Diagnostics Compiled</p>
                          <p className="text-[11px] text-slate-400 font-medium mt-1.5 leading-relaxed">Remediation steps require a full system signature inspection.</p>
                        </div>
                        <button
                          onClick={handleAIEvaluation}
                          className="py-1.5 px-4 bg-blue-600 hover:bg-blue-700 text-xs font-mono font-bold text-white rounded-xl shadow-md shadow-blue-500/10 cursor-pointer transition-colors"
                        >
                          Trigger AI Diagnostics
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right: Remediation Playbook Steps Checklist */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold block flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5 text-blue-600" /> Active Operating Playbook
                    </span>

                    {selectedAnomaly.mitigationPlaybook.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs font-sans bg-slate-50 rounded-xl border border-slate-100 mt-2">
                        Trigger AI Diagnostics first to generate step-by-step resolution runbooks.
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-64 overflow-y-auto">
                        {selectedAnomaly.mitigationPlaybook.map((step, index) => {
                          const isCompleted = step.status === 'completed';
                          const isRunning = activeStepRunning === step.id;
                          return (
                            <div 
                              key={step.id} 
                              className={`p-3 rounded-xl border flex items-start justify-between gap-3 transition-opacity ${
                                isCompleted ? 'bg-emerald-50/40 border-emerald-100/60 opacity-80' : 'bg-slate-50/60 border-slate-100 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex gap-2.5">
                                <span className={`w-4.5 h-4.5 rounded-full text-[10px] font-mono flex items-center justify-center shrink-0 border ${
                                  isCompleted ? 'bg-emerald-100 border-emerald-200 text-emerald-600' : 'bg-white border-slate-200 text-slate-500'
                                }`}>
                                  {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : index + 1}
                                </span>
                                <div>
                                  <p className={`text-xs font-sans font-bold ${isCompleted ? 'line-through text-slate-400' : 'text-slate-700'}`}>{step.action}</p>
                                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-0.5">{step.description}</p>
                                </div>
                              </div>

                              {!isCompleted && (
                                <button
                                  onClick={() => runMitigationStep(step)}
                                  disabled={isRunning || !!activeStepRunning}
                                  className="p-1 px-2.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100/50 hover:bg-blue-100/85 active:scale-95 disabled:opacity-35 transition-all text-[10px] font-mono font-bold shrink-0 shadow-xs"
                                >
                                  {isRunning ? "Running" : "Execute"}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Console log footer and Action triggers */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                {/* Simulated CLI Console */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 relative font-mono text-[10.5px] leading-relaxed text-slate-300 shadow-inner select-text select-all">
                  <div className="absolute top-2.5 right-3 text-[9px] font-bold text-slate-500 flex items-center gap-1.5 uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    Security Terminal
                  </div>
                  
                  <div className="max-h-24 overflow-y-auto space-y-1.5">
                    {consoleLogs.length === 0 ? (
                      <p className="text-slate-500 font-bold">/usr/antigravity/playbook/bin {'>'} Ready for shell command sequences...</p>
                    ) : (
                      consoleLogs.map((log, index) => {
                        const isSuccess = log.includes('[SUCCESS]');
                        const isError = log.includes('[ERROR]');
                        return (
                          <div key={index} className="flex">
                            <ChevronRight className="w-3.5 h-3.5 text-slate-600 mr-1 mt-0.5 shrink-0" />
                            <span className={isSuccess ? 'text-emerald-400 font-semibold' : isError ? 'text-rose-400 font-semibold' : 'text-blue-300'}>
                              {log}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center gap-4">
                  <p className="text-xs text-slate-400 font-semibold font-sans">
                    {selectedAnomaly.status === 'resolved' 
                      ? "✓ Incident resolved successfully and closed." 
                      : isPlaybookCompleted() 
                        ? "✓ All mitigation guidelines executed. System ready to de-congest." 
                        : "⚒ All steps are compulsory prior to triage de-escalation."}
                  </p>
                  
                  {isPlaybookCompleted() && (
                    <button
                      onClick={() => onResolveAnomaly(selectedAnomaly.id)}
                      className="py-2 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition-all shadow-md shadow-emerald-500/10 shrink-0 cursor-pointer animate-pulse"
                    >
                      De-escalate Incident
                    </button>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
              <Terminal className="w-12 h-12 text-slate-300" />
              <div>
                <p className="text-sm font-mono text-slate-700 font-bold uppercase tracking-wider">remittance dispatcher idle</p>
                <p className="text-xs max-w-sm mt-1.5 leading-relaxed text-slate-400 font-sans font-semibold">
                  Select an active anomaly incident list item on the left dashboard pane to inspect telemetry packets and activate recovery runbooks.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
