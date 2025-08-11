import React, { useState, useEffect } from 'react';
import JoinQueueView from '../views/JoinQueueView';
import ConfirmationView from '../views/ConfirmationView';
import AdminView from '../views/AdminView';
import { useParams } from 'react-router-dom';
import { useQueue } from '../context/QueueContext';

const Kiosk: React.FC = () => {
    const { lineNumber } = useParams<{ lineNumber?: string }>();
    const { queue, waitTime: globalWaitTime } = useQueue();
    const [view, setView] = useState('default'); // default, confirmation, admin
    const [userData, setUserData] = useState<{ place_in_queue: number, wait_time: number } | null>(null);
    const [adminPassword, setAdminPassword] = useState('');
    const [localWaitTime, setLocalWaitTime] = useState(0);
    const [localQueue, setLocalQueue] = useState(queue);

    useEffect(() => {
        const lineNum = lineNumber ? parseInt(lineNumber, 10) : undefined;
        if (lineNum !== undefined && [0, 1].includes(lineNum)) {
            const lineQueue = queue.filter(u => u.line_number === lineNum);
            const totalWait = lineQueue.reduce((acc, user) => acc + (user.place_in_queue * 5), 0);
            setLocalWaitTime(totalWait);
            setLocalQueue(lineQueue);
        } else {
            setLocalQueue(queue);
            setLocalWaitTime(globalWaitTime);
        }
    }, [lineNumber, queue, globalWaitTime]);

    const handleJoinSuccess = (data: { place_in_queue: number, wait_time: number }) => {
        setUserData(data);
        setView('confirmation');
    };


    const handleAdminLogin = () => {
        const password = prompt("Enter admin password");
        if (password) {
            setAdminPassword(password);
            setView('admin');
        }
    };

    const handleAuthFailure = () => {
        setView('default');
    };

    const renderView = () => {
        switch (view) {
            case 'confirmation':
                return userData && <ConfirmationView placeInQueue={userData.place_in_queue} waitTime={userData.wait_time} />;
            case 'admin':
                return <AdminView password={adminPassword} onAuthFailure={handleAuthFailure} />;
            default:
                return (
                    <div>
                        <h1>Kiosk Queue {lineNumber !== undefined ? ` - Line ${parseInt(lineNumber, 10) + 1}` : ''}</h1>
                        <p>Current Wait Time: {localWaitTime} minutes</p>
                        <p>Queue Size: {localQueue.length}</p>
                        <JoinQueueView onJoinSuccess={handleJoinSuccess} lineNumber={lineNumber ? parseInt(lineNumber, 10) : undefined} />
                        <button style={{ position: 'absolute', bottom: '10px', right: '10px' }} onClick={handleAdminLogin}>Admin</button>
                    </div>
                );
        }
    };

    return (
        <div>
            {renderView()}
        </div>
    );
};

export default Kiosk;
