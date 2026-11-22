import { create } from 'zustand';
import io, { Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

type RealtimeEvent = {
  event: string;
  data: any;
};

type SocketEventHandler = (payload: any) => void;

interface RealtimeState {
  socket: Socket | null;
  connected: boolean;
  listeners: Map<string, SocketEventHandler>;
  lastEvents: RealtimeEvent[];
  connect: () => void;
  disconnect: () => void;
  on: (event: string, handler: SocketEventHandler) => void;
  off: (event: string) => void;
  emit: (event: string, payload: any) => void;
}

export const useRealtimeStore = create<RealtimeState>((set, get) => ({
  socket: null,
  connected: false,
  listeners: new Map(),
  lastEvents: [],

  connect: () => {
    const { socket: existing } = get();
    if (existing?.connected) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      set({ socket, connected: true });
      console.log('[Socket.IO] Connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      set({ connected: false });
      console.log('[Socket.IO] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket.IO] Connect error:', err.message);
    });

    // Terapkan listener yang sudah terdaftar (jika ada)
    const { listeners } = get();
    listeners.forEach((handler, event) => {
      socket.on(event, handler);
    });

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    socket?.disconnect();
    set({ socket: null, connected: false });
  },

  on: (event: string, handler: SocketEventHandler) => {
    const { socket, listeners } = get();
    listeners.set(event, handler);
    set({ listeners });

    if (socket?.connected) {
      socket.on(event, handler);
    }
  },

  off: (event: string) => {
    const { socket, listeners } = get();
    listeners.delete(event);
    set({ listeners });
    socket?.off(event);
  },

  emit: (event: string, payload: any) => {
    const { socket } = get();
    socket?.emit(event, payload);
  },
}));
