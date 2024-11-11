import z from 'zod';

import { ArrElement } from './utils';

const componentField = z.object({
    name: z.string(),
    type: z.union([
        z.literal('string'),
        z.literal('number'),
        z.literal('boolean'),
        z.literal('date'),
    ]),
});

export const configShape = z.object({
    componentTypes: z.record(
        z.string(),
        z.object({ position: z.number(), fields: z.array(componentField) }),
    ),
});

const columnShape = z.intersection(
    z.object({ name: z.string() }),
    z.union([
        z.object({ type: z.literal('string'), value: z.string().optional() }),
        z.object({ type: z.literal('number'), value: z.number().optional() }),
        z.object({ type: z.literal('date'), value: z.date().optional() }),
        z.object({ type: z.literal('boolean'), value: z.boolean().optional() }),
    ]),
);

export const dataRow = z.array(columnShape);

export type TComponentField = z.infer<typeof componentField>;

export type TValueMap = Map<string, string | number | Date | boolean>;

export type TAcceptedTypes = TComponentField['type'];

export type TConfig = z.infer<typeof configShape>;

export type FieldDef = ArrElement<
    TConfig['componentTypes'][keyof TConfig['componentTypes']]['fields']
>;

export type TComponentType = { name: string; fields: TComponentField[]; position: number };

export type FieldValue<I extends FieldDef> = Omit<I, 'type'> &
    (
        | { type: 'string'; value?: string }
        | {
              type: 'boolean';
              value?: boolean;
          }
        | { type: 'number'; value?: number }
        | { type: 'date'; value?: Date }
    );
