/**
 * Service identifier symbols for dependency injection
 * Using symbols ensures type-safe service resolution
 */

// Tab Services
export const TYPES = {
	// Tab feature services
	TabParser: Symbol.for('TabParser'),
	TabStorage: Symbol.for('TabStorage'),
	TabState: Symbol.for('TabState'),
	ChordService: Symbol.for('ChordService'),
	AutoScrollService: Symbol.for('AutoScrollService'),

	// Tuner feature services
	AudioProcessor: Symbol.for('AudioProcessor'),
	PitchDetector: Symbol.for('PitchDetector'),
	TunerState: Symbol.for('TunerState'),

	// Practice feature services
	PracticeState: Symbol.for('PracticeState'),
	AudioState: Symbol.for('AudioState'),

	// Shared services
	UIState: Symbol.for('UIState'),
	UserState: Symbol.for('UserState'),
	PersistenceManager: Symbol.for('PersistenceManager'),
	StorageService: Symbol.for('StorageService'),

	// Session feature services
	PeerConnection: Symbol.for('PeerConnection'),
	SessionStorage: Symbol.for('SessionStorage'),
	SessionManager: Symbol.for('SessionManager'),
	SessionState: Symbol.for('SessionState')
} as const;

export type ServiceType = (typeof TYPES)[keyof typeof TYPES];
