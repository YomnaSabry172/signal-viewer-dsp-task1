from fastapi import APIRouter, HTTPException, Query
from app.services.gold_service import (
    load_minerals_data,
    load_currency_data,
    load_stock_data
)

router = APIRouter()

@router.get("/currency")
async def get_currency_data():
    """
    Get currency exchange data.
    
    Output JSON:
    {
      "ok": true,
      "columns": [...],
      "rows": 100,
      "data": [...]
    }
    """
    try:
        result = load_currency_data()
        if not result.get("ok"):
            raise HTTPException(status_code=404, detail=result.get("error"))
        return result
    except HTTPException:
        raise
    except Exception as e:
        return {
            "ok": False,
            "error": str(e)
        }


@router.get("/minerals")
async def get_merged_minerals_data():
    """
    Get merged gold exchange data (v1 and v2 combined).
    Data is sorted by date in descending order.
    
    Output JSON:
    {
      "ok": true,
      "columns": [...],
      "rows": 200,
      "data": [...]
    }
    """
    try:
        result = load_minerals_data()
        if not result.get("ok"):
            raise HTTPException(status_code=404, detail=result.get("error"))
        return result
    except HTTPException:
        raise
    except Exception as e:
        return {
            "ok": False,
            "error": str(e)
        }

@router.get("/stock")
async def get_merged_minerals_data():
    """
    Get merged gold exchange data (v1 and v2 combined).
    Data is sorted by date in descending order.
    
    Output JSON:
    {
      "ok": true,
      "columns": [...],
      "rows": 200,
      "data": [...]
    }
    """
    try:
        result = load_stock_data()
        if not result.get("ok"):
            raise HTTPException(status_code=404, detail=result.get("error"))
        return result
    except HTTPException:
        raise
    except Exception as e:
        return {
            "ok": False,
            "error": str(e)
        }
