import { useState } from 'react';
import { Button } from '@/shadcn';
import { match } from 'ts-pattern';

import TitleBar from './TitleBar';
import Home from './pages/Home/Home';
import { ThemeToggle } from './components/ThemeToggle';
import Components from './pages/Components/Components';

export type Page = 'Home' | 'Components';

const App = (): JSX.Element => {
    const [page, setPage] = useState<Page>('Home');

    return (
        <div className={'col bg-background min-h-full text-foreground'}>
            <TitleBar />
            <header className={'row py-4 px-6 justify-between border-b items-center'}>
                <div className={'row gap-10 items-center select-none'}>
                    <div className={'col gap-1'}>
                        <h1 className={'text-lg font-bold tracking-tighter'}>Stockr</h1>
                        <p
                            id={'title'}
                            className="text-sm leading-none text-gray-500 dark:text-gray-400"
                        >
                            Inventory Management
                        </p>
                    </div>
                </div>
                <div className={'row gap-4'}>
                    <Button onClick={() => setPage(page === 'Home' ? 'Components' : 'Home')}>
                        {page === 'Home' ? 'Manage Component Types' : 'Home'}
                    </Button>
                    <ThemeToggle />
                </div>
            </header>
            {match(page)
                .with('Home', () => <Home />)
                .with('Components', () => <Components />)
                .exhaustive()}
        </div>
    );
};

export default App;

