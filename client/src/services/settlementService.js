import axios from 'axios';

const API_URL = 'http://localhost:5000/api/settlements';

// Add a settlement
export const addSettlement = async (roomCode, settlement) => {
    const response = await axios.post(
        `${API_URL}/${roomCode}`,
        settlement
    );
    return response.data;
};

// Get all settlements
export const getSettlements = async (roomCode) => {
    const response = await axios.get(`${API_URL}/${roomCode}`);
    return response.data;
};

// Delete a settlement
export const deleteSettlement = async (roomCode, settlementId) => {
    const response = await axios.delete(
        `${API_URL}/${roomCode}/${settlementId}`
    );
    return response.data;
};