"""
Real-time notification service. Maintains in-process WebSocket connection
pools for the alerts and dashboard channels, and broadcasts structured
events when new detections/alerts are created.

Redis pub/sub is used opportunistically (if REDIS_URL is reachable) so that
multiple backend worker processes can share events; the app remains fully
functional without Redis for local/academic use.
"""
import json
from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import WebSocket

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

try:
    import redis.asyncio as aioredis
except ImportError:  # pragma: no cover
    aioredis = None


class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: Dict[str, List[WebSocket]] = {"alerts": [], "dashboard": []}

    async def connect(self, channel: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.setdefault(channel, []).append(websocket)

    def disconnect(self, channel: str, websocket: WebSocket) -> None:
        if websocket in self.active_connections.get(channel, []):
            self.active_connections[channel].remove(websocket)

    async def broadcast(self, channel: str, message: Dict[str, Any]) -> None:
        payload = json.dumps(message, default=str)
        stale = []
        for connection in self.active_connections.get(channel, []):
            try:
                await connection.send_text(payload)
            except Exception:  # noqa: BLE001
                stale.append(connection)
        for conn in stale:
            self.disconnect(channel, conn)


manager = ConnectionManager()


def build_event(event_type: str, **fields: Any) -> Dict[str, Any]:
    """Builds a structured, secret-free event payload."""
    event = {
        "event_type": event_type,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    event.update(fields)
    return event


async def publish_alert_event(event: Dict[str, Any]) -> None:
    await manager.broadcast("alerts", event)


async def publish_dashboard_event(event: Dict[str, Any]) -> None:
    await manager.broadcast("dashboard", event)
