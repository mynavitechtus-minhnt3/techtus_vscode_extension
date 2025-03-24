import parse = require('json-to-ast');
import * as _ from 'lodash';
import { ASTNode, ArrayNode, LiteralNode, ObjectNode } from 'json-to-ast';
import { ClassDefinition, Dependency, newAmbiguousListWarn, newEmptyListWarn, Warning, WithWarning, newAmbiguousType } from './syntax';
import { ISettings } from './settings';
import * as changeCase from "change-case";
import { jsonc } from 'jsonc';
import { TypeDefinition, typeDefinitionFromAny } from './constructor';

var pluralize = require('pluralize');

type InputKeyName = {
    name: string;
    type: string | null;
};

export function inputKeyNameHandler(key: string): InputKeyName {
    if (key.match('.') && key[0] !== '.') {
        const name = key.split('.').shift() ?? key;
        const type = key.split('.').pop() ?? null;

        return { name: name, type: type };
    } else {
        return { name: key, type: null };
    }
}

export class Hint {
    path: string;
    type: string;

    constructor(path: string, type: string) {
        this.path = path;
        this.type = type;
    }
}

export class ModelGenerator {
    private settings: ISettings;
    private rootClassName: string;
    private privateFields: boolean;
    private allClasses: ClassDefinition[] = [];
    private allClassMapping = new Map<ClassDefinition, Dependency>();
    hints: Hint[];

    constructor(settings: ISettings, privateFields = false, hints: Hint[] | null = null) {
        this.settings = settings;
        this.rootClassName = settings.model.className;
        this.privateFields = privateFields;
        if (hints !== null) {
            this.hints = hints;
        } else {
            this.hints = new Array<Hint>();
        }
    }

    get duplicates(): ClassDefinition[] {
        const getPath = (c: ClassDefinition): string => c.path;
        const duplicatesOnly = (v: string, i: number, arr: string[]) => arr.indexOf(v) !== i;
        const paths = this.allClasses.map(getPath).filter(duplicatesOnly) || [];
        return this.allClasses.filter((c) => paths.includes(c.path)) || [];
    }

    private hintForPath(path: string): Hint {
        return this.hints.filter((h) => h.path === path)[0];
    }

    private generateClassDefinition(args: {
        className: string,
        object: any,
        path: string,
        astNode: ASTNode,
    }): Warning[] {
        const warnings = new Array<Warning>();
        if (isArray(args.object)) {

            const node = navigateNode(args.astNode, '0');
            this.generateClassDefinition({
                className: args.className,
                object: args.object[0],
                path: args.path,
                astNode: node,
            });
        } else {
            const jsonRawData: Map<string, any> = new Map(Object.entries(args.object));

            this.settings.model.className = args.className;

            const classDefinition = new ClassDefinition(this.settings.model, this.privateFields);
            const _className = changeCase.pascalCase(args.className);
            console.log(`class name: ${_className}`)
            jsonRawData.forEach((value, key) => {
                let typeDef: TypeDefinition;
                const hint = this.hintForPath(`${args.path}/${cleanKey(key)}`);
                const node = navigateNode(args.astNode, cleanKey(key));
                if (hint !== null && hint !== undefined) {
                    typeDef = new TypeDefinition(
                        null, key, _className, null, hint.type, value, false, node
                    );
                } else {
                    typeDef = typeDefinitionFromAny(value, node);
                }

                let name = typeDef.filteredKey(key);
                typeDef.name = fixFieldName(inputKeyNameHandler(name).name, args.className);
                typeDef.value = value;
                typeDef.prefix = _className;
                if (typeDef.type !== null) {
                    typeDef.jsonKey = inputKeyNameHandler(name).name;

                    if (!typeDef.isPrimitive) {
                        const type = changeCase.pascalCase(inputKeyNameHandler(name).type ?? name);
                        typeDef.updateImport(type);

                        if (typeDef.isList) {
                            const singularName = pluralize.singular(type);
                            typeDef.type = typeDef.type?.replace('Class', singularName);
                            typeDef.updateImport(singularName);
                            name = singularName;
                        } else {
                            typeDef.type = type;
                        }
                    }
                }

                if (typeDef.type === null) {
                    warnings.push(newEmptyListWarn(`${args.path}/${name}`));
                }
                if (typeDef.isAmbiguous) {
                    warnings.push(newAmbiguousListWarn(`${args.path}/${name}`));
                }
                console.log(`name: ${name}, typeDef: ${typeDef}`)
                classDefinition.addField(name, typeDef);
            });

            this.allClasses.push(classDefinition);
            const dependencies = classDefinition.dependencies;
            let warns: Warning[];
            dependencies.forEach((dependency) => {
                if (dependency.typeDef.type !== null && dependency.typeDef.isList) {
                    if (dependency.typeDef.value.length > 0) {
                        let toAnalyze;
                        if (!dependency.typeDef.isAmbiguous) {
                            const mergeWithWarning = mergeObjectList(
                                dependency.typeDef.value, `${args.path}/${dependency.name}`
                            );
                            toAnalyze = mergeWithWarning.result;
                            mergeWithWarning.warnings.forEach((wrn) => warnings.push(wrn));
                        } else {
                            toAnalyze = dependency.typeDef.value[0];
                        }
                        const obj: any = {};
                        toAnalyze.forEach((value: any, key: any) => obj[key] = value);
                        const node = navigateNode(args.astNode, dependency.name);
                        warns = this.generateClassDefinition({
                            className: dependency.className,
                            object: obj,
                            path: `${args.path}/${dependency.name}`,
                            astNode: node,
                        });
                    }
                } else {
                    const node = navigateNode(args.astNode, inputKeyNameHandler(dependency.name).name);
                    warns = this.generateClassDefinition({
                        className: dependency.typeDef.type ?? dependency.className,
                        object: jsonRawData.get(dependency.name),
                        path: `${args.path}/${inputKeyNameHandler(dependency.name).name}`,
                        astNode: node,
                    });
                }
                if (warns !== null && warns !== undefined) {
                    warns.forEach(wrn => warnings.push(wrn));
                }
            });
        }

        return warnings;
    }

    private async generateUnsafeDart(rawJson: string): Promise<ClassDefinition[]> {
        const jsonRawData = parseJSON(rawJson);
        const astNode = parse(rawJson, {
            loc: true,
            source: undefined
        });

        const warnings: Warning[] = this.generateClassDefinition({
            className: this.rootClassName,
            object: jsonRawData,
            path: '',
            astNode: astNode,
        });

        return this.allClasses;
    }

    generateDartClasses(rawJson: string): Promise<ClassDefinition[]> {
        return this.generateUnsafeDart(rawJson);
    }
}

export function parseJSON(json: string): { [key: string]: any } {
    const tryEval = (str: any) => eval(`const a = ${str}; a`);

    try {
        if (!json.trim().startsWith('{')) {
            json = `{${json}`;
        }
        if (!json.trim().endsWith('}')) {
            json = `${json}}`;
        }

        return jsonc.parse(json.trim());
    } catch (ignored) { }

    try {
        return tryEval(json);
    } catch (error) {
        return new Error('Selected string is not a valid JSON');
    }
}

export function isArray(value: any): boolean {
    return Array.isArray(value);
}

export const extractor = (obj: any): any => {
    if (obj instanceof Array) {
        for (let i = 0; i < obj.length; i++) {
            return extractor(obj[i]);
        }
    } else {
        return obj;
    }
};

export function mergeObjectList(list: any[], path: string, idx = -1): WithWarning<Map<any, any>> {
    var warnings = new Array<Warning>();
    var obj = new Map();
    for (var i = 0; i < list.length; i++) {
        var toMerge = new Map(Object.entries(extractor(list[i])));
        if (toMerge.size !== 0) {
            toMerge.forEach((v: any, k: any) => {
                var t = getTypeName(obj.get(k));
                if (obj.get(k) === undefined) {
                    obj.set(k, v);
                } else {
                    var otherType = getTypeName(v);
                    if (t !== otherType) {
                        if (t === 'int' && otherType === 'double') {
                            obj.set(k, v);
                        } else if (t !== 'double' && otherType !== 'int') {
                            var realIndex = i;
                            if (idx !== -1) {
                                realIndex = idx - i;
                            }
                            var ambiguosTypePath = `${path}[${realIndex}]/${k}`;
                            warnings.push(newAmbiguousType(ambiguosTypePath));
                        }
                    } else if (t === 'List' || t === 'Class') {
                        var l = Array.from(obj.get(k));
                        var beginIndex = l.length;
                        var mergeableType = mergeableListType(l);
                        if (ListType.Object === mergeableType.listType) {
                            var mergedList =
                                mergeObjectList(l, `${path}[${i}]/${k}`, beginIndex);
                            mergedList.warnings.forEach((wrn) => warnings.push(wrn));
                            obj.set(k, new Array((mergedList.result)));
                        } else {
                            if (l.length > 0) {
                                obj.set(k, new Array(l[0]));
                            }
                            if (mergeableType.isAmbigous) {
                                warnings.push(newAmbiguousType(`${path}[${i}]/${k}`));
                            }
                        }
                    } else if (t === 'Class') {
                        var properIndex = i;
                        if (idx !== -1) {
                            properIndex = i - idx;
                        }
                        var mergedObj = mergeObj(
                            obj.get(k),
                            v,
                            `${path}[${properIndex}]/${k}`,
                        );
                        mergedObj.warnings.forEach((wrn) => warnings.push(wrn));
                        obj.set(k, mergedObj.result);
                    }
                }
            });
        }
    }
    return new WithWarning(obj, warnings);
}

export const cleanKey = (key: string): string => {
    const search = /([^]@)/gi;
    const replace = '';
    return inputKeyNameHandler(key.replace(search, replace)).name;
};

export function navigateNode(astNode: ASTNode, path: string): ASTNode {
    let node: ASTNode;
    if (astNode?.type === 'Object') {
        var objectNode: ObjectNode = astNode as ObjectNode;
        var propertyNode = objectNode.children[0];
        if (propertyNode !== null) {
            propertyNode.key.value = path;
            node = propertyNode.value;
        }
    }
    if (astNode?.type === 'Array') {
        var arrayNode: ArrayNode = astNode as ArrayNode;
        var index = +path ?? null;
        if (index !== null && arrayNode.children.length > index) {
            node = arrayNode.children[index];
        }
    }
    return node!!;
}

export enum ListType { Object, String, Double, Int, Dynamic, Null }

class MergeableListType {
    listType: ListType;
    isAmbigous: boolean;

    constructor(listType: ListType, isAmbigous: boolean) {
        this.isAmbigous = isAmbigous;
        this.listType = listType;
    };
}

function mergeableListType(list: any[]): MergeableListType {
    var t = ListType.Dynamic;
    var isAmbigous = false;
    list.forEach((e) => {
        var inferredType: ListType;
        if (typeof e + '' === 'number') {
            inferredType = e % 1 === 0 ? ListType.Int : ListType.Double;
        } else if (typeof e === 'string') {
            inferredType = ListType.String;
        } else if (isObject(e)) {
            inferredType = ListType.Object;
        }
        if (t !== ListType.Null && t !== inferredType!!) {
            isAmbigous = true;
        }
        t = inferredType!!;
    });
    return new MergeableListType(t, isAmbigous);
}

export function getTypeName(obj: any): string {
    var type = typeof obj;
    if (obj === null || obj === 'undefined') {
        return 'dynamic';
    } else if (isDate(obj) && type === 'string') {
        return 'String';
        return 'DateTime';
    } else if (type === 'string') {
        // return 'dynamic';
        return 'String';
    } else if (type === 'number') {
        // return 'dynamic';
        return obj % 1 === 0 ? 'int' : 'double';
    } else if (type === 'boolean') {
        // return 'dynamic';
        return 'bool';
    } else if (isArray(obj)) {
        // return 'dynamic';
        return 'List';
    } else {
        // return 'dynamic';
        return 'Class';
    }
}

export function isDate(date: string): boolean {
    const datePattern = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(Z|[\+-]\d{2}:?\d{2})?$/gm;
    return datePattern.exec(date) !== null ? true : false;
}

export function isObject(value: any): boolean {
    return (
        Object.keys(value).length !== 0 &&
        Object.values(value).every(
            (item) => typeof item === typeof Object.values(value)[0]
        )
    );
}

function mergeObj(obj: Map<any, any>, other: Map<any, any>, path: string): WithWarning<Map<any, any>> {
    var warnings = new Array<Warning>();
    var clone = new Map(obj);
    other.forEach((k, v) => {
        if (clone.get(k) === null) {
            clone.set(k, v);
        } else {
            var otherType = getTypeName(v);
            var t = getTypeName(clone.get(k));
            if (t !== otherType) {
                if (t === 'int' && otherType === 'double') {
                    clone.set(k, v);
                } else if (typeof v + '' !== 'number' && clone.get(k) % 1 === 0) {
                    warnings.push(newAmbiguousType(`${path}/${k}`));
                }
            } else if (t === 'List') {
                var l = Array(clone.get(k));
                l.push(other.get(k));
                var mergeableType = mergeableListType(l);
                if (ListType.Object === mergeableType.listType) {
                    var mergedList = mergeObjectList(l, `${path}`);
                    mergedList.warnings.forEach((wrn) => warnings.push(wrn));
                    clone.set(k, new Array(mergedList.result));
                } else {
                    if (l.length > 0) {
                        clone.set(k, new Array(l[0]));
                    }
                    if (mergeableType.isAmbigous) {
                        warnings.push(newAmbiguousType(`${path}/${k}`));
                    }
                }
            } else if (t === 'Class') {
                var mergedObj = mergeObj(clone.get(k), other.get(k), `${path}/${k}`);
                mergedObj.warnings.forEach((wrn) => warnings.push(wrn));
                clone.set(k, mergedObj.result);
            }
        }
    });
    return new WithWarning(clone, warnings);
}

export function fixFieldName(name: string, prefix: string, isPrivate = false): string {
    var reservedKeys: string[] = ['get', 'for', 'default', 'set', 'this', 'break', 'class', 'return', 'in'];
    var fieldName = changeCase.camelCase(name)?.replace(/_/g, '');

    if (reservedKeys.includes(fieldName)) {
        var reserved = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
        return fieldName = changeCase.camelCase(`${prefix}${reserved}`)?.replace(/_/g, '');
    }

    return isPrivate ? `_${fieldName}` : fieldName;
}
