import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { User, QueueState, WaitDetail } from '../api/api';
import { socket } from '../api/socket';

interface QueueContextType {
    queue: User[];
    waitDetail: WaitDetail | undefined;
    connectAdmin: (password: string) => void;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

export const QueueProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [queue, setQueue] = useState<User[]>([]);
    const [waitDetail, setWaitDetail] = useState<WaitDetail | undefined>(undefined);

    useEffect(() => {
        const handleQueueUpdate = (data: QueueState) => {
            console.log(data);
            setQueue(data.queue);
            setWaitDetail(data.wait_detail);
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
    <QueueContext.Provider value={{ queue, waitDetail, connectAdmin }}>
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
