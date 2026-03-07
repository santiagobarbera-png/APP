'use strict';

// MBTI compatibility matrix — all 16 types x 16 types (scores 0-100)
const MBTI_MATRIX = {
    INTJ: { INTJ:72, INTP:88, ENTJ:85, ENTP:83, INFJ:78, INFP:74, ENFJ:70, ENFP:68, ISTJ:65, ISFJ:58, ESTJ:60, ESFJ:52, ISTP:70, ISFP:55, ESTP:58, ESFP:50 },
    INTP: { INTJ:88, INTP:75, ENTJ:80, ENTP:90, INFJ:72, INFP:76, ENFJ:68, ENFP:72, ISTJ:62, ISFJ:55, ESTJ:58, ESFJ:50, ISTP:74, ISFP:58, ESTP:60, ESFP:52 },
    ENTJ: { INTJ:85, INTP:80, ENTJ:70, ENTP:82, INFJ:68, INFP:65, ENFJ:75, ENFP:70, ISTJ:72, ISFJ:60, ESTJ:75, ESFJ:62, ISTP:65, ISFP:55, ESTP:68, ESFP:58 },
    ENTP: { INTJ:83, INTP:90, ENTJ:82, ENTP:72, INFJ:70, INFP:74, ENFJ:72, ENFP:78, ISTJ:58, ISFJ:52, ESTJ:60, ESFJ:55, ISTP:72, ISFP:60, ESTP:70, ESFP:62 },
    INFJ: { INTJ:78, INTP:72, ENTJ:68, ENTP:70, INFJ:74, INFP:88, ENFJ:85, ENFP:90, ISTJ:60, ISFJ:65, ESTJ:55, ESFJ:60, ISTP:58, ISFP:72, ESTP:52, ESFP:62 },
    INFP: { INTJ:74, INTP:76, ENTJ:65, ENTP:74, INFJ:88, INFP:72, ENFJ:95, ENFP:85, ISTJ:55, ISFJ:62, ESTJ:50, ESFJ:58, ISTP:56, ISFP:78, ESTP:48, ESFP:65 },
    ENFJ: { INTJ:70, INTP:68, ENTJ:75, ENTP:72, INFJ:85, INFP:95, ENFJ:70, ENFP:88, ISTJ:62, ISFJ:70, ESTJ:65, ESFJ:72, ISTP:55, ISFP:80, ESTP:58, ESFP:75 },
    ENFP: { INTJ:68, INTP:72, ENTJ:70, ENTP:78, INFJ:90, INFP:85, ENFJ:88, ENFP:70, ISTJ:52, ISFJ:60, ESTJ:55, ESFJ:65, ISTP:58, ISFP:82, ESTP:62, ESFP:78 },
    ISTJ: { INTJ:65, INTP:62, ENTJ:72, ENTP:58, INFJ:60, INFP:55, ENFJ:62, ENFP:52, ISTJ:75, ISFJ:82, ESTJ:88, ESFJ:80, ISTP:70, ISFP:65, ESTP:72, ESFP:65 },
    ISFJ: { INTJ:58, INTP:55, ENTJ:60, ENTP:52, INFJ:65, INFP:62, ENFJ:70, ENFP:60, ISTJ:82, ISFJ:75, ESTJ:80, ESFJ:88, ISTP:62, ISFP:72, ESTP:65, ESFP:78 },
    ESTJ: { INTJ:60, INTP:58, ENTJ:75, ENTP:60, INFJ:55, INFP:50, ENFJ:65, ENFP:55, ISTJ:88, ISFJ:80, ESTJ:72, ESFJ:82, ISTP:68, ISFP:60, ESTP:78, ESFP:68 },
    ESFJ: { INTJ:52, INTP:50, ENTJ:62, ENTP:55, INFJ:60, INFP:58, ENFJ:72, ENFP:65, ISTJ:80, ISFJ:88, ESTJ:82, ESFJ:72, ISTP:58, ISFP:70, ESTP:68, ESFP:82 },
    ISTP: { INTJ:70, INTP:74, ENTJ:65, ENTP:72, INFJ:58, INFP:56, ENFJ:55, ENFP:58, ISTJ:70, ISFJ:62, ESTJ:68, ESFJ:58, ISTP:72, ISFP:78, ESTP:88, ESFP:80 },
    ISFP: { INTJ:55, INTP:58, ENTJ:55, ENTP:60, INFJ:72, INFP:78, ENFJ:80, ENFP:82, ISTJ:65, ISFJ:72, ESTJ:60, ESFJ:70, ISTP:78, ISFP:72, ESTP:80, ESFP:88 },
    ESTP: { INTJ:58, INTP:60, ENTJ:68, ENTP:70, INFJ:52, INFP:48, ENFJ:58, ENFP:62, ISTJ:72, ISFJ:65, ESTJ:78, ESFJ:68, ISTP:88, ISFP:80, ESTP:72, ESFP:85 },
    ESFP: { INTJ:50, INTP:52, ENTJ:58, ENTP:62, INFJ:62, INFP:65, ENFJ:75, ENFP:78, ISTJ:65, ISFJ:78, ESTJ:68, ESFJ:82, ISTP:80, ISFP:88, ESTP:85, ESFP:72 },
};

const VALID_MBTI = new Set(Object.keys(MBTI_MATRIX));

/**
 * MBTI compatibility score (0-100).
 */
const calculateMBTICompatibility = (mbti1, mbti2) => {
    if (!mbti1 || !mbti2) return 50;
    const t1 = mbti1.toUpperCase();
    const t2 = mbti2.toUpperCase();
    if (!VALID_MBTI.has(t1) || !VALID_MBTI.has(t2)) return 50;
    return MBTI_MATRIX[t1][t2] || 50;
};

/**
 * Age compatibility score (0-100).
 * Peak at 0-year difference, decreasing with larger gaps.
 */
const calculateAgeCompatibility = (birthDate1, birthDate2) => {
    if (!birthDate1 || !birthDate2) return 50;
    const age1 = Math.floor((Date.now() - new Date(birthDate1)) / (365.25 * 24 * 3600 * 1000));
    const age2 = Math.floor((Date.now() - new Date(birthDate2)) / (365.25 * 24 * 3600 * 1000));
    const diff = Math.abs(age1 - age2);
    if (diff <= 2) return 100;
    if (diff <= 5) return 90;
    if (diff <= 10) return 75;
    if (diff <= 15) return 60;
    if (diff <= 20) return 45;
    return Math.max(10, 45 - (diff - 20) * 1.5);
};

/**
 * Haversine formula — returns distance in km between two lat/lon points.
 */
const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Distance compatibility score (0-100).
 * Score decreases as distance increases beyond threshold.
 */
const calculateDistanceCompatibility = (lat1, lon1, lat2, lon2, maxDistanceKm = 100) => {
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 50;
    const dist = haversineDistance(lat1, lon1, lat2, lon2);
    if (dist <= 10) return 100;
    if (dist <= maxDistanceKm) {
        return Math.round(100 - ((dist - 10) / (maxDistanceKm - 10)) * 60);
    }
    return Math.max(0, Math.round(40 - ((dist - maxDistanceKm) / maxDistanceKm) * 40));
};

/**
 * Interests/hobbies overlap score (0-100).
 * Uses Jaccard similarity on lowercase interest arrays.
 */
const calculateInterestsCompatibility = (interests1, interests2) => {
    if (!interests1 || !interests2) return 50;
    const set1 = new Set(interests1.map((i) => i.toLowerCase().trim()));
    const set2 = new Set(interests2.map((i) => i.toLowerCase().trim()));
    if (set1.size === 0 || set2.size === 0) return 50;
    const intersection = [...set1].filter((i) => set2.has(i)).length;
    const union = new Set([...set1, ...set2]).size;
    return Math.round((intersection / union) * 100);
};

/**
 * Big Five personality trait compatibility (0-100).
 * Scores closer traits higher; uses inverse of normalized Euclidean distance.
 */
const calculateBigFiveCompatibility = (user1, user2) => {
    const traits = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
    const validTraits = traits.filter(
        (t) => user1[t] != null && user2[t] != null
    );
    if (validTraits.length === 0) return 50;

    const sumSquaredDiffs = validTraits.reduce((acc, t) => {
        const diff = (parseFloat(user1[t]) - parseFloat(user2[t])) / 100;
        return acc + diff * diff;
    }, 0);
    const normalizedDist = Math.sqrt(sumSquaredDiffs / validTraits.length);
    return Math.round((1 - normalizedDist) * 100);
};

/**
 * Combined compatibility score with weighted components.
 * Returns an object with individual scores and totalScore.
 */
const calculateCompatibilityScore = (user1, user2, maxDistanceKm = 100) => {
    const mbtiScore = calculateMBTICompatibility(user1.mbti_type, user2.mbti_type);
    const ageScore = calculateAgeCompatibility(user1.birth_date, user2.birth_date);
    const distanceScore = calculateDistanceCompatibility(
        user1.location_lat, user1.location_lon,
        user2.location_lat, user2.location_lon,
        maxDistanceKm
    );
    const interestsScore = calculateInterestsCompatibility(user1.interests, user2.interests);
    const bigFiveScore = calculateBigFiveCompatibility(user1, user2);

    // Weighted average
    const weights = { mbti: 0.30, age: 0.15, distance: 0.20, interests: 0.20, bigFive: 0.15 };
    const totalScore = Math.round(
        mbtiScore * weights.mbti +
        ageScore * weights.age +
        distanceScore * weights.distance +
        interestsScore * weights.interests +
        bigFiveScore * weights.bigFive
    );

    return { totalScore, mbtiScore, ageScore, distanceScore, interestsScore, bigFiveScore };
};

/**
 * Find perfect matches among a list of user objects.
 * Returns array of { userId, matchUserId, score } pairs above the threshold.
 */
const findPerfectMatchesForAllUsers = (users, threshold = 80) => {
    const matches = [];
    for (let i = 0; i < users.length; i++) {
        for (let j = i + 1; j < users.length; j++) {
            const u1 = users[i];
            const u2 = users[j];
            const { totalScore } = calculateCompatibilityScore(u1, u2);
            if (totalScore >= threshold) {
                matches.push({ userId: u1.id, matchUserId: u2.id, score: totalScore });
                matches.push({ userId: u2.id, matchUserId: u1.id, score: totalScore });
            }
        }
    }
    return matches;
};

/**
 * Find perfect matches for a single user given their userId.
 * Queries the DB directly; intended for script use.
 */
const findPerfectMatchesForUser = async (userId, pool, threshold = 80) => {
    const result = await pool.query(
        `SELECT u.*, up.min_age, up.max_age, up.preferred_genders, up.max_distance_km
         FROM users u
         LEFT JOIN user_preferences up ON u.id = up.user_id
         WHERE u.is_active = TRUE AND u.mbti_type IS NOT NULL`,
        []
    );
    const users = result.rows;
    const currentUser = users.find((u) => u.id === userId);
    if (!currentUser) return [];

    return users
        .filter((u) => u.id !== userId)
        .map((u) => ({ ...calculateCompatibilityScore(currentUser, u), candidateId: u.id }))
        .filter((r) => r.totalScore >= threshold)
        .map((r) => ({ userId, matchUserId: r.candidateId, score: r.totalScore }));
};

module.exports = {
    calculateMBTICompatibility,
    calculateAgeCompatibility,
    calculateDistanceCompatibility,
    calculateInterestsCompatibility,
    calculateBigFiveCompatibility,
    calculateCompatibilityScore,
    findPerfectMatchesForAllUsers,
    findPerfectMatchesForUser,
    haversineDistance,
};
