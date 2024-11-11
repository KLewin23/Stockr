import { keys } from '@/utils';
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
    const { config, refetchConfig, refetchData } = useContext(MainContext);
    const updateConfig = trpc.updateConfig.useMutation({
        onSuccess: () => {
            notify.success(`Component type successfully created.`);
            refetchConfig();
            refetchData();
            onComplete();
        },
        onError: e => notify.error(e.message),
    });
    const deleteComponentType = trpc.deleteComponent.useMutation({
        onSuccess: () => {
            notify.success(`Component type successfully deleted.`);
            refetchConfig();
            refetchData();
            onComplete();
        },
        onError: e => notify.error(e.message),
    });

    return (
        <ComponentTypeForm
            mode={'edit'}
            defaultValues={{
                componentName: component.name,
                position: component.position.toString(),
                fields: component.fields.map(field => ({
                    fieldName: field.name,
                    type: field.type,
                })),
            }}
            onSubmit={(v, didRename) => {
                updateConfig.mutate({
                    config: {
                        componentTypes: {
                            ...(didRename
                                ? keys(config.componentTypes).reduce(
                                      (acc, typeName) =>
                                          typeName === component.name
                                              ? acc
                                              : {
                                                    ...acc,
                                                    [typeName]: config.componentTypes[typeName],
                                                },
                                      {},
                                  )
                                : config.componentTypes),
                            [v.componentName]: {
                                position: parseInt(v.position, 10),
                                fields: v.fields.map(field => ({
                                    name: field.fieldName,
                                    type: field.type,
                                })),
                            },
                        },
                    },
                    ...(didRename
                        ? { origionalTypeName: component.name, newTypeName: v.componentName }
                        : { modifiedTypeName: component.name }),
                });
            }}
            onDelete={() => deleteComponentType.mutate({ componentName: component.name })}
            onCancel={onComplete}
        />
    );
};

export default EditComponentType;
