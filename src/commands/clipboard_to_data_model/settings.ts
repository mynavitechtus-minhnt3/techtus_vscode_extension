import * as path from 'path';
import * as changeCase from "change-case";

export class ClassNameModel {
    readonly enhancement: string = '';
    readonly directoryName: string;
    readonly fileName: string;
    className: string;

    constructor(className: string) {
        if (!className.match(/\W/gm)) {
            this.className = className;
        } else {
            const split = className.split(/\W{1,}/gm);
            const first = split.shift() ?? className;
            const last = '.' + split.join('.').split('.').map((e) => changeCase.snakeCase(e)).join('.');
            this.className = first;
            if (last.match(/(\W|dart)+$/gm)) {
                this.enhancement = '.' + last.replace(/(\W|dart)+$/gm, '').split('.').map((e) => changeCase.snakeCase(e)).join('.');
            } else {
                this.enhancement = last;
            }
        }
        this.directoryName = changeCase.snakeCase(this.className);
        this.fileName = `${changeCase.snakeCase(this.className)}${changeCase.snakeCase(this.enhancement)}.dart`;
    }
}

export interface ISettings {
    /**
     * Class definition model. Required root class name.
     */
    model: ClassNameModel;
    /**
     * File target directory.
     */
    targetDirectory: string;
    /**
     * A valid JSON.
     */
    json: string;

    // genEntity: boolean;

    // genMapper: boolean;

    // entityDirectory: string;
}

export class Settings implements ISettings {
    model: ClassNameModel;
    targetDirectory: string;
    // entityDirectory: string;
    json: string;

    constructor(settings: ISettings) {
        this.model = settings.model;
        this.json = settings.json;
        this.targetDirectory = buildTargetDirectory(settings);
        // this.genEntity = settings.genEntity;
        // this.genMapper = settings.genMapper;
        // this.entityDirectory = toPosixPath(settings.entityDirectory);
    }
    // genEntity: boolean;
    // genMapper: boolean;
}

const buildTargetDirectory = (settings: ISettings): string => {
    return toPosixPath(settings.targetDirectory);
};

export function toPosixPath(pathLike: string): string {

    if (pathLike.includes(path.win32.sep)) {
        return pathLike.split(path.win32.sep).join(path.posix.sep);
    }

    return pathLike;
}