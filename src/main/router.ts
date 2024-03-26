import path from 'path';
import { z } from 'zod';
import { existsSync } from 'fs';
import { readdir } from 'fs/promises';
import { BrowserWindow, app } from 'electron';
import { TRPCError, initTRPC } from '@trpc/server';

import { file } from './file';
import { ArrElement } from '../utils';
import { TConfig, configShape, dataRow } from '../config';

type Context = {
    window: BrowserWindow;
    config: TConfig;
};

const t = initTRPC.context<Context>().create({ isServer: true });

const renderRowAsCsv = (row: ArrElement<z.infer<typeof dataRow>>): string => {
    if ((row.type === 'string' && row.value.includes(',')) || row.type === 'date')
        return `"${row.value}"`;
    return row.value.toString();
};

const splitCsvRow = (row: string) =>
    row.match(
        /(?<=")[^"]+?(?="(?:\s*?,|\s*?$))|(?<=(?:^|,)\s*?)(?:[^,"\s][^,"]*[^,"\s])|(?:[^,"\s])(?![^"]*?"(?:\s*?,|\s*?$))(?=\s*?(?:,|$))/g,
    );

const { procedure } = t;

const parseCsv = (file: string) => {
    const lines = file.split('\n');
    const header = splitCsvRow(lines[0]);
    return lines.slice(1, -1).map(row => {
        const cols = splitCsvRow(row);
        return (cols ?? []).reduce(
            (acc, col, index) => ({ ...acc, [(header ?? [])[index]]: col }),
            {},
        );
    });
};

export const router = t.router({
    readData: procedure.query(async () => {
        const dataFolder = path.join(app.getPath('userData'), 'data');
        const dataFolderContents = await readdir(dataFolder);
        const promises = dataFolderContents.map(async fileName => [
            fileName,
            await file(fileName, 'data').read<object[]>(parseCsv),
        ]);

        return await Promise.all(promises)
            .then(r => {
                return r.reduce(
                    (acc, [fileName, contents]) =>
                        typeof fileName !== 'string'
                            ? acc
                            : { ...acc, [fileName.replace('.csv', '')]: contents },
                    {},
                );
            })
            .catch(reason => console.log(reason, 'r'));
    }),
    writeData: procedure
        .input(z.object({ componentName: z.string(), rowValues: dataRow }))
        .mutation(async ({ input }) => {
            const filePath = path.join(
                app.getPath('userData'),
                'data',
                `${input.componentName}.csv`,
            );
            const fileRef = file(`${input.componentName}.csv`, 'data');
            const rowAsString = input.rowValues.reduce(
                (acc, item, index) => `${acc}${index === 0 ? '' : ','}${renderRowAsCsv(item)}`,
                '',
            );
            if (!existsSync(filePath)) {
                const headerString = input.rowValues.reduce(
                    (acc, item, index) =>
                        `${acc}${index === 0 ? '' : ','}${item.name.includes(',') ? `"${item.name}"` : item.name}`,
                    '',
                );
                return await fileRef.write(
                    headerString.concat('\n').concat(rowAsString).concat('\n'),
                );
            }
            return await fileRef.append(rowAsString.concat('\n'));
        }),
    deleteRow: procedure
        .input(z.object({ componentName: z.string(), rowNumber: z.number() }))
        .mutation(async ({ input }) => {
            const fileRef = file(`${input.componentName}.csv`, 'data');
            const fileContents = await fileRef.read<string[]>(f => f.split('\n'));
            if (fileContents === false)
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Error reading csv',
                });
            const writeOutcome = await fileRef.write(
                fileContents.filter((_, index) => index !== input.rowNumber + 1).join('\n'),
            );
            if (writeOutcome === false)
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Error writing data',
                });
        }),
    getConfig: procedure.output(configShape).query(({ ctx }) => ctx.config),
    writeConfig: procedure
        .input(z.object({ config: configShape }))
        .mutation(
            async ({ input }) => await file('config.json').write(JSON.stringify(input.config)),
        ),
    updateConfig: procedure
        .input(z.object({ config: configShape, modifiedType: z.string() }))
        .mutation(async ({ input }) => {
            await file('config.json').write(JSON.stringify(input.config));
            const dataPath = path.join(
                app.getPath('userData'),
                'data',
                `${input.modifiedType}.csv`,
            );
            if (existsSync(dataPath)) {
                const dataFileRef = await file(`${input.modifiedType}.csv`, 'data');
                const readData = await dataFileRef.read(file => {
                    const lines = file.split('\n');
                    const rows = lines.slice(0, -1).map(line => splitCsvRow(line));
                    const header = rows[0];
                    return header ? { header: splitCsvRow(lines[0]), data: rows.slice(1) } : false;
                });
                if (readData === false || readData.header === null) return;
                const { header, data } = readData;

                const newOrDeletedColumns = input.config.componentTypes[input.modifiedType].reduce<{
                    new: string[];
                    remaining: string[];
                    deleted: string[];
                }>(
                    (acc, field) => {
                        const inHeader = header.includes(field.name);
                        return {
                            new: [...acc.new, ...(inHeader ? [] : [field.name])],
                            remaining: [...acc.remaining, ...(inHeader ? [field.name] : [])],
                            deleted: acc.deleted.filter(col => col !== field.name),
                        };
                    },
                    { new: [], remaining: [], deleted: header },
                );
                const deletedIndexes = newOrDeletedColumns.deleted.reduce<number[]>(
                    (acc, colName) => {
                        const index = header?.indexOf(colName);
                        return index === -1 ? acc : [...acc, index];
                    },
                    [],
                );
                const rowToString = (acc: string, item: string) =>
                    `${acc}${acc !== '' ? ',' : ''}${item.includes(',') ? `"${item}"` : item}`;
                const newData = data.reduce<string[]>((acc, line) => {
                    if (line === null) return acc;
                    const newLine = line.reduce<string>(
                        (lineAcc, item, index) =>
                            deletedIndexes.includes(index) ? lineAcc : rowToString(lineAcc, item),
                        '',
                    );
                    return [
                        ...acc,
                        newLine.concat(Array(newOrDeletedColumns.new.length + 1).join(',')),
                    ];
                }, []);
                const newHeader = header
                    .concat(newOrDeletedColumns.new)
                    .reduce((headerAcc, colName) => {
                        if (newOrDeletedColumns.deleted.includes(colName)) return headerAcc;
                        return rowToString(headerAcc, colName);
                    }, '');

                dataFileRef.write([newHeader].concat(newData).join('\n'));
            }
        }),
});

export type Router = typeof router;
