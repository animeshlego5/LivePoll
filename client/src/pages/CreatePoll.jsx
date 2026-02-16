import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

let API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
if (API_URL.endsWith('/')) API_URL = API_URL.slice(0, -1);

function CreatePoll() {
    const navigate = useNavigate();
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const addOption = () => {
        if (options.length >= 8) return;
        setOptions([...options, '']);
    };

    const removeOption = (index) => {
        if (options.length <= 2) return;
        setOptions(options.filter((_, i) => i !== index));
    };

    const updateOption = (index, value) => {
        const updated = [...options];
        updated[index] = value;
        setOptions(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const trimmedQuestion = question.trim();
        const validOptions = options.map((o) => o.trim()).filter((o) => o.length > 0);

        if (!trimmedQuestion) {
            setError('Please enter a question.');
            return;
        }
        if (validOptions.length < 2) {
            setError('Please provide at least 2 options.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/polls`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: trimmedQuestion, options: validOptions }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create poll');
            }

            const { pollId } = await res.json();
            navigate(`/poll/${pollId}`);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-poll">
            <div className="card glass-card">
                <div className="card-header">
                    <h1>Create a Poll</h1>
                    <p className="subtitle">Ask a question, add options, and share the link for real-time voting.</p>
                </div>

                {error && <div className="error-banner">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="question">Your Question</label>
                        <input
                            id="question"
                            type="text"
                            placeholder="What should we have for lunch?"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            maxLength={200}
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label>Options</label>
                        <div className="options-list">
                            {options.map((opt, i) => (
                                <div key={i} className="option-row">
                                    <span className="option-number">{i + 1}</span>
                                    <input
                                        type="text"
                                        placeholder={`Option ${i + 1}`}
                                        value={opt}
                                        onChange={(e) => updateOption(i, e.target.value)}
                                        maxLength={100}
                                    />
                                    {options.length > 2 && (
                                        <button
                                            type="button"
                                            className="btn-icon btn-remove"
                                            onClick={() => removeOption(i)}
                                            title="Remove option"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        {options.length < 8 && (
                            <button type="button" className="btn-add-option" onClick={addOption}>
                                <span>+</span> Add Option
                            </button>
                        )}
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? (
                            <span className="spinner" />
                        ) : (
                            'Create Poll'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default CreatePoll;
