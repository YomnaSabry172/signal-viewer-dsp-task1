"""
Gold Service: Load and process minerals exchange and currency data
"""

from pathlib import Path
import pandas as pd
from typing import Dict, List, Any

# Data paths
MINERALS_DATA_PATH = Path(__file__).parent.parent.parent / "data" / "minerals"
STOCK_DATA_PATH = Path(__file__).parent.parent.parent / "data" / "stock"
CURRENCY_DATA_PATH = Path(__file__).parent.parent.parent / "data" / "currency"

def load_minerals_data() -> Dict[str, Any]:
    """
    Load minerals stock data from CSV file.
        
    Returns:
        Dictionary with data and metadata
    """
    try:
        filename = "final_minerals_data.csv"

        filepath = MINERALS_DATA_PATH / filename
        
        if not filepath.exists():
            return {
                "ok": False,
                "error": f"minerals data file not found: {filename}"
            }
        
        # Read CSV with index_col=0 to skip the unnamed index column
        df = pd.read_csv(filepath)

        data_records = df.astype(object).where(pd.notna(df), None).to_dict(orient="records")
        
        
        # Convert to dictionary format
        data ={
                "ok": True,
                "columns": df.columns.tolist(),
                "rows": len(df),
                "data": data_records
            }
        
        return data
        
    except Exception as e:
        return {
            "ok": False,
            "error": str(e)
        }


def load_currency_data() -> Dict[str, Any]:
    """
    Load currency exchange data from CSV file.
    
    Returns:
        Dictionary with currency data and metadata
    """
    try:
        filepath = CURRENCY_DATA_PATH / "currency.csv"
        
        if not filepath.exists():
            return {
                "ok": False,
                "error": "Currency data file not found"
            }
        
        # Read CSV - set index_col=0 if first column is unnamed index
        df = pd.read_csv(filepath)
        
        # Convert to dictionary with NaN handling
        data_records = df.astype(object).where(pd.notna(df), None).to_dict(orient="records")
        
        # Convert to dictionary format
        data = {
            "ok": True,
            "columns": df.columns.tolist(),
            "rows": len(df),
            "data": data_records
        }
        
        return data
        
    except Exception as e:
        return {
            "ok": False,
            "error": str(e)
        }

def load_stock_data() -> Dict[str, Any]:
    try:
        filename = "final_stock_data.csv"

        filepath = STOCK_DATA_PATH / filename

        if not filepath.exists():
            return {
                "ok": False,
                "error": f"stock data file not found: {filename}"
            }
        
        df = pd.read_csv(filepath)

        data_records = df.astype(object).where(pd.notna(df), None).to_dict(orient="records")

        data = {
            "ok": True,
            "columns": df.columns.tolist(),
            "rows": len(df),
            "data": data_records
        }

        return data
    
    except Exception as e:
        return {
            "ok": False,
            "error": str(e)
        }