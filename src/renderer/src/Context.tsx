import { createContext } from 'react';
import { TConfig, TValueMap } from 'src/config';

interface TMainContext {
    config: TConfig;
    refetchConfig: () => void;
    data: Map<string, Array<TValueMap>>;
    refetchData: () => void;
}

export const MainContext = createContext<TMainContext>({
    config: { componentTypes: {} },
    refetchConfig: () => null,
    data: new Map(),
    refetchData: () => null,
});
