import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import socket from '../socket';

let API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
if (API_URL.endsWith('/')) API_URL = API_URL.slice(0, -1);

function ViewPoll() {
    const { id } = useParams();
    const [poll, setPoll] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);
    const [hasVoted, setHasVoted] = useState(false);
    const [voteError, setVoteError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [copied, setCopied] = useState(false);

    const storageKey = `voted_poll_${id}`;

    const fetchPoll = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/api/polls/${id}`);
            if (res.status === 404) {
                setNotFound(true);
                setLoading(false);
                return;
            }
            if (!res.ok) throw new Error('Failed to fetch poll');
            const data = await res.json();
            setPoll(data);
        } catch (err) {
            console.error(err);
            setNotFound(true);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (localStorage.getItem(storageKey) === 'true') {
            setHasVoted(true);
        }

        fetchPoll();

        socket.connect();
        socket.emit('join_poll', id);

        socket.on('poll_updated', (updatedPoll) => {
            setPoll(updatedPoll);
        });

        socket.on('vote_error', (data) => {
            setVoteError(data.message);
            setSubmitting(false);
        });

        socket.on('connect', () => {
            socket.emit('join_poll', id);
            fetchPoll();
        });

        return () => {
            socket.off('poll_updated');
            socket.off('vote_error');
            socket.off('connect');
            socket.disconnect();
        };
    }, [id, fetchPoll, storageKey]);

    const handleVote = () => {
        if (!selectedOption || submitting) return;
        setVoteError('');
        setSubmitting(true);

        socket.emit('submit_vote', { pollId: id, optionId: selectedOption });

        localStorage.setItem(storageKey, 'true');
        setHasVoted(true);
        setSubmitting(false);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const totalVotes = poll
        ? poll.options.reduce((sum, opt) => sum + opt.voteCount, 0)
        : 0;

    if (loading) {
        return (
            <div className="view-poll">
                <div className="card glass-card loading-card">
                    <div className="spinner large" />
                    <p>Loading poll…</p>
                </div>
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="view-poll">
                <div className="card glass-card not-found-card">
                    <div className="not-found-icon">🔍</div>
                    <h2>Poll Not Found</h2>
                    <p>This poll doesn't exist or the link is invalid.</p>
                    <Link to="/" className="btn-primary">
                        ← Create a New Poll
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="view-poll">
            {copied && <div className="copy-toast">✓ Link copied to clipboard!</div>}
            <div className="card glass-card poll-card">
                <h1 className="poll-question">{poll.question}</h1>

                <div className="vote-meta">
                    <span className="total-votes">
                        🗳️ {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
                    </span>
                    {hasVoted && <span className="voted-badge">✓ You voted</span>}
                </div>

                {voteError && <div className="error-banner">{voteError}</div>}

                {!hasVoted && (
                    <div className="voting-section">
                        <div className="options-vote-list">
                            {poll.options.map((opt) => (
                                <label
                                    key={opt._id}
                                    className={`vote-option ${selectedOption === opt._id ? 'selected' : ''}`}
                                >
                                    <input
                                        type="radio"
                                        name="vote"
                                        value={opt._id}
                                        checked={selectedOption === opt._id}
                                        onChange={() => setSelectedOption(opt._id)}
                                    />
                                    <span className="radio-custom" />
                                    <span className="vote-option-text">{opt.text}</span>
                                </label>
                            ))}
                        </div>
                        <button
                            className="btn-primary btn-vote"
                            disabled={!selectedOption || submitting}
                            onClick={handleVote}
                        >
                            {submitting ? <span className="spinner" /> : 'Submit Vote'}
                        </button>
                    </div>
                )}

                {hasVoted && (
                    <div className="results-section">
                        {poll.options.map((opt) => {
                            const pct = totalVotes > 0 ? ((opt.voteCount / totalVotes) * 100).toFixed(1) : 0;
                            return (
                                <div key={opt._id} className="result-bar-wrapper">
                                    <div className="result-bar-header">
                                        <span className="result-bar-label">{opt.text}</span>
                                        <span className="result-bar-count">
                                            {opt.voteCount} ({pct}%)
                                        </span>
                                    </div>
                                    <div className="result-bar-track">
                                        <div
                                            className="result-bar-fill"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="share-section">
                    <p className="share-label">Share this poll</p>
                    <div className="share-input-row">
                        <input
                            type="text"
                            value={window.location.href}
                            readOnly
                            className="share-url"
                        />
                        <button
                            className="btn-copy"
                            onClick={handleCopy}
                        >
                            {copied ? '✓ Copied' : 'Copy'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ViewPoll;
