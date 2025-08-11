import React from 'react';

interface ConfirmationViewProps {
    placeInQueue: number;
    waitTime: number;
}

const ConfirmationView: React.FC<ConfirmationViewProps> = ({ placeInQueue, waitTime }) => {
    const arrivalTime = new Date(Date.now() + waitTime * 60000).toLocaleTimeString();

    return (
        <div>
            <h2>You're in the Queue!</h2>
            <p>Your place in line: {placeInQueue}</p>
            <p>Estimated time until your turn: {waitTime} minutes</p>
            <p>Estimated arrival time: {arrivalTime}</p>
        </div>
    );
};

export default ConfirmationView;
