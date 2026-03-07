'use strict';

const { calculateMBTICompatibility, calculateBigFiveCompatibility } = require('../services/aiMatchingService');

class Personality {
    constructor(mbtiType, bigFiveScores) {
        this.mbtiType = mbtiType;
        this.bigFiveScores = bigFiveScores;
    }

    calculateCompatibility(otherPersonality) {
        const mbtiScore = calculateMBTICompatibility(this.mbtiType, otherPersonality.mbtiType);
        const bigFiveScore = calculateBigFiveCompatibility(this.bigFiveScores, otherPersonality.bigFiveScores);
        const totalScore = Math.round(mbtiScore * 0.5 + bigFiveScore * 0.5);
        return { mbtiScore, bigFiveScore, totalScore };
    }

    storeData(_data) {
        // Persistence handled via User model and database schema
    }

    analyzeData() {
        return {
            mbtiType: this.mbtiType,
            bigFiveScores: this.bigFiveScores,
        };
    }
}

module.exports = Personality;