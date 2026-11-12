from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from app.content import get_challenge, get_challenges, evaluate_answer, get_ai_hint
from typing import Literal
from uuid import uuid4 # used to generate unique identifiers for game sessions.
from app.session import GameSession

app = FastAPI(title="Cyber Clash API")
# Store active game sessions in memory
sessions = {}



class AnswerRequest(BaseModel):
    challenge_id: str
    action: Literal["report", "verify_separately", "no_action"]

# Retrieve all cybersecurity challenges
@app.get("/api/challenges")
def list_challenges(
    night: int = 1,
    mode: Literal["guided", "standard", "challenge"] = "standard",
    count: int = 6,
    seed: str = ""
):
    # Just implementing night 1 content only
    if night != 1:
        raise HTTPExcerption(
            status_code = 4
            detail = "It is not night yet technician.........."
        )

    # retrieving the public challenges from SQLite
    challenges = get_challenges()

    if mode == "challenge":
        # applying the existing Night 1 rules
        challenges = [
            c for c in challenges if c["tier"] >= 2
        ]

    #return the structure React expects
    return {
        "night" : night,
        "mode": mode,
        "challenges": challenges[:max(0, count)]
    }
    



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


class HintRequest(BaseModel):
    session_id: str
    challenge_id: str



@app.post("/api/hint")
def request_hint(request: HintRequest):

    # Find the player's session
    game = sessions.get(request.session_id)

    if game is None:
        raise HTTPException(
            status_code=404,
            detail="Game session not found"
        )

    # Find the AI hint
    hint = get_ai_hint(request.challenge_id)

    if hint is None:
        raise HTTPException(
            status_code=404,
            detail="Challenge not found"
        )

    # Attempt to spend electricity
    result = game.request_ai_hint(request.challenge_id)

    if not result["allowed"]:
        raise HTTPException(
            status_code=409,
            detail="Not enough electricity for AI assistance"
        )

    return {
        "session_id": request.session_id,
        "challenge_id": request.challenge_id,
        "hint": hint,
        "charged": result["charged"],
        "power": result["power"]
    }



@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


class SessionRequest(BaseModel):
    difficulty: Literal[
        "guided", "standard", "challenge"
    ] = "standard"


@app.post("/api/session")
def create_session(request: SessionRequest):

    # Generate a unique session ID
    session_id = str(uuid4())

    # Create a new game session
    game = GameSession(request.difficulty)

    # Store the session
    sessions[session_id] = game

    return {
        "session_id": session_id,
        "difficulty": game.difficulty,
        "power": game.power
    }
