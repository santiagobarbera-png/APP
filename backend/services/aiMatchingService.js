// AI Matching Service.
const calculateMBTICompatibility = (mbti1, mbti2) => {
    const matrix = {
        'INFP': { 'ENFJ': 95, 'INFJ': 90 },
        'ENFJ': { 'INFP': 95, 'INFJ': 85 },
    };
    return matrix[mbti1]?.[mbti2] || 50;
};

const calculateTotalCompatibility = (user1, user2) => {
    const score = calculateMBTICompatibility(user1.mbti, user2.mbti);
    return { totalScore: score };
};

module.exports = { calculateMBTICompatibility, calculateTotalCompatibility };