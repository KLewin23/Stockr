import { notify } from '@/shadcn';
import { useContext } from 'react';
import { trpc } from '@/renderer/main';
import { TComponentType } from 'src/config';
import { MainContext } from '@/renderer/Context';

import ComponentTypeForm from './ComponentTypeForm';

const EditComponentType = ({
    component,
    onComplete,
}: {
    component: TComponentType;
    onComplete: () => void;
}): JSX.Element => {
    const { config, refetchConfig } = useContext(MainContext);
    const updateConfig = trpc.updateConfig.useMutation({
        onSuccess: () => {
            notify.success(`Component type successfully created.`);
            refetchConfig();
            onComplete();
        },
    });

    return (
        <ComponentTypeForm
            mode={'edit'}
            defaultValues={{
                componentName: component.name,
                fields: component.fields.map(field => ({
                    fieldName: field.name,
                    type: field.type,
                })),
            }}
            onSubmit={v =>
                updateConfig.mutate({
                    config: {
                        componentTypes: {
                            ...config.componentTypes,
                            [v.componentName]: v.fields.map(field => ({
                                name: field.fieldName,
                                type: field.type,
                            })),
                        },
                    },
                    modifiedType: component.name,
                })
            }
            onCancel={onComplete}
        />
    );
};

export default EditComponentType;
