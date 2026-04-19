from fastapi import APIRouter, HTTPException, Query

from app.services.microbiome_service import (
    get_patient_ids,
    get_abundance_over_time,
    get_patient_composition,
)

router = APIRouter()


@router.get("/patients")
def list_patients():
    """
    List all patient IDs (derived from microbiome sample External IDs).
    Used to populate the patient dropdown on the microbiome page.
    """
    try:
        patients = get_patient_ids()
        return {"patients": patients, "count": len(patients)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/abundance-over-time")
def abundance_over_time(
    patient_id: str = Query(..., description="Patient ID (e.g. 2066, 2243)"),
):
    """
    For the given patient, return abundance over time (week_num) for the top 5–6 most abundant microbiomes.
    Response: { weeks: number[], curves: { name, otuId, data: { week_num, abundance }[] }[] }
    """
    try:
        result = get_abundance_over_time(patient_id)
        if not result["weeks"] and not result["curves"]:
            raise HTTPException(
                status_code=404,
                detail=f"No data found for patient_id={patient_id}",
            )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/patient-composition")
def patient_composition(
    patient_id: str = Query(..., description="Patient ID (e.g. P6038, H4001)"),
):
    """
    For the given patient, return composition at latest time point (for pie chart)
    and top taxa (for profile card). Response: { composition, top_taxa, week_num }
    """
    try:
        result = get_patient_composition(patient_id)
        if not result["composition"] and not result["top_taxa"]:
            raise HTTPException(
                status_code=404,
                detail=f"No composition found for patient_id={patient_id}",
            )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
