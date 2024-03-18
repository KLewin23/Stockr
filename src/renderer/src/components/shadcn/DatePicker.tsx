import { format } from 'date-fns';
import { cn } from '@/renderer/utils';
import { CalendarIcon } from '@radix-ui/react-icons';

import { Button } from './Button';
import { Calendar } from './Calendar';
import { Popover, PopoverContent, PopoverTrigger } from './Popover';

export const DatePicker = ({
    date,
    setDate,
}: {
    date?: Date;
    setDate: (date: Date | undefined) => void;
}): JSX.Element => {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={'outline'}
                    className={cn(
                        'w-full justify-start text-left font-normal',
                        !date && 'text-muted-foreground',
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : <span>Pick a date</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
            </PopoverContent>
        </Popover>
    );
};
