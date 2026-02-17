const matches = []; // This can be replaced with your database model

// Get all matches
exports.getMatches = (req, res) => {
    res.status(200).json(matches);
};

// Create a new match
exports.createMatch = (req, res) => {
    const match = req.body; // Assuming match data comes in the body
    matches.push(match);
    res.status(201).json(match);
};

// Update match status
exports.updateMatchStatus = (req, res) => {
    const { id } = req.params; // Get match ID from route parameters
    const match = matches.find(m => m.id === id);
    if (match) {
        match.status = req.body.status; // Update the match status
        res.status(200).json(match);
    } else {
        res.status(404).json({ message: 'Match not found' });
    }
};

// Delete a match
exports.deleteMatch = (req, res) => {
    const { id } = req.params;
    const index = matches.findIndex(m => m.id === id);
    if (index !== -1) {
        matches.splice(index, 1);
        res.status(204).send();
    } else {
        res.status(404).json({ message: 'Match not found' });
    }
};