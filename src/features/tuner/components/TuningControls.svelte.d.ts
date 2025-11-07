interface Props {
    selectedTuning?: string;
    onstart?: () => void;
    onstop?: () => void;
    ontuningChange?: (tuning: string) => void;
}
declare const TuningControls: import("svelte").Component<Props, {}, "">;
type TuningControls = ReturnType<typeof TuningControls>;
export default TuningControls;
