export const keys = Object.keys as <T>(o: T) => Extract<keyof T, string>[];

export type ArrElement<ArrType> = ArrType extends readonly (infer ElementType)[]
    ? ElementType
    : never;

export const getErrorFromArray = <T>(array: Array<Error | T>): T[] | Error => {
    const error = array.find(el => el instanceof Error);
    return error instanceof Error ? error : array as T[];
};
