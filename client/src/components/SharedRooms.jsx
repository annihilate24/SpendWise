import { useEffect, useState, useCallback } from 'react';
import {
    createRoom,
    joinRoom,
    getRoom,
    getRoomsByMember,
    getSavedMemberName,
    saveSavedMemberName,
    clearSavedMemberName,
    getLastOpenedRoomCode,
    saveLastOpenedRoomCode,
    clearLastOpenedRoomCode,
    saveRoomToRecentList
} from '../services/sharedRoomService';

import SharedExpense from './SharedExpense';

function SharedRooms() {
    // Member identity & switcher state
    const [currentMember, setCurrentMember] = useState(() => getSavedMemberName());
    const [memberInput, setMemberInput] = useState(() => getSavedMemberName());

    // Member's rooms from MongoDB (source of truth)
    const [memberRooms, setMemberRooms] = useState([]);
    const [loadingRooms, setLoadingRooms] = useState(false);
    const [roomsError, setRoomsError] = useState('');

    // Currently opened room details
    const [room, setRoom] = useState(null);
    const [openingRoomCode, setOpeningRoomCode] = useState('');
    const [restoringRoom, setRestoringRoom] = useState(
        () => Boolean(getLastOpenedRoomCode())
    );

    // Form inputs
    const [roomName, setRoomName] = useState('');
    const [creatorName, setCreatorName] = useState(() => getSavedMemberName());
    const [joinRoomCode, setJoinRoomCode] = useState('');
    const [joinMemberName, setJoinMemberName] = useState(() => getSavedMemberName());
    const [findRoomCode, setFindRoomCode] = useState('');

    // Feedback notifications
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Fetch all rooms for a member directly from MongoDB
    const loadMemberRooms = useCallback(async (memberName) => {
        if (!memberName || !memberName.trim()) {
            setMemberRooms([]);
            return;
        }

        const trimmed = memberName.trim();
        setLoadingRooms(true);
        setRoomsError('');

        try {
            const data = await getRoomsByMember(trimmed);
            const fetched = Array.isArray(data?.rooms) ? data.rooms : [];
            setMemberRooms(fetched);
        } catch (fetchErr) {
            console.error('Error fetching member rooms:', fetchErr);
            setRoomsError(
                fetchErr.response?.data?.message ||
                'Unable to retrieve your rooms from MongoDB. Please check your connection and try again.'
            );
            setMemberRooms([]);
        } finally {
            setLoadingRooms(false);
        }
    }, []);

    // Initial mount: load member rooms from MongoDB & restore last opened room if any
    useEffect(() => {
        let isActive = true;
        const initialMember = getSavedMemberName();
        const savedRoomCode = getLastOpenedRoomCode();

        if (initialMember) {
            loadMemberRooms(initialMember);
        }

        if (savedRoomCode) {
            const restoreRoom = async () => {
                try {
                    const data = await getRoom(savedRoomCode);
                    const savedRoom = data?.room;

                    if (!savedRoom?.roomCode || !Array.isArray(savedRoom.members)) {
                        throw new Error('Invalid saved room data');
                    }

                    if (!isActive) return;
                    setRoom(savedRoom);
                } catch (restoreError) {
                    if (!isActive) return;
                    if (restoreError.response?.status === 404) {
                        clearLastOpenedRoomCode();
                        setRoom(null);
                    }
                } finally {
                    if (isActive) {
                        setRestoringRoom(false);
                    }
                }
            };

            restoreRoom();
        } else {
            setRestoringRoom(false);
        }

        return () => {
            isActive = false;
        };
    }, [loadMemberRooms]);

    // Switch or set active member
    const handleSwitchMember = async (e) => {
        e?.preventDefault();
        const trimmed = memberInput.trim();

        if (!trimmed) {
            setError('Please enter a member name to view rooms.');
            return;
        }

        setError('');
        setMessage(`Viewing shared rooms for "${trimmed}".`);
        saveSavedMemberName(trimmed);
        setCurrentMember(trimmed);
        setCreatorName(trimmed);
        setJoinMemberName(trimmed);

        await loadMemberRooms(trimmed);
    };

    // Open a selected room
    const handleOpenRoom = async (codeToOpen) => {
        if (!codeToOpen) return;

        setError('');
        setMessage('');
        setOpeningRoomCode(codeToOpen);

        try {
            const data = await getRoom(codeToOpen);
            if (!data?.room?.roomCode || !Array.isArray(data.room.members)) {
                throw new Error('Invalid room data received.');
            }

            const openedRoom = data.room;
            setRoom(openedRoom);
            saveLastOpenedRoomCode(openedRoom.roomCode);

            // Keep legacy recent list updated
            saveRoomToRecentList({
                roomCode: openedRoom.roomCode,
                roomName: openedRoom.roomName,
                memberName: currentMember
            });

            setMessage(`Room "${openedRoom.roomName}" opened.`);
        } catch (openErr) {
            if (openErr.response?.status === 404) {
                clearLastOpenedRoomCode();
                if (room?.roomCode?.toUpperCase() === codeToOpen.toUpperCase()) {
                    setRoom(null);
                }
                setError(`Room ${codeToOpen} was not found in MongoDB.`);
                if (currentMember) loadMemberRooms(currentMember);
            } else {
                setError(openErr.response?.data?.message || 'Unable to open room. Please try again.');
            }
        } finally {
            setOpeningRoomCode('');
        }
    };

    // Close current room view
    const handleCloseRoom = () => {
        setRoom(null);
        clearLastOpenedRoomCode();
        setMessage('Room view closed.');
    };

    // Clear active member session
    const handleClearMember = () => {
        clearSavedMemberName();
        clearLastOpenedRoomCode();
        setCurrentMember('');
        setMemberInput('');
        setCreatorName('');
        setJoinMemberName('');
        setMemberRooms([]);
        setRoom(null);
        setMessage('Active member cleared.');
        setError('');
    };

    // Create a new shared room
    const handleCreateRoom = async (e) => {
        e.preventDefault();

        setError('');
        setMessage('');

        if (!roomName.trim() || !creatorName.trim()) {
            setError('Room name and creator name are required.');
            return;
        }

        setLoading(true);
        const trimmedCreator = creatorName.trim();

        try {
            const data = await createRoom({
                roomName: roomName.trim(),
                createdBy: trimmedCreator
            });

            const newRoom = data.room;

            // Remember the member name
            saveSavedMemberName(trimmedCreator);
            setCurrentMember(trimmedCreator);
            setMemberInput(trimmedCreator);
            setJoinMemberName(trimmedCreator);

            // Set as active opened room
            setRoom(newRoom);
            saveLastOpenedRoomCode(newRoom.roomCode);
            saveRoomToRecentList({
                roomCode: newRoom.roomCode,
                roomName: newRoom.roomName,
                memberName: trimmedCreator
            });

            // Refresh rooms for this member directly from MongoDB
            await loadMemberRooms(trimmedCreator);

            setMessage(`Shared room "${newRoom.roomName}" created successfully! Room code: ${newRoom.roomCode}`);
            setRoomName('');
        } catch (createErr) {
            setError(
                createErr.response?.data?.message ||
                'Unable to create shared room.'
            );
        } finally {
            setLoading(false);
        }
    };

    // Join an existing shared room
    const handleJoinRoom = async (e) => {
        e.preventDefault();

        setError('');
        setMessage('');

        if (!joinRoomCode.trim() || !joinMemberName.trim()) {
            setError('Room code and your member name are required.');
            return;
        }

        setLoading(true);
        const trimmedMember = joinMemberName.trim();
        const code = joinRoomCode.trim().toUpperCase();

        try {
            const data = await joinRoom({
                roomCode: code,
                memberName: trimmedMember
            });

            const joinedRoom = data.room;

            // Remember member name
            saveSavedMemberName(trimmedMember);
            setCurrentMember(trimmedMember);
            setMemberInput(trimmedMember);
            setCreatorName(trimmedMember);

            // Set as active room
            setRoom(joinedRoom);
            saveLastOpenedRoomCode(joinedRoom.roomCode);
            saveRoomToRecentList({
                roomCode: joinedRoom.roomCode,
                roomName: joinedRoom.roomName,
                memberName: trimmedMember
            });

            // Refresh member's rooms from MongoDB
            await loadMemberRooms(trimmedMember);

            setMessage(`Joined room "${joinedRoom.roomName}" successfully!`);
            setJoinRoomCode('');
        } catch (joinErr) {
            setError(
                joinErr.response?.data?.message ||
                'Unable to join shared room.'
            );
        } finally {
            setLoading(false);
        }
    };

    // Find room details by code
    const handleFindRoom = async (e) => {
        e.preventDefault();

        setError('');
        setMessage('');

        if (!findRoomCode.trim()) {
            setError('Please enter a room code.');
            return;
        }

        setLoading(true);
        const code = findRoomCode.trim().toUpperCase();

        try {
            const data = await getRoom(code);
            const foundRoom = data.room;

            setRoom(foundRoom);
            saveLastOpenedRoomCode(foundRoom.roomCode);
            saveRoomToRecentList({
                roomCode: foundRoom.roomCode,
                roomName: foundRoom.roomName,
                memberName: currentMember
            });

            setMessage(`Room "${foundRoom.roomName}" details loaded.`);
            setFindRoomCode('');
        } catch (findErr) {
            setError(
                findErr.response?.data?.message ||
                'Unable to find room. Please check the room code.'
            );
        } finally {
            setLoading(false);
        }
    };

    // Copy room code to clipboard
    const handleCopyCode = async (codeToCopy) => {
        try {
            await navigator.clipboard.writeText(codeToCopy);
            setMessage(`Room code ${codeToCopy} copied to clipboard!`);
            setError('');
        } catch {
            setError('Unable to copy room code.');
        }
    };

    return (
        <div className="shared-rooms-container">
            <h2>Shared Rooms</h2>
            <p>Manage expenses together with friends and roommates.</p>

            {/* Prototype Security Notice */}
            <aside className="prototype-notice" role="note">
                <span className="notice-icon" aria-hidden="true">ℹ️</span>
                <div>
                    <strong>Prototype Notice:</strong> Room retrieval is based on member name matching in MongoDB without user authentication. Member names do not provide secure identity verification; production multi-user access control requires authentication.
                </div>
            </aside>

            {message && (
                <p className="success-message" role="status">{message}</p>
            )}

            {error && (
                <p className="error-message" role="alert">{error}</p>
            )}

            {restoringRoom && (
                <div className="loading-state room-restore-loading" role="status">
                    <span className="loading-spinner" aria-hidden="true" />
                    <span>Restoring your last opened room...</span>
                </div>
            )}

            {/* Member Switcher Bar */}
            <div className="member-bar">
                <div className="member-info">
                    <span>Active Member:</span>
                    {currentMember ? (
                        <div className="member-tag-wrap">
                            <strong className="member-name-tag">{currentMember}</strong>
                            <button
                                type="button"
                                className="clear-member-btn"
                                title="Clear active member"
                                onClick={handleClearMember}
                            >
                                Clear
                            </button>
                        </div>
                    ) : (
                        <span className="no-member-tag">None set (Create or join a room)</span>
                    )}
                </div>

                <form className="member-switch-form" onSubmit={handleSwitchMember}>
                    <input
                        aria-label="Member name to switch to"
                        type="text"
                        placeholder="Switch member name..."
                        value={memberInput}
                        onChange={(e) => setMemberInput(e.target.value)}
                    />
                    <button type="submit" disabled={loadingRooms || !memberInput.trim()}>
                        {loadingRooms ? 'Loading...' : 'Switch'}
                    </button>
                </form>
            </div>

            {/* My Rooms Section (Retrieved from MongoDB) */}
            <section className="recent-rooms-section" aria-labelledby="my-rooms-heading">
                <div className="recent-rooms-heading">
                    <div>
                        <h3 id="my-rooms-heading">
                            My Rooms {currentMember ? `(${currentMember})` : ''}
                        </h3>
                        <p>All shared rooms you belong to, retrieved live from MongoDB.</p>
                    </div>
                    {currentMember && (
                        <button
                            type="button"
                            className="refresh-rooms-btn"
                            onClick={() => loadMemberRooms(currentMember)}
                            disabled={loadingRooms}
                            title="Refresh room list from MongoDB"
                        >
                            {loadingRooms ? 'Refreshing...' : '↻ Refresh Rooms'}
                        </button>
                    )}
                </div>

                {/* Loading state */}
                {loadingRooms && (
                    <div className="room-state-box loading-state" role="status">
                        <span className="loading-spinner" aria-hidden="true" />
                        <span>Retrieving your shared rooms from MongoDB...</span>
                    </div>
                )}

                {/* Error state */}
                {!loadingRooms && roomsError && (
                    <div className="room-state-box error-state" role="alert">
                        <p>{roomsError}</p>
                        <button
                            type="button"
                            className="retry-btn"
                            onClick={() => loadMemberRooms(currentMember)}
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Empty state */}
                {!loadingRooms && !roomsError && memberRooms.length === 0 && (
                    <div className="recent-rooms-empty">
                        <p>
                            {currentMember
                                ? `No shared rooms found for "${currentMember}" in MongoDB.`
                                : 'No member name specified.'}
                        </p>
                        <p className="empty-subtext">
                            {currentMember
                                ? 'Create a new room or join an existing room below to get started.'
                                : 'Enter your name above or create/join a room below to view your rooms.'}
                        </p>
                    </div>
                )}

                {/* Grid of rooms */}
                {!loadingRooms && !roomsError && memberRooms.length > 0 && (
                    <div className="recent-rooms-grid">
                        {memberRooms.map((roomItem) => {
                            const isActive = room?.roomCode?.toUpperCase() === roomItem.roomCode.toUpperCase();
                            const isOpening = openingRoomCode.toUpperCase() === roomItem.roomCode.toUpperCase();

                            return (
                                <article
                                    className={`recent-room-card${isActive ? ' active' : ''}`}
                                    key={roomItem.roomCode || roomItem._id}
                                >
                                    <div className="recent-room-card-top">
                                        <h4 title={roomItem.roomName}>{roomItem.roomName}</h4>
                                        {isActive && <span className="active-room-badge">Open</span>}
                                    </div>

                                    <div className="recent-room-code">
                                        <span>Room Code</span>
                                        <div className="room-code-tag-group">
                                            <strong>{roomItem.roomCode}</strong>
                                            <button
                                                type="button"
                                                className="mini-copy-btn"
                                                title="Copy Room Code"
                                                onClick={() => handleCopyCode(roomItem.roomCode)}
                                            >
                                                Copy
                                            </button>
                                        </div>
                                    </div>

                                    <div className="recent-room-creator">
                                        <span>Creator</span>
                                        <strong>{roomItem.createdBy || 'Unknown'}</strong>
                                    </div>

                                    <div className="recent-room-members-list">
                                        <span className="members-title">
                                            Members ({roomItem.members?.length || 0})
                                        </span>
                                        <div className="member-tags">
                                            {roomItem.members?.map((m, idx) => {
                                                const mName = typeof m === 'string' ? m : m.name;
                                                const isCreator = mName.toLowerCase() === (roomItem.createdBy || '').toLowerCase();
                                                const isCurrent = currentMember && mName.toLowerCase() === currentMember.toLowerCase();

                                                return (
                                                    <span
                                                        key={idx}
                                                        className={`member-tag${isCreator ? ' creator' : ''}${isCurrent ? ' you' : ''}`}
                                                        title={isCreator ? `${mName} (Creator)` : mName}
                                                    >
                                                        {mName}{isCurrent ? ' (You)' : ''}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {roomItem.createdAt && (
                                        <div className="recent-room-date">
                                            <span>Created</span>
                                            <time dateTime={roomItem.createdAt}>
                                                {new Date(roomItem.createdAt).toLocaleDateString(undefined, {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </time>
                                        </div>
                                    )}

                                    <div className="recent-room-actions">
                                        <button
                                            type="button"
                                            disabled={loading || isOpening}
                                            onClick={() => handleOpenRoom(roomItem.roomCode)}
                                        >
                                            {isOpening
                                                ? 'Opening Room...'
                                                : isActive
                                                    ? 'Active (Click to Refresh)'
                                                    : 'Open Room'}
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Room Creation & Joining Forms */}
            <div className="shared-room-cards">
                {/* Create Room */}
                <div className="room-card">
                    <h3>Create a Room</h3>
                    <form onSubmit={handleCreateRoom}>
                        <input
                            aria-label="Room name"
                            type="text"
                            placeholder="Enter room name"
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                            required
                        />

                        <input
                            aria-label="Your name for the new room"
                            type="text"
                            placeholder="Your name"
                            value={creatorName}
                            onChange={(e) => setCreatorName(e.target.value)}
                            required
                        />

                        <button type="submit" disabled={loading || restoringRoom}>
                            {loading ? 'Please wait...' : 'Create Room'}
                        </button>
                    </form>
                </div>

                {/* Join Room */}
                <div className="room-card">
                    <h3>Join a Room</h3>
                    <form onSubmit={handleJoinRoom}>
                        <input
                            aria-label="Room code to join"
                            type="text"
                            placeholder="Enter room code"
                            value={joinRoomCode}
                            onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())}
                            required
                        />

                        <input
                            aria-label="Your name to join the room"
                            type="text"
                            placeholder="Your name"
                            value={joinMemberName}
                            onChange={(e) => setJoinMemberName(e.target.value)}
                            required
                        />

                        <button type="submit" disabled={loading || restoringRoom}>
                            {loading ? 'Please wait...' : 'Join Room'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Find Room by Code */}
            <div className="room-card find-room-card">
                <h3>Find Room Details</h3>
                <form onSubmit={handleFindRoom}>
                    <input
                        aria-label="Room code to find"
                        type="text"
                        placeholder="Enter room code"
                        value={findRoomCode}
                        onChange={(e) => setFindRoomCode(e.target.value.toUpperCase())}
                        required
                    />

                    <button type="submit" disabled={loading || restoringRoom}>
                        {loading ? 'Please wait...' : 'Find Room'}
                    </button>
                </form>
            </div>

            {/* Room Details & Shared Expenses */}
            {room && (
                <div className="room-details" id="room-details-section">
                    <div className="room-details-header">
                        <div>
                            <h3>{room.roomName}</h3>
                            <p className="room-code-display">
                                <span>Room code</span>
                                <strong>{room.roomCode}</strong>
                            </p>
                        </div>
                        <div className="room-details-actions">
                            <button
                                type="button"
                                onClick={() => handleOpenRoom(room.roomCode)}
                                disabled={openingRoomCode === room.roomCode}
                                title="Refresh room details from MongoDB"
                            >
                                {openingRoomCode === room.roomCode ? 'Refreshing...' : 'Refresh Room'}
                            </button>
                            <button
                                type="button"
                                onClick={() => handleCopyCode(room.roomCode)}
                            >
                                Copy Room Code
                            </button>
                            <button
                                type="button"
                                className="close-room-btn"
                                onClick={handleCloseRoom}
                            >
                                Close Room View
                            </button>
                        </div>
                    </div>

                    <h4>Room Members ({room.members?.length || 0})</h4>
                    <ul>
                        {room.members?.map((member, index) => {
                            const name = typeof member === 'string' ? member : member.name;
                            const isCreator = name.toLowerCase() === (room.createdBy || '').toLowerCase();
                            return (
                                <li key={index}>
                                    {name} {isCreator ? '(Creator)' : ''}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}

            {/* Shared Expenses & Settlements for the selected room */}
            {room && (
                <SharedExpense key={room.roomCode} room={room} />
            )}
        </div>
    );
}

export default SharedRooms;
