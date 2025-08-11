import React, { useState, useEffect } from 'react';
import { removeFromQueue, getNext, checkAdminPassword } from '../api/api';
import { User } from '../api/api';
import { useQueue } from '../context/QueueContext';

const AdminView: React.FC = () => {
    const { queue: adminQueue, connectAdmin } = useQueue();
    const [error, setError] = useState<string | null>(null);
    const [password, setPassword] = useState<string | null>(null);

    useEffect(() => {
        if (!password) {
            const timer = setTimeout(() => {
                const pass = prompt("Enter admin password");
                if (pass) {
                    setPassword(pass);
                } else {
                    setError("Password is required to view this page.");
                }
            }, 500); // 500ms delay

            return () => clearTimeout(timer);
        } else {
            connectAdmin(password);

            const checkPassword = async () => {
                try {
                    await checkAdminPassword(password);
                    setError(null);
                } catch (error) {
                    console.error(error);
                    setError('Failed to fetch queue. Incorrect password?');
                }
            };
            checkPassword();
        }
    }, [password, connectAdmin]);

    const handleRemove = async (userId: number) => {
        if (!password) return;
        try {
            await removeFromQueue(password, userId);
        } catch (error) {
            console.error(error);
            alert('Failed to remove user.');
        }
    };

    const handleNext = async (lineNumber: number) => {
        if (!password) return;
        try {
            await getNext(password, lineNumber);
        } catch (error) {
            console.error(error);
            alert('Failed to advance queue.');
        }
    };

    if (error) {
        return <div>Error: {error}</div>;
    }

    const lines = adminQueue.reduce((acc, user) => {
        const lineNumber = user.line_number ?? -1;
        if (!acc[lineNumber]) {
            acc[lineNumber] = [];
        }
        acc[lineNumber].push(user);
        return acc;
    }, {} as Record<number, User[]>);


    return (
        <div>
            <h2>Admin - Queue Management</h2>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                {Object.entries(lines).map(([lineNumber, users]) => (
                    <div key={lineNumber}>
                        <h3>Line {parseInt(lineNumber, 10) + 1}</h3>
                        <button onClick={() => handleNext(parseInt(lineNumber, 10))}>Next</button>
                        <ul>
                            {users.map(user => (
                                <li key={user.id}>
                                    {user.name} (Party: {user.party_size}) - Place: {user.place_in_queue} - Phone: {user.phone_number}
                                    <button onClick={() => handleRemove(user.id)}>Remove</button>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminView;
