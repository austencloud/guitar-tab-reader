import type { StringDefinition } from '../services/types';
interface Props {
    open?: boolean;
    customTuning?: StringDefinition[] | null;
    onclose?: () => void;
}
declare const TunerModal: import("svelte").Component<Props, {}, "">;
type TunerModal = ReturnType<typeof TunerModal>;
export default TunerModal;
