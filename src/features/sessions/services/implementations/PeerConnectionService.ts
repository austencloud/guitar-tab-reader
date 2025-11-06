import { injectable } from 'inversify';
import Peer, { type DataConnection } from 'peerjs';
import type { IPeerConnection } from '../contracts/IPeerConnection';
import type { SessionEvent, ConnectionStatus } from '../../types';
import { ConnectionState } from '../../types';

/**
 * WebRTC peer connection service using PeerJS
 * Handles all low-level peer-to-peer communication
 */

@injectable()
export class PeerConnectionService implements IPeerConnection {
	private peer: Peer | null = null;
	private connections: Map<string, DataConnection> = new Map();
	private connectionStatus: ConnectionStatus = {
		state: ConnectionState.DISCONNECTED,
		connectedPeers: 0
	};

	// Event callbacks
	private eventCallback: ((event: SessionEvent, fromPeerId: string) => void) | null = null;
	private statusCallback: ((status: ConnectionStatus) => void) | null = null;
	private peerConnectedCallback: ((peerId: string) => void) | null = null;
	private peerDisconnectedCallback: ((peerId: string) => void) | null = null;

	async initialize(peerId?: string): Promise<string> {
		return new Promise((resolve, reject) => {
			try {
				// Create peer with optional custom ID
				// Using public PeerJS cloud server (can be replaced with custom server later)
				const options: any = {
					debug: 2 // Set to 0 in production
				};

				this.peer = peerId ? new Peer(peerId, options) : new Peer(options);

				this.peer.on('open', (id) => {
					console.log('[PeerConnection] Peer initialized with ID:', id);
					this.updateConnectionStatus({
						state: ConnectionState.CONNECTED
					});
					resolve(id);
				});

				this.peer.on('error', (error) => {
					console.error('[PeerConnection] Peer error:', error);
					this.updateConnectionStatus({
						state: ConnectionState.ERROR,
						error: error.message
					});
					reject(error);
				});

				// Handle incoming connections
				this.peer.on('connection', (conn) => {
					console.log('[PeerConnection] Incoming connection from:', conn.peer);
					this.setupConnection(conn);
				});

				this.peer.on('disconnected', () => {
					console.log('[PeerConnection] Peer disconnected');
					this.updateConnectionStatus({
						state: ConnectionState.DISCONNECTED
					});
				});
			} catch (error) {
				reject(error);
			}
		});
	}

	async createSession(sessionCode: string): Promise<void> {
		if (!this.peer) {
			throw new Error('Peer not initialized');
		}

		console.log('[PeerConnection] Creating session with code:', sessionCode);
		// For the host, we just wait for incoming connections
		// The session code will be used by joiners to find this peer
		this.updateConnectionStatus({
			state: ConnectionState.CONNECTED
		});
	}

	async joinSession(sessionCode: string, hostPeerId: string): Promise<void> {
		if (!this.peer) {
			throw new Error('Peer not initialized');
		}

		console.log('[PeerConnection] Joining session:', sessionCode, 'Host:', hostPeerId);

		return new Promise((resolve, reject) => {
			try {
				this.updateConnectionStatus({
					state: ConnectionState.CONNECTING
				});

				// Connect to the host
				const conn = this.peer!.connect(hostPeerId, {
					reliable: true,
					serialization: 'json'
				});

				this.setupConnection(conn);

				conn.on('open', () => {
					console.log('[PeerConnection] Connected to host');
					this.updateConnectionStatus({
						state: ConnectionState.CONNECTED
					});
					resolve();
				});

				conn.on('error', (error) => {
					console.error('[PeerConnection] Connection error:', error);
					this.updateConnectionStatus({
						state: ConnectionState.ERROR,
						error: error.message
					});
					reject(error);
				});
			} catch (error) {
				reject(error);
			}
		});
	}

	async leaveSession(): Promise<void> {
		console.log('[PeerConnection] Leaving session');

		// Close all connections
		for (const conn of this.connections.values()) {
			conn.close();
		}
		this.connections.clear();

		this.updateConnectionStatus({
			state: ConnectionState.DISCONNECTED,
			connectedPeers: 0
		});
	}

	async broadcast(event: SessionEvent): Promise<void> {
		if (this.connections.size === 0) {
			console.warn('[PeerConnection] No peers to broadcast to');
			return;
		}

		console.log('[PeerConnection] Broadcasting event:', event.type, 'to', this.connections.size, 'peers');

		// Send to all connected peers
		for (const [peerId, conn] of this.connections) {
			try {
				conn.send(event);
			} catch (error) {
				console.error(`[PeerConnection] Failed to send to ${peerId}:`, error);
			}
		}
	}

	async sendTo(peerId: string, event: SessionEvent): Promise<void> {
		const conn = this.connections.get(peerId);
		if (!conn) {
			throw new Error(`No connection to peer: ${peerId}`);
		}

		console.log('[PeerConnection] Sending event:', event.type, 'to', peerId);
		conn.send(event);
	}

	onEvent(callback: (event: SessionEvent, fromPeerId: string) => void): void {
		this.eventCallback = callback;
	}

	onConnectionStatusChange(callback: (status: ConnectionStatus) => void): void {
		this.statusCallback = callback;
	}

	onPeerConnected(callback: (peerId: string) => void): void {
		this.peerConnectedCallback = callback;
	}

	onPeerDisconnected(callback: (peerId: string) => void): void {
		this.peerDisconnectedCallback = callback;
	}

	getPeerId(): string | null {
		return this.peer?.id || null;
	}

	getConnectedPeers(): string[] {
		return Array.from(this.connections.keys());
	}

	getConnectionStatus(): ConnectionStatus {
		return { ...this.connectionStatus };
	}

	destroy(): void {
		console.log('[PeerConnection] Destroying peer connection');
		this.leaveSession();
		this.peer?.destroy();
		this.peer = null;
		this.eventCallback = null;
		this.statusCallback = null;
		this.peerConnectedCallback = null;
		this.peerDisconnectedCallback = null;
	}

	// ============================================================================
	// Private Methods
	// ============================================================================

	private setupConnection(conn: DataConnection): void {
		const peerId = conn.peer;

		conn.on('open', () => {
			console.log('[PeerConnection] Connection established with:', peerId);
			this.connections.set(peerId, conn);
			this.updateConnectionStatus({
				connectedPeers: this.connections.size
			});
			this.peerConnectedCallback?.(peerId);
		});

		conn.on('data', (data) => {
			try {
				const event = data as SessionEvent;
				console.log('[PeerConnection] Received event:', event.type, 'from:', peerId);
				this.eventCallback?.(event, peerId);
			} catch (error) {
				console.error('[PeerConnection] Failed to parse event:', error);
			}
		});

		conn.on('close', () => {
			console.log('[PeerConnection] Connection closed with:', peerId);
			this.connections.delete(peerId);
			this.updateConnectionStatus({
				connectedPeers: this.connections.size
			});
			this.peerDisconnectedCallback?.(peerId);
		});

		conn.on('error', (error) => {
			console.error(`[PeerConnection] Connection error with ${peerId}:`, error);
			this.connections.delete(peerId);
			this.updateConnectionStatus({
				connectedPeers: this.connections.size,
				error: error.message
			});
			this.peerDisconnectedCallback?.(peerId);
		});
	}

	private updateConnectionStatus(updates: Partial<ConnectionStatus>): void {
		this.connectionStatus = {
			...this.connectionStatus,
			...updates
		};
		this.statusCallback?.(this.connectionStatus);
	}
}
