const Sentiment = require('sentiment');
const analyzer = new Sentiment();

/**
 * Analyze the sentiment of a given text.
 * Returns an object with label, score, comparative, and keyword arrays.
 */
function analyzeSentiment(text) {
    if (!text || typeof text !== 'string') {
        return {
            label: 'Neutral',
            score: 0,
            comparative: 0,
            positiveWords: [],
            negativeWords: []
        };
    }

    const result = analyzer.analyze(text);

    let label = 'Neutral';
    if (result.comparative > 0.05) {
        label = 'Positive';
    } else if (result.comparative < -0.05) {
        label = 'Negative';
    }

    return {
        label,
        score: result.score,
        comparative: parseFloat(result.comparative.toFixed(4)),
        positiveWords: [...new Set(result.positive)],
        negativeWords: [...new Set(result.negative)]
    };
}

module.exports = { analyzeSentiment };
