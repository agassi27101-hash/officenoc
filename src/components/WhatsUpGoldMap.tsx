import React, { useState, useEffect } from 'react';
import { 
  Network, Server, Cpu, Layers, RefreshCw, Play, Activity, 
  Settings, CheckCircle2, AlertTriangle, XCircle, Search, 
  HelpCircle, Wifi, Globe, Terminal, ChevronRight, Zap, RefreshCcw
} from 'lucide-react';
import { HardwareDevice, ISPConnection, WifiAP } from '../types';

interface WhatsUpGoldMapProps {
  hardware: HardwareDevice[];
  isps: ISPConnection[];
  wifiAPs: WifiAP[];
  onRebootDevice: (id: string) => void;
  onUpdateDeviceStatus?: (id: string, newStatus: 'online' | 'warning' | 'offline') => void;
  onAddDeviceClick?: () => void;
  onDeleteDevice?: (id: string) => void;
}

interface MapNode {
  id: string;
  name: string;
  ip: string;
  type: 'ISP' | 'Firewall' | 'Switch' | 'Server' | 'AP' | 'UPS' | 'NAS' | 'Printer' | 'Other';
  status: 'online' | 'warning' | 'offline';
  x: number; // coordinate percent for responsive absolute rendering
  y: number;
  cpu?: number;
  ram?: number;
  temp?: number;
  loss?: number;
  latency?: number;
  rawRef?: any; // reference to actual source object
}

interface ConnectionLink {
  from: string;
  to: string;
  label?: string;
  status: 'online' | 'warning' | 'offline';
}

export default function WhatsUpGoldMap({
  hardware,
  isps,
  wifiAPs,
  onRebootDevice,
  onUpdateDeviceStatus,
  onAddDeviceClick,
  onDeleteDevice
}: WhatsUpGoldMapProps) {
  // Search state to filter/find nodes
  const [searchQuery, setSearchQuery] = useState('');
  // Active status filter ('all', 'online', 'warning', 'offline')
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'warning' | 'offline'>('all');
  
  // Selected node for WhatsUp Gold Properties Inspector
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  // Live action/tools state inside inspector
  const [pingConsole, setPingConsole] = useState<string[]>([]);
  const [isPinging, setIsPinging] = useState(false);
  const [isTracerouting, setIsTracerouting] = useState(false);
  const [isPollingSNMP, setIsPollingSNMP] = useState(false);
  const [pingSuccessRate, setPingSuccessRate] = useState<number | null>(null);

  // Auto-arrange helper or toggling links
  const [showFlowTraffic, setShowFlowTraffic] = useState(true);
  const [activeTab, setActiveTab] = useState<'topology' | 'discovery'>('topology');

  // Convert disparate data units (ISPs, APs, Hardware) to unified WhatsUp Gold Node format
  const getUnifiedNodes = (): MapNode[] => {
    const nodes: MapNode[] = [];

    // 1. ISPs (placed at top x: 15 to 85, y: 12)
    isps.forEach((isp, idx) => {
      // Spaces ISPs out evenly at the top hierarchy
      const step = 80 / Math.max(1, isps.length - 1);
      const x = 10 + idx * step;
      nodes.push({
        id: isp.id,
        name: isp.name,
        ip: isp.gateway,
        type: 'ISP',
        status: isp.status === 'active' ? 'online' : isp.status === 'down' ? 'offline' : 'warning',
        x: x,
        y: 12,
        loss: isp.packetLoss,
        latency: isp.latency,
        rawRef: isp
      });
    });

    // 2. Firewall Security Gateway (centered at x: 50, y: 32)
    // Find firewall from hardware
    const firewallHw = hardware.find(h => h.type === 'Firewall') || {
      id: 'hw-fw', name: 'FortiGate FW-80D', ip: '192.168.1.1', status: 'online', cpu: 12, ram: 42, temp: 36, latency: 1.2
    };
    nodes.push({
      id: firewallHw.id,
      name: firewallHw.name,
      ip: firewallHw.ip,
      type: 'Firewall',
      status: firewallHw.status,
      x: 50,
      y: 32,
      cpu: firewallHw.cpu,
      ram: firewallHw.ram,
      temp: firewallHw.temp,
      latency: firewallHw.latency !== undefined ? firewallHw.latency : (firewallHw.status === 'offline' ? 0 : 1.2),
      rawRef: firewallHw
    });

    // 3. Core Switch (centered at x: 50, y: 52)
    const coreSwitch = hardware.find(h => h.name.toLowerCase().includes('core') || h.type === 'Switch') || {
      id: 'hw-sw-core', name: 'Enterprise Core Switch', ip: '192.168.1.10', status: 'online', cpu: 8, ram: 28, temp: 42, latency: 2.5
    };
    nodes.push({
      id: coreSwitch.id,
      name: coreSwitch.name,
      ip: coreSwitch.ip,
      type: 'Switch',
      status: coreSwitch.status,
      x: 50,
      y: 52,
      cpu: coreSwitch.cpu,
      ram: coreSwitch.ram,
      temp: coreSwitch.temp,
      latency: coreSwitch.latency !== undefined ? coreSwitch.latency : (coreSwitch.status === 'offline' ? 0 : 2.5),
      rawRef: coreSwitch
    });

    // 4. Other Switches and Servers (arranged in row y: 72)
    const restHw = hardware.filter(h => h.id !== firewallHw.id && h.id !== coreSwitch.id);
    restHw.forEach((dev, idx) => {
      // distribute them under the core switch
      const step = 84 / Math.max(1, restHw.length - 1);
      const x = 8 + idx * step;
      nodes.push({
        id: dev.id,
        name: dev.name,
        ip: dev.ip,
        type: dev.type as any,
        status: dev.status,
        x: x,
        y: 72,
        cpu: dev.cpu,
        ram: dev.ram,
        temp: dev.temp,
        latency: dev.latency !== undefined ? dev.latency : (dev.status === 'offline' ? 0 : dev.status === 'warning' ? 32.4 : 3.8),
        rawRef: dev
      });
    });

    // 5. Wifi APs (distributed at the absolute base y: 90)
    wifiAPs.forEach((ap, idx) => {
      const step = 60 / Math.max(1, wifiAPs.length - 1);
      const x = 20 + idx * step;
      nodes.push({
        id: ap.id,
        name: ap.name,
        ip: `192.168.12.${20 + idx}`,
        type: 'AP',
        status: ap.status === 'active' ? 'online' : ap.status === 'congested' ? 'warning' : 'offline',
        x: x,
        y: 90,
        latency: ap.status === 'inactive' ? 0 : ap.status === 'congested' ? 44.5 : 2.8,
        rawRef: ap
      });
    });

    return nodes;
  };

  const allUnifiedNodes = getUnifiedNodes();

  // Establish logical dependancy connections for Map
  const getConnections = (nodes: MapNode[]): ConnectionLink[] => {
    const links: ConnectionLink[] = [];
    
    // Find firewall, core switch reference IDs
    const fwNode = nodes.find(n => n.type === 'Firewall');
    const coreSwNode = nodes.find(n => n.type === 'Switch' && n.name.toLowerCase().includes('core')) || nodes.find(n => n.type === 'Switch');

    if (!fwNode) return [];

    // 1. ISPs connect to Firewall
    const ispNodes = nodes.filter(n => n.type === 'ISP');
    ispNodes.forEach(isp => {
      // connection status is offline if either node is offline
      let linkStatus: ConnectionLink['status'] = 'online';
      if (isp.status === 'offline' || fwNode.status === 'offline') linkStatus = 'offline';
      else if (isp.status === 'warning' || fwNode.status === 'warning') linkStatus = 'warning';

      links.push({
        from: isp.id,
        to: fwNode.id,
        label: `${isp.latency ? isp.latency + 'ms' : 'Line'}`,
        status: linkStatus
      });
    });

    if (!coreSwNode) return links;

    // 2. Firewall connects to Core Switch
    let pfStatus: ConnectionLink['status'] = 'online';
    if (fwNode.status === 'offline' || coreSwNode.status === 'offline') pfStatus = 'offline';
    else if (fwNode.status === 'warning' || coreSwNode.status === 'warning') pfStatus = 'warning';
    
    links.push({
      from: fwNode.id,
      to: coreSwNode.id,
      label: 'Main uplink',
      status: pfStatus
    });

    // 3. Core Switch connects to all other hardware (Servers, UPS, Printers, NAS, other switches)
    const downstreamHw = nodes.filter(n => 
      n.type !== 'ISP' && 
      n.type !== 'Firewall' && 
      n.id !== coreSwNode.id && 
      n.type !== 'AP'
    );
    downstreamHw.forEach(dh => {
      let linkS: ConnectionLink['status'] = 'online';
      if (coreSwNode.status === 'offline' || dh.status === 'offline') linkS = 'offline';
      else if (coreSwNode.status === 'warning' || dh.status === 'warning') linkS = 'warning';

      links.push({
        from: coreSwNode.id,
        to: dh.id,
        status: linkS
      });
    });

    // 4. Core Switch also links directly downstream to WiFi APs
    const apNodes = nodes.filter(n => n.type === 'AP');
    apNodes.forEach(ap => {
      let linkS: ConnectionLink['status'] = 'online';
      if (coreSwNode.status === 'offline' || ap.status === 'offline') linkS = 'offline';
      else if (coreSwNode.status === 'warning' || ap.status === 'warning') linkS = 'warning';

      links.push({
        from: coreSwNode.id,
        to: ap.id,
        status: linkS
      });
    });

    return links;
  };

  const connections = getConnections(allUnifiedNodes);

  // Filter local nodes based on search bar & status checkboxes
  const filteredNodes = allUnifiedNodes.filter(node => {
    // 1. Search Query Match
    const matchesSearch = node.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          node.ip.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          node.type.toLowerCase().includes(searchQuery.toLowerCase());
    
    // 2. Status Match
    const matchesStatus = statusFilter === 'all' || node.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Pick some active node to display in properties if none selected yet
  const activeSelectedNode = allUnifiedNodes.find(n => n.id === selectedNodeId) || null;

  // Triggers live ping simulation (WhatsUp Gold core feature)
  const runPingTest = (node: MapNode) => {
    if (isPinging) return;
    setIsPinging(true);
    setPingConsole([]);
    setPingSuccessRate(null);

    let progress = 0;
    const lines: string[] = [
      `PING ${node.name} (${node.ip}) 56(84) bytes of data.`
    ];
    setPingConsole([...lines]);

    const interval = setInterval(() => {
      progress++;
      if (progress <= 4) {
        const isLost = node.status === 'offline' || (node.status === 'warning' && Math.random() < 0.25);
        if (isLost) {
          lines.push(`Request timeout for icmp_seq ${progress}`);
        } else {
          const ttl = Math.floor(Math.random() * 8) + 54;
          const time = (Math.random() * 25 + 2).toFixed(1);
          lines.push(`64 bytes from ${node.ip}: icmp_seq=${progress} ttl=${ttl} time=${time} ms`);
        }
        setPingConsole([...lines]);
      } else {
        clearInterval(interval);
        // Summarize statistics
        const unreachable = node.status === 'offline';
        const rate = unreachable ? 0 : node.status === 'warning' ? 75 : 100;
        lines.push('');
        lines.push(`--- ${node.name} ping statistics ---`);
        lines.push(`4 packets transmitted, ${unreachable ? 0 : node.status === 'warning' ? 3 : 4} received, ${100 - rate}% packet loss, time 3004ms`);
        lines.push(`rtt min/avg/max/mdev = 2.14/15.22/31.10/8.45 ms`);
        setPingConsole([...lines]);
        setPingSuccessRate(rate);
        setIsPinging(false);
      }
    }, 700);
  };

  // Triggers live Traceroute diagnostics
  const runTracerouteTest = (node: MapNode) => {
    if (isTracerouting) return;
    setIsTracerouting(true);
    setPingConsole([`traceroute to ${node.name} (${node.ip}), 30 hops max, 60 byte packets`]);

    const hops = [
      ` 1  gateway.corp.net (192.168.1.1)  0.415 ms  0.320 ms  0.222 ms`,
      ` 2  core-switch-bb5.net (192.168.1.10)  0.942 ms  1.104 ms  0.885 ms`,
    ];

    if (node.type === 'ISP') {
      hops.push(` 3  bgp-edge-fibrelnk.isp.net (103.4.12.1)  4.112 ms  3.905 ms  4.410 ms`);
    } else if (node.type === 'AP' || node.type === 'Server' || node.type === 'UPS') {
      hops.push(` 3  ${node.name.toLowerCase()}.subnet30.internal (${node.ip})  8.118 ms  2.415 ms  5.184 ms`);
    } else {
      hops.push(` 3  node-target.internal (${node.ip})  2.951 ms  3.104 ms  2.880 ms`);
    }

    let progress = 0;
    const interval = setInterval(() => {
      if (progress < hops.length) {
        setPingConsole(prev => [...prev, hops[progress]]);
        progress++;
      } else {
        clearInterval(interval);
        setPingConsole(prev => [...prev, `Traceroute packet path diagnostics complete.`]);
        setIsTracerouting(false);
      }
    }, 600);
  };

  // Triggers SNMP system telemetry poll
  const runSNMPTelemetryPoll = (node: MapNode) => {
    if (isPollingSNMP) return;
    setIsPollingSNMP(true);
    setPingConsole([`Polling SNMP (v2c) agent at ${node.ip}:161...`]);

    setTimeout(() => {
      setPingConsole([
        `SNMP connection verified (Public Community String Authorized)`,
        `System.sysDescr.0: ${node.name} Kernel v4.19_build-${node.type === 'Firewall' ? 'fortios' : 'linux'}`,
        `System.sysObjectID.0: Enterprise MIB Object .1.3.6.1.4.1`,
        `System.sysUpTime.0: ${node.rawRef?.uptime || '23 days, 14:04:15.52'}`,
        `Interfaces.ifNumber.0: ${node.type === 'Switch' ? '48 Ports' : '4 Ports'}`,
        `IP-MIB.ipAdEntAddr.1: Host Bound: ${node.ip}`,
        `Host-Resources-MIB.hrProcessorLoad.1: ${Math.round(node.cpu || 15)}% Utilization`,
        `Host-Resources-MIB.hrStorageUsed.1: ${Math.round(node.ram || 40)}% active physical RAM`,
        `Diagnostics Sensor ID-Temp.1: ${node.temp || 35}°C`,
        `SNMP query task finished successfully.`
      ]);
      setIsPollingSNMP(false);
    }, 1200);
  };

  // Trigger Local Power State Update
  const handleToggleState = (node: MapNode) => {
    if (!onUpdateDeviceStatus) return;
    const nextStatus = node.status === 'online' ? 'offline' : 'online';
    onUpdateDeviceStatus(node.id, nextStatus);
  };

  // Quick stats variables
  const totalWugs = allUnifiedNodes.length;
  const onlineCount = allUnifiedNodes.filter(n => n.status === 'online').length;
  const warningCount = allUnifiedNodes.filter(n => n.status === 'warning').length;
  const offlineCount = allUnifiedNodes.filter(n => n.status === 'offline').length;

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-2xl relative" id="whatsupgold-dynamic-map-container">
      
      {/* Topology Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-800 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <h3 className="font-display font-semibold text-base text-white flex items-center gap-2">
              WhatsUp Gold Active Dependency Map
            </h3>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Visual topology and logical device linkages with instant ICMP ping / SNMP poll diagnostics console.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {onAddDeviceClick && (
            <button
              onClick={onAddDeviceClick}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-sans text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition-colors"
            >
              <Zap className="w-3.5 h-3.5 fill-current text-white animate-pulse" />
              Add Device
            </button>
          )}

          {/* View Switches */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850 shrink-0">
            <button
              onClick={() => setActiveTab('topology')}
              className={`px-3 py-1.5 font-mono text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                activeTab === 'topology' 
                  ? 'bg-blue-600/20 border border-blue-500/20 text-blue-400' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Topology Map
            </button>
            <button
              onClick={() => setActiveTab('discovery')}
              className={`px-3 py-1.5 font-mono text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                activeTab === 'discovery' 
                  ? 'bg-blue-600/20 border border-blue-500/20 text-blue-400' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Discovery List ({allUnifiedNodes.length} devices)
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Controls & Live counters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        
        {/* Total Devices Count */}
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850 flex items-center justify-between">
          <div>
            <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wider">Managed Devices</span>
            <span className="text-xl font-black text-white mt-1 block select-all">{totalWugs} Nodes</span>
          </div>
          <Network className="w-8 h-8 text-blue-500/35" />
        </div>

        {/* Online Count */}
        <button 
          onClick={() => setStatusFilter(statusFilter === 'online' ? 'all' : 'online')}
          className={`p-3 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
            statusFilter === 'online' ? 'bg-emerald-950/20 border-emerald-500/50' : 'bg-slate-950/50 border-slate-850 hover:border-slate-800'
          }`}
        >
          <div>
            <span className="text-[9px] font-bold text-emerald-400 block uppercase tracking-wider">Up / Healthy</span>
            <span className="text-xl font-black text-white mt-1 block select-all">{onlineCount} Stable</span>
          </div>
          <div className="h-6.5 w-6.5 bg-emerald-500/10 rounded-full flex items-center justify-center">
            <div className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-pulse" />
          </div>
        </button>

        {/* Warning Count */}
        <button 
          onClick={() => setStatusFilter(statusFilter === 'warning' ? 'all' : 'warning')}
          className={`p-3 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
            statusFilter === 'warning' ? 'bg-amber-950/20 border-amber-500/50' : 'bg-slate-950/50 border-slate-850 hover:border-slate-800'
          }`}
        >
          <div>
            <span className="text-[9px] font-bold text-amber-500 block uppercase tracking-wider">Warning State</span>
            <span className="text-xl font-black text-white mt-1 block select-all">{warningCount} Caution</span>
          </div>
          <div className="h-6.5 w-6.5 bg-amber-500/10 rounded-full flex items-center justify-center">
            <div className="h-2.5 w-2.5 bg-amber-500 rounded-full animate-ping" />
          </div>
        </button>

        {/* Offline Count */}
        <button 
          onClick={() => setStatusFilter(statusFilter === 'offline' ? 'all' : 'offline')}
          className={`p-3 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
            statusFilter === 'offline' ? 'bg-rose-950/20 border-rose-500/50' : 'bg-slate-950/50 border-slate-850 hover:border-slate-800'
          }`}
        >
          <div>
            <span className="text-[9px] font-bold text-rose-500 block uppercase tracking-wider">Critical / Down</span>
            <span className="text-xl font-black text-white mt-1 block select-all">{offlineCount} Outage</span>
          </div>
          <div className="h-6.5 w-6.5 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 font-bold text-[9px]">
            <XCircle className="w-5 h-5 text-rose-500" />
          </div>
        </button>

      </div>

      {/* FILTER SEARCH TOOLS */}
      <div className="flex flex-col sm:flex-row gap-3 items-center mb-5 bg-slate-950 p-3 rounded-xl border border-slate-850/80">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input 
            type="text"
            placeholder="Quick search a network node (e.g. AD-Server, Starlink, Firewall)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 text-xs font-mono py-2 pl-9 pr-4 rounded-lg focus:outline-none placeholder-slate-550 text-white"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-[10px]"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto self-end sm:self-center">
          <label className="text-[10px] font-mono text-slate-500 uppercase font-black tracking-wider whitespace-nowrap shrink-0">
            Flow Line:
          </label>
          <button
            onClick={() => setShowFlowTraffic(!showFlowTraffic)}
            className={`px-3 py-1.5 font-mono text-[9.5px] font-bold rounded border transition-all ${
              showFlowTraffic 
                ? 'bg-blue-600/10 border-blue-500/30 text-blue-400' 
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            {showFlowTraffic ? '✓ Flowing Stream' : '✗ Static Solid'}
          </button>
          
          {statusFilter !== 'all' && (
            <button
              onClick={() => setStatusFilter('all')}
              className="px-2.5 py-1.5 font-mono text-[9.5px] bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* INTERACTIVE GRAPH CANVAS BOX */}
        <div className="lg:col-span-8 bg-slate-950 rounded-2xl border border-slate-850 p-4 min-h-[500px] flex flex-col justify-between overflow-x-hidden relative">
          
          {activeTab === 'topology' ? (
            <div className="relative w-full h-[480px] border border-slate-900 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] rounded-xl overflow-hidden self-center">
              
              {/* Dynamic Connection lines SVG Layer */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                {connections.map((link, idx) => {
                  const fromNode = filteredNodes.find(n => n.id === link.from);
                  const toNode = filteredNodes.find(n => n.id === link.to);
                  
                  if (!fromNode || !toNode) return null;

                  // percentage coordinates mapped to absolute coordinates
                  const x1 = `${fromNode.x}%`;
                  const y1 = `${fromNode.y}%`;
                  const x2 = `${toNode.x}%`;
                  const y2 = `${toNode.y}%`;

                  // line styling based on connection link status
                  let stColor = '#3b82f6'; // default blue
                  let stDash = 'none';

                  if (link.status === 'offline') {
                    stColor = '#ef4444'; // red
                    stDash = '4, 4';
                  } else if (link.status === 'warning') {
                    stColor = '#f59e0b'; // amber
                    stDash = '6, 4';
                  } else {
                    stColor = '#10b981'; // green line
                  }

                  const isHighlightedPath = selectedNodeId === link.from || selectedNodeId === link.to;

                  return (
                    <g key={`link-${idx}`}>
                      {/* Thicker shadow/highlight line if node selected */}
                      {isHighlightedPath && (
                        <line 
                          x1={x1} y1={y1} x2={x2} y2={y2}
                          stroke="#3b82f6"
                          strokeWidth="5"
                          strokeOpacity="0.22"
                        />
                      )}

                      {/* Main connection line */}
                      <line 
                        x1={x1} y1={y1} x2={x2} y2={y2}
                        stroke={stColor}
                        strokeWidth={isHighlightedPath ? 2.5 : 1.5}
                        strokeOpacity={link.status === 'offline' ? 0.4 : 0.8}
                        strokeDasharray={stDash}
                      />

                      {/* Dynamic flowing traffic dash dot (WhatsUp Gold indicator) */}
                      {showFlowTraffic && link.status !== 'offline' && (
                        <circle r="3.5" fill={link.status === 'warning' ? '#f59e0b' : '#34d399'} className="shadow-[0_0_8px_#10b981]">
                          <animateMotion 
                            path={`M 0,0 L 100,100`} // Dummy motion will resolve coordinates
                            dur={link.status === 'warning' ? '4.8s' : '2.8s'}
                            repeatCount="indefinite" 
                            keyPoints="0;1"
                            keyTimes="0;1"
                          />
                          {/* Real coordinate inline animation using CSS transition vector trick */}
                          <animate attributeName="cx" from={x1} to={x2} dur="2.8s" repeatCount="indefinite" />
                          <animate attributeName="cy" from={y1} to={y2} dur="2.8s" repeatCount="indefinite" />
                        </circle>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* RENDER THE GRAPH NODES */}
              {filteredNodes.map(node => {
                const isSelected = selectedNodeId === node.id;
                
                // Color mapping
                let statusColor = 'bg-emerald-500';
                let glowColor = 'shadow-[0_0_15px_#10b981]';
                let borderTheme = 'border-emerald-500/30';
                
                if (node.status === 'offline') {
                  statusColor = 'bg-rose-500';
                  glowColor = 'shadow-[0_0_15px_#f43f5e]';
                  borderTheme = 'border-rose-500/30';
                } else if (node.status === 'warning') {
                  statusColor = 'bg-amber-500';
                  glowColor = 'shadow-[0_0_15px_#f59e0b]';
                  borderTheme = 'border-amber-500/30';
                }

                // Render device specific icons
                let NodeIcon = LaptopNodeIcon;
                if (node.type === 'ISP') NodeIcon = Globe;
                else if (node.type === 'Firewall') NodeIcon = ShieldNodeIcon;
                else if (node.type === 'Switch') NodeIcon = Layers;
                else if (node.type === 'Server') NodeIcon = Server;
                else if (node.type === 'AP') NodeIcon = Wifi;
                else if (node.type === 'UPS') NodeIcon = Zap;
                else if (node.type === 'NAS') NodeIcon = Layers;
                
                return (
                  <button 
                    key={node.id}
                    id={`wug-node-${node.id}`}
                    onClick={() => {
                      setSelectedNodeId(node.id);
                      setPingConsole([`Click diagnostics console commands above to evaluate routing on ${node.name}.`]);
                    }}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 p-2.5 rounded-xl border bg-slate-900 flex flex-col items-center justify-center transition-all cursor-pointer z-10 hover:scale-108 hover:-translate-y-4 ${
                      isSelected 
                        ? 'border-blue-500 scale-110 z-20 shadow-[0_0_20px_rgba(59,130,246,0.25)] ring-1 ring-blue-500/40' 
                        : `${borderTheme} hover:border-slate-400`
                    }`}
                    style={{
                      left: `${node.x}%`,
                      top: `${node.y}%`
                    }}
                  >
                    {/* Glowing status lamp on top corner */}
                    <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${statusColor} ${glowColor}`} />

                    <div className="p-1 rounded bg-slate-950/80 mb-1">
                      <NodeIcon className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-slate-350'}`} />
                    </div>

                    <span className="text-[9px] font-mono font-bold text-white max-w-[85px] truncate text-center block">
                      {node.name}
                    </span>
                    <span className="text-[7.5px] font-mono text-slate-500 leading-none block select-text">
                      {node.ip}
                    </span>
                    {node.latency !== undefined && (
                      <span className="mt-1 text-[8px] font-mono px-1 py-0.5 rounded bg-slate-950/80 font-bold text-blue-400 border border-blue-900/40">
                        {node.status === 'offline' ? 'Offline' : `${node.latency} ms`}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* EMPTY CORNER INTRO GUIDE */}
              <div className="absolute bottom-3 left-3 bg-slate-900/95 border border-slate-800 p-2.5 rounded-lg max-w-[210px] pointer-events-none text-[10px] font-mono text-slate-400 space-y-1">
                <span className="font-bold text-slate-200 block uppercase text-[9px] tracking-wide mb-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  WUG Topology Legend
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded bg-emerald-500 shrink-0" />
                  <span>Green = Online / Up</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded bg-amber-500 shrink-0" />
                  <span>Gold/Amber = Maintenance</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded bg-rose-500 shrink-0" />
                  <span>Red = Offline/Broken Link</span>
                </div>
                <p className="text-[8px] text-slate-500 border-t border-slate-800/80 pt-1 mt-1">
                  Click on any node to open the WhatsUp Gold Properties Inspector.
                </p>
              </div>

            </div>
          ) : (
            // DISCOVERY DEVICE LIST TABLE alternative
            <div className="overflow-x-auto border border-slate-850 rounded-xl max-h-[460px] overflow-y-auto mb-4 select-text">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-850 uppercase text-[9px] tracking-wider font-extrabold">
                    <th className="p-3">Device Name</th>
                    <th className="p-3">IP Address</th>
                    <th className="p-3">Category Type</th>
                    <th className="p-3">Telemetry Load</th>
                    <th className="p-3">Latency</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/60">
                  {filteredNodes.map((node) => (
                    <tr 
                      key={node.id} 
                      onClick={() => setSelectedNodeId(node.id)}
                      className={`hover:bg-slate-850/20 transition-all cursor-pointer ${selectedNodeId === node.id ? 'bg-blue-900/10' : ''}`}
                    >
                      <td className="p-3 font-bold text-slate-200 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          node.status === 'online' ? 'bg-emerald-500' : node.status === 'warning' ? 'bg-amber-500' : 'bg-rose-500'
                        }`} />
                        {node.name}
                      </td>
                      <td className="p-3 text-slate-400 font-mono text-[11px]">{node.ip}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[8.5px] uppercase font-black bg-slate-900 text-slate-400 border border-slate-800">
                          {node.type}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 text-[10.5px]">
                        {node.cpu !== undefined ? `CPU: ${node.cpu}% / ${node.temp}°C` : 'N/A telemetry'}
                      </td>
                      <td className="p-3 text-blue-400 font-bold">
                        {node.status === 'offline' ? 'Offline' : node.latency !== undefined ? `${node.latency} ms` : 'N/A'}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-md text-[8.5px] font-bold uppercase tracking-wider ${
                          node.status === 'online' 
                            ? 'bg-emerald-500/10 text-emerald-400' 
                            : node.status === 'warning'
                              ? 'bg-amber-500/10 text-amber-500'
                              : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {node.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex gap-1.5 justify-end items-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedNodeId(node.id);
                              runPingTest(node);
                            }}
                            className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-blue-400 rounded text-[9.5px]"
                          >
                            Ping Test
                          </button>
                          {onDeleteDevice && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Are you sure you want to delete and un-register node "${node.name}" (${node.ip})?`)) {
                                  onDeleteDevice(node.id);
                                  if (selectedNodeId === node.id) {
                                    setSelectedNodeId(null);
                                  }
                                }
                              }}
                              className="px-2 py-1 bg-rose-950/40 hover:bg-rose-900/40 text-rose-450 border border-rose-950/40 rounded text-[9.5px] cursor-pointer transition-colors"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredNodes.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 font-mono">
                        No discovered hardware elements matched search filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Quick interactive note */}
          <div className="mt-3 text-slate-600 font-mono text-[9px] flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-slate-500" />
            Designed like modern WhatsUp Gold NMS discovery console. Tap nodes to issue active SNMP queries or soft restart line protocols.
          </div>
        </div>

        {/* WUG PROPERTIES INSPECTOR SIDEBAR */}
        <div className="lg:col-span-4 bg-slate-950 rounded-2xl border border-slate-850 p-5 flex flex-col justify-between" id="wug-inspector-panel">
          {activeSelectedNode ? (
            <div className="space-y-4.5">
              
              {/* Box Title */}
              <div className="flex justify-between items-start pb-2.5 border-b border-slate-850">
                <div>
                  <span className="text-[8px] font-black tracking-wider text-blue-400 block uppercase">
                    WhatsUp Gold Inspector
                  </span>
                  <h4 className="text-white font-mono text-xs font-bold mt-0.5 select-all">
                    {activeSelectedNode.name}
                  </h4>
                </div>
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase font-mono border ${
                  activeSelectedNode.status === 'online'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : activeSelectedNode.status === 'warning'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-rose-500/15 text-rose-450 border-rose-500/20'
                }`}>
                  {activeSelectedNode.status}
                </span>
              </div>

              {/* Node Specifications info */}
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-900 space-y-1.5 font-mono text-[10px]">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold uppercase">PHYSICAL IP:</span>
                  <span className="text-slate-300 font-bold select-all">{activeSelectedNode.ip}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold uppercase">WUG TYPE ID:</span>
                  <span className="text-blue-400 font-bold">{activeSelectedNode.type} Node</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold uppercase">UPTIME STAT:</span>
                  <span className="text-slate-300">{activeSelectedNode.rawRef?.uptime || '23 days, 12h'}</span>
                </div>
                {activeSelectedNode.loss !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold uppercase">PACKET LOSS:</span>
                    <span className={`font-bold ${activeSelectedNode.loss > 3 ? 'text-rose-400' : 'text-slate-300'}`}>{activeSelectedNode.loss}%</span>
                  </div>
                )}
                {activeSelectedNode.latency !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold uppercase">LATENCY MS:</span>
                    <span className="text-amber-405 font-bold">{activeSelectedNode.latency}ms</span>
                  </div>
                )}
              </div>

              {/* Dynamic Health Indicators (CPU, RAM, Temp) */}
              {activeSelectedNode.status !== 'offline' && activeSelectedNode.cpu !== undefined ? (
                <div className="space-y-3">
                  {/* CPU level bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-mono text-slate-500 font-bold uppercase">
                      <span>SNMP CPU UTILIZATION</span>
                      <span className="text-slate-300 font-bold">{activeSelectedNode.cpu}%</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          activeSelectedNode.cpu > 70 ? 'bg-amber-500' : 'bg-blue-500'
                        }`} 
                        style={{ width: `${activeSelectedNode.cpu}%` }} 
                      />
                    </div>
                  </div>

                  {/* RAM utilization */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-mono text-slate-500 font-bold uppercase">
                      <span>Memory Load</span>
                      <span className="text-slate-300 font-bold">{activeSelectedNode.ram || 40}%</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-indigo-500 transition-all duration-500" 
                        style={{ width: `${activeSelectedNode.ram || 40}%` }} 
                      />
                    </div>
                  </div>

                  {/* Temperature sensor */}
                  <div className="flex justify-between items-center text-[10px] font-mono bg-slate-900/40 p-2 rounded-lg border border-slate-900">
                    <span className="text-slate-500 font-bold uppercase">SNMP TEMP SENSOR:</span>
                    <span className={`font-bold ${activeSelectedNode.temp && activeSelectedNode.temp > 50 ? 'text-amber-400' : 'text-slate-300'}`}>
                      {activeSelectedNode.temp}°C
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-900/30 text-center rounded-xl border border-slate-900/50 text-[10px] font-mono text-slate-500">
                  {activeSelectedNode.status === 'offline' 
                    ? 'Device packet layer dropped offline. Cannot query SNMP counters.' 
                    : 'Simple link node. No active SNMP performance telemetry.'}
                </div>
              )}

              {/* ACTIVE WUG COMMAND DIAGNOSTIC TOOLS BUTTONS BAR */}
              <div className="space-y-2 pt-3 border-t border-slate-850">
                <span className="text-[8px] font-black uppercase text-slate-550 tracking-wider block font-mono">
                  Diagnostics Toolkit (WhatsUp Gold Direct)
                </span>
                
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => runPingTest(activeSelectedNode)}
                    disabled={isPinging || isTracerouting || isPollingSNMP}
                    className="py-1.5 px-1 bg-slate-900 hover:bg-slate-850 text-blue-400 disabled:opacity-40 font-mono text-[9px] font-bold rounded border border-slate-800 hover:border-slate-700 transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-1"
                  >
                    <Activity className={`w-3.5 h-3.5 ${isPinging ? 'animate-bounce text-amber-500' : ''}`} />
                    <span>ICMP Ping</span>
                  </button>

                  <button
                    onClick={() => runTracerouteTest(activeSelectedNode)}
                    disabled={isPinging || isTracerouting || isPollingSNMP}
                    className="py-1.5 px-1 bg-slate-900 hover:bg-slate-850 text-blue-400 disabled:opacity-40 font-mono text-[9px] font-bold rounded border border-slate-800 hover:border-slate-700 transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-1"
                  >
                    <Terminal className={`w-3.5 h-3.5 ${isTracerouting ? 'animate-pulse text-amber-500' : ''}`} />
                    <span>Traceroute</span>
                  </button>

                  <button
                    onClick={() => runSNMPTelemetryPoll(activeSelectedNode)}
                    disabled={isPinging || isTracerouting || isPollingSNMP}
                    className="py-1.5 px-1 bg-slate-900 hover:bg-slate-850 text-blue-400 disabled:opacity-40 font-mono text-[9px] font-bold rounded border border-slate-800 hover:border-slate-700 transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-1"
                  >
                    <Cpu className={`w-3.5 h-3.5 ${isPollingSNMP ? 'animate-spin text-amber-500' : ''}`} />
                    <span>Poll SNMP</span>
                  </button>
                </div>
              </div>

              {/* LIVE DIAGNOSTICS SHELL OUTPUT CONSOLE WINDOW */}
              <div className="space-y-1.5 font-mono">
                <span className="text-[8px] font-black text-slate-550 uppercase tracking-wider block">
                  Interactive Packet Shell Output
                </span>
                <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 h-32 overflow-y-auto text-[9.5px] text-emerald-400 space-y-1 font-mono leading-relaxed select-text shadow-inner">
                  {pingConsole.map((line, lIdx) => (
                    <div key={`pl-${lIdx}`} className="whitespace-pre-wrap">
                      <span className="text-slate-600 mr-1.5">WUG:</span>{line}
                    </div>
                  ))}
                  {pingConsole.length === 0 && (
                    <div className="text-slate-600 italic">No packet command has been run. Tap ICMP Ping above.</div>
                  )}
                </div>
              </div>

              {/* ACTION TOGGLES */}
              <div className="space-y-2 pt-2 border-t border-slate-850">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleToggleState(activeSelectedNode)}
                    className={`py-1.5 px-2 font-mono text-[9.5px] font-bold rounded transition-all cursor-pointer border ${
                      activeSelectedNode.status === 'offline'
                        ? 'bg-emerald-900/10 hover:bg-emerald-900/30 text-emerald-400 border-emerald-800/30'
                        : 'bg-rose-950/20 hover:bg-rose-900/35 text-rose-400 border-rose-950/40'
                    }`}
                  >
                    {activeSelectedNode.status === 'offline' ? 'Power Sync Node' : 'Simulate Outage'}
                  </button>

                  <button
                    onClick={() => {
                      if (activeSelectedNode.type === 'AP') {
                        alert(`Soft Reboot queued for wireless hub controller ${activeSelectedNode.name}.`);
                      } else {
                        onRebootDevice(activeSelectedNode.id);
                      }
                    }}
                    className="py-1.5 px-2 bg-slate-900 hover:bg-slate-850 text-slate-300 font-mono text-[9.5px] font-bold rounded border border-slate-800 hover:border-slate-705 cursor-pointer transition-all flex items-center justify-center gap-1"
                  >
                    <RefreshCcw className="w-2.5 h-2.5" />
                    <span>Cycle Reboot</span>
                  </button>
                </div>

                {onDeleteDevice && (
                  <button
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete and un-register node "${activeSelectedNode.name}" (${activeSelectedNode.ip})?`)) {
                        onDeleteDevice(activeSelectedNode.id);
                        setSelectedNodeId(null);
                      }
                    }}
                    className="w-full py-1.5 px-2 bg-rose-950/40 hover:bg-rose-900/50 text-rose-400 font-mono text-[9.5px] font-bold rounded border border-rose-900/40 hover:border-rose-800/60 cursor-pointer transition-colors flex items-center justify-center gap-1"
                  >
                    ✗ Delete Node from Monitor
                  </button>
                )}
              </div>

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="h-14 w-14 bg-slate-900 rounded-full border border-slate-800 flex items-center justify-center text-slate-500">
                <Settings className="w-6 h-6 animate-spin" />
              </div>
              <h4 className="font-display font-semibold text-xs text-slate-300 uppercase tracking-widest leading-none">
                Properties Inspector
              </h4>
              <p className="text-slate-550 font-mono text-[10px] max-w-[210px] leading-relaxed">
                Click on any node in the active topology graph coordinates to inspect real-time SNMP properties, memory utilization curves, or run tools.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

// Low level generic node/laptop graphic icon since we might need standard shapes
function LaptopNodeIcon(props: any) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

// Low level firewall SVG icon standard representation
function ShieldNodeIcon(props: any) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
