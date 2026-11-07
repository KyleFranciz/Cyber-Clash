
import pytest
from app.session import GameSession


# Test starting electricity for all difficulties
@pytest.mark.parametrize("difficulty, expected_power", [
    ("guided", 100),
    ("standard", 85),
    ("challenge", 70)
])
def test_starting_power(difficulty, expected_power):
    game = GameSession(difficulty)

    assert game.power == expected_power


# Test AI electricity cost
@pytest.mark.parametrize("difficulty, expected_power", [
    ("guided", 97),
    ("standard", 79),
    ("challenge", 60)
])
def test_ai_hint_cost(difficulty, expected_power):
    game = GameSession(difficulty)

    result = game.request_ai_hint("N1-EM-001")

    assert result["allowed"] is True
    assert result["charged"] is True
    assert game.power == expected_power


# Test that repeated hints are free
def test_duplicate_hint():
    game = GameSession("standard")

    game.request_ai_hint("N1-EM-001")
    result = game.request_ai_hint("N1-EM-001")

    assert result["charged"] is False
    assert game.power == 79


# Test insufficient electricity
def test_insufficient_power():
    game = GameSession("standard")

    game.power = 3

    result = game.request_ai_hint("N1-EM-001")

    assert result["allowed"] is False
    assert result["charged"] is False
    assert game.power == 3


# Test blackout detection
def test_blackout():
    game = GameSession("standard")

    game.power = 0

    assert game.is_blackout() is True


# Test invalid difficulty
def test_invalid_difficulty():
    with pytest.raises(ValueError):
        GameSession("impossible")
