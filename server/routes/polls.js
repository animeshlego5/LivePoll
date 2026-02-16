const express = require('express');
const router = express.Router();
const Poll = require('../models/Poll');

router.post('/', async (req, res) => {
    try {
        const { question, options } = req.body;

        if (!question || !question.trim()) {
            return res.status(400).json({ error: 'Poll question is required' });
        }

        if (!Array.isArray(options) || options.length < 2) {
            return res.status(400).json({ error: 'At least 2 options are required' });
        }

        const validOptions = options
            .map((opt) => (typeof opt === 'string' ? opt.trim() : ''))
            .filter((opt) => opt.length > 0);

        if (validOptions.length < 2) {
            return res.status(400).json({ error: 'At least 2 non-empty options are required' });
        }

        const poll = await Poll.create({
            question: question.trim(),
            options: validOptions.map((text) => ({ text })),
        });

        res.status(201).json({ pollId: poll._id });
    } catch (err) {
        console.error('Error creating poll:', err.message);
        res.status(500).json({ error: 'Failed to create poll' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const poll = await Poll.findById(req.params.id).select('-voterIPHashes');

        if (!poll) {
            return res.status(404).json({ error: 'Poll not found' });
        }

        res.json(poll);
    } catch (err) {
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ error: 'Poll not found' });
        }
        console.error('Error fetching poll:', err.message);
        res.status(500).json({ error: 'Failed to fetch poll' });
    }
});

module.exports = router;
