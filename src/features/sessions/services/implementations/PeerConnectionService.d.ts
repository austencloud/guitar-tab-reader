import type { IPeerConnection } from '../contracts/IPeerConnection';
import type { SessionEvent, ConnectionStatus } from '../../types';
/**
 * WebRTC peer connection service using PeerJS
 * Handles all low-level peer-to-peer communication
 */
export declare class PeerConnectionService implements IPeerConnection {
    private peer;
    private connections;
    private connectionStatus;
    private eventCallback;
    private statusCallback;
    private peerConnectedCallback;
    private peerDisconnectedCallback;
    initialize(peerId?: string): Promise<string>;
    createSession(sessionCode: string): Promise<void>;
    joinSession(sessionCode: string, hostPeerId: string): Promise<void>;
    leaveSession(): Promise<void>;
    broadcast(event: SessionEvent): Promise<void>;
    sendTo(peerId: string, event: SessionEvent): Promise<void>;
    onEvent(callback: (event: SessionEvent, fromPeerId: string) => void): void;
    onConnectionStatusChange(callback: (status: ConnectionStatus) => void): void;
    onPeerConnected(callback: (peerId: string) => void): void;
    onPeerDisconnected(callback: (peerId: string) => void): void;
    getPeerId(): string | null;
    getConnectedPeers(): string[];
    getConnectionStatus(): ConnectionStatus;
    destroy(): void;
    private setupConnection;
    private updateConnectionStatus;
}
