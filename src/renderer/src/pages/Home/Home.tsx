import { TConfig } from 'src/config';
import { useContext, useEffect, useMemo, useState } from 'react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import {
    Card,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    Tabs,
    TabsList,
    TabsTrigger,
} from '@/shadcn';

import NewItem from './NewItem';
import { keys } from '../../../../utils';
import { MainContext } from '../../Context';

const Home = (): JSX.Element => {
    const { config, data } = useContext(MainContext);
    const [selectedTab, setSelectedTab] = useState<keyof TConfig['componentTypes'] | undefined>(
        undefined,
    );
    const memoisedData = useMemo(
        () => (selectedTab && data[selectedTab] ? data[selectedTab] : []),
        [data, selectedTab],
    );
    const table = useReactTable({
        data: memoisedData,
        columns:
            selectedTab && config.componentTypes[selectedTab]
                ? config.componentTypes[selectedTab].map(f => ({
                      accessorKey: f.name,
                      header: f.name,
                  }))
                : [],
        getCoreRowModel: getCoreRowModel(),
    });

    useEffect(() => {
        if (selectedTab !== undefined) return;
        setSelectedTab(keys(config.componentTypes)[0]);
    }, [config]);

    console.log(table.getRowModel().rows?.length);

    return (
        <div className={'col py-12 px-10 gap-4 grow'}>
            <div className={'row w-full gap-10'}>
                <NewItem />
                <Tabs value={selectedTab} defaultValue={selectedTab} onValueChange={setSelectedTab}>
                    <TabsList>
                        {keys(config.componentTypes).map(typeKey => (
                            <TabsTrigger key={typeKey} value={typeKey} className={'min-w-32'}>
                                {typeKey}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            </div>
            <Card className={'p-6 grow'}>
                <Table className={'h-full'}>
                    <TableHeader>
                        {table.getHeaderGroups().map(headerGroup => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map(header => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                      header.column.columnDef.header,
                                                      header.getContext(),
                                                  )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map(row => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && 'selected'}
                                >
                                    {row.getVisibleCells().map(cell => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext(),
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={
                                        selectedTab && config.componentTypes[selectedTab]
                                            ? config.componentTypes[selectedTab].length
                                            : 0
                                    }
                                    className="h-24 text-center"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
};

export default Home;
