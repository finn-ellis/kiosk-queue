import { io, Socket } from 'socket.io-client';
import API_URL from './config';

// Connect specifically to the queue namespace so server-side isolation works
export const socket: Socket = io(`${API_URL}/queue`);

// Helper to request admin elevation
export function connectAsAdmin(password: string) {
	socket.emit('admin_connect', { password });
}

// Helper to downgrade back to public room
export function leaveAdmin() {
	socket.emit('admin_leave');
}
