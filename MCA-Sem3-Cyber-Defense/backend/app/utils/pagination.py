import math
from typing import Tuple

from fastapi import Query


class PaginationParams:
    def __init__(
        self,
        page: int = Query(1, ge=1, description="Page number, starting at 1"),
        page_size: int = Query(20, ge=1, le=200, description="Items per page"),
    ):
        self.page = page
        self.page_size = page_size

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size


def paginate_query(query, page: int, page_size: int) -> Tuple[list, int, int]:
    total = query.count()
    total_pages = max(1, math.ceil(total / page_size))
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return items, total, total_pages
