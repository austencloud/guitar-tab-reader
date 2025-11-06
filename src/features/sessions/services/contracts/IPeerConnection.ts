import type { SessionEvent, ConnectionStatus } from '../../types';

/**
 * Interface for WebRTC peer connection management
 * Abstracts PeerJS implementation details
 */

export interface IPeerConnection {
	/**
	 * Initialize the peer connection with a unique peer ID
	 * @param peerId Optional peer ID (generated if not provided)
	 */
	initialize(peerId?: string): Promise<string>;

	/**
	 * Create a new session and become the host
	 * @param sessionCode The room/session code
	 */
	createSession(sessionCode: string): Promise<void>;

	/**
	 * Join an existing session using a code
	 * @param sessionCode The room/session code to join
	 * @param hostPeerId The peer ID of the session host
	 */
	joinSession(sessionCode: string, hostPeerId: string): Promise<void>;

	/**
	 * Leave the current session and disconnect from all peers
	 */
	leaveSession(): Promise<void>;

	/**
	 * Broadcast an event to all connected peers
	 * @param event The event to broadcast
	 */
	broadcast(event: SessionEvent): Promise<void>;

	/**
	 * Send an event to a specific peer
	 * @param peerId The target peer ID
	 * @param event The event to send
	 */
	sendTo(peerId: string, event: SessionEvent): Promise<void>;

	/**
	 * Subscribe to events from peers
	 * @param callback Function to call when an event is received
	 */
	onEvent(callback: (event: SessionEvent, fromPeerId: string) => void): void;

	/**
	 * Subscribe to connection status changes
	 * @param callback Function to call when connection status changes
	 */
	onConnectionStatusChange(callback: (status: ConnectionStatus) => void): void;

	/**
	 * Subscribe to peer connections
	 * @param callback Function to call when a new peer connects
	 */
	onPeerConnected(callback: (peerId: string) => void): void;

	/**
	 * Subscribe to peer disconnections
	 * @param callback Function to call when a peer disconnects
	 */
	onPeerDisconnected(callback: (peerId: string) => void): void;

	/**
	 * Get the current peer ID
	 */
	getPeerId(): string | null;

	/**
	 * Get all connected peer IDs
	 */
	getConnectedPeers(): string[];

	/**
	 * Get current connection status
	 */
	getConnectionStatus(): ConnectionStatus;

	/**
	 * Clean up and destroy the peer connection
	 */
	destroy(): void;
}
