import { notify } from '@/shadcn';
import { useContext } from 'react';
import { trpc } from '@/renderer/main';
import { MainContext } from '@/renderer/Context';

import ComponentTypeForm from './ComponentTypeForm';

const NewComponentType = ({ onComplete }: { onComplete: () => void }): JSX.Element => {
    const { config, refetchConfig } = useContext(MainContext);
    const writeConfig = trpc.writeConfig.useMutation({
        onSuccess: () => {
            notify.success(`Component type successfully created.`);
            refetchConfig();
            onComplete();
        },
    });

    return (
        <ComponentTypeForm
            mode={'create'}
            onSubmit={v =>
                writeConfig.mutate({
                    config: {
                        componentTypes: {
                            ...config.componentTypes,
                            [v.componentName]: v.fields.map(field => ({
                                name: field.fieldName,
                                type: field.type,
                            })),
                        },
                    },
                })
            }
            onCancel={onComplete}
        />
    );
};

export default NewComponentType;
