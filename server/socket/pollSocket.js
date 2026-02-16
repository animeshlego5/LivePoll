const crypto = require('crypto');
const Poll = require('../models/Poll');

function hashIP(ip) {
    return crypto.createHash('sha256').update(ip).digest('hex');
}

module.exports = function initPollSocket(io) {
    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        socket.on('join_poll', (pollId) => {
            if (!pollId) return;
            socket.join(pollId);
        });

        socket.on('submit_vote', async ({ pollId, optionId }) => {
            try {
                if (!pollId || !optionId) {
                    socket.emit('vote_error', { message: 'pollId and optionId are required' });
                    return;
                }

                const rawIP =
                    socket.handshake.headers['x-forwarded-for'] ||
                    socket.handshake.address ||
                    'unknown';
                const ip = rawIP.split(',')[0].trim();
                const ipHash = hashIP(ip);

                const existingPoll = await Poll.findById(pollId);
                if (!existingPoll) {
                    socket.emit('vote_error', { message: 'Poll not found' });
                    return;
                }

                if (existingPoll.voterIPHashes.includes(ipHash)) {
                    socket.emit('vote_error', { message: 'You have already voted on this poll' });
                    return;
                }

                const optionExists = existingPoll.options.some(
                    (opt) => opt._id.toString() === optionId
                );
                if (!optionExists) {
                    socket.emit('vote_error', { message: 'Invalid option' });
                    return;
                }

                await Poll.updateOne(
                    { _id: pollId, 'options._id': optionId },
                    {
                        $inc: { 'options.$.voteCount': 1 },
                        $push: { voterIPHashes: ipHash },
                    }
                );

                const updatedPoll = await Poll.findById(pollId).select('-voterIPHashes');
                io.to(pollId).emit('poll_updated', updatedPoll);
            } catch (err) {
                console.error('Vote error:', err.message);
                socket.emit('vote_error', { message: 'Failed to submit vote' });
            }
        });

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });
};
