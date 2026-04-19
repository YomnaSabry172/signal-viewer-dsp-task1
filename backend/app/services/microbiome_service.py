"""
Load microbiome data from patients_csv/*.csv (one CSV per patient).
Each CSV: External ID, week_num, then taxonomy columns with abundance (0-1).
"""
import csv
from pathlib import Path

from app.core.config import MICROBIOME_DATA_DIR

# Number of top abundant microbiomes to return as curves
TOP_N_OTUS = 6
# Number of top taxa to show in composition; the rest are summed as "Other"
TOP_N_COMPOSITION = 10

# First two columns in each patient CSV are identifiers, not taxonomy
ID_COLUMNS = {"External ID", "week_num"}


def _patients_dir() -> Path:
    return MICROBIOME_DATA_DIR / "patients_csv"


def _shorten_taxonomy_name(col: str) -> str:
    """Use last segment after | for shorter labels (e.g. g__Bacteroides)."""
    if "|" in col:
        return col.rsplit("|", 1)[-1].strip()
    return col.strip()


def get_patient_ids():
    """
    Return list of all patient IDs from patients_csv/*.csv filenames (stem = patient id).
    """
    pdir = _patients_dir()
    if not pdir.is_dir():
        return []
    ids = [f.stem for f in pdir.glob("*.csv") if f.is_file()]
    return sorted(ids)


def get_abundance_over_time(patient_id: str):
    """
    For the given patient_id, load patients_csv/{patient_id}.csv.
    CSV has columns: External ID, week_num, then taxonomy columns (abundance 0-1).
    Return weeks (sorted week_num) and top TOP_N_OTUS curves with data per week.
    """
    patient_id = str(patient_id).strip()
    path = _patients_dir() / f"{patient_id}.csv"
    if not path.is_file():
        return {"weeks": [], "curves": []}

    rows = []
    taxonomy_columns = []
    with open(path, newline="", encoding="utf-8") as f:
        r = csv.DictReader(f)
        if not r.fieldnames:
            return {"weeks": [], "curves": []}
        taxonomy_columns = [c for c in r.fieldnames if c not in ID_COLUMNS]
        for row in r:
            try:
                week = float(row.get("week_num", 0))
            except (ValueError, TypeError):
                week = 0.0
            rows.append({"week_num": week, "row": row})

    if not rows or not taxonomy_columns:
        return {"weeks": [], "curves": []}

    rows.sort(key=lambda x: x["week_num"])
    weeks = sorted({r["week_num"] for r in rows})

    # Total abundance per taxonomy column (sum across all time points) to pick top TOP_N_OTUS
    col_totals = []
    for col in taxonomy_columns:
        total = 0.0
        for r in rows:
            try:
                total += float(r["row"].get(col, 0) or 0)
            except (ValueError, TypeError):
                pass
        col_totals.append((col, total))
    col_totals.sort(key=lambda x: -x[1])
    top_columns = [col for col, _ in col_totals[:TOP_N_OTUS]]

    curves = []
    seen_names = set()
    for col in top_columns:
        name = _shorten_taxonomy_name(col)
        if name in seen_names:
            name = col if len(col) <= 50 else col[:47] + "..."
        seen_names.add(name)
        data = []
        for r in rows:
            try:
                ab = float(r["row"].get(col, 0) or 0)
            except (ValueError, TypeError):
                ab = 0.0
            data.append({"week_num": r["week_num"], "abundance": round(ab, 4)})
        curves.append({"name": name, "otuId": col, "data": data})

    return {"weeks": weeks, "curves": curves}


def get_patient_composition(patient_id: str):
    """
    For the given patient_id, return composition for the latest time point (for pie chart)
    and a simple profile summary (top taxa). Used for pie chart + profile card.
    Returns: { composition: { name: proportion }, top_taxa: [name, ...], week_num }
    """
    patient_id = str(patient_id).strip()
    path = _patients_dir() / f"{patient_id}.csv"
    if not path.is_file():
        return {"composition": {}, "top_taxa": [], "week_num": None}

    rows = []
    taxonomy_columns = []
    with open(path, newline="", encoding="utf-8") as f:
        r = csv.DictReader(f)
        if not r.fieldnames:
            return {"composition": {}, "top_taxa": [], "week_num": None}
        taxonomy_columns = [c for c in r.fieldnames if c not in ID_COLUMNS]
        for row in r:
            try:
                week = float(row.get("week_num", 0))
            except (ValueError, TypeError):
                week = 0.0
            rows.append({"week_num": week, "row": row})

    if not rows or not taxonomy_columns:
        return {"composition": {}, "top_taxa": [], "week_num": None}

    # Use latest time point (max week_num)
    latest = max(rows, key=lambda x: x["week_num"])
    week_num = latest["week_num"]
    row = latest["row"]

    # Build composition: short_name -> proportion (only non-zero), sorted by value desc
    comp_pairs = []
    seen_short = set()
    for col in taxonomy_columns:
        try:
            val = float(row.get(col, 0) or 0)
        except (ValueError, TypeError):
            val = 0.0
        if val <= 0:
            continue
        name = _shorten_taxonomy_name(col)
        if name in seen_short:
            name = col if len(col) <= 40 else col[:37] + "..."
        seen_short.add(name)
        comp_pairs.append((name, val))
    comp_pairs.sort(key=lambda x: -x[1])

    # Keep only top TOP_N_COMPOSITION; sum the rest into "Other"
    top_pairs = comp_pairs[:TOP_N_COMPOSITION]
    rest_sum = sum(v for _, v in comp_pairs[TOP_N_COMPOSITION:])
    composition = {name: round(v, 4) for name, v in top_pairs}
    if rest_sum > 0:
        composition["Other"] = round(rest_sum, 4)
    top_taxa = [name for name, _ in top_pairs[:8]]

    return {"composition": composition, "top_taxa": top_taxa, "week_num": week_num}
