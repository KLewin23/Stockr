export const keys = Object.keys as <T>(o: T) => Extract<keyof T, string>[];

export type ArrElement<ArrType> = ArrType extends readonly (infer ElementType)[]
    ? ElementType
    : never;
