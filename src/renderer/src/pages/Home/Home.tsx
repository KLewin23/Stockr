import { keys } from '@/utils';
import { trpc } from '@/renderer/main';
import { TConfig, TValueMap } from '@/config';
import { TrashIcon } from '@radix-ui/react-icons';
import { useContext, useEffect, useMemo, useState } from 'react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import {
    Button,
    Card,
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
    Table,
    TableBody,
    TableCell,
    TableEmpty,
    TableHead,
    TableHeader,
    TableRow,
    Tabs,
    TabsList,
    TabsTrigger,
} from '@/shadcn';

import NewItem from './NewItem';
import { MainContext } from '../../Context';
import EditItem, { EditedRowProps } from './EditItem';

const Home = (): JSX.Element => {
    const [editedRow, setEditedRow] = useState<EditedRowProps | null>(null);
    const { config, data, refetchData } = useContext(MainContext);
    const deleteRow = trpc.deleteRow.useMutation({ onSuccess: () => refetchData() });
    const [selectedTab, setSelectedTab] = useState<keyof TConfig['componentTypes'] | undefined>(
        undefined,
    );
    const memoisedData = useMemo(() => {
        if (!selectedTab) return [];
        const rows = data.get(selectedTab);
        return rows ?? [];
    }, [data, selectedTab]);

    const table = useReactTable({
        data: memoisedData,
        columns:
            selectedTab && config.componentTypes[selectedTab]
                ? config.componentTypes[selectedTab].map(f => ({
                      header: f.name,
                      accessorFn: (row: TValueMap) => row.get(f.name),
                  }))
                : [],
        getCoreRowModel: getCoreRowModel(),
    });

    useEffect(() => {
        if (selectedTab !== undefined) return;
        setSelectedTab(keys(config.componentTypes)[0]);
    }, [config]);

    return (
        <div className={'col py-12 px-10 gap-4 grow'}>
            <EditItem rowData={editedRow ? editedRow : null} onClose={() => setEditedRow(null)} />
            <div className={'row w-full gap-10'}>
                <NewItem currentlyViewedType={selectedTab} />
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
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row, index) => (
                                <ContextMenu key={row.id}>
                                    <ContextMenuTrigger asChild>
                                        <TableRow
                                            className={'cursor-pointer'}
                                            onClick={() => {
                                                if (!selectedTab) return;
                                                setEditedRow({
                                                    entry: row.original,
                                                    type: selectedTab,
                                                    index,
                                                });
                                            }}
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
                                            <TableCell
                                                key={`${selectedTab}-${row.id}-actions`}
                                                className={'w-40 max-h-[53px] py-0'}
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <Button
                                                    className={
                                                        'aspect-square bg-red-700 w-8 h-8 p-0 hover:bg-red-800'
                                                    }
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        if (!selectedTab) return;
                                                        deleteRow.mutate({
                                                            componentName: selectedTab,
                                                            rowNumber: index,
                                                        });
                                                    }}
                                                >
                                                    <TrashIcon className={'text-white'} />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    </ContextMenuTrigger>
                                    <ContextMenuContent>
                                        <ContextMenuItem
                                            onClick={() => {
                                                if (!selectedTab) return;
                                                deleteRow.mutate({
                                                    componentName: selectedTab,
                                                    rowNumber: index,
                                                });
                                            }}
                                        >
                                            Delete item
                                        </ContextMenuItem>
                                    </ContextMenuContent>
                                </ContextMenu>
                            ))
                        ) : (
                            <TableEmpty>
                                <TableCell
                                    colSpan={
                                        selectedTab && config.componentTypes[selectedTab]
                                            ? config.componentTypes[selectedTab].length + 1
                                            : 0
                                    }
                                    className="h-32 text-[16px] text-center"
                                >
                                    No results.
                                </TableCell>
                            </TableEmpty>
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
};

export default Home;
