import type { StringDefinition } from '../services/types';
interface Props {
    activeStrings?: StringDefinition[];
    closestString?: StringDefinition | null;
    detectedCents?: number;
}
declare const StringsDisplay: import("svelte").Component<Props, {}, "">;
type StringsDisplay = ReturnType<typeof StringsDisplay>;
export default StringsDisplay;
