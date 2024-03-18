import { TConfig } from 'src/config';
import { createContext } from 'react';

interface TMainContext {
    config: TConfig;
    refetchConfig: () => void;
    data: Record<string, Array<Record<string, string>>>;
    refetchData: () => void;
}

export const MainContext = createContext<TMainContext>({
    config: { componentTypes: {} },
    refetchConfig: () => null,
    data: {},
    refetchData: () => null,
});
