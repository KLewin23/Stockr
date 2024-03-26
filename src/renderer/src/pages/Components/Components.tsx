import { keys } from '@/utils';
import { TComponentType } from '@/config';
import { useContext, useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/shadcn';

import { MainContext } from '../../Context';
import NewComponentType from './NewComponentType';
import EditComponentType from './EditComponentType';

type State = 'create' | 'display' | TComponentType;

const Components = (): JSX.Element => {
    const { config } = useContext(MainContext);
    const [mode, setMode] = useState<State>('display');

    return mode === 'create' ? (
        <NewComponentType onComplete={() => setMode('display')} />
    ) : typeof mode === 'object' ? (
        <EditComponentType component={mode} onComplete={() => setMode('display')} />
    ) : (
        <div className={'col py-12 px-10 gap-6 grow h-full'}>
            <Button className={'w-min'} onClick={() => setMode('create')}>
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
                        onClick={() =>
                            setMode({ name: typeKey, fields: config.componentTypes[typeKey] })
                        }
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
