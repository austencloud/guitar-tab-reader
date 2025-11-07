import type { StringDefinition } from '../services/types';
interface Props {
    closestString?: StringDefinition | null;
    statusMessage?: string;
    isCurrentlyTuned?: boolean;
}
declare const NoteInfoDisplay: import("svelte").Component<Props, {}, "">;
type NoteInfoDisplay = ReturnType<typeof NoteInfoDisplay>;
export default NoteInfoDisplay;
