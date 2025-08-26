import React, { useState, useEffect } from 'react';
import JoinQueueView from '../views/JoinQueueView';
import ConfirmationView from '../views/ConfirmationView';
import { useParams } from 'react-router-dom';
import { useQueue } from '../context/QueueContext';

const Kiosk: React.FC = () => {
    const { lineNumber } = useParams<{ lineNumber?: string }>();
    const { queue, waitDetail } = useQueue();
    const [view, setView] = useState('default'); // default, confirmation
    const [userData, setUserData] = useState<{ place_in_queue: number, wait_time: number, line_number?: number, party_size?: number, initial_estimated_wait?: number } | null>(null);
    // const [localWaitTime, setLocalWaitTime] = useState(0);
    const [localQueue, setLocalQueue] = useState(queue);

    useEffect(() => {
        const lineNum = lineNumber ? parseInt(lineNumber, 10) : undefined;
        if (lineNum !== undefined && [0, 1].includes(lineNum)) {
            const lineQueue = queue.filter(u => u.line_number === lineNum);
            // const totalWait = lineQueue.reduce((acc, user) => acc + (user.place_in_queue * 5), 0);
            // setLocalWaitTime(totalWait);
            setLocalQueue(lineQueue);
        } else {
            setLocalQueue(queue);
            // setLocalWaitTime(globalWaitTime);
        }
    }, [lineNumber, queue]);

    const handleJoinSuccess = (data: { place_in_queue: number, wait_time: number, line_number: number, party_size: number, initial_estimated_wait?: number }) => {
        setUserData(data);
        setView('confirmation');
    };

    const renderView = () => {
        switch (view) {
            case 'confirmation':
                return userData && (
                    <ConfirmationView
                        placeInQueue={userData.place_in_queue}
                        waitTime={userData.wait_time}
                        initialEstimatedWait={userData.initial_estimated_wait}
                        partySize={userData.party_size}
                        lineNumber={userData.line_number}
                        perLineSingle={waitDetail?.per_line_single}
                        perSpan={waitDetail?.per_span}
                        onNewSignup={() => { setUserData(null); setView('default'); }}
                    />
                );
            default:
                return (
                    <div>
                        <h1>Kiosk Queue {lineNumber !== undefined ? ` - Line ${parseInt(lineNumber, 10) + 1}` : ''}</h1>
                        {/* <p>Current Wait Time: {localWaitTime} minutes</p> */}
                        <p>Queue Size: {localQueue.length}</p>
                        <JoinQueueView onJoinSuccess={handleJoinSuccess} lineNumber={lineNumber ? parseInt(lineNumber, 10) : undefined} />
                    </div>
                );
        }
    };

    return (
        <div className="kiosk-shell">
            {renderView()}
            <style>{`
                .kiosk-shell { font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,sans-serif; padding:1.25rem .75rem 2rem; }
                .kiosk-shell h1 { margin:0 0 1rem; font-size:1.85rem; font-weight:650; letter-spacing:.5px; background:linear-gradient(90deg,#0d5cab,#1976d2); -webkit-background-clip:text; color:transparent; }
                .kiosk-shell > div > p { font-size:.85rem; margin:.15rem 0 .75rem; color:#475660; }
            `}</style>
        </div>
    );
};

export default Kiosk;
