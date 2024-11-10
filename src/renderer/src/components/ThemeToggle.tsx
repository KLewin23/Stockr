import { MoonIcon, SunIcon } from '@radix-ui/react-icons';

import { Button, useTheme } from './shadcn';

export function ThemeToggle() {
    const { setTheme, theme } = useTheme();

    return (
        <Button
            variant="outline"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            size="icon"
        >
            <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
    );
}
