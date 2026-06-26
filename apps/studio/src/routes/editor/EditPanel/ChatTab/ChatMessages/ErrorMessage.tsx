import { useEditorEngine } from '@/components/Context';
import { Icons } from '@onlook/ui/icons';
import { observer } from 'mobx-react-lite';

export const ErrorMessage = observer(() => {
    const editorEngine = useEditorEngine();
    const errorMessage = editorEngine.chat.stream.errorMessage;

    if (errorMessage) {
        return (
            <div className="flex w-full flex-row items-center justify-center gap-2 p-2 text-small text-red">
                <Icons.ExclamationTriangle className="w-6" />
                <p className="w-5/6 text-wrap overflow-auto">{errorMessage}</p>
            </div>
        );
    }
    return null;
});
