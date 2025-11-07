/**
 * Service identifier symbols for dependency injection
 * Using symbols ensures type-safe service resolution
 */
export declare const TYPES: {
    readonly TabParser: symbol;
    readonly TabStorage: symbol;
    readonly TabState: symbol;
    readonly ChordService: symbol;
    readonly AutoScrollService: symbol;
    readonly ITabContentProcessor: symbol;
    readonly IChordDictionaryService: symbol;
    readonly IResponsiveFontCalculator: symbol;
    readonly IUrlImportService: symbol;
    readonly ISmartImportService: symbol;
    readonly AudioProcessor: symbol;
    readonly PitchDetector: symbol;
    readonly TunerState: symbol;
    readonly PracticeState: symbol;
    readonly AudioState: symbol;
    readonly UIState: symbol;
    readonly UserState: symbol;
    readonly PersistenceManager: symbol;
    readonly StorageService: symbol;
    readonly LayoutState: symbol;
    readonly ModalOrchestrator: symbol;
    readonly ScrollBehaviorService: symbol;
    readonly NavigationCoordinator: symbol;
    readonly ContextManager: symbol;
    readonly PeerConnection: symbol;
    readonly SessionStorage: symbol;
    readonly SessionManager: symbol;
    readonly SessionState: symbol;
    readonly SessionEventBus: symbol;
    readonly SessionLifecycle: symbol;
    readonly QueueManagement: symbol;
    readonly MemberManagement: symbol;
    readonly PlaylistService: symbol;
    readonly SessionHistory: symbol;
    readonly PersistentRoomService: symbol;
    readonly SessionSync: symbol;
};
export type ServiceType = (typeof TYPES)[keyof typeof TYPES];
