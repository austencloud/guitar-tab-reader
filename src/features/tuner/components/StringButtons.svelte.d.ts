import type { StringDefinition } from '../services/types';
interface Props {
    strings?: StringDefinition[];
    closestString?: StringDefinition | null;
    onplayNote?: (string: StringDefinition) => void;
}
declare const StringButtons: import("svelte").Component<Props, {}, "">;
type StringButtons = ReturnType<typeof StringButtons>;
export default StringButtons;
