import path from 'path';
import { z } from 'zod';
import { existsSync } from 'fs';
import { readdir } from 'fs/promises';
import { initTRPC } from '@trpc/server';
import { BrowserWindow, app } from 'electron';

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

const { procedure } = t;

const parseCsv = (file: string) => {
    // console.log(file);
    const lines = file.split('\n');
    const header = lines[0].match(
        /(?<=")[^"]+?(?="(?:\s*?,|\s*?$))|(?<=(?:^|,)\s*?)(?:[^,"\s][^,"]*[^,"\s])|(?:[^,"\s])(?![^"]*?"(?:\s*?,|\s*?$))(?=\s*?(?:,|$))/g,
    );
    return lines.slice(1, -1).map(row => {
        const cols = row.match(
            /(?<=")[^"]+?(?="(?:\s*?,|\s*?$))|(?<=(?:^|,)\s*?)(?:[^,"\s][^,"]*[^,"\s])|(?:[^,"\s])(?![^"]*?"(?:\s*?,|\s*?$))(?=\s*?(?:,|$))/g,
        );
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
        return dataFolderContents.reduce(
            async (acc, fileName) => ({
                ...acc,
                [fileName.replace('.csv', '')]: await file(fileName, 'data').read(parseCsv),
            }),
            {},
        );
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
            console.log(filePath);
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
    getConfig: procedure.output(configShape).query(({ ctx }) => ctx.config),
    writeConfig: procedure
        .input(z.object({ config: configShape }))
        .mutation(
            async ({ input }) => await file('config.json').write(JSON.stringify(input.config)),
        ),
});

export type Router = typeof router;
