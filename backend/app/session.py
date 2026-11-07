# Tracks the player's remaining electricity and AI hint usage.
#Preventing AI assistance when power is insufficent


class GameSession: # class representing a player's game session

    def __init__(self, difficulty="standard"):
        # Store the selected difficulty
        self.difficulty = difficulty

        # Starting power for each difficulty
        starting_power = {
            "guided": 100,
            "standard": 85,
            "challenge": 70
        }

        # Power cost for an AI email hint
        self.ai_hint_costs = {
            "guided": 3,
            "standard": 6,
            "challenge": 10
        }

        # Validate the difficulty setting
        if difficulty not in starting_power:
            raise ValueError("Invalid difficulty")

        # Initialize the player's power
        self.power = starting_power[difficulty]

        # Remember which challenges received AI hints
        self.used_hints = set()
    
    
    def consume_power(self, amount):
        # Reject negative power costs
        if amount < 0:
            raise ValueError("Power cost cannot be negative")

        # Check if the player has enough electricity
        if self.power < amount:
            return False

        # Deduct electricity
        self.power -= amount
        return True

    def request_ai_hint(self, challenge_id):
        # Check whether the hint was already requested
        if challenge_id in self.used_hints:
            return {
                "allowed": True,
                "charged": False,
                "power": self.power
            }

        # Find the AI hint cost for this difficulty
        cost = self.ai_hint_costs[self.difficulty]

        # Attempt to spend electricity
        if not self.consume_power(cost):
            return {
                "allowed": False,
                "charged": False,
                "power": self.power
            }

        # Record that the hint has been requested
        self.used_hints.add(challenge_id)

        return {
            "allowed": True,
            "charged": True,
            "power": self.power
        }

    def is_blackout(self):
        # Return True when electricity is depleted
        return self.power <= 0


if __name__ == "__main__":
    game = GameSession("standard")

    print("Starting power:", game.power)

    result = game.request_ai_hint("N1-EM-001")
    print("First hint request:", result)

    result = game.request_ai_hint("N1-EM-001")
    print("Repeated hint request:", result)

    print("Blackout:", game.is_blackout())
