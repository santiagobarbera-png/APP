'use strict';

/**
 * AI Matching Engine
 * Calculates compatibility scores between users based on:
 * - MBTI personality compatibility (30%)
 * - Location/distance proximity (25%)
 * - Age compatibility (20%)
 * - Shared interests (25%)
 */

// ------------------------------------------------------------
// MBTI Compatibility Matrix (0-100 scale)
// Based on validated MBTI compatibility research
// ------------------------------------------------------------
const MBTI_COMPATIBILITY = {
    INTJ: { ENFP: 95, ENTP: 90, INFP: 80, INFJ: 75, INTJ: 70, ENTJ: 65, INTP: 70, ISFP: 60, ENFJ: 60, ESTJ: 55, ISTJ: 60, ISTP: 55, ESFJ: 45, ESFP: 40, ESTP: 40, ISFJ: 50 },
    INTP: { ENTJ: 90, ENFJ: 85, ENTP: 80, INTJ: 70, INFJ: 70, INFP: 65, ENFP: 70, ISTP: 60, ESTP: 55, ESTJ: 55, ESFJ: 40, ESFP: 45, ISFP: 55, ISTJ: 60, ISFJ: 50, INTP: 65 },
    ENTJ: { INTP: 90, INFP: 85, INFJ: 80, INTJ: 75, ENTP: 70, ISFP: 65, ENFP: 65, ENFJ: 65, ISTJ: 60, ESTJ: 55, ISTP: 60, ESFP: 45, ESFJ: 40, ESTP: 50, ISFJ: 50, ENTJ: 60 },
    ENTP: { INFJ: 95, INTJ: 90, ENFJ: 80, INTP: 80, INFP: 75, ENTJ: 70, ENFP: 70, ISTP: 65, ISTJ: 60, ESTJ: 55, ESFJ: 45, ESFP: 50, ISFP: 55, ESTP: 55, ISFJ: 45, ENTP: 65 },
    INFJ: { ENTP: 95, ENFP: 90, INTJ: 80, INFP: 80, ENFJ: 75, ENTJ: 75, INTP: 70, ISFP: 65, ISTP: 60, ESTP: 50, ESFP: 50, ISTJ: 55, ESTJ: 50, ESFJ: 45, ISFJ: 60, INFJ: 70 },
    INFP: { ENFJ: 95, ENTJ: 85, ENTP: 75, INFJ: 80, ENFP: 75, INTJ: 80, ESFJ: 65, ISFJ: 60, ISFP: 70, ESTJ: 50, ISTP: 55, ESTP: 45, ESFP: 55, INTP: 65, ISTJ: 50, INFP: 70 },
    ENFJ: { INFP: 95, ISFP: 90, INTP: 85, INFJ: 75, ISFJ: 75, ENFP: 70, INTJ: 60, ISTP: 60, ESFP: 65, ESTP: 55, ESTJ: 55, ISTJ: 55, ESFJ: 60, ENTP: 70, ENTJ: 65, ENFJ: 65 },
    ENFP: { INTJ: 95, INFJ: 90, ENTJ: 65, ENFJ: 70, INTP: 70, INFP: 75, ISFJ: 70, ISTJ: 65, ESFJ: 65, ESTJ: 55, ISTP: 60, ESTP: 55, ESFP: 60, ISFP: 65, ENTP: 70, ENFP: 70 },
    ISTJ: { ESFP: 90, ESTP: 85, ENFP: 65, ISFJ: 75, ESTJ: 70, ISTP: 70, ISFP: 70, ESFJ: 65, INFP: 50, INFJ: 55, INTJ: 60, INTP: 60, ENTJ: 60, ENTP: 60, ENFJ: 55, ISTJ: 65 },
    ISFJ: { ESFP: 90, ESTP: 85, ENFP: 70, ISTJ: 75, ESTJ: 70, ISTP: 65, ESFJ: 70, INFP: 60, INFJ: 60, INTJ: 50, ISFP: 70, ENFJ: 75, INTP: 50, ENTJ: 50, ENTP: 45, ISFJ: 65 },
    ESTJ: { ISFP: 85, ISTP: 80, INTJ: 55, ISTJ: 70, ISFJ: 70, ESFJ: 75, ESTP: 65, ENFP: 55, INFP: 50, INTP: 55, INFJ: 50, ENTJ: 55, ENFJ: 55, ENTP: 55, ESFP: 70, ESTJ: 65 },
    ESFJ: { ISFP: 85, ISTP: 80, INFP: 65, ISFJ: 70, ISTJ: 65, ESTJ: 75, ESFP: 70, ENFP: 65, INFJ: 45, INTJ: 45, INTP: 40, ENTJ: 40, ENFJ: 60, ENTP: 45, ESTP: 70, ESFJ: 65 },
    ISTP: { ESFJ: 80, ESTJ: 80, ENFJ: 60, INFJ: 60, ISFJ: 65, ISTJ: 70, ESTP: 75, ISFP: 70, ENTJ: 60, INTP: 60, INTJ: 55, ENFP: 60, INFP: 55, ENTP: 65, ESFP: 70, ISTP: 65 },
    ISFP: { ESFJ: 85, ESTJ: 85, ENFJ: 90, INFJ: 65, ISFJ: 70, ISTJ: 70, ESFP: 75, ISTP: 70, ENTJ: 65, ENTP: 55, INTJ: 60, ENFP: 65, INFP: 70, INTP: 55, ESTP: 65, ISFP: 65 },
    ESTP: { ISFJ: 85, ISTJ: 85, INFJ: 50, ESTJ: 65, ESFJ: 70, ISTP: 75, ESFP: 75, ISFP: 65, INTP: 55, INTJ: 40, ENTJ: 50, ENFP: 55, INFP: 45, ENTP: 55, ENFJ: 55, ESTP: 65 },
    ESFP: { ISFJ: 90, ISTJ: 90, INFJ: 50, ESTJ: 70, ESFJ: 70, ISTP: 70, ESTP: 75, ISFP: 75, INTJ: 40, INTP: 45, ENTJ: 45, ENFP: 60, INFP: 55, ENTP: 50, ENFJ: 65, ESFP: 70 },
};

/**
 * Calculate MBTI compatibility score (0-100)
 */
function calculateMBTICompatibility(mbti1, mbti2) {
    if (!mbti1 || !mbti2) return 50; // neutral if not set
    const type1 = mbti1.toUpperCase();
    const type2 = mbti2.toUpperCase();
    return MBTI_COMPATIBILITY[type1]?.[type2] ?? MBTI_COMPATIBILITY[type2]?.[type1] ?? 50;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg) {
    return deg * (Math.PI / 180);
}

/**
 * Calculate location compatibility score (0-100)
 * 100 = same city, decreases with distance
 */
function calculateLocationScore(lat1, lon1, lat2, lon2, maxDistanceKm = 100) {
    const distance = haversineDistance(lat1, lon1, lat2, lon2);
    if (distance === null) return 50; // neutral if no location

    if (distance <= 5) return 100;
    if (distance <= 20) return 90;
    if (distance <= 50) return 75;
    if (distance <= maxDistanceKm) return Math.max(0, 75 - ((distance - 50) / (maxDistanceKm - 50)) * 50);
    return Math.max(0, 25 - ((distance - maxDistanceKm) / maxDistanceKm) * 25);
}

/**
 * Calculate age compatibility score (0-100)
 */
function calculateAgeCompatibility(age1, age2) {
    if (!age1 || !age2) return 50;
    const diff = Math.abs(age1 - age2);
    if (diff <= 2) return 100;
    if (diff <= 5) return 90;
    if (diff <= 8) return 80;
    if (diff <= 10) return 70;
    if (diff <= 15) return 55;
    if (diff <= 20) return 40;
    return Math.max(0, 30 - (diff - 20) * 2);
}

/**
 * Calculate interest overlap score (0-100)
 */
function calculateInterestScore(interests1, interests2) {
    if (!interests1 || !interests2 || interests1.length === 0 || interests2.length === 0) return 50;

    const set1 = new Set(interests1.map(i => i.toLowerCase().trim()));
    const set2 = new Set(interests2.map(i => i.toLowerCase().trim()));

    const intersection = [...set1].filter(x => set2.has(x));
    const union = new Set([...set1, ...set2]);

    // Jaccard similarity * 100
    const jaccard = (intersection.length / union.size) * 100;

    // Bonus for many shared interests
    const sharedCount = intersection.length;
    const bonus = Math.min(20, sharedCount * 5);

    return Math.min(100, jaccard + bonus);
}

/**
 * Calculate TOTAL compatibility score (0-100)
 * Weights:
 *   - MBTI:      30%
 *   - Location:  25%
 *   - Age:       20%
 *   - Interests: 25%
 */
function calculateCompatibilityScore(user1, user2, preferences = {}) {
    const mbtiScore = calculateMBTICompatibility(user1.mbti, user2.mbti);
    const locationScore = calculateLocationScore(
        user1.latitude, user1.longitude,
        user2.latitude, user2.longitude,
        preferences.max_distance_km || 100
    );
    const ageScore = calculateAgeCompatibility(user1.age, user2.age);
    const interestScore = calculateInterestScore(user1.interests, user2.interests);

    const totalScore =
        (mbtiScore * 0.30) +
        (locationScore * 0.25) +
        (ageScore * 0.20) +
        (interestScore * 0.25);

    return {
        totalScore: Math.round(totalScore * 100) / 100,
        breakdown: {
            mbti: Math.round(mbtiScore),
            location: Math.round(locationScore),
            age: Math.round(ageScore),
            interests: Math.round(interestScore),
        },
        distance_km: haversineDistance(
            user1.latitude, user1.longitude,
            user2.latitude, user2.longitude
        ),
    };
}

/**
 * Find all potential matches for a user and rank them by score
 */
function rankCandidates(currentUser, candidates, preferences = {}) {
    return candidates
        .map(candidate => {
            const result = calculateCompatibilityScore(currentUser, candidate, preferences);
            return {
                userId: candidate.id,
                name: candidate.name,
                score: result.totalScore,
                scoreDetails: result.breakdown,
                distance_km: result.distance_km,
                candidate,
            };
        })
        .filter(r => r.score >= 60) // Only "perfect" matches >= 60%
        .sort((a, b) => b.score - a.score);
}

module.exports = {
    calculateMBTICompatibility,
    calculateLocationScore,
    calculateAgeCompatibility,
    calculateInterestScore,
    calculateCompatibilityScore,
    rankCandidates,
    haversineDistance,
};
