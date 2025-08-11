import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { User } from '../api/api';
import { useQueue } from '../context/QueueContext';

const NextUpView: React.FC = () => {
    const { lineNumber } = useParams<{ lineNumber?: string }>();
    const { queue } = useQueue();
    const [nextUp, setNextUp] = useState<User[]>([]);

    useEffect(() => {
        let nextUpUsers: User[] = [];

        if (lineNumber !== undefined) {
            const lineNum = parseInt(lineNumber, 10);
            const user = queue.find(u => u.line_number === lineNum && u.place_in_queue === 1);
            if (user) {
                nextUpUsers.push(user);
            }
        } else {
            const lines: Record<number, User> = {};
            queue.forEach(user => {
                if (user.place_in_queue === 1 && user.line_number !== undefined) {
                    lines[user.line_number] = user;
                }
            });
            nextUpUsers = Object.values(lines).sort((a, b) => (a.line_number ?? 0) - (b.line_number ?? 0));
        }
        setNextUp(nextUpUsers);
    }, [lineNumber, queue]);

    return (
        <div>
            <h1>Next Up</h1>
            {nextUp.length > 0 ? (
                <ul>
                    {nextUp.map(user => (
                        <li key={user.id}>
                            <h3>Line {user.line_number !== undefined ? user.line_number + 1 : 'N/A'}</h3>
                            <p>Name: {user.name}</p>
                            <p>Party Size: {user.party_size}</p>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No one is currently up next.</p>
            )}
        </div>
    );
};

export default NextUpView;
