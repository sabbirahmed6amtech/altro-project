import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

let channelCounter = 0;

export function useRealtime(onNewOrder) {
  const callbackRef = useRef(onNewOrder);
  callbackRef.current = onNewOrder;

  const channelNameRef = useRef(null);
  if (channelNameRef.current === null) {
    channelNameRef.current = `orders-realtime-${++channelCounter}`;
  }

  useEffect(() => {
    const channel = supabase
      .channel(channelNameRef.current)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          callbackRef.current?.(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // stable — callback changes don't recreate the subscription
}