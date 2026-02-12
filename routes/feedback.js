const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const { analyzeSentiment } = require('../utils/sentiment');

// ─── POST /api/feedback ── Submit new feedback ──────────────────────────
router.post('/', async (req, res) => {
    try {
        const { name, email, category, rating, message } = req.body;

        if (!name || !message) {
            return res.status(400).json({
                success: false,
                error: 'Name and feedback message are required.'
            });
        }

        // Analyze sentiment
        const sentiment = analyzeSentiment(message);

        const feedback = new Feedback({
            name: name.trim(),
            email: email ? email.trim() : '',
            category: category || 'General',
            rating: rating || 3,
            message: message.trim(),
            sentiment
        });

        await feedback.save();

        res.status(201).json({
            success: true,
            data: feedback,
            message: 'Feedback submitted and analyzed successfully!'
        });
    } catch (err) {
        console.error('Error submitting feedback:', err);
        res.status(500).json({
            success: false,
            error: 'Server error while saving feedback.'
        });
    }
});

// ─── GET /api/feedback ── Get all feedback (with optional filters) ──────
router.get('/', async (req, res) => {
    try {
        const { sentiment, category, limit = 50, page = 1 } = req.query;
        const filter = {};

        if (sentiment) filter['sentiment.label'] = sentiment;
        if (category) filter.category = category;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [feedbacks, total] = await Promise.all([
            Feedback.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Feedback.countDocuments(filter)
        ]);

        res.json({
            success: true,
            data: feedbacks,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (err) {
        console.error('Error fetching feedback:', err);
        res.status(500).json({ success: false, error: 'Server error.' });
    }
});

// ─── GET /api/feedback/stats ── Dashboard analytics data ────────────────
router.get('/stats', async (req, res) => {
    try {
        const [
            totalCount,
            sentimentCounts,
            categoryCounts,
            ratingDistribution,
            recentTrend,
            avgRating
        ] = await Promise.all([
            // Total feedback count
            Feedback.countDocuments(),

            // Sentiment distribution
            Feedback.aggregate([
                { $group: { _id: '$sentiment.label', count: { $sum: 1 } } }
            ]),

            // Category distribution
            Feedback.aggregate([
                { $group: { _id: '$category', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),

            // Rating distribution
            Feedback.aggregate([
                { $group: { _id: '$rating', count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ]),

            // Recent trend (last 7 days)
            Feedback.aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                        }
                    }
                },
                {
                    $group: {
                        _id: {
                            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                            sentiment: '$sentiment.label'
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.date': 1 } }
            ]),

            // Average rating
            Feedback.aggregate([
                { $group: { _id: null, avg: { $avg: '$rating' } } }
            ])
        ]);

        // Format sentiment counts
        const sentimentMap = { Positive: 0, Neutral: 0, Negative: 0 };
        sentimentCounts.forEach(s => {
            if (s._id) sentimentMap[s._id] = s.count;
        });

        // Format rating distribution
        const ratingMap = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        ratingDistribution.forEach(r => {
            ratingMap[r._id] = r.count;
        });

        // Format trend data
        const trendData = {};
        recentTrend.forEach(t => {
            if (!trendData[t._id.date]) {
                trendData[t._id.date] = { Positive: 0, Neutral: 0, Negative: 0 };
            }
            trendData[t._id.date][t._id.sentiment] = t.count;
        });

        res.json({
            success: true,
            data: {
                totalFeedback: totalCount,
                averageRating: avgRating.length ? parseFloat(avgRating[0].avg.toFixed(2)) : 0,
                sentimentDistribution: sentimentMap,
                categoryDistribution: categoryCounts.map(c => ({
                    category: c._id,
                    count: c.count
                })),
                ratingDistribution: ratingMap,
                trend: Object.entries(trendData).map(([date, sentiments]) => ({
                    date,
                    ...sentiments
                }))
            }
        });
    } catch (err) {
        console.error('Error fetching stats:', err);
        res.status(500).json({ success: false, error: 'Server error.' });
    }
});

// ─── DELETE /api/feedback/:id ── Delete a feedback entry ────────────────
router.delete('/:id', async (req, res) => {
    try {
        const feedback = await Feedback.findByIdAndDelete(req.params.id);
        if (!feedback) {
            return res.status(404).json({ success: false, error: 'Feedback not found.' });
        }
        res.json({ success: true, message: 'Feedback deleted successfully.' });
    } catch (err) {
        console.error('Error deleting feedback:', err);
        res.status(500).json({ success: false, error: 'Server error.' });
    }
});

module.exports = router;
