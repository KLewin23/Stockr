import { useState } from 'react';
import { match } from 'ts-pattern';
import { Button, Notification } from '@/shadcn';

import Home from './pages/Home/Home';
import Components from './pages/Components/Components';

export type Page = 'Home' | 'Components';

const App = (): JSX.Element => {
    const [page, setPage] = useState<Page>('Home');

    return (
        <div className={'col bg-background min-h-full text-foreground'}>
            <Notification />
            <header className={'row py-4 px-6 justify-between border-b items-center'}>
                <div className={'row gap-10 items-center'}>
                    <div className="col gap-1">
                        <h1 className="text-lg font-bold tracking-tighter">Stockr</h1>
                        <p className="text-sm leading-none text-gray-500 dark:text-gray-400">
                            Inventory Management
                        </p>
                    </div>
                </div>
                <Button onClick={() => setPage(page === 'Home' ? 'Components' : 'Home')}>
                    {page === 'Home' ? 'Manage Component Types' : 'Home'}
                </Button>
            </header>
            {match(page)
                .with('Home', () => <Home />)
                .with('Components', () => <Components />)
                .exhaustive()}
        </div>
    );
};

export default App;

