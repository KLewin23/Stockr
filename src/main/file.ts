import path from 'path';
import { app } from 'electron';
import { existsSync, mkdirSync, promises } from 'fs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const read = async <T extends object | []>(
    path: string,
    validator: (file: string) => T | Error,
): Promise<T | Error> => {
    return await promises.readFile(path, 'utf8').then(file => validator(file));
};

const write = async (path: string, contents: string) => {
    return await promises
        .writeFile(path, contents)
        .then(() => true)
        .catch(() => false);
};

const append = async (path: string, content: string) => {
    return await promises
        .appendFile(path, content)
        .then(() => true)
        .catch(() => false);
};

const exists = async (fileName: string) => {
    return await promises
        .access(fileName)
        .then(() => true)
        .catch(() => false);
};

const rename = async (origionalFilePath: string, newFilePath: string) => {
    return await promises
        .rename(origionalFilePath, newFilePath)
        .then(() => true)
        .catch(() => false);
};

const destroy = async (fileName: string) => {
    return await promises
        .rm(fileName)
        .then(() => true)
        .catch(() => false);
};

export const file = (fileName: string, folder?: string) => {
    const userData = app.getPath('userData');
    const filePath = folder ? path.join(userData, folder, fileName) : path.join(userData, fileName);
    const folderPath = folder ? path.join(userData, folder) : path.join(userData);

    if (folder && !existsSync(folderPath)) {
        mkdirSync(folderPath);
    }

    return {
        read: <T extends object | []>(validator: (file: string) => T | Error) =>
            read<T>(filePath, validator),
        write: (contents: string) => write(filePath, contents),
        append: (contents: string) => append(filePath, contents),
        exists: () => exists(filePath),
        rename: (newFileName: string) =>
            rename(
                filePath,
                folder
                    ? path.join(userData, folder, newFileName)
                    : path.join(userData, newFileName),
            ),
        destroy: () => destroy(filePath),
    };
};
