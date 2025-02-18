import numpy as np
from typing import List, Dict
import json
import sys

def calculate_rating_adjustment(metrics: Dict) -> int:
    """
    Calculate rating adjustment using numpy for better numerical stability
    """
    success_rate = metrics['successRate']
    avg_hints = metrics['avgHints']
    avg_attempts = metrics['avgAttempts']
    avg_rating_diff = metrics['avgRatingDiff']
    high_rated_successes = metrics['highRatedSuccesses']
    very_high_rated_successes = metrics['veryHighRatedSuccesses']
    
    # Base success rate adjustment
    if success_rate > 70:
        rating_delta = -np.minimum(200, np.floor((success_rate - 70) * 3))
    elif success_rate < 40:
        base_increase = np.minimum(800, np.floor((40 - success_rate) * 20))
        attempt_multiplier = 2.5 if avg_attempts > 2 else 1.8 if avg_attempts > 1 else 1.0
        rating_delta = np.floor(base_increase * attempt_multiplier)
    else:
        rating_delta = 0
        
    # Hint penalty
    if avg_hints > 1:
        hint_penalty = np.minimum(100, np.floor(avg_hints * 30))
        rating_delta -= hint_penalty
        
    # Rating difference adjustment
    if avg_rating_diff > 0:
        base_adjustment = np.minimum(1000, np.floor(avg_rating_diff * 1.5))
        rating_bonus = 800 if very_high_rated_successes >= 2 else \
                      600 if high_rated_successes >= 3 else \
                      400 if high_rated_successes > 0 else 0
                      
        consistency_multiplier = 2.0 if success_rate > 50 else \
                               1.5 if success_rate > 30 else 1.2
                               
        total_adjustment = np.floor((base_adjustment + rating_bonus) * consistency_multiplier)
        rating_delta += total_adjustment
        
    # Ensure minimum increases for key scenarios
    if success_rate < 25 or very_high_rated_successes > 0 or avg_attempts > 2:
        min_increase = 600 if very_high_rated_successes > 0 else \
                      800 if success_rate < 25 else \
                      400 if avg_attempts > 2 else 300
        rating_delta = np.maximum(rating_delta, min_increase)
        
    # Additional challenge bonus
    if avg_attempts > 2 and success_rate < 40:
        challenge_bonus = np.minimum(400, np.floor(avg_attempts * 80))
        rating_delta += challenge_bonus
        
    return int(rating_delta)

if __name__ == "__main__":
    # Read input from stdin
    metrics = json.loads(sys.stdin.read())
    result = calculate_rating_adjustment(metrics)
    # Write result to stdout
    print(json.dumps({"ratingDelta": result}))
