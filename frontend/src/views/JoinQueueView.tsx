import React, { useState } from 'react';
import { joinQueue } from '../api/api';

interface JoinQueueViewProps {
    onJoinSuccess: (data: { place_in_queue: number, wait_time: number }) => void;
    lineNumber?: number;
}

const JoinQueueView: React.FC<JoinQueueViewProps> = ({ onJoinSuccess, lineNumber }) => {
    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [partySize, setPartySize] = useState(1);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) {
            setError('Name is required');
            return;
        }
        try {
            const data = await joinQueue(name, phoneNumber, partySize, lineNumber);
            onJoinSuccess(data);
        } catch (err) {
            setError('Failed to join queue. Please try again.');
            console.error(err);
        }
    };

    return (
        <div>
            <h2>Join the Queue</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Name:</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div>
                    <label>Phone Number (optional):</label>
                    <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
                </div>
                <div>
                    <label>Party Size: {partySize}</label>
                    <input type="range" value={partySize} onChange={(e) => setPartySize(parseInt(e.target.value, 10))} min="1" max="2" />
                </div>
                <button type="submit">Join Queue</button>
            </form>
        </div>
    );
};

export default JoinQueueView;
