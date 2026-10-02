import { useCallback, useEffect, useRef, useState } from "react";
import { WS_BASE_URL, getToken } from "@/lib/api/client";

export type SocketStatus = "connecting" | "open" | "closed" | "error";

export interface SocketMessage<T = unknown> {
  type?: string | undefined;
  event?: string | undefined;
  data?: T | undefined;
  payload?: T | undefined;
  [key: string]: unknown;
}

interface Options {
  /** Path appended to VITE_WS_BASE_URL, e.g. "/ws/alerts". */
  path: string;
  enabled?: boolean | undefined;
  onMessage?: (message: SocketMessage) => void | undefined;
}

/**
 * Resilient WebSocket client with exponential backoff. The application must
 * never crash or block when the realtime channel is unavailable.
 */
export function useSocket({ path, enabled = true, onMessage }: Options) {
  const [status, setStatus] = useState<SocketStatus>("closed");
  const [lastMessage, setLastMessage] = useState<SocketMessage | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handlerRef = useRef(onMessage);
  const closedByUs = useRef(false);

  handlerRef.current = onMessage;

  const connect = useCallback(() => {
    if (typeof window === "undefined" || !enabled) return;
    const token = getToken();
    const url = `${WS_BASE_URL}${path}${token ? `?token=${encodeURIComponent(token)}` : ""}`;

    let socket: WebSocket;
    try {
      socket = new WebSocket(url);
    } catch {
      setStatus("error");
      return;
    }

    socketRef.current = socket;
    setStatus("connecting");

    socket.onopen = () => {
      retryRef.current = 0;
      setStatus("open");
    };

    socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data as string) as SocketMessage;
        setLastMessage(parsed);
        handlerRef.current?.(parsed);
      } catch {
        /* ignore non-JSON frames (heartbeats etc.) */
      }
    };

    socket.onerror = () => setStatus("error");

    socket.onclose = () => {
      socketRef.current = null;
      if (closedByUs.current) {
        setStatus("closed");
        return;
      }
      setStatus("closed");
      const attempt = Math.min(retryRef.current++, 5);
      const delay = Math.min(1000 * 2 ** attempt, 30000);
      timerRef.current = setTimeout(connect, delay);
    };
  }, [path, enabled]);

  useEffect(() => {
    closedByUs.current = false;
    if (enabled) connect();
    return () => {
      closedByUs.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [connect, enabled]);

  const reconnect = useCallback(() => {
    retryRef.current = 0;
    socketRef.current?.close();
    connect();
  }, [connect]);

  return { status, lastMessage, reconnect };
}
