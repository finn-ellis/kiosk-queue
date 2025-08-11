import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { User, QueueState } from '../api/api';
import { socket } from '../api/socket';

interface QueueContextType {
    queue: User[];
    waitTime: number;
    connectAdmin: (password: string) => void;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

export const QueueProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [queue, setQueue] = useState<User[]>([]);
    const [waitTime, setWaitTime] = useState(0);

    useEffect(() => {
        const handleQueueUpdate = (data: QueueState) => {
            console.log(data);
            setQueue(data.queue);
            setWaitTime(data.wait_time);
        };

        socket.on('queue_update', handleQueueUpdate);
        socket.emit('get_queue'); // Initial fetch

        // Re-join public room on connect to ensure user gets updates
        socket.on('connect', () => {
            socket.emit('join_public');
        });

        return () => {
            socket.off('queue_update', handleQueueUpdate);
            socket.off('connect');
        };
    }, []);

    const connectAdmin = useCallback((password: string) => {
        socket.emit('admin_connect', { password });
    }, []);

    return (
        <QueueContext.Provider value={{ queue, waitTime, connectAdmin }}>
            {children}
        </QueueContext.Provider>
    );
};

export const useQueue = () => {
    const context = useContext(QueueContext);
    if (context === undefined) {
        throw new Error('useQueue must be used within a QueueProvider');
    }
    return context;
};
