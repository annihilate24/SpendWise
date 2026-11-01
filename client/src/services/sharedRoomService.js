
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/rooms';
const LAST_ROOM_CODE_KEY = 'spendwise:lastOpenedRoomCode';
const RECENT_ROOMS_KEY = 'spendwise:recentRooms';
const SAVED_MEMBER_KEY = 'spendwise:savedMemberName';

export const getSavedMemberName = () => {
    try {
        const direct = window.localStorage.getItem(SAVED_MEMBER_KEY);
        if (direct && direct.trim()) return direct.trim();

        // Fallback to member name from recentRooms if available
        const recent = getSavedRooms();
        const found = recent.find((r) => r.memberName && r.memberName.trim());
        if (found) return found.memberName.trim();

        return '';
    } catch {
        return '';
    }
};

export const saveSavedMemberName = (memberName) => {
    try {
        const trimmed = String(memberName || '').trim();
        if (trimmed) {
            window.localStorage.setItem(SAVED_MEMBER_KEY, trimmed);
        } else {
            window.localStorage.removeItem(SAVED_MEMBER_KEY);
        }
        return true;
    } catch {
        return false;
    }
};

export const clearSavedMemberName = () => {
    try {
        window.localStorage.removeItem(SAVED_MEMBER_KEY);
        return true;
    } catch {
        return false;
    }
};

export const getSavedRooms = () => {
    try {
        const savedRooms = JSON.parse(window.localStorage.getItem(RECENT_ROOMS_KEY) || '[]');
        return Array.isArray(savedRooms)
            ? savedRooms.filter((room) => typeof room?.roomCode === 'string' && room.roomCode.trim())
            : [];
    } catch {
        return [];
    }
};

export const saveRoomToRecentList = ({ roomCode, roomName, memberName }) => {
    const normalizedCode = String(roomCode || '').trim().toUpperCase();
    if (!normalizedCode) return { rooms: getSavedRooms(), saved: false };

    const existingRooms = getSavedRooms();
    const previousRoom = existingRooms.find(
        (room) => room.roomCode.toUpperCase() === normalizedCode
    );
    const updatedRoom = {
        roomCode: normalizedCode,
        roomName: roomName || previousRoom?.roomName || 'Shared room',
        memberName: memberName || previousRoom?.memberName || ''
    };
    const rooms = [
        updatedRoom,
        ...existingRooms.filter((room) => room.roomCode.toUpperCase() !== normalizedCode)
    ];

    try {
        window.localStorage.setItem(RECENT_ROOMS_KEY, JSON.stringify(rooms));
        window.localStorage.setItem(LAST_ROOM_CODE_KEY, normalizedCode);
        return { rooms, saved: true };
    } catch {
        return { rooms: existingRooms, saved: false };
    }
};

export const removeRoomFromRecentList = (roomCode) => {
    const normalizedCode = String(roomCode || '').trim().toUpperCase();
    const rooms = getSavedRooms().filter(
        (room) => room.roomCode.toUpperCase() !== normalizedCode
    );

    try {
        window.localStorage.setItem(RECENT_ROOMS_KEY, JSON.stringify(rooms));
        if (getLastOpenedRoomCode().toUpperCase() === normalizedCode) {
            window.localStorage.removeItem(LAST_ROOM_CODE_KEY);
        }
        return rooms;
    } catch {
        return getSavedRooms();
    }
};

export const getLastOpenedRoomCode = () => {
    try {
        return window.localStorage.getItem(LAST_ROOM_CODE_KEY) || '';
    } catch {
        return '';
    }
};

export const saveLastOpenedRoomCode = (roomCode) => {
    try {
        window.localStorage.setItem(LAST_ROOM_CODE_KEY, roomCode);
        return true;
    } catch {
        return false;
    }
};

export const clearLastOpenedRoomCode = () => {
    try {
        window.localStorage.removeItem(LAST_ROOM_CODE_KEY);
    } catch {
        // Storage may be unavailable in private browsing or restricted contexts.
    }
};

// Create a shared room
export const createRoom = async (roomData) => {
    const response = await axios.post(API_URL, roomData);
    return response.data;
};

// Join an existing room
export const joinRoom = async (roomData) => {
    const response = await axios.post(`${API_URL}/join`, roomData);
    return response.data;
};

// Get room details
export const getRoom = async (roomCode) => {
    const response = await axios.get(`${API_URL}/${roomCode}`);
    return response.data;
};

// Retrieve all rooms for a member from MongoDB
export const getRoomsByMember = async (memberName) => {
    const trimmed = String(memberName || '').trim();
    if (!trimmed) {
        return { rooms: [], message: 'Member name is required.' };
    }
    const response = await axios.get(`${API_URL}/member/${encodeURIComponent(trimmed)}`);
    return response.data;
};

