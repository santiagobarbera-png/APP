'use strict';

const {
    calculateMBTICompatibility,
    calculateAgeCompatibility,
    calculateDistanceCompatibility,
    calculateInterestsCompatibility,
    calculateBigFiveCompatibility,
    calculateCompatibilityScore,
    findPerfectMatchesForAllUsers,
    haversineDistance,
} = require('../backend/services/aiMatchingService');

describe('calculateMBTICompatibility', () => {
    test('returns high score for known compatible pair INFP-ENFJ', () => {
        expect(calculateMBTICompatibility('INFP', 'ENFJ')).toBe(95);
    });

    test('returns same-type score for INTJ-INTJ', () => {
        expect(calculateMBTICompatibility('INTJ', 'INTJ')).toBe(72);
    });

    test('returns default 50 for null types', () => {
        expect(calculateMBTICompatibility(null, 'INTJ')).toBe(50);
        expect(calculateMBTICompatibility('INTJ', null)).toBe(50);
    });

    test('returns default 50 for unknown types', () => {
        expect(calculateMBTICompatibility('XXXX', 'INTJ')).toBe(50);
    });

    test('is case-insensitive', () => {
        expect(calculateMBTICompatibility('infp', 'enfj')).toBe(95);
    });
});

describe('calculateAgeCompatibility', () => {
    const yearsAgo = (years) => {
        const d = new Date();
        d.setFullYear(d.getFullYear() - years);
        return d;
    };

    test('returns 100 for same-age users', () => {
        const d = yearsAgo(25);
        expect(calculateAgeCompatibility(d, d)).toBe(100);
    });

    test('returns 90 for 4-year difference', () => {
        expect(calculateAgeCompatibility(yearsAgo(25), yearsAgo(29))).toBe(90);
    });

    test('returns lower score for 15-year difference', () => {
        const score = calculateAgeCompatibility(yearsAgo(25), yearsAgo(40));
        // 15-year gap lands in the 60 bucket (<=15) or 45 bucket (<=20) depending on rounding
        expect(score).toBeGreaterThanOrEqual(45);
        expect(score).toBeLessThan(75);
    });

    test('returns 50 when dates are null', () => {
        expect(calculateAgeCompatibility(null, yearsAgo(25))).toBe(50);
    });
});

describe('haversineDistance', () => {
    test('returns ~0 for same coordinates', () => {
        expect(haversineDistance(40.7128, -74.006, 40.7128, -74.006)).toBeCloseTo(0, 1);
    });

    test('returns approximately 5570km between New York and London', () => {
        const dist = haversineDistance(40.7128, -74.006, 51.5074, -0.1278);
        expect(dist).toBeGreaterThan(5500);
        expect(dist).toBeLessThan(5700);
    });
});

describe('calculateDistanceCompatibility', () => {
    test('returns 100 for very close users (< 10km)', () => {
        const score = calculateDistanceCompatibility(40.71, -74.01, 40.72, -74.01);
        expect(score).toBe(100);
    });

    test('returns 50 for null coordinates', () => {
        expect(calculateDistanceCompatibility(null, null, 40.71, -74.01)).toBe(50);
    });

    test('returns lower score for distant users', () => {
        const score = calculateDistanceCompatibility(40.7128, -74.006, 51.5074, -0.1278);
        expect(score).toBeLessThan(40);
    });
});

describe('calculateInterestsCompatibility', () => {
    test('returns 100 for identical interests', () => {
        const interests = ['hiking', 'music', 'travel'];
        expect(calculateInterestsCompatibility(interests, interests)).toBe(100);
    });

    test('returns 0 for completely different interests', () => {
        expect(calculateInterestsCompatibility(['hiking'], ['cooking'])).toBe(0);
    });

    test('returns ~33 for one common interest out of three', () => {
        const score = calculateInterestsCompatibility(['hiking', 'music', 'travel'], ['hiking', 'cooking', 'reading']);
        expect(score).toBeGreaterThan(15);
        expect(score).toBeLessThan(35);
    });

    test('returns 50 for null interests', () => {
        expect(calculateInterestsCompatibility(null, ['hiking'])).toBe(50);
    });

    test('is case-insensitive', () => {
        expect(calculateInterestsCompatibility(['Hiking'], ['hiking'])).toBe(100);
    });
});

describe('calculateBigFiveCompatibility', () => {
    test('returns 100 for identical personality scores', () => {
        const user = { openness: 80, conscientiousness: 70, extraversion: 60, agreeableness: 75, neuroticism: 40 };
        expect(calculateBigFiveCompatibility(user, user)).toBe(100);
    });

    test('returns lower score for very different personalities', () => {
        const u1 = { openness: 100, conscientiousness: 100, extraversion: 100, agreeableness: 100, neuroticism: 0 };
        const u2 = { openness: 0, conscientiousness: 0, extraversion: 0, agreeableness: 0, neuroticism: 100 };
        expect(calculateBigFiveCompatibility(u1, u2)).toBeLessThan(20);
    });

    test('returns 50 when no trait data is available', () => {
        expect(calculateBigFiveCompatibility({}, {})).toBe(50);
    });
});

describe('calculateCompatibilityScore', () => {
    const user1 = {
        id: 1,
        mbti_type: 'INFP',
        birth_date: new Date(new Date().setFullYear(new Date().getFullYear() - 25)),
        location_lat: 40.7128, location_lon: -74.006,
        interests: ['hiking', 'music', 'travel'],
        openness: 80, conscientiousness: 70, extraversion: 50, agreeableness: 75, neuroticism: 40,
    };
    const user2 = {
        id: 2,
        mbti_type: 'ENFJ',
        birth_date: new Date(new Date().setFullYear(new Date().getFullYear() - 27)),
        location_lat: 40.73, location_lon: -74.0,
        interests: ['hiking', 'music', 'cooking'],
        openness: 75, conscientiousness: 65, extraversion: 70, agreeableness: 80, neuroticism: 35,
    };

    test('returns an object with all score components', () => {
        const result = calculateCompatibilityScore(user1, user2);
        expect(result).toHaveProperty('totalScore');
        expect(result).toHaveProperty('mbtiScore');
        expect(result).toHaveProperty('ageScore');
        expect(result).toHaveProperty('distanceScore');
        expect(result).toHaveProperty('interestsScore');
        expect(result).toHaveProperty('bigFiveScore');
    });

    test('totalScore is between 0 and 100', () => {
        const result = calculateCompatibilityScore(user1, user2);
        expect(result.totalScore).toBeGreaterThanOrEqual(0);
        expect(result.totalScore).toBeLessThanOrEqual(100);
    });

    test('INFP-ENFJ pair has high MBTI score', () => {
        const result = calculateCompatibilityScore(user1, user2);
        expect(result.mbtiScore).toBeGreaterThanOrEqual(90);
    });
});

describe('findPerfectMatchesForAllUsers', () => {
    const makeUser = (id, mbti, lat, lon, interests) => ({
        id,
        mbti_type: mbti,
        birth_date: new Date(new Date().setFullYear(new Date().getFullYear() - 25)),
        location_lat: lat, location_lon: lon,
        interests,
        openness: 70, conscientiousness: 65, extraversion: 55, agreeableness: 70, neuroticism: 40,
    });

    test('returns empty array for fewer than 2 users', () => {
        expect(findPerfectMatchesForAllUsers([])).toEqual([]);
        expect(findPerfectMatchesForAllUsers([makeUser(1, 'INFP', 40.7, -74.0, [])])).toEqual([]);
    });

    test('returns bidirectional matches above threshold', () => {
        const users = [
            makeUser(1, 'INFP', 40.71, -74.0, ['hiking', 'music']),
            makeUser(2, 'ENFJ', 40.72, -74.0, ['hiking', 'music']),
        ];
        const matches = findPerfectMatchesForAllUsers(users, 50);
        // Should produce two entries (both directions)
        expect(matches.length).toBeGreaterThanOrEqual(2);
        const userIds = matches.map((m) => m.userId);
        expect(userIds).toContain(1);
        expect(userIds).toContain(2);
    });

    test('respects threshold — no matches returned below threshold', () => {
        const users = [
            makeUser(1, 'INFP', 40.71, -74.0, []),
            makeUser(2, 'ISTJ', 51.5, -0.12, []),
        ];
        const matches = findPerfectMatchesForAllUsers(users, 99);
        expect(matches).toEqual([]);
    });
});
