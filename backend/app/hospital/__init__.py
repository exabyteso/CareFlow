"""Hospital desk: queue, wait-count override, arrived / no-show (wait decrement).

P1 includes ``router`` from ``app.main`` — do not ``include_router`` here.
"""

from app.hospital.router import router

__all__ = ["router"]
