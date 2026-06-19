export interface NetworkNode {
  id: string;
  name: string;
  region: string;
  ip: string;
  x: number; // Percent coordinates for UI topology map
  y: number;
  status: 'active' | 'idle' | 'congested' | 'compromised';
  latency: number; // ms
  bandwidth: number; // Gbps
  packetLoss: number; // percentage
  cpuUsage: number; // %
}

export interface PlaybookStep {
  id: string;
  action: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  logOutput?: string[];
}

export interface AnomalyEvent {
  id: string;
  title: string;
  description: string;
  timestamp: string; // HH:MM:SS format
  code: string; // e.g. "Heuristic_X3", "Sec_Breach?"
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'investigating' | 'acknowledged' | 'resolved' | 'ignored';
  details?: string; // AI generated context
  mitigationPlaybook: PlaybookStep[];
  affectedNodeId?: string;
}

export interface TelemetryMetrics {
  activeNodes: number;
  threatsBlocked: string; // e.g. "28.4k"
  upTime: string; // "99.998%"
  liveLatency: number; // ms
  bandwidthUsage: number[]; // Array of last 7 seconds channels
  packetLossRate: number; // percentage
}

export type ActiveTab = 'overview' | 'devices' | 'metrics' | 'alerts' | 'settings';

export interface ISPConnection {
  id: string;
  name: string;
  gateway: string;
  type: string;
  status: 'active' | 'backup' | 'down';
  bandwidthUsg: number; // in %
  throughput: { rx: number; tx: number; max: number }; // Gbps or Mbps
  latency: number; // ms
  packetLoss: number; // %
}

export interface WifiAP {
  id: string;
  name: string;
  location: string;
  clients: number;
  status: 'active' | 'congested' | 'inactive';
  signal: number; // dBm
  uptime: string;
}

export interface MonitoredUrl {
  id: string;
  name: string;
  url: string;
  category: 'Internal' | 'External' | 'API';
  status: 'online' | 'slow' | 'offline';
  statusCode: number;
  latency: number; // ms
  sslExpiryDays: number;
  lastChecked: string;
}

export interface HardwareDevice {
  id: string;
  name: string;
  ip: string;
  type: 'Firewall' | 'Switch' | 'Router' | 'Server' | 'UPS' | 'NAS' | 'Printer' | 'Other';
  status: 'online' | 'warning' | 'offline';
  cpu: number;
  ram: number;
  temp: number;
  uptime: string;
  locationGroup?: string;
  parentDeviceId?: string;
  maintenanceMode?: boolean;
  snmpEnabled?: boolean;
  latency?: number; // Response time in ms
}

