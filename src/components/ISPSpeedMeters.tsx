import React, { useState, useEffect } from 'react';
import { ISPConnection } from '../types';
import { 
  Zap, ArrowUp, ArrowDown, Activity, Play, 
  RefreshCw, CheckCircle2, AlertTriangle, ShieldAlert 
} from 'lucide-react';

interface ISPSpeedMetersProps {
  isps: ISPConnection[];
  speedtestingIsp: string | null;
  triggerSpeedTest: (id: string) => void;
  toggleIspStatus: (id: string) => void;
}

export default function ISPSpeedMeters({
  isps,
  speedtestingIsp,
  triggerSpeedTest,
  toggleIspStatus
}: ISPSpeedMetersProps) {
  // Local state for live counting animation values during speed tests
  const [testSpeeds, setTestSpeeds] = useState<Record<string, { rx: number; tx: number }>>({});
  const [activeTestRunId, setActiveTestRunId] = useState<string | null>(null);

  // Monitor when speedtestingIsp changes to simulate realistic dial-needle surges!
  useEffect(() => {
    if (speedtestingIsp) {
      setActiveTestRunId(speedtestingIsp);
      const targetIsp = isps.find(i => i.id === speedtestingIsp);
      if (!targetIsp) return;

      const maxRx = targetIsp.throughput.max;
      const intervalTime = 80; // refresh fast
      let elapsed = 0;
      const duration = 1500; // matching timeout

      const timer = setInterval(() => {
        elapsed += intervalTime;
        const progress = Math.min(1, elapsed / duration);
        
        // Dynamic sine fluctuation to mimic real speed test needle bouncing!
        const randomBounce = Math.sin(progress * Math.PI * 4.5) * 60;
        const baseSpeed = progress * maxRx;
        const animatedRx = Math.max(0, Math.round(baseSpeed + randomBounce));
        const finalRx = Math.min(maxRx - 15, animatedRx);
        const finalTx = Math.max(0, Math.round(finalRx * 0.18 + (Math.random() * 10 - 5)));

        setTestSpeeds(prev => ({
          ...prev,
          [speedtestingIsp]: { rx: finalRx, tx: finalTx }
        }));

        if (progress >= 1) {
          clearInterval(timer);
          // Set to actual completed stats
          setTestSpeeds(prev => ({
            ...prev,
            [speedtestingIsp]: { rx: maxRx - 20, tx: Math.round((maxRx - 20) * 0.2) }
          }));
          setTimeout(() => setActiveTestRunId(null), 1000);
        }
      }, intervalTime);

      return () => clearInterval(timer);
    }
  }, [speedtestingIsp, isps]);

  // General speed test all helper
  const runTestAll = () => {
    isps.forEach((isp, idx) => {
      if (isp.status !== 'down') {
        setTimeout(() => {
          triggerSpeedTest(isp.id);
        }, idx * 1800); // Sequence them beautifully
      }
    });
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-[0_4px_30px_rgba(0,0,0,0.35)]" id="isp-speed-meters-module">
      {/* Module Title Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-slate-800 mb-6">
        <div>
          <h3 className="font-display font-semibold text-sm text-white flex items-center gap-2">
            <Zap className="text-amber-500 fill-amber-500/20 w-4.5 h-4.5 animate-pulse" />
            Live Speed Test & Throughput Monitors
          </h3>
          <p className="text-slate-400 text-xs mt-1">
            Real-time radial speedometers for separate office WAN gateways.
          </p>
        </div>
        <button 
          onClick={runTestAll}
          className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-mono text-[10.5px] font-black uppercase rounded-lg shadow-md hover:shadow-indigo-500/10 cursor-pointer transition-all flex items-center gap-1.5 shrink-0"
        >
          <RefreshCw className="w-3 h-3 animate-spin" />
          Test All Gateways
        </button>
      </div>

      {/* Grid of ISPs meters */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {isps.map(isp => {
          const isCurrentlyGlobalTesting = speedtestingIsp === isp.id;
          const isCountingAnimation = activeTestRunId === isp.id;
          
          // Speed numbers to display
          let displayRx = isp.throughput.rx;
          let displayTx = isp.throughput.tx;
          if (isCountingAnimation && testSpeeds[isp.id]) {
            displayRx = testSpeeds[isp.id].rx;
            displayTx = testSpeeds[isp.id].tx;
          }

          // Calculate percent of maximum configured capacity for speed gauge
          const maxCapacity = isp.throughput.max;
          const usagePercent = Math.min(100, Math.round((displayRx / maxCapacity) * 100)) || 0;

          // Theme values based on ISP characteristics
          let colorTheme = 'text-blue-500';
          let borderGlow = 'rgba(59, 130, 246, 0.15)';
          let strokeColor = '#3b82f6';

          if (isp.status === 'down') {
            colorTheme = 'text-rose-500';
            borderGlow = 'rgba(239, 68, 68, 0.05)';
            strokeColor = '#f43f5e';
          } else if (isp.id === 'isp-telekom') {
            // Telekom = Emerald / Teal
            colorTheme = 'text-emerald-400';
            borderGlow = 'rgba(16, 185, 129, 0.18)';
            strokeColor = '#10b981';
          } else if (isp.id === 'isp-starlink') {
            // Starlink = Violet / Purple
            colorTheme = 'text-purple-400';
            borderGlow = 'rgba(139, 92, 246, 0.15)';
            strokeColor = '#8b5cf6';
          } else if (isp.id === 'isp-indosat') {
            colorTheme = 'text-amber-400';
            borderGlow = 'rgba(245, 158, 11, 0.15)';
            strokeColor = '#f59e0b';
          }

          // SVG radial path math
          const radius = 42;
          const circumference = 2 * Math.PI * radius;
          // We make it an open 270-degree arc for realistic physical gauges
          // Total arc is 270 degrees. Length of arc is 270/360 of full circumference
          const arcLength = (270 / 360) * circumference;
          const arcOffset = circumference - arcLength; // The gap is at the bottom
          // How much of the arc is filled
          const fillLength = (usagePercent / 100) * arcLength;
          const strokeDashoffset = circumference - fillLength;

          // Active/Status badges
          const isLosingPackets = isp.packetLoss > 5;

          return (
            <div 
              key={isp.id}
              className={`bg-slate-950 rounded-xl p-5 border transition-all relative overflow-hidden flex flex-col justify-between ${
                isp.status === 'down'
                  ? 'border-rose-900/30 shadow-[inset_0_0_12px_rgba(239,68,68,0.02)]'
                  : isp.status === 'active'
                    ? 'border-slate-800 hover:border-slate-700 shadow-[0_4px_25px_rgba(16,185,129,0.02)]'
                    : 'border-slate-850 hover:border-slate-800'
              }`}
            >
              
              {/* Card Header information */}
              <div className="flex justify-between items-start gap-2 mb-4">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      isp.status === 'down' 
                        ? 'bg-rose-500 animate-pulse' 
                        : isp.status === 'active'
                          ? 'bg-emerald-400 animate-pulse'
                          : 'bg-blue-400'
                    }`} />
                    <h4 className="text-white font-mono text-[11px] font-bold tracking-tight uppercase leading-tight select-text">{isp.name}</h4>
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 font-semibold tracking-wide block mt-1">
                    {isp.type} ({maxCapacity}M max)
                  </span>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`px-2 py-0.5 rounded-md text-[8.5px] font-mono font-black uppercase tracking-wider ${
                    isp.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : isp.status === 'down'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/20'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/15'
                  }`}>
                    {isp.status}
                  </span>
                </div>
              </div>

              {/* Radial Speedometer Dial visualization */}
              <div className="my-5 flex flex-col items-center justify-center relative">
                <div className="w-36 h-36 relative flex items-center justify-center">
                  
                  {/* Gauge background tick marks or ring arc */}
                  <svg className="w-full h-full transform -rotate-225" viewBox="0 0 100 100">
                    {/* Background gauge path (dimly lit) */}
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="transparent"
                      stroke="#1e293b"
                      strokeWidth="6"
                      strokeDasharray={`${arcLength} ${circumference}`}
                      strokeLinecap="round"
                    />
                    
                    {/* Active highlight fill path */}
                    {isp.status !== 'down' && (
                      <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="transparent"
                        stroke={strokeColor}
                        strokeWidth="6.5"
                        strokeDasharray={circumference}
                        // To make the transition beautiful during active test speed jumps
                        style={{
                          strokeDashoffset: strokeDashoffset,
                          transition: isCountingAnimation ? 'stroke-dashoffset 80ms linear' : 'stroke-dashoffset 800ms cubic-bezier(0.1, 0.8, 0.3, 1)'
                        }}
                        strokeLinecap="round"
                      />
                    )}
                  </svg>

                  {/* Absolute Centered value content inside dial */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center mt-3">
                    <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-widest leading-none">
                      DOWNLOAD
                    </span>
                    <span className="text-2xl font-mono font-black text-white tracking-tight mt-1 mb-0.5 select-all">
                      {isp.status === 'down' ? '—' : displayRx.toFixed(1)}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 font-bold tracking-wider leading-none">
                      {isp.status === 'down' ? '' : 'Mbps'}
                    </span>

                    {/* Testing flashing text */}
                    {isCountingAnimation && (
                      <span className="text-[8px] font-mono text-amber-400 font-bold tracking-widest animate-pulse mt-1">
                        MEASURING...
                      </span>
                    )}
                  </div>

                  {/* Tiny glowing tick status needle */}
                  {isp.status !== 'down' && (
                    <div 
                      className="absolute w-1 h-14 bottom-1/2 left-1/2 origin-bottom transform -translate-x-1/2 pointer-events-none transition-transform duration-300"
                      style={{
                        transform: `rotate(${Math.min(270, (usagePercent / 100) * 270) - 135}deg)`,
                        transition: isCountingAnimation ? 'transform 80ms linear' : 'transform 800ms cubic-bezier(0.1, 0.8, 0.3, 1)'
                      }}
                    >
                      <div className="w-[2px] h-10 bg-gradient-to-b from-white to-orange-500 rounded-full shadow-[0_0_8px_white]" />
                    </div>
                  )}

                </div>

                {/* Subtext info for connection capacity use percentage */}
                <div className="text-center -mt-2">
                  <span className="text-[10px] font-mono text-slate-500 font-semibold">
                    {isp.status === 'down' ? 'Line Dropped' : `Bandwidth Load: ${usagePercent}%`}
                  </span>
                </div>
              </div>

              {/* Extra metric panels for Upload, Latency, and Packet Loss */}
              <div className="mt-2.5 pt-3 border-t border-slate-900 grid grid-cols-3 gap-1.5 text-center font-mono text-[10.5px]">
                
                {/* Upload speed */}
                <div className="bg-slate-900/40 p-1.5 rounded-lg border border-slate-900">
                  <span className="text-[8px] text-slate-500 block uppercase font-black tracking-wide">UPLOAD</span>
                  <div className="flex items-center justify-center gap-0.5 mt-1 text-slate-300 font-bold">
                    <ArrowUp className="w-2.5 h-2.5 text-blue-500 shrink-0" />
                    <span className="select-all">
                      {isp.status === 'down' ? '—' : `${displayTx.toFixed(0)}M`}
                    </span>
                  </div>
                </div>

                {/* Latency meter */}
                <div className="bg-slate-900/40 p-1.5 rounded-lg border border-slate-900">
                  <span className="text-[8px] text-slate-500 block uppercase font-black tracking-wide">LATENCY</span>
                  <div className="flex items-center justify-center gap-0.5 mt-1 text-slate-300 font-bold">
                    <Activity className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                    <span className="select-all">
                      {isp.status === 'down' ? '—' : `${isp.latency}ms`}
                    </span>
                  </div>
                </div>

                {/* Packet loss */}
                <div className={`p-1.5 rounded-lg border text-center ${
                  isLosingPackets ? 'bg-rose-950/10 border-rose-900/20' : 'bg-slate-900/40 border-slate-900'
                }`}>
                  <span className={`text-[8px] block uppercase font-black tracking-wide ${
                    isLosingPackets ? 'text-rose-400' : 'text-slate-500'
                  }`}>LOSS</span>
                  <span className={`font-bold mt-1 block select-all ${
                    isLosingPackets ? 'text-rose-400 animate-pulse' : 'text-slate-300'
                  }`}>
                    {isp.packetLoss}%
                  </span>
                </div>

              </div>

              {/* Action control drawer right on the speedometer */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-900">
                {/* Kill switcher */}
                <button
                  type="button"
                  id={`isp-kill-btn-${isp.id}`}
                  onClick={() => toggleIspStatus(isp.id)}
                  className={`text-[9.5px] font-mono font-bold py-1.5 px-2 rounded-lg border transition-all cursor-pointer ${
                    isp.status === 'down'
                      ? 'bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-400 border-emerald-800/40 hover:border-emerald-700/60'
                      : 'bg-slate-900/50 hover:bg-rose-950/20 text-rose-450 border-rose-950/40 hover:border-rose-900/50'
                  }`}
                >
                  {isp.status === 'down' ? 'Power Sync' : 'Kill Signal'}
                </button>

                {/* Local test button */}
                <button
                  type="button"
                  id={`isp-test-btn-${isp.id}`}
                  onClick={() => triggerSpeedTest(isp.id)}
                  disabled={isp.status === 'down' || isCurrentlyGlobalTesting}
                  className="text-[9.5px] font-mono font-bold py-1.5 px-2 rounded-lg bg-blue-950/30 hover:bg-blue-900/40 border border-blue-900/30 hover:border-blue-800 text-blue-400 disabled:opacity-20 transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  {isCurrentlyGlobalTesting ? (
                    <>
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping shrink-0" />
                      <span>Testing...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-2.5 h-2.5 fill-blue-400/25 shrink-0" />
                      <span>Test Line</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
