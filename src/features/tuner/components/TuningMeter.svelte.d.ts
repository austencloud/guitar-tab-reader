import type { StringDefinition } from '../services/types';
interface Props {
    detectedCents?: number;
    closestString?: StringDefinition | null;
    strings?: StringDefinition[];
    statusMessage?: string;
}
declare const TuningMeter: import("svelte").Component<Props, {}, "">;
type TuningMeter = ReturnType<typeof TuningMeter>;
export default TuningMeter;
