from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import AssemblyVote
from schemas import VoteCreate

router = APIRouter(prefix="/api/assembly", tags=["Asambleas & Quórum Legal (Ley 5038)"])

@router.get("/votes")
def get_assembly_votes(db: Session = Depends(get_db)):
    """Retorna los votos registrados en el orden del día de la asamblea."""
    votes = db.query(AssemblyVote).all()
    return [
        {
            "id": v.id,
            "userId": v.user_id,
            "unit": v.unit,
            "pointId": v.point_id,
            "option": v.option,
            "aliquot": v.aliquot
        }
        for v in votes
    ]

@router.post("/vote")
def cast_vote(payload: VoteCreate, db: Session = Depends(get_db)):
    """
    Registra el voto ponderado por la alícuota indivisa del propietario según Ley 5038.
    """
    # Verificar si ya votó en este punto
    existing = db.query(AssemblyVote).filter(
        AssemblyVote.unit == payload.unit,
        AssemblyVote.point_id == payload.point_id
    ).first()

    if existing:
        existing.option = payload.option
        db.commit()
        return {
            "success": True,
            "message": f"Voto actualizado a '{payload.option}' con alícuota de {payload.aliquot}."
        }

    new_vote = AssemblyVote(
        id=f"vote-{payload.unit}-{payload.point_id}",
        user_id=payload.user_id,
        unit=payload.unit,
        point_id=payload.point_id,
        option=payload.option,
        aliquot=payload.aliquot
    )
    db.add(new_vote)
    db.commit()

    return {
        "success": True,
        "message": f"Voto registrado exitosamente con alícuota de {payload.aliquot}."
    }
