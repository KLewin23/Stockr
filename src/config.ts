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
    componentTypes: z.record(z.string(), z.array(componentField)),
});

export const dataRow = z.array(
    z.intersection(
        z.object({ name: z.string() }),
        z.union([
            z.object({ type: z.literal('string'), value: z.string() }),
            z.object({ type: z.literal('number'), value: z.number() }),
            z.object({ type: z.literal('date'), value: z.date() }),
            z.object({ type: z.literal('boolean'), value: z.boolean() }),
        ]),
    ),
);

export type TConfig = z.infer<typeof configShape>;

export type FieldDef = ArrElement<TConfig['componentTypes'][keyof TConfig['componentTypes']]>;

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
