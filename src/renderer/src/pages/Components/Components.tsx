import { useContext, useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/shadcn';

import { keys } from '../../../../utils';
import { MainContext } from '../../Context';
import NewComponentType from './NewComponentType';

const Components = (): JSX.Element => {
    const { config } = useContext(MainContext);
    const [createType, setCreateType] = useState(false);
    return createType ? (
        <NewComponentType onComplete={() => setCreateType(false)} />
    ) : (
        <div className={'col py-12 px-10 gap-6 grow h-full'}>
            <Button className={'w-min'} onClick={() => setCreateType(true)}>
                Create Component Type
            </Button>
            <h2 className={'text-1.5 font-semibold'}>Existing Components</h2>
            <div className={'grid grid-cols-5 gap-10'}>
                {keys(config.componentTypes).length === 0 ? (
                    <p className={'pl-4 text-1 italic'}>Currently no component types exist.</p>
                ) : null}
                {keys(config.componentTypes).map(typeKey => (
                    <Card
                        key={typeKey}
                        className={
                            'cursor-pointer transition-colors duration-300 hover:bg-border/40'
                        }
                    >
                        <CardHeader>
                            <CardTitle>{typeKey}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul>
                                {config.componentTypes[typeKey].map(field => (
                                    <li
                                        key={`${typeKey}-${field.name}-${field.type}`}
                                        className={'list-disc list-inside'}
                                    >
                                        {field.name} [{field.type}]
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default Components;
