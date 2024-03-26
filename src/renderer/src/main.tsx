import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import ReactDOM from 'react-dom/client';
import { ipcLink } from 'electron-trpc/renderer';
import React, { ReactNode, useState } from 'react';
import { createTRPCReact } from '@trpc/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import App from './App';
import './assets/main.css';
import { MainContext } from './Context';
// @ts-ignore Needs to be imported here no matter ts issues
import { Router } from '../../main/router';
import { ThemeProvider } from './components/shadcn/ThemeProvider';

export const trpc = createTRPCReact<Router>();

const TRPCWrapper = ({ children }: { children: ReactNode }): JSX.Element => {
    const [queryClient] = useState(() => new QueryClient());
    const [trpcClient] = useState(() =>
        trpc.createClient({
            links: [ipcLink()],
        }),
    );

    return (
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </trpc.Provider>
    );
};

const Main = () => {
    const { data: config, refetch: refetchConfig } = trpc.getConfig.useQuery(undefined, {
        cacheTime: Infinity,
        staleTime: Infinity,
    });
    const { data, refetch: refetchData } = trpc.readData.useQuery(undefined, {
        cacheTime: Infinity,
        staleTime: Infinity,
    });

    return (
        <MainContext.Provider
            value={{
                config: config ?? { componentTypes: {} },
                refetchConfig,
                data: data ?? {},
                refetchData,
            }}
        >
            <ThemeProvider>
                <App />
            </ThemeProvider>
        </MainContext.Provider>
    );
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <TRPCWrapper>
            <Main />
        </TRPCWrapper>
    </React.StrictMode>,
);

