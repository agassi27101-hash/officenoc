import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import twilio from 'twilio';
import nodemailer from 'nodemailer';

// Load environment variables for local testing
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy Gemini API Client Initialization
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("⚠️ Warning: GEMINI_API_KEY is not set. Dashboard will operate in high-performance simulated diagnostics mode.");
    return null;
  }
  
  if (!aiClient) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
      console.log("🚀 Google GenAI client successfully initialized.");
    } catch (err) {
      console.error("❌ Failed to initialize GoogleGenAI client:", err);
    }
  }
  return aiClient;
}

// Fallback high-fidelity rules-based generator when Gemini is not configured
const mockFallbackAnalysis = (code: string, title: string) => {
  const responses: Record<string, { analysis: string; playbook: any[] }> = {
    "Heuristic_X3": {
      analysis: `### [DIAGNOSTIC TRACE: ${code}]
System identified high throughput burst originating from US-EAST-1 cloud servers. 

**Root Cause:** Heavy cluster utilization triggering microservices burst boundaries. Traffic profiles indicate typical asynchronous block operations or parallelized ETL workflows.
**System Impact:** Bandwidth consumption increased to 84%. Internal node replication times increased by 45ms.
**Threat Level:** Low (Non-malicious batch transaction profile).`,
      playbook: [
        { id: "step-1", action: "Allocate Bandwidth Reserve", description: "Allocate temporary burst throttle on CH_ALPHA_01 (4.0 Gbps limit).", status: "pending" },
        { id: "step-2", action: "Verify Node Certificates", description: "Trigger cryptographic handshake verification across affected cluster boundaries.", status: "pending" },
        { id: "step-3", action: "Re-engage Batch Thresholds", description: "De-prioritize background sync tasks until off-peak hours.", status: "pending" }
      ]
    },
    "Sec_Breach?": {
      analysis: `### [SECURITY BREACH ALERT: ${code}]
Massive un-throttled packet amplification detected across Edge Gateway 04. Traffic matches known DDoS footprint.

**Primary Vector:** High-volume user datagram request flood directed at UDP port 53 / 1194.
**System Impact:** Circular packet buffer overflow on Node-SouthEast-4. Up-time stability at critical border routing weakened.
**Mitigation Strategy:** Active boundary quarantine and IP rate-limiting layer activation.`,
      playbook: [
        { id: "step-1", action: "Quarantine Edge Gateway 04", description: "Spin down vulnerable input listeners on target edge interfaces.", status: "pending" },
        { id: "step-2", action: "Activate DDoS Filter Mesh", description: "Deploy automated cloudlet scrubbing filtering layer (Geo IP filter).", status: "pending" },
        { id: "step-3", action: "Blacklist Host Coordinates", description: "Commit malicious subnet targets (185.22.14.0/24) to secure routing tables.", status: "pending" },
        { id: "step-4", action: "Broadband Load Redistribution", description: "Re-route vital corporate payloads via CH_DELTA_14.", status: "pending" }
      ]
    },
    "Shadow_IT": {
      analysis: `### [COMPLIANCE AUDIT TRACE: ${code}]
Unencrypted plain text communication identified within local internal network.

**Host Target:** Local corporate workstation 192.168.1.102.
**Violation Details:** Transmitting corporate token secrets via cleartext HTTP protocols.
**Mitigation Guide:** Initiate SSL redirection policy and issue workstation certificate upgrade.`,
      playbook: [
        { id: "step-1", action: "Block Port 80 Outliers", description: "Redirect non-encrypted workstation traffic to standard HTTPS proxy.", status: "pending" },
        { id: "step-2", action: "Push Fleet Security Updates", description: "Enforce TLS 1.3 protocol standards on workstation 192.168.1.102.", status: "pending" }
      ]
    },
    "Optimized": {
      analysis: `### [TOPOLOGY ROUTING REPORT: ${code}]
Self-healing mesh routing executed. Latency adjustments successfully completed for Asia-Pacific channels.

**Diagnostic Status:** Active connection routing path updated. Core connections re-routed away from congested Singapore-Edge to HKG-Core boundaries. Overall connection ping dropped by 48ms.`,
      playbook: [
        { id: "step-1", action: "Record Path Performance Metrics", description: "Confirm real-time throughput levels on new HKG pathways.", status: "pending" },
        { id: "step-2", action: "Update DNS Registry Seeds", description: "Propagate optimized endpoint coordinate changes globally.", status: "pending" }
      ]
    }
  };

  return responses[code] || {
    analysis: `### [TELEMETRY INSIGHT: ${code}]
Anomalous metrics flagged on live network console.

**Context:** Node indicators show deviation from baseline standard traffic protocols. Standard procedures suggest reviewing diagnostic logs.`,
    playbook: [
      { id: "step-1", action: "Log Diagnostic Handshake", description: "Initiate technical telemetry handshake tracking across local gateway interfaces.", status: "pending" },
      { id: "step-2", action: "Standard System Review", description: "Acknowledge alert and monitor active memory buffer allocations.", status: "pending" }
    ]
  };
};

/**
 * Endpoint 1: Analyze Network Security Anomaly (Gemini-AI Diagnostics)
 */
app.post('/api/analyze-anomaly', async (req, res) => {
  const { code, title, description, severity } = req.body;
  if (!code || !title) {
    return res.status(400).json({ error: 'Missing anomaly details (code, title)' });
  }

  const client = getGeminiClient();

  if (!client) {
    // Return high-quality local fallback analysis if Gemini isn't initialized
    const fallback = mockFallbackAnalysis(code, title);
    return res.json({
      analysis: fallback.analysis,
      updatedPlaybook: fallback.playbook
    });
  }

  try {
    const prompt = `You are the lead intelligence AI system for "Antigravity", an advanced, high-performance secure global network framework.
Analyze the following network telemetry anomaly:
- ALERT CODE: ${code}
- EVENT TITLE: ${title}
- SYSTEM REPORT: ${description}
- SEVERITY LEVEL: ${severity}

Generate a professional, cohesive technical response in two parts:
1. "analysis": A markdown diagnostic report explaining:
   - Technical breakdown of the anomaly
   - Root Causes
   - Estimated network impact (latency/packet loss)
   Ensure the response uses concise, sleek, authoritative language suitable for elite network operators/CTOs. Do not include introductory conversational filler.
2. "playbookSteps": A JSON array of 3 to 4 sequential, specific actions for an engineer to take in our dashboard panel to mitigate this exact anomaly.
Each step in "playbookSteps" MUST have:
   - "action": short name (e.g., "Deploy DDoS Filter Space")
   - "description": precise operating instruction (e.g., "Block external subnet traffic on port 53")

Format output as a raw JSON object (with keys "analysis" and "playbookSteps") using response Mime Type or standard schema representation.`;

    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['analysis', 'playbookSteps'],
          properties: {
            analysis: {
              type: Type.STRING,
              description: 'Markdown technical details of the analysis and system recommendations.'
            },
            playbookSteps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['action', 'description'],
                properties: {
                  action: { type: Type.STRING },
                  description: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const data = JSON.parse(response.text || '{}');
    
    // Add ids and statuses to playbook steps for client-side execution
    const updatedPlaybook = (data.playbookSteps || []).map((step: any, index: number) => ({
      id: `ai-step-${index + 1}`,
      action: step.action,
      description: step.description,
      status: 'pending'
    }));

    return res.json({
      analysis: data.analysis,
      updatedPlaybook: updatedPlaybook
    });

  } catch (error: any) {
    console.error("Error analyzing anomaly with Gemini:", error);
    // Fallback on error
    const fallback = mockFallbackAnalysis(code, title);
    return res.json({
      analysis: `## [REDUCED DIAGNOSTICS MODE]\nAI Diagnostics failed with error: ${error.message || 'unknown'}.\n\n### Local Assessment:\n${fallback.analysis}`,
      updatedPlaybook: fallback.playbook
    });
  }
});

/**
 * Endpoint 2: Generate Custom Scenario Anomaly (Gemini-AI Scenario Synthesis Lab)
 */
app.post('/api/generate-scenario', async (req, res) => {
  const { userPrompt, affectedNode } = req.body;
  const targetNodeName = affectedNode || 'Node-Global-Edge';

  const client = getGeminiClient();

  if (!client) {
    // Generate high quality simulated custom payload offline
    const randomId = Math.floor(Math.random() * 900) + 100;
    const nowStr = new Date().toTimeString().split(' ')[0];
    const userSeed = userPrompt ? userPrompt.toLowerCase() : 'hardware leak';

    let title = "Performance Degraded";
    let code = "SYS_LATENCY";
    let desc = `Telemetry metrics reveal anomalous behaviors. Source details: ${userPrompt || 'Custom hardware diagnostics needed'}.`;
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'high';
    let steps = [
      { action: "Flush Host Buffer", description: "Recycle operational pipeline states to free overhead limits on target node." },
      { action: "Squeeze Virtual Queues", description: "Compress parallel routing pipelines down to baseline limits." }
    ];

    if (userSeed.includes('firewall') || userSeed.includes('hack') || userSeed.includes('attack') || userSeed.includes('ddos')) {
      title = "Unauthorized Routing Vector";
      code = "SEC_VECT_09";
      severity = "critical";
      desc = "Intrusion system triggered by unauthorized terminal inputs attempting admin override protocol.";
      steps = [
        { action: "Revoke Host Session Tokens", description: "De-authorize and reset active TLS cryptographic certificate authorities." },
        { action: "Enable Deep inspection Shield", description: "Quarantine local interface endpoints and spool connections to diagnostic sandbox." }
      ];
    } else if (userSeed.includes('database') || userSeed.includes('sql') || userSeed.includes('leak')) {
      title = "Database Tunnel Overflow";
      code = "DB_FLUSH_ERR";
      severity = "medium";
      desc = "Telemetry alerts identify high data load on local SQL servers exceeding optimal pipeline width.";
      steps = [
        { action: "Throttle Concurrent SQL Workers", description: "Apply pool capping policies to dynamic thread allocation states." },
        { action: "Redirect DB Payloads", description: "Re-route real-time reads via replica cache networks." }
      ];
    }

    return res.json({
      anomaly: {
        id: `custom-scen-${nowStr}`,
        title,
        code,
        description: desc,
        timestamp: nowStr,
        severity,
        status: 'active',
        affectedNodeId: affectedNode || 'node-us-east',
        mitigationPlaybook: steps.map((s, idx) => ({ ...s, id: `step-${idx+1}`, status: 'pending' }))
      }
    });
  }

  try {
    const prompt = `Synthesize a highly realistic technical network threat or operational anomaly for the Antigravity Network Dashboard.
The simulation is requested by a Tier-1 DevOps engineer with the following focus: "${userPrompt || 'Standard hardware breakdown or core database failure'}"
Affected Target Area/Node: "${targetNodeName}"

Return a fully populated JSON object representing this anomaly.
The JSON object MUST strictly adhere to this schema:
{
  "code": "STRING (sci-fi short security code, e.g., 'SEC_PORT_RULE', 'FLUX_DESYNC', 'DB_CONN_LOCK')",
  "title": "STRING (short 2-4 word dramatic yet realistic network alarm, e.g. Port Amplification Leak, Microservice Desync)",
  "description": "STRING (concise 1-2 sentence extremely technical description of the event, referencing telemetry spikes, node states, and ports)",
  "severity": "STRING (one of: 'low', 'medium', 'high', 'critical')",
  "playbookSteps": [
    {
      "action": "STRING (a crisp executive trigger verb-phrase, e.g. 'Flush Buffer Pool', 'Deploy Quarantine Shield')",
      "description": "STRING (detailed technical instructions on how standard technicians carry out this mitigation step)"
    }
  ]
}

Make the event deeply technical, using realistic parameters. Ensure output is returned strictly as raw JSON matching the requested structure.`;

    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['code', 'title', 'description', 'severity', 'playbookSteps'],
          properties: {
            code: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            severity: { type: Type.STRING, enum: ['low', 'medium', 'high', 'critical'] },
            playbookSteps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['action', 'description'],
                properties: {
                  action: { type: Type.STRING },
                  description: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    const nowStr = new Date().toTimeString().split(' ')[0];

    return res.json({
      anomaly: {
        id: `synth-${Date.now()}`,
        title: parsed.title,
        code: parsed.code,
        description: parsed.description,
        timestamp: nowStr,
        severity: parsed.severity,
        status: 'active',
        affectedNodeId: affectedNode || 'node-us-east',
        mitigationPlaybook: (parsed.playbookSteps || []).map((step: any, index: number) => ({
          id: `step-${index + 1}`,
          action: step.action,
          description: step.description,
          status: 'pending'
        }))
      }
    });

  } catch (err: any) {
    console.error("Error synthesizing scenario with Gemini:", err);
    return res.json({
      error: `Fallback simulation triggered. Error details: ${err.message || "unknown"}`
    });
  }
});

/**
 * Endpoint 3: Send Critical Outage Email Alerts (Real SMTP or Elegant Simulation)
 */
app.post('/api/send-email-alert', async (req, res) => {
  const { recipient, deviceName, eventCode, message } = req.body;

  if (!recipient) {
    return res.status(400).json({ error: 'Missing alert recipient email address.' });
  }

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = process.env.SMTP_PORT || '587';
  const fromEmail = process.env.SMTP_FROM_EMAIL || user || 'noc-alerts@antigravity.net';

  const isConfigured = !!(host && user && pass);

  console.log(`✉️ Incoming Email Dispatch Request. Target: ${recipient}, Device: ${deviceName}, Configured: ${isConfigured}`);

  if (isConfigured) {
    try {
      const transporter = nodemailer.createTransport({
        host: host,
        port: parseInt(port),
        secure: port === '465',
        auth: {
          user: user,
          pass: pass
        }
      } as any);

      const finalSubject = `🚨 [NOC CRITICAL ALARM] ${deviceName || 'General Segment'} is DOWN - ${eventCode || 'OUTAGE'}`;
      const mailBodyText = `🚨 CRITICAL DOWN OUTAGE ALERT\n\nDevice: ${deviceName || 'Unknown'}\nEvent Code: ${eventCode || 'OUTAGE'}\nDetails: ${message || 'No additional details.'}\n\nAntigravity Network Alert System.`;
      const mailBodyHtml = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #f43f5e; border-radius: 12px; background-color: #0f172a; color: #f8fafc;">
          <div style="text-align: center; margin-bottom: 20px;">
            <span style="font-size: 11px; font-weight: bold; font-family: monospace; letter-spacing: 0.15em; padding: 4px 10px; background: rgba(244, 63, 94, 0.2); border: 1px solid #f43f5e; border-radius: 6px; color: #f43f5e; text-transform: uppercase;">CRITICAL ALARM DISPATCHED</span>
          </div>
          <h2 style="color: #f43f5e; margin-top: 5px; font-size: 18px; text-align: center;">🚨 CRITICAL DEVICE OUTAGE DETECTED</h2>
          
          <div style="margin: 24px 0; background: #020617; border-radius: 8px; padding: 16px; border: 1px solid #1e293b;">
            <p style="margin: 4px 0; font-size: 13px;"><strong style="color: #94a3b8;">Device Source:</strong> <code style="color: #38bdf8; font-weight: bold; font-size: 13px;">${deviceName || 'Primary Node Gateway'}</code></p>
            <p style="margin: 8px 0 4px 0; font-size: 13px;"><strong style="color: #94a3b8;">Alarm Code:</strong> <code style="color: #fb923c; font-weight: bold;">${eventCode || 'CRITICAL_DOWN'}</code></p>
          </div>

          <p style="font-size: 13px; color: #cbd5e1; margin-bottom: 10px; font-weight: bold;">Diagnostic Payload Details:</p>
          <blockquote style="border-left: 4px solid #f43f5e; background: #1e293b; padding: 12px 16px; border-radius: 4px; margin: 10xp 0 20px 0; font-size: 12.5px; line-height: 1.6; color: #e2e8f0; font-family: monospace;">
            ${message || 'Node heartbeat ping failures exceeded critical baseline thresholds.'}
          </blockquote>

          <div style="border-top: 1px solid #1e293b; padding-top: 15px; text-align: center; font-size: 11px; color: #64748b;">
            This security transmission is automatically generated by <strong style="color: #cbd5e1;">Antigravity NOC Controls</strong>.<br />
            Please update status logs inside active command playbook consoles after resolving physical handshakes.
          </div>
        </div>
      `;

      const info = await transporter.sendMail({
        from: fromEmail,
        to: recipient,
        subject: finalSubject,
        text: mailBodyText,
        html: mailBodyHtml
      });

      console.log(`✅ Email sent successfully via SMTP: ${info.messageId}`);
      return res.json({
        status: 'sent',
        message: 'Alert email dispatched successfully via custom SMTP.',
        messageId: info.messageId
      });

    } catch (err: any) {
      console.error(`❌ Failed to deliver email via SMTP:`, err);
      return res.status(500).json({
        status: 'error',
        error: err.message || 'SMTP negotiation failed',
        message: 'SMTP credentials provided threw a connection timeout or authorization error. Please check your SMTP settings in key credentials.'
      });
    }
  } else {
    // Elegant Simulation fallback state
    console.warn(`⚠️ Outgoing alert email recorded in local telemetry pipeline (SMTP is un-configured).`);
    return res.json({
      status: 'simulated',
      message: 'SMTP settings not provided. Outage alert successfully logged with simulated delivery.',
      details: {
        recipient,
        deviceName,
        eventCode,
        subject: `🚨 [SIMULATED ALARM] ${deviceName || 'General Segment'} is DOWN`,
        dispatchedMessage: message
      }
    });
  }
});

/**
 * Endpoint 4: Trigger On-Call Automated Voice Call Escalation (Twilio API or Elegant Simulation)
 */
app.post('/api/trigger-voice-call', async (req, res) => {
  const { recipient, deviceName, eventCode, details } = req.body;

  if (!recipient) {
    return res.status(400).json({ error: 'Missing on-call recipient phone number.' });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  const isConfigured = !!(accountSid && authToken && fromNumber);

  console.log(`📞 Incoming Voice Escalation Request. Target: ${recipient}, Device: ${deviceName}, Configured: ${isConfigured}`);

  const fallbackTtsMessage = `Warning. Your Antigravity security control panel detected that node ${deviceName || 'System Edge Gateway'} is currently down. Event profile: ${eventCode || 'CRITICAL DOWN'}. Details: ${details || 'No telemetry received'}. Please verify physical link status.`;

  if (isConfigured) {
    try {
      const client = twilio(accountSid, authToken);

      // We dynamically serve the Twiml XML content via endpoint 5 (/api/twiml-alert)
      // Resolve caller domain dynamically so Twilio call gets dynamic instructions 
      let hostDomain = process.env.APP_URL || `https://${req.get('host')}`;
      if (!hostDomain.startsWith('http://') && !hostDomain.startsWith('https://')) {
        hostDomain = `https://${hostDomain}`;
      }

      const twimlUrl = `${hostDomain}/api/twiml-alert?message=${encodeURIComponent(fallbackTtsMessage)}`;
      console.log(`🔗 Constructing Twilio TwiML Instruction Fetch Link: ${twimlUrl}`);

      const call = await client.calls.create({
        url: twimlUrl,
        to: recipient,
        from: fromNumber
      });

      console.log(`✅ Automated Twilio Phone Call successfully dialed. SID: ${call.sid}`);
      return res.json({
        status: 'dialing',
        message: 'On-call automated escalation call has been successfully placed via Twilio!',
        callSid: call.sid
      });

    } catch (err: any) {
      console.error(`❌ Failed to place Twilio Call:`, err);
      return res.status(500).json({
        status: 'error',
        error: err.message || 'Twilio dialing protocol failure',
        message: 'Could not connect to Twilio. Verify your SID, Token, and verified outbound caller IDs.'
      });
    }
  } else {
    // Elegant Simulation fallback state
    console.warn(`⚠️ Automated Voice escalation dialed in high-fidelity simulated pipeline (Twilio is un-configured).`);
    return res.json({
      status: 'simulated',
      message: 'Active voice escalation dispatched securely inside simulated environment.',
      details: {
        recipient,
        deviceName,
        eventCode,
        ttsMessage: fallbackTtsMessage
      }
    });
  }
});

/**
 * Endpoint 5: Serve XML TwiML Instructions dynamically back to Twilio systems
 */
app.get('/api/twiml-alert', (req, res) => {
  const message = (req.query.message as string) || 'Warning. Automated system diagnostics fail check. Please sign in to resolve.';
  
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-US">${message}</Say>
  <Pause length="1"/>
  <Say voice="alice" language="en-US">Goodbye.</Say>
</Response>`;

  res.header('Content-Type', 'text/xml');
  return res.send(twiml);
});

app.post('/api/twiml-alert', (req, res) => {
  const message = (req.query.message as string) || (req.body.message as string) || 'Warning. Automated system diagnostics fail check. Please sign in to resolve.';
  
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-US">${message}</Say>
  <Pause length="1"/>
  <Say voice="alice" language="en-US">Goodbye.</Say>
</Response>`;

  res.header('Content-Type', 'text/xml');
  return res.send(twiml);
});

/**
 * Endpoint 6: Fetch server secret configuration status securely
 */
app.get('/api/config-status', (req, res) => {
  return res.json({
    emailConfigured: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
    twilioConfigured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER),
    smtpHost: process.env.SMTP_HOST || '',
    smtpUser: process.env.SMTP_USER || '',
    twilioFrom: process.env.TWILIO_FROM_NUMBER || ''
  });
});

// Configure Vite integration for develop, or static folders for build/production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log("🛠️ Vite dev middleware attached to Express.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("📦 Standard static application routing declared for production.");
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
