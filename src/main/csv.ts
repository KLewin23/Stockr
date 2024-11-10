import { z } from 'zod';
import { isValid } from 'date-fns';

import { ArrElement, getErrorFromArray } from '../utils';
import { FieldDef, TAcceptedTypes, TValueMap, dataRow } from '../config';

export const renderColumnAsCsv = (row: ArrElement<z.infer<typeof dataRow>>): string => {
    if ((row.type === 'string' && row.value.includes(',')) || row.type === 'date')
        return `"${row.value}"`;
    return row.value.toString();
};

export const splitCsvRow = (row: string) =>
    row.match(
        /(?<=")[^"]+?(?="(?:\s*?,|\s*?$))|(?<=(?:^|,)\s*?)(?:[^,"\s][^,"]*[^,"\s])|(?:[^,"\s])(?![^"]*?"(?:\s*?,|\s*?$))(?=\s*?(?:,|$))/g,
    );

export const parseCol = (
    value: string,
    type: TAcceptedTypes,
): string | number | Date | boolean | Error => {
    if (type === 'string') return value;
    if (type === 'number')
        return !isNaN(+value) ? parseFloat(value) : Error(`Value: ${value} is not a number`);
    if (type === 'boolean')
        return value === 'true' || value === 'false'
            ? value === 'true'
                ? true
                : false
            : Error(`Value: ${value} is not a boolean`);

    const parsedDate = new Date(value);
    return isValid(parsedDate) ? parsedDate : 'ERROR';
};

export const parseCsv = (file: string, config: FieldDef[]): Error | TValueMap[] => {
    const lines = file.split('\n');
    const header = splitCsvRow(lines[0]);
    const configAsMap = config.reduce(
        (map, field) => map.set(field.name, field.type),
        new Map<string, TAcceptedTypes>(),
    );
    if (header === null) return Error('File is malformed, header could not be read.');
    const mappedLines = lines.slice(1).map(row => {
        const cols = splitCsvRow(row);
        return (cols ?? []).reduce<TValueMap | Error>((map, col, index) => {
            const type = configAsMap.get(header[index]);
            if (type === undefined) return Error(`Type not defined for column ${header[index]}`);
            if (map instanceof Error) return map;
            const parsedCol = parseCol(col, type);
            return parsedCol instanceof Error ? parsedCol : map.set(header[index], parsedCol);
        }, new Map());
    });
    return getErrorFromArray(mappedLines);
};
