import React, { useState } from 'react';
import { NetworkNode } from '../types';
import { Network, Plus, Server, Zap, RefreshCw, Radio } from 'lucide-react';

interface NetworkMapProps {
  nodes: NetworkNode[];
  onAddNode: (name: string, location: string) => void;
  onRefreshTelemetry: () => void;
  onCongestNode: (id: string) => void;
}

export default function NetworkMap({ nodes, onAddNode, onRefreshTelemetry, onCongestNode }: NetworkMapProps) {
  const [hoveredNode, setHoveredNode] = useState<NetworkNode | null>(null);
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeRegion, setNewNodeRegion] = useState('US-West-3');
  const [showAddForm, setShowAddForm] = useState(false);

  // Default connections between nodes to trace global conduits
  const conduits = [
    { from: 'node-us-east', to: 'node-us-west', color: 'stroke-blue-500' },
    { from: 'node-us-east', to: 'node-eu-central', color: 'stroke-purple-500' },
    { from: 'node-eu-central', to: 'node-asia-se', color: 'stroke-blue-500' },
    { from: 'node-eu-central', to: 'node-safari', color: 'stroke-blue-500' },
    { from: 'node-us-west', to: 'node-asia-se', color: 'stroke-purple-500' },
    { from: 'node-us-east', to: 'node-latam', color: 'stroke-blue-500' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeName.trim()) return;
    onAddNode(newNodeName, newNodeRegion);
    setNewNodeName('');
    setShowAddForm(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500';
      case 'congested': return 'bg-amber-500';
      case 'compromised': return 'bg-rose-500 animate-pulse';
      case 'idle': return 'bg-slate-400';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 relative flex flex-col h-full min-h-[550px]" id="network-map-panel">
      {/* Panel Controls */}
      <div className="flex items-center justify-between mb-4 z-10">
        <div>
          <h3 className="font-display font-semibold text-lg text-slate-800 flex items-center gap-2">
            <Network className="text-blue-600 w-5 h-5 animate-pulse" />
            Global Conduit Mesh Routing
          </h3>
          <p className="font-sans text-xs text-slate-500 font-medium">Click clusters to toggle congestion. Hover for deep packet inspection.</p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={onRefreshTelemetry}
            className="p-1.5 px-3 bg-white border border-slate-200/80 rounded-xl text-xs font-mono text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 font-bold shadow-sm"
            title="Refresh routes"
          >
            <RefreshCw className="w-3 h-3 text-slate-500" />
            Ping Matrix
          </button>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="p-1.5 px-3.5 bg-blue-600 hover:bg-blue-700 text-xs font-mono font-bold text-white rounded-xl shadow-md shadow-blue-500/10 active:scale-95 transition-all flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Spin Node
          </button>
        </div>
      </div>

      {/* SVG Canvas Map Area */}
      <div className="flex-1 relative bg-slate-50/80 rounded-xl border border-slate-100 overflow-hidden flex items-center justify-center p-4">
        {/* Animated Cybergrid background */}
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1.5px,transparent_1.5px)] [background-size:16px_16px] opacity-75 pointer-events-none" />

        {/* Trace SVG Tunnels */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          {conduits.map((conduit, i) => {
            const nodeA = nodes.find(n => n.id === conduit.from);
            const nodeB = nodes.find(n => n.id === conduit.to);
            if (!nodeA || !nodeB) return null;

            // Coordinates are percentages relative to the map box
            return (
              <g key={`conduit-${i}`}>
                {/* Visual Connection Conduit */}
                <line
                  x1={`${nodeA.x}%`}
                  y1={`${nodeA.y}%`}
                  x2={`${nodeB.x}%`}
                  y2={`${nodeB.y}%`}
                  className={`${conduit.color} stroke-[1.5] opacity-20`}
                />
                {/* Active Streaming Packets Animation */}
                <line
                  x1={`${nodeA.x}%`}
                  y1={`${nodeA.y}%`}
                  x2={`${nodeB.x}%`}
                  y2={`${nodeB.y}%`}
                  className={`${conduit.color} stroke-[2] opacity-70`}
                  strokeDasharray="6, 18"
                  strokeDashoffset={nodes[0]?.latency ? (nodes[0].latency * (i + 1) * 0.1) % 100 : "20"}
                >
                  <animate 
                    attributeName="stroke-dashoffset" 
                    values="100;0" 
                    dur={`${(nodeA.latency + nodeB.latency) / 20}s`} 
                    repeatCount="indefinite" 
                  />
                </line>
              </g>
            );
          })}
        </svg>

        {/* Custom Node Deployment Form Overlay */}
        {showAddForm && (
          <div className="absolute top-4 left-4 z-30 w-64 p-5 rounded-2xl bg-white/95 border border-slate-200 glow-cyan backdrop-blur-xl animate-fade-in shadow-xl shadow-slate-100">
            <h4 className="text-xs font-mono font-bold tracking-wider text-blue-600 mb-3 uppercase flex items-center gap-1">
              <Server className="w-3.5 h-3.5" /> Initialize New Edge Node
            </h4>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 font-bold uppercase mb-1">Host Name ID</label>
                <input 
                  type="text" 
                  value={newNodeName}
                  onChange={(e) => setNewNodeName(e.target.value)}
                  placeholder="e.g. Node-SeattleX-09" 
                  maxLength={18}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-400 font-bold uppercase mb-1">Geographic Region</label>
                <select 
                  value={newNodeRegion}
                  onChange={(e) => setNewNodeRegion(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="US-East-1">US-East-1 (Virginia)</option>
                  <option value="US-West-2">US-West-2 (Oregon)</option>
                  <option value="EU-Central-1">EU-Central-1 (Frankfurt)</option>
                  <option value="Asia-SE-1">Asia-SE-1 (Singapore)</option>
                  <option value="LATAM-South">LATAM-South (São Paulo)</option>
                  <option value="AF-South-1">AF-South-1 (Cape Town)</option>
                </select>
              </div>
              <div className="flex gap-2 pt-1.5">
                <button 
                  type="button" 
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/85 text-xs font-mono font-bold text-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-xs font-mono font-bold transition-all shadow-md shadow-blue-500/10"
                >
                  Commit
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Global Geographic Node Indicators */}
        {nodes.map((node) => {
          const isCompromised = node.status === 'compromised';
          return (
            <div
              key={node.id}
              className="absolute z-10 cursor-pointer group"
              style={{ left: `${node.x}%`, top: `${node.y}%`, transform: 'translate(-50%, -50%)' }}
              onMouseEnter={() => setHoveredNode(node)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={() => onCongestNode(node.id)}
            >
              {/* Target Scope Rings / Diagnostic Rings */}
              {isCompromised && (
                <div className="absolute w-12 h-12 -left-[14px] -top-[14px] border border-rose-500/30 rounded-full animate-ping pointer-events-none" />
              )}
              
              {/* Outer Pulse Indicator ring */}
              <div className="absolute -inset-1.5 rounded-full bg-opacity-20 animate-pulse-slow">
                <span className={`absolute inset-0 rounded-full ${isCompromised ? 'bg-rose-500 animate-pulse' : node.status === 'congested' ? 'bg-amber-400' : 'bg-blue-400'}`} />
              </div>

              {/* Main Node Body Ring */}
              <div className={`relative w-4.5 h-4.5 rounded-full flex items-center justify-center border ${isCompromised ? 'bg-white border-rose-500 animate-bounce shadow-md' : 'bg-white border-slate-200 shadow-sm'} group-hover:border-blue-500 z-10 transition-all`}>
                <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(node.status)}`} />
              </div>

              {/* Minimalist Tiny Text floating */}
              <div className="absolute left-6 -top-1 px-1.5 py-0.5 rounded-md bg-white border border-slate-100/80 text-[9px] font-mono whitespace-nowrap text-slate-500 font-bold tracking-tighter shadow-sm opacity-80 group-hover:opacity-100 group-hover:border-blue-400 group-hover:text-blue-600 transition-all">
                {node.name}
              </div>
            </div>
          );
        })}

        {/* Floating Telemetry deep inspection details */}
        {hoveredNode && (
          <div 
            className="absolute z-40 p-4 w-72 rounded-xl bg-white/95 border border-slate-200 shadow-xl shadow-slate-200/50 backdrop-blur-xl pointer-events-none animate-fade-in"
            style={{
              left: `${Math.min(hoveredNode.x + 2, 75)}%`,
              top: `${Math.min(hoveredNode.y - 12, 60)}%`
            }}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-2 mb-2">
              <div>
                <h4 className="text-sm font-sans font-bold text-slate-800 tracking-tight leading-none">{hoveredNode.name}</h4>
                <p className="text-[10px] font-mono text-slate-400 font-bold mt-1 uppercase tracking-wider">{hoveredNode.region}</p>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-50 border border-slate-100">
                <span className={`w-2 h-2 rounded-full ${getStatusColor(hoveredNode.status)}`} />
                <span className="text-[10px] font-sans text-slate-600 font-semibold capitalize">{hoveredNode.status}</span>
              </div>
            </div>

            {/* Readouts Table */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div>
                <span className="block text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider">Gateway IP</span>
                <span className="text-xs font-mono font-black text-slate-700">{hoveredNode.ip}</span>
              </div>
              <div>
                <span className="block text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider">CPU Allocation</span>
                <span className="text-xs font-mono font-black text-slate-700">{hoveredNode.cpuUsage}%</span>
              </div>
              <div>
                <span className="block text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider">Edge Ping</span>
                <span className={`text-xs font-mono font-black ${hoveredNode.latency > 50 ? 'text-amber-500' : 'text-blue-600'}`}>
                  {hoveredNode.latency}ms
                </span>
              </div>
              <div>
                <span className="block text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider">Throughput Load</span>
                <span className="text-xs font-mono font-black text-purple-600">{hoveredNode.bandwidth} Gbps</span>
              </div>
            </div>

            {/* Packet loss readout if active */}
            {hoveredNode.packetLoss > 0 && (
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[9px] font-mono text-slate-400 font-bold uppercase">Packet Leakage</span>
                <span className="text-xs font-mono font-black text-rose-500">{hoveredNode.packetLoss}%</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Connection statistics footer */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 z-10">
        <div className="flex items-center gap-1.5">
          <Radio className="w-4.5 h-4.5 text-blue-600 animate-pulse" />
          <span className="text-xs text-slate-500 font-medium">Active tunnels established:</span>
          <span className="text-xs font-mono font-bold text-blue-600 px-1.5 py-0.5 rounded bg-slate-50 border border-slate-100">
            {conduits.length}
          </span>
        </div>
        
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] text-slate-500 font-bold uppercase">Healthy Edge</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-[10px] text-slate-500 font-bold uppercase">Congested Mesh</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-[10px] text-slate-500 font-bold uppercase">Security Compromise</span>
          </div>
        </div>
      </div>
    </div>
  );
}
