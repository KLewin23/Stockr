import { notify } from '@/shadcn';
import { useContext } from 'react';
import { trpc } from '@/renderer/main';
import { MainContext } from '@/renderer/Context';

import ComponentTypeForm from './ComponentTypeForm';

const NewComponentType = ({ onComplete }: { onComplete: () => void }): JSX.Element => {
    const { config, refetchConfig } = useContext(MainContext);
    const setupComponent = trpc.setupComponent.useMutation({
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
                setupComponent.mutate({
                    componentName: v.componentName,
                    config: {
                        componentTypes: {
                            ...config.componentTypes,
                            [v.componentName]: v.fields.map(field => ({
                                name: field.fieldName,
                                type: field.type,
                            })),
                        },
                    },
                    header: v.fields.reduce((acc, field, index) => {
                        const heading = field.fieldName.includes(',')
                            ? `"${field.fieldName}"`
                            : field.fieldName;
                        return index === 0 ? heading : `${acc},${heading}`;
                    }, ''),
                })
            }
            onCancel={onComplete}
        />
    );
};

export default NewComponentType;
