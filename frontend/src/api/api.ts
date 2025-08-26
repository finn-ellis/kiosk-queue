const API_URL = 'http://localhost:5000/api/kiosk';

export interface User {
    id: number;
    name: string;
    phone_number: string;
    party_size: number;
    place_in_queue: number;
    line_number?: number;
}

export interface WaitDetail {
    per_line_single: number[]; // minutes wait to join each individual line as size 1
    per_span: Record<number, number>; // span_size -> minutes wait
}

export interface QueueState {
    queue: User[];
    wait_time: number; // legacy aggregate
    wait_detail?: WaitDetail;
}

export const getQueue = async (): Promise<QueueState> => {
    const response = await fetch(`${API_URL}/queue`);
    if (!response.ok) {
        throw new Error('Failed to fetch queue');
    }
    return response.json();
};

export const joinQueue = async (name: string, phoneNumber: string, partySize: number, lineNumber?: number): Promise<any> => {
    const response = await fetch(`${API_URL}/join`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, phone_number: phoneNumber, party_size: partySize, line_number: lineNumber }),
    });
    if (!response.ok) {
        throw new Error('Failed to join queue');
    }
    return response.json();
};

export const checkAdminPassword = async (password: string): Promise<any> => {
    const response = await fetch(`${API_URL}/admin/check_password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
    });
    if (!response.ok) {
        throw new Error('Incorrect password');
    }
    return response.json();
};

export const getNext = async (password: string, lineNumber: number): Promise<any> => {
    const response = await fetch(`${API_URL}/admin/next`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password, line_number: lineNumber }),
    });
    if (!response.ok) {
        throw new Error('Failed to get next in queue');
    }
    return response.json();
};

export const removeFromQueue = async (password: string, userId: number): Promise<any> => {
    const response = await fetch(`${API_URL}/admin/remove`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password, user_id: userId }),
    });
    if (!response.ok) {
        throw new Error('Failed to remove from queue');
    }
    return response.json();
};

export const getAdminQueue = async (password: string): Promise<QueueState> => {
    const response = await fetch(`${API_URL}/admin/queue`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch admin queue');
    }
    return response.json();
};
