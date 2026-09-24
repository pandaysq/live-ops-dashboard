import { useLiveMetrics, type LogSeverity } from '@/hooks/use-live-metrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatUptime, cn } from '@/lib/utils';
import { Activity, Server, Clock, Users, Terminal } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

function StatusDot({ status }: { status: 'operational' | 'degraded' | 'offline' }) {
  const colors = {
    operational: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]',
    degraded: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]',
    offline: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
  };
  return <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", colors[status])} />;
}

function SeverityBadge({ severity }: { severity: LogSeverity }) {
  const map: Record<LogSeverity, { label: string, variant: 'default' | 'success' | 'warning' | 'destructive' | 'info' }> = {
    info: { label: 'INFO', variant: 'info' },
    success: { label: 'OK', variant: 'success' },
    warning: { label: 'WARN', variant: 'warning' },
    error: { label: 'ERR', variant: 'destructive' }
  };
  const m = map[severity];
  return <Badge variant={m.variant} className="font-mono rounded px-1.5 py-[1px] text-[10px] leading-tight uppercase tracking-wider">{m.label}</Badge>;
}

export default function Dashboard() {
  const { snapshot, history, services, events } = useLiveMetrics();
  
  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6 lg:p-8 font-sans selection:bg-primary/20">
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            OPS_CTRL
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-mono">
            SYS_TIME: {new Date(snapshot.timestamp).toISOString()}
          </p>
        </div>
        <div className="flex items-center gap-3 bg-card border px-4 py-2 rounded-full shadow-sm">
          <StatusDot status={snapshot.servicesOnline === snapshot.servicesTotal ? 'operational' : 'degraded'} />
          <span className="text-sm font-semibold tracking-wide uppercase">
            {snapshot.servicesOnline === snapshot.servicesTotal ? 'All Systems Nominal' : 'Degraded Performance'}
          </span>
        </div>
      </header>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">System Uptime</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{formatUptime(snapshot.uptime)}</div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Conns</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{snapshot.activeConnections.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cluster Load</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono mb-2">{snapshot.load.toFixed(1)}%</div>
            <Progress value={snapshot.load} className="h-1.5" />
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Services</CardTitle>
            <Server className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{snapshot.servicesOnline} / {snapshot.servicesTotal}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Chart */}
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Live Load History
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} minTickGap={30} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Area type="monotone" dataKey="load" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorLoad)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Services */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Server className="w-4 h-4" />
              Service Health
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-[320px] w-full">
              <div className="flex flex-col p-6 pt-0 gap-3">
                {services.map(srv => (
                  <div key={srv.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/50 hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <StatusDot status={srv.status} />
                      <div>
                        <div className="font-semibold text-sm">{srv.name}</div>
                        <div className="text-xs text-muted-foreground capitalize mt-0.5">{srv.status}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm font-semibold">{srv.latency}ms</div>
                      <div className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">Latency</div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Events Terminal */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/30 pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Terminal className="w-4 h-4" />
            System Events
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[280px] w-full bg-card">
            <div className="p-4 font-mono text-sm flex flex-col gap-1">
              <AnimatePresence initial={false}>
                {events.map((ev) => (
                  <motion.div 
                    key={ev.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start md:items-center gap-3 py-2 border-b border-border/40 last:border-0 hover:bg-muted/30 rounded px-2 transition-colors group"
                  >
                    <div className="text-muted-foreground text-xs whitespace-nowrap opacity-60 group-hover:opacity-100 transition-opacity">
                      {new Date(ev.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
                    </div>
                    <div className="w-14 shrink-0 flex items-center justify-center">
                      <SeverityBadge severity={ev.severity} />
                    </div>
                    <div className="font-bold text-xs shrink-0 w-32 truncate text-foreground/80">
                      [{ev.service}]
                    </div>
                    <div className="text-foreground/90 flex-1 break-words md:break-normal text-xs md:text-sm">
                      {ev.message}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
