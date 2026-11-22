import { useEffect } from 'react';
import { useRealtimeStore } from '../store/realtimeStore';

export type RealtimeHandler = (payload: any) => void;

export function useRealtime(event: string, handler: RealtimeHandler, deps: any[] = []) {
  const { on, off, connect } = useRealtimeStore();

  useEffect(() => {
    connect();
    on(event, handler);
    return () => {
      off(event);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, ...deps]);
}
