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
    readonly AudioProcessor: symbol;
    readonly PitchDetector: symbol;
    readonly TunerState: symbol;
    readonly PracticeState: symbol;
    readonly AudioState: symbol;
    readonly UIState: symbol;
    readonly UserState: symbol;
    readonly PersistenceManager: symbol;
    readonly StorageService: symbol;
};
export type ServiceType = (typeof TYPES)[keyof typeof TYPES];
