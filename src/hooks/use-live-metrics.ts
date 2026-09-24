import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

export type LogSeverity = 'info' | 'warning' | 'error' | 'success';

export interface OpsEvent {
  id: string;
  timestamp: number;
  severity: LogSeverity;
  service: string;
  message: string;
}

export interface ServiceInfo {
  id: string;
  name: string;
  status: 'operational' | 'degraded' | 'offline';
  latency: number;
}

export interface SystemSnapshot {
  timestamp: number;
  uptime: number;
  load: number;
  activeConnections: number;
  servicesOnline: number;
  servicesTotal: number;
}

export interface DataPoint {
  time: string;
  load: number;
  connections: number;
}

const INITIAL_SERVICES: ServiceInfo[] = [
  { id: 'srv-api', name: 'API Gateway', status: 'operational', latency: 42 },
  { id: 'srv-auth', name: 'Auth Service', status: 'operational', latency: 28 },
  { id: 'srv-db', name: 'Database Cluster', status: 'operational', latency: 15 },
  { id: 'srv-work-a', name: 'Worker Pool A', status: 'operational', latency: 110 },
  { id: 'srv-work-b', name: 'Worker Pool B', status: 'operational', latency: 95 },
  { id: 'srv-pay', name: 'Billing Engine', status: 'operational', latency: 210 },
];

export function useLiveMetrics() {
  const [snapshot, setSnapshot] = useState<SystemSnapshot>({
    timestamp: Date.now(),
    uptime: 1205400, // starting uptime
    load: 45,
    activeConnections: 1240,
    servicesOnline: 6,
    servicesTotal: 6,
  });
  
  const [history, setHistory] = useState<DataPoint[]>([]);
  const [services, setServices] = useState<ServiceInfo[]>(INITIAL_SERVICES);
  const [events, setEvents] = useState<OpsEvent[]>([
    { id: '1', timestamp: Date.now() - 5000, severity: 'info', service: 'System', message: 'Dashboard initialized and connected to telemetry stream.' }
  ]);
  
  useEffect(() => {
    // Generate initial history
    const now = Date.now();
    const initialHistory: DataPoint[] = Array.from({ length: 30 }).map((_, i) => {
      const t = new Date(now - (30 - i) * 2000);
      return {
        time: `${t.getHours().toString().padStart(2,'0')}:${t.getMinutes().toString().padStart(2,'0')}:${t.getSeconds().toString().padStart(2,'0')}`,
        load: 40 + Math.random() * 20,
        connections: 1200 + Math.random() * 100
      };
    });
    setHistory(initialHistory);

    const socket = io({
      path: '/api/socket.io',
      transports: ['websocket', 'polling'],
    });

    socket.on('metrics:snapshot', (incoming: {
      timestamp: string;
      uptime: number;
      load: number;
      activeConnections: number;
      servicesOnline: number;
      servicesTotal: number;
      events: Array<Omit<OpsEvent, 'timestamp'> & { timestamp: string }>;
    }) => {
      const timestamp = new Date(incoming.timestamp).getTime();
      setSnapshot({
        timestamp,
        uptime: incoming.uptime,
        load: incoming.load,
        activeConnections: incoming.activeConnections,
        servicesOnline: incoming.servicesOnline,
        servicesTotal: incoming.servicesTotal,
      });
      setHistory((current) => {
        const t = new Date(timestamp);
        const point = {
          time: t.toLocaleTimeString([], { hour12: false }),
          load: incoming.load,
          connections: incoming.activeConnections,
        };
        return [...current, point].slice(-30);
      });
      setEvents(
        incoming.events.map((event) => ({
          ...event,
          timestamp: new Date(event.timestamp).getTime(),
        })),
      );
      setServices((current) =>
        current.map((service, index) => ({
          ...service,
          status: index === current.length - 1 ? 'degraded' : 'operational',
          latency: Math.max(8, Math.round(service.latency + (Math.random() - 0.5) * 8)),
        })),
      );
    });
    
    return () => {
      socket.disconnect();
    };
  }, []);

  return { snapshot, history, services, events };
}
