import React, { useState, useEffect, useMemo } from 'react';
import { 
  Network, Wifi, Monitor, Server, Circle, ShieldAlert, CheckCircle2, 
  AlertTriangle, RefreshCw, Plus, Search, ExternalLink, Activity, 
  Cpu, HardDrive, Thermometer, Battery, Globe, Lock, Key, ArrowRight,
  Sparkles, Sliders, Settings, Play, ChevronLeft, ChevronRight, Check,
  Terminal, Rss, Bell, LogOut, HelpCircle, ArrowUpRight, ArrowDownLeft,
  Phone, Mail, MessageSquare, PhoneCall
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell, Tooltip } from 'recharts';
import { 
  ActiveTab, ISPConnection, WifiAP, MonitoredUrl, HardwareDevice, 
  PlaybookStep, AnomalyEvent 
} from './types';
import PlaybookConsole from './components/PlaybookConsole';
import ISPSpeedMeters from './components/ISPSpeedMeters';
import WhatsUpGoldMap from './components/WhatsUpGoldMap';

// 4+ Office ISPs initial data
const initialISPs: ISPConnection[] = [
  { id: 'isp-telekom', name: 'Telekom Primary Fiber', gateway: '195.122.3.1', type: 'Dedicated GigaFiber', status: 'active', bandwidthUsg: 84.7, throughput: { rx: 712.4, tx: 134.7, max: 1000 }, latency: 11, packetLoss: 0.00 },
  { id: 'isp-biznet', name: 'BizNet Backup Fiber', gateway: '202.80.114.1', type: 'Symmetric Broadband', status: 'backup', bandwidthUsg: 15.2, throughput: { rx: 62.0, tx: 14.1, max: 500 }, latency: 16, packetLoss: 0.00 },
  { id: 'isp-indosat', name: 'Indosat Microwave Link', gateway: '103.10.22.4', type: 'Wireless Radio Link', status: 'backup', bandwidthUsg: 0.0, throughput: { rx: 0.0, tx: 0.0, max: 100 }, latency: 28, packetLoss: 0.12 },
  { id: 'isp-starlink', name: 'Starlink SAT Emergency', gateway: '143.204.1.1', type: 'LEO Satellite Grid', status: 'backup', bandwidthUsg: 0.0, throughput: { rx: 0.0, tx: 0.0, max: 220 }, latency: 45, packetLoss: 26.94 }
];

// Initial office WiFi APs data
const initialWiFiAPs: WifiAP[] = [
  { id: 'wifi-ap-1', name: 'AP-HQ-GroundFloor', location: 'Open Lobby & Reception', clients: 44, status: 'active', signal: -52, uptime: '14 days' },
  { id: 'wifi-ap-2', name: 'AP-HQ-FirstFloor', location: 'Meeting Rooms & Offices', clients: 31, status: 'active', signal: -58, uptime: '89 days' },
  { id: 'wifi-ap-3', name: 'AP-HQ-SecondFloor', location: 'Engineering & Desk Area', clients: 88, status: 'congested', signal: -64, uptime: '89 days' },
  { id: 'wifi-ap-4', name: 'AP-HQ-ServerRoom', location: 'NOC Rack & Datacenter', clients: 5, status: 'active', signal: -35, uptime: '142 days' },
  { id: 'wifi-ap-5', name: 'AP-GuestPortal-Public', location: 'Cafeteria & Lobby', clients: 19, status: 'active', signal: -70, uptime: '4 days' }
];

// Initial Active Hardware Devices
const initialHardware: HardwareDevice[] = [
  { id: 'hw-1', name: 'SophosXG-HQ-Firewall', ip: '192.168.1.1', type: 'Firewall', status: 'online', cpu: 34, ram: 48, temp: 42, uptime: '142 days', latency: 1.2 },
  { id: 'hw-2', name: 'CoreStack-Catalyst-S1', ip: '192.168.1.10', type: 'Switch', status: 'online', cpu: 14, ram: 22, temp: 36, uptime: '89 days', latency: 2.5 },
  { id: 'hw-3', name: 'Server-DellR740-VM01', ip: '192.168.10.100', type: 'Server', status: 'online', cpu: 68, ram: 78, temp: 48, uptime: '45 days', latency: 4.8 },
  { id: 'hw-4', name: 'Storage-RS3618xs-Backup', ip: '192.168.10.250', type: 'NAS', status: 'online', cpu: 22, ram: 40, temp: 39, uptime: '12 days', latency: 3.1 },
  { id: 'hw-5', name: 'UPS-APC-Smart3000', ip: '192.168.1.99', type: 'UPS', status: 'online', cpu: 4, ram: 8, temp: 24, uptime: '224 days', latency: 0.9 },
  { id: 'hw-6', name: 'Router-Cisco4431-WAN', ip: '192.168.1.254', type: 'Router', status: 'offline', cpu: 0, ram: 0, temp: 18, uptime: '0 days', latency: 0 }
];

// Exactly 42 Monitored URL listings to prove 40+ URL monitoring suite
const initialUrls: MonitoredUrl[] = [
  { id: 'url-1', name: 'Google Workspace Single-SignOn', url: 'google.com/a/office', category: 'External', status: 'online', statusCode: 200, latency: 11, sslExpiryDays: 242, lastChecked: '5s ago' },
  { id: 'url-2', name: 'Microsoft 365 Cloud Hub', url: 'microsoft365.com', category: 'External', status: 'online', statusCode: 200, latency: 15, sslExpiryDays: 14, lastChecked: '12s ago' },
  { id: 'url-3', name: 'Slack HQ Communications webhook', url: 'hooks.slack.com/hq-con', category: 'API', status: 'online', statusCode: 200, latency: 22, sslExpiryDays: 105, lastChecked: '3s ago' },
  { id: 'url-4', name: 'Office Active CRM Portal', url: 'crm.internal.office.net', category: 'Internal', status: 'online', statusCode: 200, latency: 4, sslExpiryDays: 3, lastChecked: '2s ago' },
  { id: 'url-5', name: 'Corporate Email SMTP Gateway', url: 'mail-relay.office-internal', category: 'Internal', status: 'online', statusCode: 200, latency: 8, sslExpiryDays: 195, lastChecked: '44s ago' },
  { id: 'url-6', name: 'SAP Production ERP', url: 'sap.production.local', category: 'Internal', status: 'online', statusCode: 200, latency: 5, sslExpiryDays: 180, lastChecked: '1m ago' },
  { id: 'url-7', name: 'External Stripe Checkout System', url: 'checkout.stripe.com/office', category: 'API', status: 'online', statusCode: 200, latency: 48, sslExpiryDays: 120, lastChecked: '25s ago' },
  { id: 'url-8', name: 'Jira Software Engineering Board', url: 'jira.atlassian.net', category: 'External', status: 'online', statusCode: 200, latency: 31, sslExpiryDays: 114, lastChecked: '52s ago' },
  { id: 'url-9', name: 'Gitlab Enterprise repository', url: 'git.office-internal', category: 'Internal', status: 'online', statusCode: 200, latency: 6, sslExpiryDays: 34, lastChecked: '3s ago' },
  { id: 'url-10', name: 'Sophos XG Central Controller', url: 'sophos-firewall.local', category: 'Internal', status: 'online', statusCode: 200, latency: 2, sslExpiryDays: 150, lastChecked: '15s ago' },
  { id: 'url-11', name: 'Active Directory Domain Sync', url: 'active-directory.office.local', category: 'Internal', status: 'online', statusCode: 200, latency: 3, sslExpiryDays: 300, lastChecked: '8s ago' },
  { id: 'url-12', name: 'Wiki Technical Knowledge base', url: 'wiki.office-internal', category: 'Internal', status: 'online', statusCode: 200, latency: 5, sslExpiryDays: 80, lastChecked: '40s ago' },
  { id: 'url-13', name: 'Primary Mirror Storage NAS', url: 'nas-backup-primary.local', category: 'Internal', status: 'online', statusCode: 200, latency: 9, sslExpiryDays: 360, lastChecked: '1m ago' },
  { id: 'url-14', name: 'Network Printer Laser spooler', url: 'printer-spool.local', category: 'Internal', status: 'slow', statusCode: 200, latency: 198, sslExpiryDays: 1, lastChecked: '4s ago' },
  { id: 'url-15', name: 'HQ Access Control RFID Security', url: 'gate.security.local', category: 'Internal', status: 'online', statusCode: 200, latency: 12, sslExpiryDays: 45, lastChecked: '12s ago' },
  { id: 'url-16', name: 'Main Lobby Visitor Check-in Desk', url: 'lobby-kiosk.local', category: 'Internal', status: 'online', statusCode: 200, latency: 15, sslExpiryDays: 34, lastChecked: '30s ago' },
  { id: 'url-17', name: 'CCTV Feeds Physical Gateway', url: 'cctv-controller.office.local', category: 'Internal', status: 'offline', statusCode: 404, latency: 0, sslExpiryDays: 4, lastChecked: '1s ago' },
  { id: 'url-18', name: 'Office HVAC Smart Temp controller', url: 'hvac.office.local', category: 'Internal', status: 'online', statusCode: 200, latency: 9, sslExpiryDays: 12, lastChecked: '10s ago' },
  { id: 'url-19', name: 'Google Cloud API Auth gateway', url: 'gcp.api-secure.net', category: 'API', status: 'online', statusCode: 200, latency: 25, sslExpiryDays: 420, lastChecked: '20s ago' },
  { id: 'url-20', name: 'Salesforce CRM production sync', url: 'salesforce.com/api/sync', category: 'API', status: 'online', statusCode: 200, latency: 54, sslExpiryDays: 95, lastChecked: '44s ago' },
  { id: 'url-21', name: 'API Mobile Auth Gateway', url: 'api.company.com/v1/user-auth', category: 'API', status: 'online', statusCode: 200, latency: 18, sslExpiryDays: 120, lastChecked: '10s ago' },
  { id: 'url-22', name: 'API Real-time Inventory DB proxy', url: 'api.company.com/v1/inventory', category: 'API', status: 'online', statusCode: 200, latency: 32, sslExpiryDays: 140, lastChecked: '12s ago' },
  { id: 'url-23', name: 'API Telemetry metrics collector', url: 'api.company.com/v1/telemetry', category: 'API', status: 'offline', statusCode: 500, latency: 0, sslExpiryDays: 88, lastChecked: '2s ago' },
  { id: 'url-24', name: 'API Corporate Reporting daemon', url: 'api.company.com/v1/reports', category: 'API', status: 'slow', statusCode: 503, latency: 450, sslExpiryDays: 88, lastChecked: '30s ago' },
  { id: 'url-25', name: 'Customer Support Zendesk channel', url: 'support.company.com', category: 'External', status: 'online', statusCode: 200, latency: 45, sslExpiryDays: 312, lastChecked: '1m ago' },
  { id: 'url-26', name: 'Primary DNS Router Gateway resolver', url: 'dns.google', category: 'External', status: 'online', statusCode: 200, latency: 12, sslExpiryDays: 450, lastChecked: '5s ago' },
  { id: 'url-27', name: 'Cloudflare Secondary DNS server', url: 'one.one.one.one', category: 'External', status: 'online', statusCode: 200, latency: 8, sslExpiryDays: 452, lastChecked: '4s ago' },
  { id: 'url-28', name: 'External Zoom Bridge Controller', url: 'zoom.us/telephony', category: 'External', status: 'online', statusCode: 200, latency: 32, sslExpiryDays: 160, lastChecked: '3m ago' },
  { id: 'url-29', name: 'Marketing Web Flow Hubspot CMS', url: 'marketing.company.com', category: 'External', status: 'online', statusCode: 200, latency: 51, sslExpiryDays: 110, lastChecked: '42s ago' },
  { id: 'url-30', name: 'Active Directory SSO Federation', url: 'adfs.office.net/auth', category: 'Internal', status: 'online', statusCode: 200, latency: 5, sslExpiryDays: 12, lastChecked: '10s ago' },
  { id: 'url-31', name: 'Internal HR portal', url: 'hr-portal.office.local', category: 'Internal', status: 'online', statusCode: 200, latency: 6, sslExpiryDays: 45, lastChecked: '5m ago' },
  { id: 'url-32', name: 'Engineering Technical repository 2', url: 'git2.office-internal', category: 'Internal', status: 'online', statusCode: 200, latency: 7, sslExpiryDays: 200, lastChecked: '2m ago' },
  { id: 'url-33', name: 'Switch Core Stack-2 control panel', url: 'switch-stack-2.local', category: 'Internal', status: 'online', statusCode: 200, latency: 3, sslExpiryDays: 90, lastChecked: '15s ago' },
  { id: 'url-34', name: 'Partner secure webhook feed', url: 'partner-portal.local/endpoint', category: 'API', status: 'online', statusCode: 200, latency: 14, sslExpiryDays: 18, lastChecked: '1m ago' },
  { id: 'url-35', name: 'Customer Stripe checkout session 2', url: 'checkout2.stripe.com', category: 'API', status: 'online', statusCode: 200, latency: 28, sslExpiryDays: 140, lastChecked: '22s ago' },
  { id: 'url-36', name: 'Salesforce API Gateway', url: 'api.salesforce.company', category: 'API', status: 'online', statusCode: 200, latency: 39, sslExpiryDays: 100, lastChecked: '5m ago' },
  { id: 'url-37', name: 'API Quartz scheduling daemon', url: 'api.company.com/v1/scheduler', category: 'API', status: 'online', statusCode: 200, latency: 19, sslExpiryDays: 52, lastChecked: '11s ago' },
  { id: 'url-38', name: 'SMTP mirror relay backup', url: 'mail-relay-2.office-internal', category: 'Internal', status: 'online', statusCode: 200, latency: 12, sslExpiryDays: 90, lastChecked: '2h ago' },
  { id: 'url-39', name: 'DHCP Pool IP allocate monitor', url: 'dhcp-controller.local', category: 'Internal', status: 'online', statusCode: 200, latency: 4, sslExpiryDays: 300, lastChecked: '10s ago' },
  { id: 'url-40', name: 'VLAN primary route supervisor', url: 'vlan100.local', category: 'Internal', status: 'online', statusCode: 200, latency: 3, sslExpiryDays: 300, lastChecked: '30s ago' },
  { id: 'url-41', name: 'SaaS Jira cloud webhook agent', url: 'jira.webhooks.company.com', category: 'API', status: 'online', statusCode: 200, latency: 29, sslExpiryDays: 80, lastChecked: '1m ago' },
  { id: 'url-42', name: 'External CDN asset caching', url: 'assets.company.com', category: 'External', status: 'online', statusCode: 200, latency: 15, sslExpiryDays: 210, lastChecked: '4m ago' }
];

// Initial Anomaly Events
const initialAnomalies: AnomalyEvent[] = [
  {
    id: 'anom-1',
    title: 'Starlink Loss Threshold Warning',
    description: 'LEO Satellite connection packet drop rate is elevated above safe limits due to storm interference.',
    code: 'SAT_INTERFERENCE',
    severity: 'critical',
    status: 'active',
    timestamp: '11:05:12',
    affectedNodeId: 'isp-starlink',
    mitigationPlaybook: [
      { id: 'sb-1', action: 'Divert Satellite Traffic', description: 'Initiate protocol gateway shift to primary Telekom line.', status: 'completed', logOutput: ['Redirecting sat routes...', 'Active gateway tunnel diverted successfully to 195.122.3.1.'] },
      { id: 'sb-2', action: 'BGP Priority Override', description: 'Re-weight Telekom fiber priority metric inside Cisco Router.', status: 'completed', logOutput: ['Executing weight 100 on Telekom priority vlan...'] },
      { id: 'sb-3', action: 'Inspect Satellite Sync', description: 'Run remote query command to Starlink satellite transceiver.', status: 'pending' }
    ]
  },
  {
    id: 'anom-2',
    title: 'CCTV Feed Gateway Offline',
    description: '404 Not Found response returned from physical video recorder controller backend.',
    code: 'CCTV_FAIL',
    severity: 'medium',
    status: 'investigating',
    timestamp: '10:42:01',
    affectedNodeId: 'hw-6',
    mitigationPlaybook: [
      { id: 'cb-1', action: 'Ping Controller', description: 'Issue 10 count packet handshake to CCTV controller gateway.', status: 'running', logOutput: ['PING 192.168.1.50...', 'Request timed out.', 'Request timed out.'] },
      { id: 'cb-2', action: 'Inspect power line', description: 'Analyze UPS logs for possible fuse trip state.', status: 'pending' }
    ]
  },
  {
    id: 'anom-3',
    title: 'Cisco WAN Router Offline',
    description: 'Hardware interface terminal Router-Cisco4431-WAN timed out during periodic ping diagnostics.',
    code: 'ROUTER_DOWN',
    severity: 'high',
    status: 'active',
    timestamp: '09:12:15',
    affectedNodeId: 'hw-6',
    mitigationPlaybook: []
  },
  {
    id: 'anom-4',
    title: 'Internal SAP Database Slow Response',
    description: 'Latency metrics on SAP ERP locally hosted application floated above 150ms.',
    code: 'DB_SLOW_LOAD',
    severity: 'low',
    status: 'resolved',
    timestamp: '08:00:24',
    affectedNodeId: 'hw-3',
    mitigationPlaybook: []
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [isps, setIsps] = useState<ISPConnection[]>(initialISPs);
  const [wifiAPs, setWifiAPs] = useState<WifiAP[]>(initialWiFiAPs);
  const [urls, setUrls] = useState<MonitoredUrl[]>(initialUrls);
  const [latencyHistory, setLatencyHistory] = useState<number[]>(() => [
    14, 18, 12, 16, 21, 15, 13, 19, 14, 11, 15, 17, 13, 15, 16, 12, 14, 18, 15, 14
  ]);
  const [downloadHistory, setDownloadHistory] = useState<number[]>(() => [
    710, 750, 730, 810, 850, 890, 820, 780, 840, 860, 810, 830, 850, 840, 870, 890, 850, 860, 847, 852
  ]);
  const [uploadHistory, setUploadHistory] = useState<number[]>(() => [
    128, 135, 131, 145, 153, 161, 147, 140, 151, 154, 145, 149, 152, 151, 156, 160, 153, 154, 152, 153
  ]);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [hoveredTrafficIdx, setHoveredTrafficIdx] = useState<number | null>(null);
  const [hardware, setHardware] = useState<HardwareDevice[]>(initialHardware);
  const [anomalies, setAnomalies] = useState<AnomalyEvent[]>(initialAnomalies);
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyEvent | null>(null);

  // SMS, Email, Phone Alert Routing Configuration state
  const [alertSettings, setAlertSettings] = useState({
    smsEnabled: false,
    smsNumber: '+1 (555) 432-1098',
    emailEnabled: true,
    emailAddress: 'noc-alerts@enterprise.net',
    callEnabled: true,
    callNumber: '+1 (555) 876-5432',
    testMessage: 'ALERT: Primary Core-Switch-Rack went offline.'
  });

  // Keep track of active incoming voice call simulation
  const [activeCall, setActiveCall] = useState<{
    status: 'ringing' | 'connected' | 'completed';
    deviceName: string;
    recipient: string;
    details: string;
  } | null>(null);

  // Keep track of active toast notifications mapping to SMS/Email
  const [toasts, setToasts] = useState<{
    id: string;
    title: string;
    message: string;
    medium: 'sms' | 'email' | 'call';
    deviceName?: string;
    details?: string;
    timestamp: string;
  }[]>([]);

  // Simulation alert routing logs
  const [dispatchedAlerts, setDispatchedAlerts] = useState<{
    id: string;
    timestamp: string;
    deviceName: string;
    eventCode: string;
    medium: 'SMS' | 'Email' | 'Voice Call';
    recipient: string;
    message: string;
    status: 'Delivered' | 'Sent' | 'Completed' | 'Dialing...';
  }[]>([
    {
      id: 'disp-1',
      timestamp: '09:42:15',
      deviceName: 'Router-Cisco4431-WAN',
      eventCode: 'WAN_PING_DOWN',
      medium: 'SMS',
      recipient: '+1 (555) 432-1098',
      message: '🚨 CRITICAL ALERT: Router-Cisco4431-WAN is DOWN (No Route to Host). Status: Offline',
      status: 'Delivered'
    },
    {
      id: 'disp-2',
      timestamp: '09:42:16',
      deviceName: 'Router-Cisco4431-WAN',
      eventCode: 'WAN_PING_DOWN',
      medium: 'Email',
      recipient: 'noc-alerts@enterprise.net',
      message: '🚨 CRITICAL ALERT: Router-Cisco4431-WAN is DOWN (No Route to Host). Status: Offline',
      status: 'Sent'
    },
    {
      id: 'disp-3',
      timestamp: '09:42:18',
      deviceName: 'Router-Cisco4431-WAN',
      eventCode: 'WAN_PING_DOWN',
      medium: 'Voice Call',
      recipient: '+1 (555) 876-5432',
      message: 'Emergency TTS Voice Escalation: Warning! Device Router-Cisco4431-WAN is offline. Please investigate.',
      status: 'Completed'
    }
  ]);

  const addNotificationToast = (title: string, message: string, medium: 'sms' | 'email' | 'call', deviceName?: string, details?: string) => {
    const newToast = {
      id: `toast-${Date.now()}-${Math.random()}`,
      title,
      message,
      medium,
      deviceName,
      details,
      timestamp: new Date().toLocaleTimeString()
    };
    setToasts(prev => [newToast, ...prev]);
    
    if (medium !== 'call') {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newToast.id));
      }, 7000);
    } else {
      setActiveCall({
        status: 'ringing',
        deviceName: deviceName || 'System Target Node',
        recipient: alertSettings.callNumber,
        details: details || 'Unknown event'
      });
    }
  };

  const [backendConfig, setBackendConfig] = useState<{
    emailConfigured: boolean;
    twilioConfigured: boolean;
    smtpHost: string;
    smtpUser: string;
    twilioFrom: string;
  } | null>(null);

  useEffect(() => {
    fetch('/api/config-status')
      .then(res => res.json())
      .then(data => setBackendConfig(data))
      .catch(err => console.error("Error fetching live critical NOC setup status:", err));
  }, []);

  const triggerAlertNotifications = (deviceName: string, code: string, details: string) => {
    const timeStr = new Date().toTimeString().split(' ')[0];
    const newDispatches: any[] = [];
    
    if (alertSettings.smsEnabled) {
      newDispatches.push({
        id: `disp-sms-${Date.now()}`,
        timestamp: timeStr,
        deviceName,
        eventCode: code,
        medium: 'SMS',
        recipient: alertSettings.smsNumber,
        message: `🚨 [SMS Alert] CRITICAL DOWN: "${deviceName}" (${details}) is Offline! Please inspect.`,
        status: 'Delivered'
      });
      addNotificationToast('SMS Sent', `To ${alertSettings.smsNumber}: "${deviceName}" down!`, 'sms');
    }
    
    if (alertSettings.emailEnabled) {
      const emailMsg = `🚨 [NOC Email Alert] Critical Failure on segment node: "${deviceName}". Details: ${details}. Severity: CRITICAL_URGENT.`;
      const dispatchId = `disp-email-${Date.now()}`;
      
      newDispatches.push({
        id: dispatchId,
        timestamp: timeStr,
        deviceName,
        eventCode: code,
        medium: 'Email',
        recipient: alertSettings.emailAddress,
        message: emailMsg,
        status: 'Sending...'
      });
      
      addNotificationToast('Sending Email Alert', `Triggering email dispatch to ${alertSettings.emailAddress}...`, 'email');
      
      // Dispatch server request
      fetch('/api/send-email-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: alertSettings.emailAddress,
          deviceName,
          eventCode: code,
          message: emailMsg
        })
      })
      .then(res => res.json())
      .then(data => {
        setDispatchedAlerts(prev => prev.map(d => {
          if (d.id === dispatchId) {
            return { 
              ...d, 
              status: data.status === 'sent' ? 'Delivered' : 'Simulated',
              message: data.status === 'sent' 
                ? `${d.message} (SMTP Delivered ID: ${data.messageId || 'OK'})`
                : `${d.message} (Simulated Dispatch Done)`
            };
          }
          return d;
        }));
        
        const toastTitle = data.status === 'sent' ? 'Email Delivered (SMTP)' : 'Email Logged (Simulated)';
        const toastMsg = data.status === 'sent' 
          ? `Dispatched via custom SMTP to ${alertSettings.emailAddress}!` 
          : `Outbound warning logged securely in simulated channels.`;
        addNotificationToast(toastTitle, toastMsg, 'email');
      })
      .catch(err => {
        console.error("Email API Call Error:", err);
        setDispatchedAlerts(prev => prev.map(d => {
          if (d.id === dispatchId) {
            return { ...d, status: 'Failed' };
          }
          return d;
        }));
        addNotificationToast('SMTP Delivery Failed', `Host connection error: ${err.message || 'Check credentials'}`, 'email');
      });
    }
    
    if (alertSettings.callEnabled) {
      const callMsg = `Emergency escalation: Device "${deviceName}" is DOWN. Details: "${details}". Action required.`;
      const dispatchId = `disp-call-${Date.now()}`;
      
      newDispatches.push({
        id: dispatchId,
        timestamp: timeStr,
        deviceName,
        eventCode: code,
        medium: 'Voice Call',
        recipient: alertSettings.callNumber,
        message: callMsg,
        status: 'Dialing...'
      });
      
      addNotificationToast('Placing Outbound Call', `Connecting to Twilio line for ${alertSettings.callNumber}...`, 'call', deviceName, details);
      
      // Dispatch server voice call request
      fetch('/api/trigger-voice-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: alertSettings.callNumber,
          deviceName,
          eventCode: code,
          details
        })
      })
      .then(res => res.json())
      .then(data => {
        setDispatchedAlerts(prev => prev.map(d => {
          if (d.id === dispatchId) {
            return { 
              ...d, 
              status: data.status === 'dialing' ? 'Completed' : 'Simulated',
              message: data.status === 'dialing' 
                ? `${d.message} (Placed Twilio Call SID: ${data.callSid})` 
                : `${d.message} (Local simulation popped up)`
            };
          }
          return d;
        }));
        
        if (data.status === 'dialing') {
          addNotificationToast('Voice Call Answered', `Escalation call placed successfully via Twilio!`, 'call', deviceName, details);
        }
      })
      .catch(err => {
        console.error("Voice API Call Error:", err);
        setDispatchedAlerts(prev => prev.map(d => {
          if (d.id === dispatchId) {
            return { ...d, status: 'Failed' };
          }
          return d;
        }));
        addNotificationToast('Twilio Call Failed', `Protocol Error: ${err.message || 'Check credentials'}`, 'call');
      });
    }
    
    if (newDispatches.length > 0) {
      setDispatchedAlerts(prev => [...newDispatches, ...prev]);
    }
  };

  // Search & Filters inside Metrics Tab
  const [urlSearch, setUrlSearch] = useState('');
  const [urlFilter, setUrlFilter] = useState<'All' | 'Internal' | 'External' | 'API' | 'Offline/Slow'>('All');
  const [urlPage, setUrlPage] = useState(0);
  const itemsPerPage = 8;

  // Add Custom URL Modal Form
  const [showAddUrlModal, setShowAddUrlModal] = useState(false);
  const [newUrlForm, setNewUrlForm] = useState({
    name: '',
    url: '',
    category: 'Internal' as MonitoredUrl['category']
  });

  // Add Hardware Device Modal Form
  const [showAddHardwareModal, setShowAddHardwareModal] = useState(false);
  const [newHardwareForm, setNewHardwareForm] = useState({
    name: '',
    ip: '',
    type: 'Router' as HardwareDevice['type'],
    status: 'online' as HardwareDevice['status'],
    locationGroup: '',
    parentDeviceId: 'None',
    maintenanceMode: false,
    snmpEnabled: false
  });

  // Diagnostics counters
  const [speedtestingIsp, setSpeedtestingIsp] = useState<string | null>(null);
  const [rebootingNode, setRebootingNode] = useState<string | null>(null);
  const [simulatingTick, setSimulatingTick] = useState(true);

  // Periodic Simulation Effect to bring the NOC dashboard to life!
  useEffect(() => {
    if (!simulatingTick) return;

    const timer = setInterval(() => {
      // Fluctuate Telekom & backup ISPs speeds slightly
      setIsps(prev => {
        const updated = prev.map(isp => {
          if (isp.status === 'down') return isp;
          const drift = Math.floor(Math.random() * 20 - 10);
          const latDrift = Math.floor(Math.random() * 4 - 2);
          
          // Accumulate randomized live speeds
          let currentRx = isp.throughput.rx;
          if (isp.status === 'active') {
            currentRx = Math.max(650, Math.min(990, currentRx + drift));
          } else if (isp.bandwidthUsg > 0) {
            currentRx = Math.max(30, Math.min(120, currentRx + drift));
          }

          return {
            ...isp,
            throughput: {
              ...isp.throughput,
              rx: Number(currentRx.toFixed(1)),
              tx: Number((currentRx * 0.18).toFixed(1))
            },
            latency: Math.max(4, Math.min(120, isp.latency + latDrift))
          };
        });

        const activeIsp = updated.find(isp => isp.status === 'active') || updated[0];
        if (activeIsp) {
          setDownloadHistory(h => {
            const next = [...h, activeIsp.throughput.rx];
            if (next.length > 25) next.shift();
            return next;
          });
          setUploadHistory(h => {
            const next = [...h, activeIsp.throughput.tx];
            if (next.length > 25) next.shift();
            return next;
          });
        }
        return updated;
      });

      // Fluctuate clients and dbm counters on Wifi access points
      setWifiAPs(prev => prev.map(ap => {
        if (ap.status === 'inactive') return ap;
        const clientsVar = Math.floor(Math.random() * 4 - 2);
        const sigVar = Math.floor(Math.random() * 4 - 2);
        return {
          ...ap,
          clients: Math.max(1, Math.min(150, ap.clients + clientsVar)),
          signal: Math.min(-30, Math.max(-90, ap.signal + sigVar))
        };
      }));

      // Fluctuate system CPU and memory load dials
      setHardware(prev => prev.map(dev => {
        if (dev.status === 'offline') return dev;
        const cpuVar = Math.floor(Math.random() * 10 - 5);
        const ramVar = Math.floor(Math.random() * 4 - 2);
        return {
          ...dev,
          cpu: Math.max(1, Math.min(99, dev.cpu + cpuVar)),
          ram: Math.max(5, Math.min(99, dev.ram + ramVar))
        };
      }));

      // Fluctuate URL latencies slightly and record new average latency historically
      setUrls(prev => {
        const next = prev.map(u => {
          if (u.status === 'offline') return u;
          const latVar = Math.floor(Math.random() * 8 - 4);
          return {
            ...u,
            latency: Math.max(2, Math.min(480, u.latency + latVar))
          };
        });
        
        // Calculate the new average latency of online endpoints
        const activeUrls = next.filter(u => u.status === 'online');
        const avg = Math.round(activeUrls.reduce((acc, u) => acc + u.latency, 0) / activeUrls.length) || 11;
        setLatencyHistory(prevHist => {
          const updated = [...prevHist, avg];
          if (updated.length > 25) {
            updated.shift();
          }
          return updated;
        });
        return next;
      });

    }, 3000);

    return () => clearInterval(timer);
  }, [simulatingTick]);

  // Kill/offline ISP signaling drill
  const toggleIspStatus = (id: string) => {
    setIsps(prev => prev.map(isp => {
      if (isp.id === id) {
        const targetNextStatus: 'active' | 'backup' | 'down' = isp.status === 'down' ? 'backup' : 'down';
        return {
          ...isp,
          status: targetNextStatus,
          bandwidthUsg: targetNextStatus === 'down' ? 0 : 5,
          throughput: { rx: 0, tx: 0, max: isp.throughput.max },
          latency: targetNextStatus === 'down' ? 0 : 35,
          packetLoss: targetNextStatus === 'down' ? 100 : 0
        };
      }
      return isp;
    }).map((isp, idx, self) => {
      // Recalculate automatic routing weights
      const onlineIsps = self.filter(i => i.status !== 'down');
      if (onlineIsps.length === 0) return isp;

      // Find primary available ISP
      const prime = onlineIsps.find(i => i.id === 'isp-telekom') || onlineIsps[0];
      return {
        ...isp,
        status: isp.status === 'down' ? 'down' : (isp.id === prime.id ? 'active' : 'backup'),
        bandwidthUsg: isp.status === 'down' ? 0 : (isp.id === prime.id ? 84.7 : 15.2)
      };
    }));

    // Trigger local audit alert
    const targetIsp = isps.find(i => i.id === id);
    if (targetIsp) {
      if (targetIsp.status !== 'down') {
        // We killed the line
        const killedAnomaly: AnomalyEvent = {
          id: `anom-${Date.now()}`,
          title: `Line Cut: ${targetIsp.name}`,
          description: `Simulated diagnostic sequence disconnected physical port on gateway ${targetIsp.gateway}.`,
          code: 'LINE_OFFLINE',
          severity: 'high',
          status: 'active',
          timestamp: new Date().toTimeString().split(' ')[0],
          affectedNodeId: id,
          mitigationPlaybook: [
            { id: 'kp-1', action: 'BGP Re-route', description: 'Trigger Cisco WAN line failover switch protocol.', status: 'completed' },
            { id: 'kp-2', action: 'Manual Inspect', description: 'Schedule line inspection with vendor gateway coordinator.', status: 'pending' }
          ]
        };
        setAnomalies(prev => [killedAnomaly, ...prev]);
        triggerAlertNotifications(targetIsp.name, 'LINE_OFFLINE', `Gateway: ${targetIsp.gateway}`);
      }
    }
  };

  // Speed test throughput test
  const triggerSpeedTest = (id: string) => {
    setSpeedtestingIsp(id);
    setTimeout(() => {
      setIsps(prev => prev.map(isp => {
        if (isp.id === id) {
          return {
            ...isp,
            throughput: { rx: isp.throughput.max - 20, tx: isp.throughput.max * 0.2, max: isp.throughput.max },
            latency: Math.max(3, isp.latency - 5),
            packetLoss: 0
          };
        }
        return isp;
      }));
      setSpeedtestingIsp(null);
    }, 1500);
  };

  // Execute AP reboot cycle
  const triggerApReboot = (apId: string) => {
    setWifiAPs(prev => prev.map(ap => {
      if (ap.id === apId) {
        return { ...ap, status: 'inactive', clients: 0, signal: -100 };
      }
      return ap;
    }));
    setTimeout(() => {
      setWifiAPs(prev => prev.map(ap => {
        if (ap.id === apId) {
          return { ...ap, status: 'active', clients: 35, signal: -55 };
        }
        return ap;
      }));
    }, 3000);
  };

  // Execute Active Hardware Reboot cycle
  const triggerDeviceReboot = (id: string) => {
    setRebootingNode(id);
    setHardware(prev => prev.map(d => {
      if (d.id === id) {
        return { ...d, status: 'offline', cpu: 0, ram: 0, temp: 18, uptime: '0 days' };
      }
      return d;
    }));
    setTimeout(() => {
      setHardware(prev => prev.map(d => {
        if (d.id === id) {
          return { ...d, status: 'online', cpu: 25, ram: 45, temp: 35, uptime: '1 min' };
        }
        return d;
      }));
      setRebootingNode(null);
    }, 3000);
  };

  // Unified status updates from WhatsUp Gold active map
  const handleUpdateDeviceStatus = (id: string, newStatus: 'online' | 'warning' | 'offline') => {
    let devName = '';
    let devDetails = '';

    if (id.startsWith('isp-')) {
      setIsps(prev => prev.map(isp => {
        if (isp.id === id) {
          const statusValue = newStatus === 'online' ? 'active' : 'down';
          devName = isp.name;
          devDetails = `ISP GW ${isp.gateway}`;
          return { ...isp, status: statusValue as any, throughput: statusValue === 'down' ? { rx: 0, tx: 0, max: isp.throughput.max } : isp.throughput };
        }
        return isp;
      }));
    } else if (id.startsWith('wifi-')) {
      setWifiAPs(prev => prev.map(ap => {
        if (ap.id === id) {
          const statusValue = newStatus === 'online' ? 'online' : 'offline';
          devName = ap.name;
          devDetails = `Access Point: ${ap.location}`;
          return { ...ap, status: statusValue as any };
        }
        return ap;
      }));
    } else {
      setHardware(prev => prev.map(dev => {
        if (dev.id === id) {
          devName = dev.name;
          devDetails = `IP: ${dev.ip}`;
          return { ...dev, status: newStatus };
        }
        return dev;
      }));
    }

    if (newStatus === 'offline') {
      setTimeout(() => {
        triggerAlertNotifications(devName || id, 'CRITICAL_DOWN', devDetails || 'No IP');
      }, 300);
    }
  };

  // Resolve Anomaly event 
  const handleResolveAnomaly = (anomalyId: string) => {
    setAnomalies(prev => prev.map(a => 
      a.id === anomalyId ? { ...a, status: 'resolved' as const } : a
    ));
    setSelectedAnomaly(null);
  };

  // Acknowledge target alarm
  const handleAcknowledgeAnomaly = (anomalyId: string) => {
    setAnomalies(prev => prev.map(a => 
      a.id === anomalyId ? { ...a, status: 'investigating' as const } : a
    ));
    if (selectedAnomaly && selectedAnomaly.id === anomalyId) {
      setSelectedAnomaly(prev => prev ? { ...prev, status: 'investigating' as const } : null);
    }
  };

  // Mitigation playbook state callbacks
  const handleUpdatePlaybook = (anomalyId: string, updatedSteps: PlaybookStep[]) => {
    setAnomalies(prev => prev.map(a => 
      a.id === anomalyId ? { ...a, mitigationPlaybook: updatedSteps } : a
    ));
    if (selectedAnomaly && selectedAnomaly.id === anomalyId) {
      setSelectedAnomaly(prev => prev ? { ...prev, mitigationPlaybook: updatedSteps } : null);
    }
  };

  // Filter paginated URLs in Metrics Tab
  const filteredUrls = useMemo(() => {
    return urls.filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(urlSearch.toLowerCase()) || 
                            u.url.toLowerCase().includes(urlSearch.toLowerCase());
      
      const isSlowOrOff = u.statusCode >= 400 || u.latency > 150;

      if (!matchesSearch) return false;
      if (urlFilter === 'All') return true;
      if (urlFilter === 'Offline/Slow') return isSlowOrOff;
      return u.category === urlFilter;
    });
  }, [urls, urlSearch, urlFilter]);

  const maxPages = Math.ceil(filteredUrls.length / itemsPerPage);
  const paginatedUrls = useMemo(() => {
    const startIdx = urlPage * itemsPerPage;
    return filteredUrls.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredUrls, urlPage]);

  // Handle page resets on search filter
  useEffect(() => {
    setUrlPage(0);
  }, [urlFilter, urlSearch]);

  // Insert a new custom URL to monitored set
  const handleAddNewMonitoredUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrlForm.name || !newUrlForm.url) return;

    const formattedUrl: MonitoredUrl = {
      id: `url-custom-${Date.now()}`,
      name: newUrlForm.name,
      url: newUrlForm.url.replace(/https?:\/\//, ''),
      category: newUrlForm.category,
      status: 'online',
      statusCode: 200,
      latency: 18,
      sslExpiryDays: 365,
      lastChecked: 'Just created'
    };

    setUrls(prev => [formattedUrl, ...prev]);
    setNewUrlForm({ name: '', url: '', category: 'Internal' });
    setShowAddUrlModal(false);
  };

  // Insert a new custom hardware device
  const handleAddNewHardware = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHardwareForm.name || !newHardwareForm.ip) return;

    const newDev: HardwareDevice = {
      id: `hw-${Date.now()}`,
      name: newHardwareForm.name,
      ip: newHardwareForm.ip,
      type: newHardwareForm.type,
      status: newHardwareForm.maintenanceMode ? 'warning' : newHardwareForm.status,
      cpu: (newHardwareForm.status === 'offline' || newHardwareForm.maintenanceMode) ? 0 : Math.floor(Math.random() * 45 + 5),
      ram: (newHardwareForm.status === 'offline' || newHardwareForm.maintenanceMode) ? 0 : Math.floor(Math.random() * 55 + 15),
      temp: (newHardwareForm.status === 'offline' || newHardwareForm.maintenanceMode) ? 15 : Math.floor(Math.random() * 30 + 20),
      uptime: (newHardwareForm.status === 'offline' || newHardwareForm.maintenanceMode) ? '0 days' : '1 day',
      locationGroup: newHardwareForm.locationGroup || undefined,
      parentDeviceId: newHardwareForm.parentDeviceId !== 'None' ? newHardwareForm.parentDeviceId : undefined,
      maintenanceMode: newHardwareForm.maintenanceMode,
      snmpEnabled: newHardwareForm.snmpEnabled,
      latency: newHardwareForm.status === 'offline' ? 0 : 
               newHardwareForm.status === 'warning' ? Math.floor(Math.random() * 40 + 15) : 
               Number((Math.random() * 4 + 1).toFixed(1))
    };

    setHardware(prev => [newDev, ...prev]);
    setNewHardwareForm({
      name: '',
      ip: '',
      type: 'Router',
      status: 'online',
      locationGroup: '',
      parentDeviceId: 'None',
      maintenanceMode: false,
      snmpEnabled: false
    });
    setShowAddHardwareModal(false);
  };

  // Delete an existing hardware device (WhatsUp Gold Style)
  const handleDeleteDevice = (id: string) => {
    setHardware(prev => prev.filter(dev => dev.id !== id));
  };

  // Dynamic values calculating current stats matching requested options screenshot:
  const activeDeviceCount = hardware.filter(h => h.status === 'online').length;
  const inMaintenanceCount = hardware.filter(h => h.status === 'warning').length;
  const unreachableCount = hardware.filter(h => h.status === 'offline').length;
  const totalDevicesCount = hardware.length;
  const upPercentage = Math.round((activeDeviceCount / totalDevicesCount) * 100);

  const activeAlertsCount = anomalies.filter(a => a.status !== 'resolved').length;
  const averageLatency = Math.round(urls.filter(u => u.status === 'online').reduce((acc, u) => acc + u.latency, 0) / urls.filter(u => u.status === 'online').length) || 11;
  const primaryIspLoss = isps.find(i => i.status === 'active')?.packetLoss || 0;
  const primaryIspThroughputRx = isps.find(i => i.status === 'active')?.throughput.rx || 0;
  const primaryIspThroughputTx = isps.find(i => i.status === 'active')?.throughput.tx || 0;
  
  // Custom timeline points for the Area charts
  const liveChartData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      time: i + 1,
      telekom: Math.round(primaryIspThroughputRx + Math.sin(i) * 35 + Math.random() * 15),
      biznet: Math.round(15 + Math.cos(i) * 5),
      starlink: Math.round(0)
    }));
  }, [primaryIspThroughputRx]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 select-none font-sans overflow-x-hidden relative flex">
      
      {/* 1. Left Vertical Fixed Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-[240px] bg-slate-900 border-r border-slate-800 flex flex-col py-8 px-4 z-50 shadow-2xl">
        
        {/* Office NOC Branding Header */}
        <div className="mb-10 flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            <Network className="text-slate-950 w-5 h-5 font-black" />
          </div>
          <div>
            <h1 className="font-display text-[18px] font-bold text-white tracking-tight leading-none">Office NOC</h1>
            <p className="text-[9px] font-mono text-amber-500 font-bold uppercase tracking-wider mt-1.5">L3 Controller</p>
          </div>
        </div>

        {/* Dynamic Sidebar Navigation Menu matched to Screenshot: Overview, Devices, Metrics, Alerts, Settings */}
        <nav className="flex-1 space-y-1.5">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3.5 px-4.5 py-3 rounded-xl text-xs font-mono font-bold hover:bg-slate-800 hover:text-white transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-500 shadow-[inset_0_0_12px_rgba(59,130,246,0.05)]'
                : 'text-slate-400 border-l-2 border-transparent'
            }`}
          >
            <Monitor className="w-4.5 h-4.5" />
            Overview
          </button>
          
          <button
            onClick={() => setActiveTab('devices')}
            className={`w-full flex items-center gap-3.5 px-4.5 py-3 rounded-xl text-xs font-mono font-bold hover:bg-slate-800 hover:text-white transition-all cursor-pointer ${
              activeTab === 'devices'
                ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-500 shadow-[inset_0_0_12px_rgba(59,130,246,0.05)]'
                : 'text-slate-400 border-l-2 border-transparent'
            }`}
          >
            <Server className="w-4.5 h-4.5" />
            Devices
          </button>

          <button
            onClick={() => setActiveTab('metrics')}
            className={`w-full flex items-center gap-3.5 px-4.5 py-3 rounded-xl text-xs font-mono font-bold hover:bg-slate-800 hover:text-white transition-all cursor-pointer ${
              activeTab === 'metrics'
                ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-500 shadow-[inset_0_0_12px_rgba(59,130,246,0.05)]'
                : 'text-slate-400 border-l-2 border-transparent'
            }`}
          >
            <Activity className="w-4.5 h-4.5" />
            Metrics
          </button>

          <button
            onClick={() => setActiveTab('alerts')}
            className={`w-full flex items-center justify-between px-4.5 py-3 rounded-xl text-xs font-mono font-bold hover:bg-slate-800 hover:text-white transition-all cursor-pointer ${
              activeTab === 'alerts'
                ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-500 shadow-[inset_0_0_12px_rgba(59,130,246,0.05)]'
                : 'text-slate-400 border-l-2 border-transparent'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <Bell className="w-4.5 h-4.5" />
              Alerts
            </div>
            {activeAlertsCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500 font-bold text-white leading-none">
                {activeAlertsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3.5 px-4.5 py-3 rounded-xl text-xs font-mono font-bold hover:bg-slate-800 hover:text-white transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-500 shadow-[inset_0_0_12px_rgba(59,130,246,0.05)]'
                : 'text-slate-400 border-l-2 border-transparent'
            }`}
          >
            <Settings className="w-4.5 h-4.5" />
            Settings
          </button>
        </nav>

        {/* Lower Sidebar Actions */}
        <div className="mt-auto pt-6 border-t border-slate-800 space-y-3 font-mono text-[11px]">
          <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 text-slate-400 leading-normal">
            <p className="font-bold text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Gateway Secure
            </p>
            <p className="text-[9px] mt-1 text-slate-500">AES-256 GCM tunnels</p>
          </div>
          <button 
            onClick={() => { alert("Exporting secure configuration bundle..."); }} 
            className="w-full text-left flex items-center gap-2.5 px-3 py-2 hover:text-white text-slate-400 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5" /> Export Specs
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 pl-[240px] min-h-screen flex flex-col justify-between" id="noc-main-container">
        
        {/* Top Header bar with light border, Search domain, and live local status */}
        <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono uppercase bg-slate-850 px-2.5 py-1 rounded-md border border-slate-800 text-slate-400 font-bold">
              HQ-NOC-CONTROLLER-WEST_NODE_ONLINE
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-[10.5px] font-black text-emerald-400 uppercase tracking-widest">
                4/4 ISPs Active
              </span>
            </div>

            <div className="flex items-center gap-3 border-l border-slate-800 pl-6 shrink-0">
              <span className="text-right text-[11px] text-slate-400 font-mono font-bold leading-none block">Admin_Ops</span>
              <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-ping" />
            </div>
          </div>
        </header>

        {/* Core Main Render Frame */}
        <main className="flex-1 p-8 max-w-[1550px] mx-auto w-full space-y-6">
          
          {/* TAB 1: OVERVIEW Tab matching options in the user query screenshot */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in" id="overview-content">
              
              {/* Header section with clean NOC coordinates */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h2 className="font-display font-semibold text-xl text-white tracking-tight">Active Core Telemetry Summary</h2>
                  <p className="text-slate-400 font-medium text-xs mt-1">Real-time gateway status, satellite drop rates, and packet loss matrix for office ISPs & Wi-Fi routers.</p>
                </div>
                
                {/* Manual diagnostics re-poll trigger bar */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-500 tracking-wider">Ticking:</span>
                  <button 
                    onClick={() => setSimulatingTick(!simulatingTick)}
                    className={`px-3 py-1.5 font-mono text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      simulatingTick 
                        ? 'bg-blue-600/10 border-blue-500/30 text-blue-400' 
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {simulatingTick ? '● Live Simulation' : '⏸ Stream Paused'}
                  </button>
                </div>
              </div>

              {/* SIX EXACT GLOWING KPI CARDS FROM SCREENSHOT IMAGE */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                
                {/* 1. BANDWIDTH Card */}
                <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800/80 hover:border-slate-700 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex flex-col justify-between min-h-[160px] relative overflow-hidden group">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold">BANDWIDTH</span>
                      <span className="text-3xl font-mono font-black text-white tracking-tight">
                        {isps[0].status === 'active' ? '84.7%' : '15.2%'}
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono shadow-xs">
                      healthy
                    </span>
                  </div>

                  {/* Interactive Dual Wave Sparkline */}
                  <div className="mt-2.5 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800/50 relative overflow-visible">
                    {(() => {
                      const svgHeight = 36;
                      const svgWidth = 180;
                      
                      // Download (DL) normalization parameters
                      const minDl = Math.min(...downloadHistory) - 10;
                      const maxDl = Math.max(...downloadHistory) + 10;
                      const dlRange = maxDl - minDl || 1;

                      // Upload (UL) normalization parameters
                      const minUl = Math.min(...uploadHistory) - 5;
                      const maxUl = Math.max(...uploadHistory) + 5;
                      const ulRange = maxUl - minUl || 1;

                      const dlPoints = downloadHistory.map((val, idx) => {
                        const x = (idx / (downloadHistory.length - 1)) * svgWidth;
                        const y = svgHeight - ((val - minDl) / dlRange) * (svgHeight - 8) - 4;
                        return { x, y, val };
                      });

                      const ulPoints = uploadHistory.map((val, idx) => {
                        const x = (idx / (uploadHistory.length - 1)) * svgWidth;
                        const y = svgHeight - ((val - minUl) / ulRange) * (svgHeight - 12) - 4;
                        return { x, y, val };
                      });

                      const dlLinePath = dlPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                      const dlAreaPath = dlPoints.length > 0 
                        ? `${dlLinePath} L ${dlPoints[dlPoints.length - 1].x} ${svgHeight} L ${dlPoints[0].x} ${svgHeight} Z`
                        : '';

                      const ulLinePath = ulPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                      const ulAreaPath = ulPoints.length > 0 
                        ? `${ulLinePath} L ${ulPoints[ulPoints.length - 1].x} ${svgHeight} L ${ulPoints[0].x} ${svgHeight} Z`
                        : '';

                      return (
                        <svg 
                          width="100%" 
                          height={svgHeight} 
                          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                          className="overflow-visible select-none"
                          onMouseLeave={() => setHoveredTrafficIdx(null)}
                        >
                          <defs>
                            <linearGradient id="dl-grad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                            </linearGradient>
                            <linearGradient id="ul-grad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.15" />
                              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>
                          
                          {/* Guides */}
                          <line x1="0" y1={svgHeight/2} x2={svgWidth} y2={svgHeight/2} stroke="rgba(148, 163, 184, 0.05)" strokeDasharray="3,3" strokeWidth="1" />

                          {/* Download Area & Path */}
                          {dlAreaPath && (
                            <path d={dlAreaPath} fill="url(#dl-grad)" className="transition-all duration-300" />
                          )}
                          {dlLinePath && (
                            <path 
                              d={dlLinePath} 
                              fill="none" 
                              stroke="#06b6d4" 
                              strokeWidth="1.6" 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              className="transition-all duration-300" 
                            />
                          )}

                          {/* Upload Area & Path */}
                          {ulAreaPath && (
                            <path d={ulAreaPath} fill="url(#ul-grad)" className="transition-all duration-200" />
                          )}
                          {ulLinePath && (
                            <path 
                              d={ulLinePath} 
                              fill="none" 
                              stroke="#f43f5e" 
                              strokeWidth="1.2" 
                              strokeDasharray="2,2"
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              className="transition-all duration-200" 
                            />
                          )}

                          {/* Vertical indicator + marker points on hover */}
                          {hoveredTrafficIdx !== null && dlPoints[hoveredTrafficIdx] && ulPoints[hoveredTrafficIdx] && (
                            <>
                              <line 
                                x1={dlPoints[hoveredTrafficIdx].x} 
                                y1={0} 
                                x2={dlPoints[hoveredTrafficIdx].x} 
                                y2={svgHeight} 
                                stroke="#38bdf8" 
                                strokeWidth="0.8" 
                                strokeDasharray="2,2" 
                              />
                              <circle 
                                cx={dlPoints[hoveredTrafficIdx].x} 
                                cy={dlPoints[hoveredTrafficIdx].y} 
                                r="3" 
                                className="fill-cyan-400 stroke-slate-900 stroke-1" 
                              />
                              <circle 
                                cx={ulPoints[hoveredTrafficIdx].x} 
                                cy={ulPoints[hoveredTrafficIdx].y} 
                                r="2.5" 
                                className="fill-rose-400 stroke-slate-900 stroke-1" 
                              />
                            </>
                          )}

                          {/* Hover slices */}
                          {dlPoints.map((p, idx) => {
                            const sliceWidth = svgWidth / downloadHistory.length;
                            return (
                              <rect
                                key={idx}
                                x={p.x - sliceWidth / 2}
                                y={0}
                                width={sliceWidth}
                                height={svgHeight}
                                fill="transparent"
                                className="cursor-crosshair pointer-events-auto"
                                onMouseEnter={() => setHoveredTrafficIdx(idx)}
                                onMouseMove={() => setHoveredTrafficIdx(idx)}
                              />
                            );
                          })}
                        </svg>
                      );
                    })()}
                  </div>

                  <div className="mt-2.5">
                    {hoveredTrafficIdx !== null ? (
                      <div className="flex items-center justify-between text-[10px] font-mono leading-none transition-all duration-150">
                        <span className="text-cyan-400 font-bold">
                          DL: {downloadHistory[hoveredTrafficIdx]?.toFixed(1)}M
                        </span>
                        <span className="text-rose-400 font-bold">
                          UL: {uploadHistory[hoveredTrafficIdx]?.toFixed(1)}M
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-[10px] font-mono leading-none transition-all duration-150">
                        <span className="text-slate-400 font-bold">
                          DL: {isps[0].throughput.rx}M / UL: {isps[0].throughput.tx}M
                        </span>
                        <span className="text-emerald-500 animate-pulse font-normal flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping"></span> Live Wave
                        </span>
                      </div>
                    )}
                    
                    {/* Bottom capacity bar matching original progress meter */}
                    <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden mt-2.5">
                      <div className="h-full rounded-full bg-cyan-400/90 glow-cyan transition-all duration-500" style={{ width: isps[0].status === 'active' ? '84.7%' : '15.2%' }} />
                    </div>
                  </div>
                </div>

                {/* 2. LATENCY Card */}
                <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800/80 hover:border-slate-700 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex flex-col justify-between min-h-[160px]">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold">LATENCY</span>
                      <span className="text-3xl font-mono font-black text-white tracking-tight">
                        {hoveredIdx !== null && latencyHistory[hoveredIdx] !== undefined ? `${latencyHistory[hoveredIdx]}ms` : `${averageLatency}ms`}
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono shadow-xs">
                      healthy
                    </span>
                  </div>
                  
                  {/* Interactive SVG Sparkline */}
                  <div className="mt-2.5 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800/50 relative overflow-visible">
                    {(() => {
                      const svgHeight = 36;
                      const svgWidth = 180;
                      const minVal = Math.min(...latencyHistory) - 1;
                      const maxVal = Math.max(...latencyHistory) + 1;
                      const valRange = maxVal - minVal || 1;

                      const points = latencyHistory.map((val, idx) => {
                        const x = (idx / (latencyHistory.length - 1)) * svgWidth;
                        const y = svgHeight - ((val - minVal) / valRange) * (svgHeight - 8) - 4;
                        return { x, y, val, idx };
                      });

                      const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                      const areaPath = points.length > 0 
                        ? `${linePath} L ${points[points.length - 1].x} ${svgHeight} L ${points[0].x} ${svgHeight} Z`
                        : '';

                      return (
                        <svg 
                          width="100%" 
                          height={svgHeight} 
                          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                          className="overflow-visible select-none"
                          onMouseLeave={() => setHoveredIdx(null)}
                        >
                          <defs>
                            <linearGradient id="latency-grad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>
                          
                          {/* Guides */}
                          <line x1="0" y1={svgHeight/2} x2={svgWidth} y2={svgHeight/2} stroke="rgba(148, 163, 184, 0.08)" strokeDasharray="3,3" strokeWidth="1" />

                          {/* Area */}
                          {areaPath && (
                            <path d={areaPath} fill="url(#latency-grad)" className="transition-all duration-300" />
                          )}
                          
                          {/* Stroke Line */}
                          {linePath && (
                            <path 
                              d={linePath} 
                              fill="none" 
                              stroke="#10b981" 
                              strokeWidth="1.8" 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              className="transition-all duration-300" 
                            />
                          )}

                          {/* Hover Track Line and Marker Dot */}
                          {hoveredIdx !== null && points[hoveredIdx] && (
                            <>
                              <line 
                                x1={points[hoveredIdx].x} 
                                y1={0} 
                                x2={points[hoveredIdx].x} 
                                y2={svgHeight} 
                                stroke="#38bdf8" 
                                strokeWidth="0.8" 
                                strokeDasharray="2,2" 
                              />
                              <circle 
                                cx={points[hoveredIdx].x} 
                                cy={points[hoveredIdx].y} 
                                r="3.5" 
                                className="fill-cyan-400 stroke-slate-900 stroke-1.5" 
                              />
                            </>
                          )}

                          {/* Interactive Cover triggers */}
                          {points.map((p, idx) => {
                            const sliceWidth = svgWidth / latencyHistory.length;
                            return (
                              <rect
                                key={idx}
                                x={p.x - sliceWidth / 2}
                                y={0}
                                width={sliceWidth}
                                height={svgHeight}
                                fill="transparent"
                                className="cursor-crosshair pointer-events-auto"
                                onMouseEnter={() => setHoveredIdx(idx)}
                                onMouseMove={() => setHoveredIdx(idx)}
                              />
                            );
                          })}
                        </svg>
                      );
                    })()}
                  </div>

                  <div className="mt-2 text-[10px] font-mono leading-none">
                    {hoveredIdx !== null ? (
                      <div className="flex items-center justify-between text-cyan-400 font-bold transition-all duration-150">
                        <span>POINT READOUT</span>
                        <span>-{ (latencyHistory.length - 1 - hoveredIdx) * 3 }s ago</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-slate-500 transition-all duration-150">
                        <span>Avg response time</span>
                        <span className="text-emerald-500 animate-pulse">● Live Feed</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. UPTIME Card */}
                <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800/80 hover:border-slate-700 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex flex-col justify-between min-h-[160px]">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold">UPTIME</span>
                      <span className="text-3xl font-mono font-black text-white tracking-tight">75.88%</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono shadow-xs">
                      healthy
                    </span>
                  </div>
                  <div className="mt-4">
                    <span className="text-[10.5px] font-mono font-bold text-slate-400">Last 30 days</span>
                    <p className="text-[9.5px] text-slate-500 font-mono mt-1">Carrier fiber infrastructure</p>
                  </div>
                </div>

                {/* 4. PACKET LOSS Card with critical indicator red highlighting and border glow */}
                <div className="bg-slate-900 rounded-2xl p-5 border-2 border-rose-500/80 hover:border-rose-450 transition-all shadow-[0_0_24px_rgba(239,68,68,0.15)] flex flex-col justify-between min-h-[160px] bg-gradient-to-br from-rose-950/15 via-slate-900 to-slate-900">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 border-rose-500/20">
                      <span className="text-[10px] font-mono text-rose-300 uppercase tracking-widest block font-bold">PACKET LOSS</span>
                      <span className="text-3xl font-mono font-black text-rose-500 tracking-tight">{isps[3].status === 'down' ? '100%' : '26.94%'}</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/35 font-mono shadow-xs animate-pulse">
                      critical
                    </span>
                  </div>
                  <div className="mt-4">
                    <span className="text-[10.5px] font-mono font-bold text-rose-400/95 block hover:underline">Below threshold</span>
                    <span className="text-[9.5px] text-rose-300/60 font-mono mt-1 block">Satellite channel active drop</span>
                  </div>
                </div>

                {/* 5. ACTIVE DEVICES Card */}
                <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800/80 hover:border-slate-700 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex flex-col justify-between min-h-[160px]">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold">ACTIVE DEVICES</span>
                      <span className="text-3xl font-mono font-black text-white tracking-tight">{activeDeviceCount + wifiAPs.length}</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono shadow-xs">
                      healthy
                    </span>
                  </div>
                  <div className="mt-4">
                    <span className="text-[10.5px] font-mono font-bold text-slate-400">Connected now</span>
                    <p className="text-[9.5px] text-slate-500 font-mono mt-1">{wifiAPs.reduce((acc, a) => acc + a.clients, 0)} users online</p>
                  </div>
                </div>

                {/* 6. ACTIVE ALERTS Card */}
                <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800/80 hover:border-slate-700 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex flex-col justify-between min-h-[160px]">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold">ACTIVE ALERTS</span>
                      <span className="text-3xl font-mono font-black text-amber-500 tracking-tight">{activeAlertsCount}</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 font-mono shadow-xs">
                      warning
                    </span>
                  </div>
                  <div className="mt-4">
                    <span className="text-[10.5px] font-mono font-bold text-slate-400">Require attention</span>
                    <p className="text-[9.5px] text-slate-500 font-mono mt-1">Inspection scripts assigned</p>
                  </div>
                </div>

              </div>

              {/* Live ISP Speed Test Dials component */}
              <ISPSpeedMeters 
                isps={isps}
                speedtestingIsp={speedtestingIsp}
                triggerSpeedTest={triggerSpeedTest}
                toggleIspStatus={toggleIspStatus}
              />

              {/* LOWER ROW: TWO GRIDS MATCHING SCREENSHOT BUT REMOVING UNDEFINED BUGS */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Recent Active Alerts List (Left Box - 8 Columns) */}
                <div className="lg:col-span-8 bg-slate-900 rounded-2xl border border-slate-800 shadow-[0_4px_30px_rgba(0,0,0,0.3)] p-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                    <h3 className="font-display font-semibold text-sm text-white flex items-center gap-2">
                      <ShieldAlert className="text-rose-500 w-4.5 h-4.5" />
                      Recent Active Alerts
                    </h3>
                    <span className="font-mono text-[9px] uppercase bg-slate-850 px-2.5 py-1 rounded text-rose-400 font-black border border-rose-950">
                      CRITICAL DRIFT ENGINES
                    </span>
                  </div>

                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {anomalies.filter(a => a.status !== 'resolved').slice(0, 4).map((alert) => (
                      <div 
                        key={alert.id}
                        onClick={() => {
                          setSelectedAnomaly(alert);
                          setActiveTab('alerts');
                        }}
                        className={`p-4 rounded-xl border text-left cursor-pointer transition-all hover:bg-slate-850/50 ${
                          alert.severity === 'critical'
                            ? 'bg-rose-950/10 border-rose-900/50 hover:border-rose-700'
                            : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-4 mb-2">
                          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded leading-none ${
                            alert.severity === 'critical' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/35'
                          }`}>
                            {alert.code}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">{alert.timestamp} • Active Now</span>
                        </div>
                        <h4 className="text-xs font-bold font-mono text-slate-200">{alert.title}</h4>
                        <p className="text-[11px] text-slate-400 font-medium mt-1 leading-normal">
                          {alert.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Device Status Summary (Right Box - 4 Columns) */}
                <div className="lg:col-span-4 bg-slate-900 rounded-2xl border border-slate-800 shadow-[0_4px_30px_rgba(0,0,0,0.3)] p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
                      <h3 className="font-display font-semibold text-sm text-white flex items-center gap-2">
                        <Server className="text-blue-500 w-4.5 h-4.5" />
                        Device Status Summary
                      </h3>
                      <span className="font-mono text-[9px] uppercase bg-slate-850 text-slate-450 px-2.5 py-0.5 rounded">
                        live map
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      
                      {/* Total Devices Stat block */}
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                        <span className="text-[9px] font-mono text-slate-500 uppercase font-black block">TOTAL DEVICES</span>
                        <span className="text-3xl font-mono font-black text-white mt-1 block select-all">{totalDevicesCount}</span>
                      </div>

                      {/* Up Percentage Stat Block */}
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                        <span className="text-[9px] font-mono text-slate-500 uppercase font-black block">UP PERCENTAGE</span>
                        <span className="text-3xl font-mono font-black text-emerald-400 mt-1 block select-all">{upPercentage}%</span>
                      </div>

                    </div>

                    {/* Operational labels stack mapping mockup */}
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center text-xs font-mono py-1.5 border-b border-slate-800/50">
                        <span className="text-slate-400 font-bold flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          UP ACTIVE
                        </span>
                        <span className="text-emerald-400 font-bold select-all">{activeDeviceCount} Nodes</span>
                      </div>

                      <div className="flex justify-between items-center text-xs font-mono py-1.5 border-b border-slate-800/50">
                        <span className="text-slate-400 font-bold flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          IN MAINTENANCE
                        </span>
                        <span className="text-amber-400 font-bold select-all">{inMaintenanceCount} Node</span>
                      </div>

                      <div className="flex justify-between items-center text-xs font-mono py-1.5">
                        <span className="text-slate-400 font-bold flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          UNREACHABLE
                        </span>
                        <span className="text-rose-500 font-bold select-all">{unreachableCount} Node</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800">
                    <button 
                      onClick={() => setActiveTab('devices')}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-mono text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer text-center"
                    >
                      Audit Connected HW Hardware
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: DEVICES MANAGER Tab. Covers ISPs (4+), Access Points, and Hardware switches */}
          {activeTab === 'devices' && (
            <div className="space-y-6 animate-fade-in" id="devices-content">

              {/* WhatsUp Gold Interactive Network Topology Dependency Map */}
              <WhatsUpGoldMap 
                hardware={hardware}
                isps={isps}
                wifiAPs={wifiAPs}
                onRebootDevice={triggerDeviceReboot}
                onUpdateDeviceStatus={handleUpdateDeviceStatus}
                onAddDeviceClick={() => setShowAddHardwareModal(true)}
                onDeleteDevice={handleDeleteDevice}
              />

              {/* WIFI OFFICE ACCESS POINTS (Clients, SSID configuration, Signal strength) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* AP list */}
                <div className="lg:col-span-8 bg-slate-900 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between">
                  <div>
                    <div className="pb-3 border-b border-slate-800 mb-4 flex justify-between items-center">
                      <h3 className="font-display font-semibold text-sm text-white flex items-center gap-2">
                        <Wifi className="text-blue-500 w-4.5 h-4.5" />
                        Office Wireless AP Access Systems
                      </h3>
                      <span className="text-[10px] font-mono text-slate-500">SSID: OfficeCorp-VLAN30</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {wifiAPs.map(ap => (
                        <div key={ap.id} className="bg-slate-950 border border-slate-850 p-4 rounded-xl">
                          <div className="flex justify-between items-start mb-1.5">
                            <div>
                              <h4 className="text-xs font-mono font-black text-slate-200">{ap.name}</h4>
                              <p className="text-[10px] text-slate-500">{ap.location}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                              ap.status === 'congested' ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                            }`}>
                              {ap.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 py-2.5 border-t border-slate-800/60 mt-3 text-[11px] font-mono">
                            <div>
                              <span className="text-[9px] text-slate-500 block uppercase">Clients</span>
                              <span className="text-white font-bold mt-0.5 block">{ap.clients} Users</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-500 block uppercase">Signal</span>
                              <span className="text-white font-bold mt-0.5 block">{ap.signal} dBm</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-500 block uppercase">Uptime</span>
                              <span className="text-white font-medium mt-0.5 block">{ap.uptime}</span>
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 mt-3 pt-2.5 border-t border-slate-800/40">
                            <button
                              onClick={() => triggerApReboot(ap.id)}
                              className="text-[9.5px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
                            >
                              Soft Reboot AP
                            </button>
                            <button
                              onClick={() => alert(`Optimized frequency spectra for AP channel ${ap.id === 'wifi-ap-3' ? 'VLAN10' : 'VLAN20'} - interference scrub clean.`)}
                              className="text-[9.5px] font-mono font-bold px-2 py-0.5 rounded bg-blue-950 border border-blue-900 text-blue-400 hover:text-white cursor-pointer"
                            >
                              Scan Spectrum
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-mono">Enterprise WiFi controller system active</span>
                    <button 
                      onClick={() => alert("Scanned current physical environment: WiFi Interference score 4% (Favorable).")}
                      className="px-3.5 py-1 text-[11px] bg-slate-850 border border-slate-800 text-slate-200 rounded hover:bg-slate-800 font-mono cursor-pointer"
                    >
                      Audit Radio Interference
                    </button>
                  </div>
                </div>

                {/* Hardware inventory right box */}
                <div className="lg:col-span-4 bg-slate-900 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
                      <h3 className="font-display font-semibold text-sm text-white flex items-center gap-2">
                        <Server className="text-blue-500 w-4.5 h-4.5 animate-pulse" />
                        Active Hardware status
                      </h3>
                      <button 
                        onClick={() => setShowAddHardwareModal(true)}
                        className="px-2.5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-mono text-[9.5px] font-bold uppercase rounded-lg flex items-center gap-1 cursor-pointer transition-all shrink-0 shadow-sm"
                      >
                        <Plus className="w-3 h-3 text-white" /> Add Device
                      </button>
                    </div>

                    <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                      {hardware.map(dev => (
                        <div key={dev.id} className="p-3 bg-slate-950 rounded-xl border border-slate-850">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] uppercase font-mono font-black text-slate-400">{dev.name}</span>
                            <span className={`w-2 h-2 rounded-full ${dev.status === 'online' ? 'bg-emerald-500' : dev.status === 'warning' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono select-text">{dev.ip} • <span className="text-blue-400 font-semibold">{dev.type}</span> • Temp {dev.temp}°C</p>

                          <div className="space-y-1.5 mt-2.5">
                            <div className="flex justify-between text-[9px] font-mono text-slate-500 font-black uppercase">
                              <span>CPU Dials</span>
                              <span>{dev.cpu}%</span>
                            </div>
                            <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-blue-500" style={{ width: `${dev.cpu}%` }} />
                            </div>
                          </div>

                          <div className="flex gap-2 justify-end mt-3 border-t border-slate-850 pt-2.5">
                            <button
                              onClick={() => handleDeleteDevice(dev.id)}
                              className="text-[9px] font-mono px-2.5 py-0.5 rounded border border-rose-950 bg-rose-950/20 text-rose-500 hover:bg-rose-900/40 cursor-pointer transition-colors"
                            >
                              Delete Node
                            </button>
                            <button
                              onClick={() => triggerDeviceReboot(dev.id)}
                              className="text-[9px] font-mono px-2 py-0.5 rounded border border-slate-800 text-slate-500 hover:text-white cursor-pointer"
                            >
                              Reboot Cycle
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 3: METRICS Tab. Active response charts & exactly 42 Monitored URL list entries */}
          {activeTab === 'metrics' && (
            <div className="space-y-6 animate-fade-in" id="metrics-content">
              
              {/* Line stats visualization charts - Bandwidth load & Latency area graphs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Traffic throughput Area graph */}
                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-md">
                  <h3 className="font-display font-semibold text-sm text-white mb-4">Traffic Throughput live spectrum (Mbps)</h3>
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={liveChartData}>
                        <defs>
                          <linearGradient id="colorTelekom" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                        <Area type="monotone" dataKey="telekom" name="Telekom Primary" stroke="#22d3ee" fillOpacity={1} fill="url(#colorTelekom)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Packet latency area graph */}
                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-md">
                  <h3 className="font-display font-semibold text-sm text-white mb-4">Baseline Signal Latency (ms)</h3>
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={liveChartData}>
                        <defs>
                          <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                        <Area type="monotone" dataKey="biznet" name="System Response" stroke="#ef4444" fillOpacity={1} fill="url(#colorLatency)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              {/* 40+ URL MONITORING FRAME (Paginated with search filtering & Add URL controller) */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-2xl">
                
                {/* Domain Controller Panel Header */}
                <div className="border-b border-slate-800 pb-4 mb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-display font-semibold text-lg text-white flex items-center gap-2">
                      <Globe className="text-blue-500 w-5 h-5 animate-spin" />
                      HQ Domain & URL Service Health Monitor (40+ Active Targets)
                    </h3>
                    <p className="text-slate-400 text-xs mt-1">Currently checking exactly <strong className="text-emerald-400 font-bold">{urls.length} target URLs</strong> across Office CRM systems, internal wiki nodes, and APIs.</p>
                  </div>

                  <button
                    onClick={() => setShowAddUrlModal(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-mono text-xs font-black rounded-lg transition-all shadow-md flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    Register New URL
                  </button>
                </div>

                {/* Filtering query tools */}
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                  
                  {/* Search query box */}
                  <div className="relative flex-1 group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
                    <input 
                      type="text" 
                      placeholder="Search URLs, descriptions, or systems..."
                      value={urlSearch}
                      onChange={(e) => setUrlSearch(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 rounded-xl py-2 pl-10 pr-4 text-xs font-mono text-slate-100 placeholder:text-slate-500 transition-all focus:outline-none"
                    />
                  </div>

                  {/* Horizontal filtering tabs */}
                  <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850 text-xs font-mono">
                    {(['All', 'Internal', 'External', 'API', 'Offline/Slow'] as const).map(tabOpt => (
                      <button
                        key={tabOpt}
                        onClick={() => setUrlFilter(tabOpt)}
                        className={`px-3 py-1.5 font-bold rounded-lg transition-all cursor-pointer ${
                          urlFilter === tabOpt 
                            ? 'bg-slate-800 text-blue-400 border border-slate-750' 
                            : 'text-slate-500 hover:text-slate-350'
                        }`}
                      >
                        {tabOpt}
                      </button>
                    ))}
                  </div>

                </div>

                {/* URL MONITORINGS TABLE */}
                <div className="overflow-x-auto border border-slate-850 rounded-xl select-text">
                  <table className="w-full text-left border-collapse text-xs font-mono">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 border-b border-slate-850 uppercase text-[10px] tracking-wider font-extrabold">
                        <th className="p-4">Target Name</th>
                        <th className="p-4">HTTP Link</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">SSL Cert State</th>
                        <th className="p-4">Latency</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/60">
                      {paginatedUrls.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-850/20 transition-all">
                          <td className="p-4 font-bold text-slate-200">{u.name}</td>
                          <td className="p-4 text-slate-400 truncate max-w-xs">{u.url}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded text-[8.5px] uppercase font-black bg-slate-800 text-slate-300">
                              {u.category}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`text-[10px] ${u.sslExpiryDays < 15 ? 'text-rose-400 font-bold animate-pulse' : 'text-slate-400'}`}>
                              🛡 {u.sslExpiryDays} days left
                            </span>
                          </td>
                          <td className="p-4 font-bold text-slate-200">
                            {u.latency > 0 ? `${u.latency} ms` : '—'}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase inline-block text-center min-w-[65px] ${
                              u.status === 'online' 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' 
                                : u.status === 'slow'
                                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/15'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/20 animate-pulse'
                            }`}>
                              {u.statusCode} {u.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => {
                                alert(`Handshake test diagnostics successfully issued for endpoint ${u.url}! Code ${u.statusCode} returned.`);
                              }}
                              className="px-2 py-1 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded text-[10px] cursor-pointer"
                            >
                              Test Ping
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800 text-xs font-mono">
                  <span className="text-slate-500">
                    Showing pages {urlPage + 1} of {Math.max(1, maxPages)} ({filteredUrls.length} total filtered URLs)
                  </span>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setUrlPage(p => Math.max(0, p - 1))}
                      disabled={urlPage === 0}
                      className="p-2 bg-slate-950 border border-slate-800 hover:border-slate-700 disabled:opacity-30 rounded-xl cursor-pointer text-slate-400 hover:text-white"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setUrlPage(p => Math.min(maxPages - 1, p + 1))}
                      disabled={urlPage >= maxPages - 1}
                      className="p-2 bg-slate-950 border border-slate-800 hover:border-slate-700 disabled:opacity-30 rounded-xl cursor-pointer text-slate-400 hover:text-white"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 4: ALERTS Remediations Tab. Integrates PlaybookConsole panel */}
          {activeTab === 'alerts' && (
            <div className="space-y-6 animate-fade-in" id="alerts-content">
              
              <div className="p-4.5 bg-rose-950/20 border border-rose-900 text-rose-300 rounded-xl text-xs font-mono flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <span><strong>NOC REMEDIATION ENGINE ACTIVE:</strong> Run playbooks, examine command lines, and clear hardware alert thresholds.</span>
                </div>
                <button 
                  onClick={() => {
                    setAnomalies(prev => prev.map(a => ({ ...a, status: 'resolved' as const })));
                    alert("Cleared logs successfully!");
                  }} 
                  className="px-3 py-1 bg-rose-500 text-white hover:bg-rose-600 rounded font-bold cursor-pointer transition-colors"
                >
                  Silence All Alarms
                </button>
              </div>

              <PlaybookConsole 
                anomalies={anomalies}
                selectedAnomaly={selectedAnomaly}
                onSelectAnomaly={setSelectedAnomaly}
                onUpdateAnomalyPlaybook={handleUpdatePlaybook}
                onResolveAnomaly={handleResolveAnomaly}
                onAcknowledgeAnomaly={handleAcknowledgeAnomaly}
                nodes={[]} // pass empty/unnecessary nodes
              />

            </div>
          )}

          {/* TAB 5: CONFIGURAIONS / SETTINGS Tab */}
          {activeTab === 'settings' && (
            <div className="glass-card rounded-2xl bg-slate-900 border border-slate-800 max-w-3xl mx-auto p-6 space-y-8 animate-fade-in" id="settings-content">
              
              {/* SECTION A: ALERT ESCALATION CHANNELS SYSTEM */}
              <div className="border-b border-slate-800 pb-6">
                <div className="flex items-center gap-2 mb-1">
                  <span className="p-1 px-2 rounded-md bg-rose-600/10 text-rose-500 font-mono text-[9px] font-bold border border-rose-900/30">ESCALATION ACTIVE</span>
                  <h3 className="font-display font-semibold text-sm text-white">Critical Outage Automated Alerts Routing</h3>
                </div>
                <p className="font-sans text-xs text-slate-400">
                  Configure direct routing for SMS messages, outbound SMTP server emails, and real-time auto-escalation voice calls when any node goes critical offline.
                </p>

                {/* Integration Credentials Status Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 p-3.5 bg-slate-950/80 rounded-xl border border-slate-850 text-[11px] font-mono leading-relaxed">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${backendConfig?.emailConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`}></span>
                    <span className="text-slate-400">SMTP Server Mail:</span>
                    <strong className={backendConfig?.emailConfigured ? 'text-emerald-400' : 'text-slate-500'}>
                      {backendConfig?.emailConfigured ? `Connected (${backendConfig.smtpHost})` : 'Simulated Pipeline Active'}
                    </strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${backendConfig?.twilioConfigured ? 'bg-purple-500 animate-pulse' : 'bg-slate-700'}`}></span>
                    <span className="text-slate-400">Twilio Voice Dialer:</span>
                    <strong className={backendConfig?.twilioConfigured ? 'text-purple-400' : 'text-slate-500'}>
                      {backendConfig?.twilioConfigured ? `Connected (${backendConfig.twilioFrom})` : 'Simulated Dialer Active'}
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
                  
                  {/* SMS CHANNEL CARD */}
                  <div className="p-4 bg-slate-950/80 border border-slate-850 rounded-xl space-y-3.5">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2 text-xs font-bold font-sans text-blue-400">
                        <MessageSquare className="w-4 h-4 text-blue-500" />
                        SMS Gateway
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={alertSettings.smsEnabled}
                          onChange={(e) => setAlertSettings(prev => ({ ...prev, smsEnabled: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-7 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold block">Mobile Recipient</label>
                      <input 
                        type="text"
                        value={alertSettings.smsNumber}
                        disabled={!alertSettings.smsEnabled}
                        onChange={(e) => setAlertSettings(prev => ({ ...prev, smsNumber: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded text-white text-[11px] font-mono focus:outline-none focus:border-blue-500 disabled:opacity-40 transition-opacity"
                        placeholder="+1 (555) 432-1098"
                      />
                    </div>
                    <div className="text-[9.5px] text-slate-500 font-mono leading-relaxed">
                      Routes via virtual SMPP gateway for prompt global delivery.
                    </div>
                  </div>

                  {/* EMAIL SMTP CARD */}
                  <div className="p-4 bg-slate-950/80 border border-slate-850 rounded-xl space-y-3.5">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2 text-xs font-bold font-sans text-emerald-400">
                        <Mail className="w-4 h-4 text-emerald-500" />
                        SMTP Mail Router
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={alertSettings.emailEnabled}
                          onChange={(e) => setAlertSettings(prev => ({ ...prev, emailEnabled: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-7 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold block">NOC Mailing List</label>
                      <input 
                        type="text"
                        value={alertSettings.emailAddress}
                        disabled={!alertSettings.emailEnabled}
                        onChange={(e) => setAlertSettings(prev => ({ ...prev, emailAddress: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded text-white text-[11px] font-mono focus:outline-none focus:border-emerald-500 disabled:opacity-40 transition-opacity"
                        placeholder="noc-alerts@enterprise.net"
                      />
                    </div>
                    <div className="text-[9.5px] text-slate-500 font-mono leading-relaxed">
                      Emails are dispatched instantly with diagnostic payload attachments.
                    </div>
                  </div>

                  {/* VOICE CALL OVER-DIAL CARD */}
                  <div className="p-4 bg-slate-950/80 border border-slate-850 rounded-xl space-y-3.5">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2 text-xs font-bold font-sans text-purple-400">
                        <Phone className="w-4 h-4 text-purple-500" />
                        Voice Call Dispatch
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={alertSettings.callEnabled}
                          onChange={(e) => setAlertSettings(prev => ({ ...prev, callEnabled: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-7 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold block">On-Call Manager</label>
                      <input 
                        type="text"
                        value={alertSettings.callNumber}
                        disabled={!alertSettings.callEnabled}
                        onChange={(e) => setAlertSettings(prev => ({ ...prev, callNumber: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded text-white text-[11px] font-mono focus:outline-none focus:border-purple-500 disabled:opacity-40 transition-opacity"
                        placeholder="+1 (555) 876-5432"
                      />
                    </div>
                    <div className="text-[9.5px] text-slate-500 font-mono leading-relaxed">
                      Escalates with synthetic text-to-speech alarm readings.
                    </div>
                  </div>

                </div>
              </div>

              {/* SECTION B: PLAYLOAD BROADCAST TEST BENCH */}
              <div className="border-b border-slate-800 pb-6 space-y-4">
                <div>
                  <h4 className="font-display font-semibold text-xs text-slate-200">Broadcast Test Emergency Simulation</h4>
                  <p className="font-sans text-[11px] text-slate-400 mt-0.5">
                    Simulate an immediate system outage to test enabled media pathways (SMS, Email & Call ringing popup).
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="text"
                    value={alertSettings.testMessage}
                    onChange={(e) => setAlertSettings(prev => ({ ...prev, testMessage: e.target.value }))}
                    className="flex-1 bg-slate-950 border border-slate-850 p-2 text-white font-mono text-[11px] rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="Custom outage simulation packet contents..."
                  />
                  <button
                    onClick={() => {
                      triggerAlertNotifications('TEST-CORE-SWITCH', 'MANUAL_TEST_TRIGGER', alertSettings.testMessage);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-mono text-[10.5px] font-bold rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    🔥 Send Test Notification Alert
                  </button>
                </div>
              </div>

              {/* SECTION C: ALERTS DISPATCH ROUTING ARCHIVES */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-sans font-bold text-xs text-white">Dispatched Escalation Logs</h4>
                    <p className="text-[11px] font-sans text-slate-400">Historical delivery queue for critical down warning broadcasts.</p>
                  </div>
                  <button 
                    onClick={() => setDispatchedAlerts([])}
                    className="text-[9.5px] font-mono text-slate-550 hover:text-rose-400 transition-colors"
                  >
                    Clear Archives
                  </button>
                </div>

                <div className="bg-slate-950 rounded-xl border border-slate-850 overflow-hidden font-mono text-[10px]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-850 text-slate-500">
                        <th className="p-2.5">Time</th>
                        <th className="p-2.5">Device Node</th>
                        <th className="p-2.5">Medium</th>
                        <th className="p-2.5">Recipient</th>
                        <th className="p-2.5">Dispatched Message Preview</th>
                        <th className="p-2.5 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {dispatchedAlerts.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-slate-500 italic">
                            No logs currently recorded in NOC channel. Run simulations above!
                          </td>
                        </tr>
                      ) : (
                        dispatchedAlerts.map(log => (
                          <tr key={log.id} className="hover:bg-slate-900/40 text-slate-300">
                            <td className="p-2.5 font-bold text-slate-450">{log.timestamp}</td>
                            <td className="p-2.5 text-blue-400 font-bold">{log.deviceName}</td>
                            <td className="p-2.5">
                              <span className="inline-flex items-center gap-1">
                                {log.medium === 'SMS' && <MessageSquare className="w-3 h-3 text-blue-400" />}
                                {log.medium === 'Email' && <Mail className="w-3 h-3 text-emerald-400" />}
                                {log.medium === 'Voice Call' && <Phone className="w-3 h-3 text-purple-400" />}
                                {log.medium}
                              </span>
                            </td>
                            <td className="p-2.5 select-all text-slate-400 font-semibold">{log.recipient}</td>
                            <td className="p-2.5 text-slate-500 truncate max-w-xs" title={log.message}>{log.message}</td>
                            <td className="p-2.5 text-right font-bold">
                              <span className={`px-1.5 py-0.5 rounded text-[8.5px] ${
                                log.status === 'Delivered' ? 'bg-blue-950/40 text-blue-400 border border-blue-900/30' :
                                log.status === 'Sent' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30' :
                                log.status === 'Completed' ? 'bg-purple-950/40 text-purple-400 border border-purple-900/30' :
                                'bg-amber-950/40 text-amber-500 border border-amber-900/30 animate-pulse'
                              }`}>
                                {log.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION D: ORIGINAL CONFIGS */}
              <div>
                <h3 className="font-display font-semibold text-xs text-white mb-3">Telemetry Base System Ticks</h3>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-805">
                  <div>
                    <h4 className="font-bold text-slate-200">Simulation Speed Coordinate Loop</h4>
                    <p className="text-[11px] text-slate-450 mt-0.5">Tweak rate threshold tick intervals for network changes.</p>
                  </div>
                  <div className="flex gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
                    <button 
                      onClick={() => alert("Simulation speed locked." )}
                      className="px-3 py-1 font-black rounded-lg bg-slate-900 border border-slate-850 text-blue-400"
                    >
                      3 Seconds Loop
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

        </main>

        {/* 4. Bottom System Status Bar */}
        <footer className="h-10 bg-slate-900 border-t border-slate-800 px-8 flex items-center justify-between text-[10px] font-mono text-slate-500 select-text">
          <div className="flex items-center gap-4">
            <span>TERMS: COMPLIANT WITH TIER-1 NOC CONTROLLERS</span>
            <span className="border-l border-slate-800 pl-4">SECURE GATEWAY ENCRYPTION: GCM-MODE ENFORCED</span>
          </div>
          <div>
            <span>UTC TIME: {new Date().toUTCString()}</span>
          </div>
        </footer>

      </div>

      {/* 5. ADD MONITORED URL MODAL DIALOG */}
      {showAddUrlModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-filter backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-display font-semibold text-sm text-white">Register Office Monitored URL</h3>
              <button 
                onClick={() => setShowAddUrlModal(false)}
                className="text-slate-400 hover:text-white font-black cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNewMonitoredUrl} className="space-y-4 font-mono text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-400 font-bold block uppercase text-[10px]">Resource / Segment Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Wiki Technical Portal"
                  value={newUrlForm.name}
                  onChange={(e) => setNewUrlForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-bold block uppercase text-[10px]">Uniform Resource Locator (URL)</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. wiki.office-internal.net"
                  value={newUrlForm.url}
                  onChange={(e) => setNewUrlForm(prev => ({ ...prev, url: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-bold block uppercase text-[10px]">Category classification</label>
                <select 
                  value={newUrlForm.category}
                  onChange={(e) => setNewUrlForm(prev => ({ ...prev, category: e.target.value as any }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500 font-mono"
                >
                  <option value="Internal">Internal (Local Intranets)</option>
                  <option value="External">External (SaaS Platforms)</option>
                  <option value="API">API Gateway Endpoints</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUrlModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-755 text-slate-350 rounded-lg font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold cursor-pointer"
                >
                  Add Monitor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. ADD HARDWARE DEVICE MODAL DIALOG (WhatsUp Gold Style) */}
      {showAddHardwareModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-filter backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-slate-350" id="add-hardware-modal-overlay">
          <div className="bg-[#111827] border border-slate-850 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl" id="add-hardware-modal-content">
            <div className="flex justify-between items-center pb-2">
              <h3 className="font-sans font-medium text-lg text-white" id="modal-title">
                Add Device
              </h3>
              <button 
                onClick={() => setShowAddHardwareModal(false)}
                className="text-slate-400 hover:text-white font-mono font-medium cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNewHardware} className="space-y-4 text-sm font-sans" id="add-device-form">
              {/* Device Name */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium block text-xs">Device Name *</label>
                <input 
                  type="text" 
                  required
                  value={newHardwareForm.name}
                  onChange={(e) => setNewHardwareForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-[#1f2937]/50 border border-slate-800 rounded-lg p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* IP Address or URL */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium block text-xs">IP Address or URL *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g., 192.168.1.1, myhost.local, or https://google.com"
                  value={newHardwareForm.ip}
                  onChange={(e) => setNewHardwareForm(prev => ({ ...prev, ip: e.target.value }))}
                  className="w-full bg-[#1f2937]/50 border border-slate-800 rounded-lg p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Device Type */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium block text-xs">Device Type</label>
                <select 
                  value={newHardwareForm.type}
                  onChange={(e) => setNewHardwareForm(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full bg-[#1f2937]/50 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500 font-sans cursor-pointer"
                >
                  <option value="Router" className="bg-[#1f2937] text-white">Router</option>
                  <option value="Switch" className="bg-[#1f2937] text-white">Switch</option>
                  <option value="Server" className="bg-[#1f2937] text-white">Server</option>
                  <option value="Printer" className="bg-[#1f2937] text-white">Printer</option>
                  <option value="Firewall" className="bg-[#1f2937] text-white">Firewall</option>
                  <option value="UPS" className="bg-[#1f2937] text-white">UPS</option>
                  <option value="NAS" className="bg-[#1f2937] text-white">NAS</option>
                  <option value="Other" className="bg-[#1f2937] text-white">Other</option>
                </select>
              </div>

              {/* Location / Group */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium block text-xs">Location / Group</label>
                <input 
                  type="text" 
                  placeholder="e.g., US-East-1, Office-SF"
                  value={newHardwareForm.locationGroup}
                  onChange={(e) => setNewHardwareForm(prev => ({ ...prev, locationGroup: e.target.value }))}
                  className="w-full bg-[#1f2937]/50 border border-slate-800 rounded-lg p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Parent Device for alerting suppression */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium block text-xs">Parent Device (for dependency alert suppression)</label>
                <select 
                  value={newHardwareForm.parentDeviceId}
                  onChange={(e) => setNewHardwareForm(prev => ({ ...prev, parentDeviceId: e.target.value }))}
                  className="w-full bg-[#1f2937]/50 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500 font-sans cursor-pointer"
                >
                  <option value="None" className="bg-[#1f2937] text-white">None</option>
                  {hardware.map(dev => (
                    <option key={dev.id} value={dev.id} className="bg-[#1f2937] text-white">{dev.name} ({dev.ip})</option>
                  ))}
                </select>
              </div>

              {/* In Maintenance Mode Checkbox */}
              <div className="flex items-center gap-2.5 py-1">
                <input 
                  type="checkbox" 
                  id="maintenance-mode"
                  checked={newHardwareForm.maintenanceMode}
                  onChange={(e) => setNewHardwareForm(prev => ({ ...prev, maintenanceMode: e.target.checked }))}
                  className="w-4.5 h-4.5 rounded border-slate-800 text-blue-600 bg-[#1f2937] focus:ring-blue-500 focus:ring-2 cursor-pointer"
                />
                <label htmlFor="maintenance-mode" className="text-xs text-slate-300 font-medium cursor-pointer">
                  In Maintenance Mode (suppress notifications)
                </label>
              </div>

              {/* SNMP Configuration optional section box */}
              <fieldset className="border border-slate-800 rounded-xl p-3.5 space-y-2">
                <legend className="px-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  SNMP Configuration (Optional)
                </legend>
                
                <div className="flex items-center gap-2.5">
                  <input 
                    type="checkbox" 
                    id="enable-snmp"
                    checked={newHardwareForm.snmpEnabled}
                    onChange={(e) => setNewHardwareForm(prev => ({ ...prev, snmpEnabled: e.target.checked }))}
                    className="w-4.5 h-4.5 rounded border-slate-800 text-blue-600 bg-[#1f2937] focus:ring-blue-500 focus:ring-2 cursor-pointer"
                  />
                  <label htmlFor="enable-snmp" className="text-xs text-slate-300 font-medium cursor-pointer">
                    Enable SNMP
                  </label>
                </div>
              </fieldset>

              {/* Form Actions */}
              <div className="flex gap-2.5 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddHardwareModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md cursor-pointer transition-all"
                >
                  Add Device
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dynamic Toasts Overlay for Broadcast alert channels */}
      <div className="fixed top-20 right-6 z-50 space-y-2 pointer-events-none max-w-sm w-full" id="notification-toasts-overlay">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl p-3.5 shadow-2xl flex items-start gap-3 animate-fade-in text-white animate-bounce-short">
            <div className={`p-1.5 rounded-lg shrink-0 ${
              t.medium === 'sms' ? 'bg-blue-600/20 text-blue-400' :
              t.medium === 'email' ? 'bg-emerald-600/20 text-emerald-400' :
              'bg-purple-600/20 text-purple-400'
            }`}>
              {t.medium === 'sms' ? (
                <MessageSquare className="w-4 h-4 text-blue-400" />
              ) : t.medium === 'email' ? (
                <Mail className="w-4 h-4 text-emerald-400" />
              ) : (
                <Phone className="w-4 h-4 text-purple-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9.5px] font-bold font-mono uppercase tracking-wide text-slate-450">{t.title}</span>
                <span className="text-[8.5px] text-slate-550 font-mono">{t.timestamp}</span>
              </div>
              <p className="text-[10.5px] text-slate-300 font-mono leading-relaxed select-text">{t.message}</p>
            </div>
            <button 
              onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))}
              className="text-slate-550 hover:text-slate-350 font-mono text-xs cursor-pointer p-0.5"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Incoming Call Simulator Overlay */}
      {activeCall && (
        <div className="fixed bottom-6 right-6 z-50 w-80 bg-slate-950/95 backdrop-blur-md border-2 border-purple-500 rounded-2xl shadow-2xl p-4 text-white hover:border-purple-400 transition-colors" id="escalation-voice-call-popup">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-full ${activeCall.status === 'ringing' ? 'bg-amber-600 animate-pulse' : 'bg-emerald-600 animate-pulse'}`}>
              <PhoneCall className="w-5 h-5 text-white animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9.5px] font-mono text-purple-400 font-bold uppercase tracking-wider">
                {activeCall.status === 'ringing' ? 'INCOMING NOC VOICE ESCALATION...' : 'CRITICAL BRIDGELINE ACTIVE'}
              </p>
              <p className="text-xs font-bold font-mono text-white truncate">{activeCall.recipient}</p>
            </div>
          </div>
          
          <div className="mt-3 p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-xs font-mono space-y-2">
            <p className="text-[10px] text-slate-450 leading-relaxed">
              <strong className="text-rose-500">Node Status Critical:</strong> "{activeCall.deviceName}" went down.
            </p>
            {activeCall.status === 'connected' ? (
              <div className="space-y-2 text-emerald-400">
                <p className="leading-relaxed italic text-[11px] bg-slate-950/50 p-2 rounded border border-emerald-950/40 text-emerald-450 select-text font-bold">
                  🔊 "NOC automation call: warning - critical alarm detected for segment leader '{activeCall.deviceName}'. This node is offline with 100% telemetry failure. Activating disaster response protocol. Repeat: '{activeCall.deviceName}' is offline."
                </p>
                <div className="flex items-center gap-1.5 text-[9px] text-emerald-500/80 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  TTS Synthesis engine connected successfully
                </div>
              </div>
            ) : (
              <p className="text-[9.5px] text-slate-500 leading-normal animate-pulse">
                Ringing on-call line... waiting for engineer off-hook handshake...
              </p>
            )}
          </div>

          <div className="mt-3.5 flex gap-2">
            {activeCall.status === 'ringing' ? (
              <>
                <button
                  onClick={() => {
                    setActiveCall(prev => prev ? { ...prev, status: 'connected' } : null);
                  }}
                  className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-[10px] rounded-lg cursor-pointer transition-colors shadow-md shadow-emerald-900/20"
                >
                  📞 Answer Call
                </button>
                <button
                  onClick={() => {
                    setActiveCall(null);
                  }}
                  className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-rose-500 border border-slate-800 text-[10px] font-mono font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Ignore
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setActiveCall(null);
                }}
                className="w-full py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-[10px] rounded-lg cursor-pointer transition-colors shadow-md text-center"
              >
                Disconnect Escalation Call
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
