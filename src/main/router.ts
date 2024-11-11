import path from 'path';
import { z } from 'zod';
import { existsSync } from 'fs';
import { readdir } from 'fs/promises';
import { BrowserWindow, app } from 'electron';
import { TRPCError, initTRPC } from '@trpc/server';

import { file } from './file';
import { getErrorFromArray, keys } from '../utils';
import { parseCsv, renderColumnAsCsv, splitCsvRow } from './csv';
import { TConfig, TValueMap, configShape, dataRow } from '../config';

type Context = {
    window: BrowserWindow;
    config: TConfig;
};

const t = initTRPC.context<Context>().create({ isServer: true });

const { procedure } = t;

const InternalServerError = (message: string) =>
    new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message });

// TODO make config and filenames lowercase

const dataRowAsString = (row: z.infer<typeof dataRow>) =>
    row.reduce(
        (acc, item, index) => `${acc}${index === 0 ? '' : ','}${renderColumnAsCsv(item)}`,
        '',
    );

export const router = t.router({
    readData: procedure.query(async ({ ctx }) => {
        const dataFolder = path.join(app.getPath('userData'), 'data');
        const dataFolderContents = await readdir(dataFolder);

        const promises = dataFolderContents.map(async fileName => ({
            fileName,
            contents: await file(fileName, 'data').read<TValueMap[]>(file =>
                parseCsv(file, ctx.config.componentTypes[fileName.slice(0, -4)].fields),
            ),
        }));

        return await Promise.all(promises)
            .then(r => {
                const parsedFiles = r.reduce<Map<string, Error | TValueMap[]>>(
                    (map, { fileName, contents }) =>
                        map.set(fileName.replace('.csv', ''), contents),
                    new Map(),
                );
                const error = getErrorFromArray([...parsedFiles.values()]);
                if (error instanceof Error)
                    throw InternalServerError(
                        error.message ?? 'Default error when parsing data file.',
                    );
                return parsedFiles as Map<string, TValueMap[]>;
            })
            .catch(e => {
                throw InternalServerError(e.message ?? 'Error caught parsing data file.');
            });
    }),
    addData: procedure
        .input(z.object({ componentName: z.string(), rowValues: dataRow }))
        .mutation(async ({ input }) => {
            const filePath = path.join(
                app.getPath('userData'),
                'data',
                `${input.componentName}.csv`,
            );
            const fileRef = file(`${input.componentName}.csv`, 'data');
            const rowAsString = dataRowAsString(input.rowValues);
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
            return await fileRef.append(`\n${rowAsString}`);
        }),
    updateData: procedure
        .input(z.object({ componentName: z.string(), rowValues: dataRow, index: z.number() }))
        .mutation(async ({ input }) => {
            const filePath = path.join(
                app.getPath('userData'),
                'data',
                `${input.componentName}.csv`,
            );
            if (!existsSync(filePath))
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: `Data file for ${input.componentName} not found.`,
                });
            const fileRef = file(`${input.componentName}.csv`, 'data');
            const fileContents = await fileRef.read(file => file.split('\n'));
            if (fileContents instanceof Error) throw InternalServerError(fileContents.message);
            return await fileRef.write(
                fileContents
                    .map((line, lineIndex) =>
                        lineIndex === input.index + 1 ? dataRowAsString(input.rowValues) : line,
                    )
                    .join('\n'),
            );
        }),
    deleteRow: procedure
        .input(z.object({ componentName: z.string(), rowNumber: z.number() }))
        .mutation(async ({ input }) => {
            const fileRef = file(`${input.componentName}.csv`, 'data');
            const fileContents = await fileRef.read<string[]>(f => f.split('\n'));
            if (fileContents instanceof Error)
                throw InternalServerError(fileContents.message ?? 'Error reading csv');
            const writeOutcome = await fileRef.write(
                fileContents.filter((_, index) => index !== input.rowNumber + 1).join('\n'),
            );
            if (writeOutcome === false) throw InternalServerError('Error writing data');
        }),
    getConfig: procedure.output(configShape).query(({ ctx }) => ctx.config),
    setupComponent: procedure
        .input(z.object({ componentName: z.string(), config: configShape, header: z.string() }))
        .mutation(async ({ input }) => {
            await file(path.join(app.getPath('userData'), 'data', `${input.componentName}.csv`));
            const dataFile = file(`${input.componentName}.csv`, 'data');
            if (await dataFile.exists())
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'Config file already exists. Move or delete the file to proceed.',
                });
            await dataFile.write(input.header);
            await file('config.json').write(JSON.stringify(input.config));
        }),
    updateConfig: procedure
        .input(
            z.intersection(
                z.object({ config: configShape }),
                z.union([
                    z.object({ modifiedTypeName: z.string() }),
                    z.object({ origionalTypeName: z.string(), newTypeName: z.string() }),
                ]),
            ),
        )
        .mutation(async ({ input }) => {
            await file('config.json').write(JSON.stringify(input.config));
            const origionalComponentName =
                'modifiedTypeName' in input ? input.modifiedTypeName : input.origionalTypeName;
            const newComponentName =
                'modifiedTypeName' in input ? input.modifiedTypeName : input.newTypeName;
            if (!file(`${origionalComponentName}.csv`, 'data').exists())
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: `Data file ${origionalComponentName}.csv not found.`,
                });
            const dataFileRef = await file(`${origionalComponentName}.csv`, 'data');
            const readData = await dataFileRef.read(file => {
                const lines = file.split('\n');
                const rows = lines.map(line => splitCsvRow(line));
                const header = rows[0];
                if (!header)
                    throw InternalServerError('File is malformed, header could not be read.');
                return { header: splitCsvRow(lines[0]), data: rows.slice(1) };
            });
            if (readData instanceof Error) throw InternalServerError(readData.message);
            if (readData.header === null)
                throw InternalServerError('File is malformed, header could not be read.');
            const { header, data } = readData;
            const newOrDeletedColumns = input.config.componentTypes[
                newComponentName
            ].fields.reduce<{
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
            const deletedIndexes = newOrDeletedColumns.deleted.reduce<number[]>((acc, colName) => {
                const index = header?.indexOf(colName);
                return index === -1 ? acc : [...acc, index];
            }, []);
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
            await dataFileRef.write([newHeader].concat(newData).join('\n'));
            if ('newTypeName' in input) {
                await dataFileRef.rename(`${input.newTypeName}.csv`);
            }
        }),
    deleteComponent: procedure
        .input(z.object({ componentName: z.string() }))
        .mutation(async ({ input, ctx }) => {
            const deletion = await file(`${input.componentName}.csv`, 'data').destroy();
            if (!deletion) throw InternalServerError('Error deleting data file.');
            const write = await file('config.json').write(
                JSON.stringify({
                    ...ctx.config,
                    componentTypes: keys(ctx.config.componentTypes).reduce(
                        (acc, type) =>
                            type === input.componentName
                                ? acc
                                : { ...acc, [type]: ctx.config.componentTypes[type] },
                        {},
                    ),
                }),
            );
            if (!write) throw InternalServerError('Error writing new config file.');
        }),
    minimize: procedure.mutation(({ ctx }) => ctx.window.minimize()),
    toggleMaximize: procedure.mutation(({ ctx }) => {
        if (ctx.window.isMaximized()) {
            return ctx.window.unmaximize();
        }
        return ctx.window.maximize();
    }),
    killApp: procedure.mutation(({ ctx }) => ctx.window.close()),
});

export type Router = typeof router;
