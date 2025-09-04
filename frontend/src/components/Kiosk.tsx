import React, { useState, useEffect } from 'react';
import PlayerCountView from '../views/PlayerCountView';
import NameInputView from '../views/NameInputView';
import EmailInputView from '../views/EmailInputView';
import EmailOptInView from '../views/EmailOptInView';
import ConfirmationView from '../views/ConfirmationView';
import { useParams } from 'react-router-dom';
import { useQueue } from '../context/QueueContext';
import { joinQueue } from '../api/api';

type UserData = {
    place_in_queue: number;
    wait_time: number;
    line_number?: number;
    party_name?: string;
    party_size?: number;
    initial_estimated_wait?: number;
};

const Kiosk: React.FC = () => {
    const { lineNumber } = useParams<{ lineNumber?: string }>();
    const { queue, waitDetail } = useQueue();
    const [view, setView] = useState('playerCount'); // playerCount, nameInput, emailInput, emailOptIn, confirmation
    const [selectedPlayerCount, setSelectedPlayerCount] = useState(1);
    const [partyName, setPartyName] = useState('');
    const [email, setEmail] = useState<string | null>(null);
    const [emailOptIn, setEmailOptIn] = useState(false);
    const [userData, setUserData] = useState<UserData | null>(null);
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

    const handleJoinSuccess = (data: UserData) => {
        setUserData(data);
        setView('confirmation');
    };

    const handlePlayerCountNext = () => {
        setView('nameInput');
    };

    const handleBackToPlayerCount = () => {
        setView('playerCount');
    };

    const handleNameInputNext = (name: string) => {
        setPartyName(name);
        setView('emailInput');
    };

    const handleBackToNameInput = () => {
        setView('nameInput');
    };

    const handleEmailInputNext = (emailAddress: string | null) => {
        if (emailAddress) {
            setEmail(emailAddress);
            setView('emailOptIn');
        } else {
            handleEmailOptInNext(false);
        }
    };

    const handleBackToEmailInput = () => {
        setView('emailInput');
    };

    const handleEmailOptInNext = async (optIn: boolean) => {
        setEmailOptIn(optIn);
        // Submit to queue with collected data
        try {
            // Use the API with collected form data
            // const { joinQueue } = await import('../api/api');
            // we use optIn here because emailOptIn state might not be updated yet
            const data = await joinQueue(partyName, email || '', optIn, selectedPlayerCount, lineNumber ? parseInt(lineNumber, 10) : undefined);
            handleJoinSuccess({ ...data, email: email, party_name: partyName, party_size: selectedPlayerCount, line_number: data.line_number });
        } catch (err) {
            console.error('Failed to join queue:', err);
            // Could add error handling here
        }
    };

    const renderView = () => {
        switch (view) {
            case 'playerCount':
                return (
                    <PlayerCountView
                        selectedCount={selectedPlayerCount}
                        onCountSelect={setSelectedPlayerCount}
                        onNext={handlePlayerCountNext}
                        currentStep={1}
                        totalSteps={7}
                    />
                );
            case 'nameInput':
                return (
                    <NameInputView
                        onNext={handleNameInputNext}
                        onBack={handleBackToPlayerCount}
                        currentStep={2}
                        totalSteps={7}
                    />
                );
            case 'emailInput':
                return (
                    <EmailInputView
                        onNext={handleEmailInputNext}
                        onBack={handleBackToNameInput}
                        currentStep={4}
                        totalSteps={7}
                    />
                );
            case 'emailOptIn':
                return (
                    <EmailOptInView
                        onNext={handleEmailOptInNext}
                        onBack={handleBackToEmailInput}
                        currentStep={5}
                        totalSteps={7}
                    />
                );
            case 'confirmation':
                return userData && (
                    <ConfirmationView
                        placeInQueue={userData.place_in_queue}
                        waitTime={userData.wait_time}
                        initialEstimatedWait={userData.initial_estimated_wait}
                        partySize={userData.party_size}
                        name={partyName}
                        lineNumber={userData.line_number}
                        perLineSingle={waitDetail?.per_line_single}
                        perSpan={waitDetail?.per_span}
                        onNewSignup={() => {
                            setUserData(null);
                            setSelectedPlayerCount(1);
                            setPartyName('');
                            setEmail('');
                            setEmailOptIn(false);
                            setView('playerCount');
                        }}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="kiosk-shell">
            {renderView()}
            <style>{`
                .kiosk-shell { font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,sans-serif; }
                .kiosk-shell h1 { margin:0 0 1rem; font-size:1.85rem; font-weight:650; letter-spacing:.5px; background:linear-gradient(90deg,#0d5cab,#1976d2); -webkit-background-clip:text; color:transparent; }
                // .kiosk-shell > div > p { font-size:.85rem; margin:.15rem 0 .75rem; color:#475660; }
            `}</style>
        </div>
    );
};

export default Kiosk;
