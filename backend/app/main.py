from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from app.content import get_challenge, get_challenges, evaluate_answer
from typing import Literal

app = FastAPI(title="Cyber Clash API")



class AnswerRequest(BaseModel):
    challenge_id: str
    action: Literal["report", "verify_separately", "no_action"]

# Retrieve all cybersecurity challenges
@app.get("/api/challenges")
def list_challenges():
    return get_challenges()


# Retrieve a specific cybersecurity challenge
@app.get("/api/challenges/{challenge_id}")
def challenge_details(challenge_id: str):
    challenge = get_challenge(challenge_id)

    if challenge is None:
        raise HTTPException(
            status_code=404,
            detail="Challenge not found"
        )

    return challenge


@app.post("/api/answer")
def submit_answer(request: AnswerRequest):

    result = evaluate_answer(
        request.challenge_id,
        request.action
    )

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Challenge not found"
        )

    return result


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
