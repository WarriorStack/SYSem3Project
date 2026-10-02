from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.logging import get_logger
from app.services.notification_service import manager

logger = get_logger(__name__)

router = APIRouter(prefix="/api/ws", tags=["WebSockets"])


@router.websocket("/alerts")
async def websocket_alerts(websocket: WebSocket):
    await manager.connect("alerts", websocket)
    try:
        while True:
            # Client is not required to send anything; this keeps the
            # connection alive and detects disconnects.
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect("alerts", websocket)
    except Exception as exc:  # noqa: BLE001
        logger.error("WebSocket /alerts error: %s", exc)
        manager.disconnect("alerts", websocket)


@router.websocket("/dashboard")
async def websocket_dashboard(websocket: WebSocket):
    await manager.connect("dashboard", websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect("dashboard", websocket)
    except Exception as exc:  # noqa: BLE001
        logger.error("WebSocket /dashboard error: %s", exc)
        manager.disconnect("dashboard", websocket)
