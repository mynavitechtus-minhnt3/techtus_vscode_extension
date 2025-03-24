import * as _ from 'lodash';
import * as changeCase from "change-case";
import { ASTNode } from 'json-to-ast';
import { getTypeName } from './model-generator';

const keywords = ['String', 'int', 'bool', 'num', 'double', 'dynamic', 'DateTime'] as const;

interface TypeDefinitionProperties {
  importName: string | null;
  jsonKey: string;
  prefix: string;
  type: string | null;
  name: string;
  value: any;
  isAmbiguous: boolean;
  isPrimitive: boolean;
  isDate: boolean;
  isList: boolean;
  required: boolean;
  defaultValue: boolean;
  getName(isPrivate: boolean): string;
  updateImport(name: string): void;
  hasValue(other: any): boolean;
  filteredKey(key: string): string;
  nullable: boolean;
}

export class TypeDefinition implements TypeDefinitionProperties {
  private _importName: string | null;
  jsonKey: string;
  prefix: string;
  type: string | null;
  name: string;
  value: any;
  isAmbiguous = false;
  isPrimitive = false;
  isDate = false;
  isList = false;
  required = false;
  defaultValue = false;
  nullable = true;

  constructor(
    importName: string | null,
    jsonKey: string,
    className: string,
    type: string | null,
    name: string,
    value: any,
    isAmbiguous: boolean,
    astNode: ASTNode,
  ) {
    this._importName = importName;
    this.jsonKey = this.filteredKey(jsonKey);
    this.prefix = className;
    this.type = type;
    this.name = name;
    this.value = value;
    this.isAmbiguous = isAmbiguous;
    if (type !== null) {
      this.isPrimitive = isPrimitiveType(type);
      if (name === 'int' && isASTLiteralDouble(astNode)) {
        this.name = 'double';
      }
      if (type.includes('DateTime')) {
        this.isDate = true;
      }
      if (isList(type)) {
        this.isList = true;
      }
      if (type === 'dynamic') {
        this.nullable = false;
      }
    }
    if (isAmbiguous === null) {
      isAmbiguous = false;
    }
  }

  get importName() {
    return this._importName;
  }

  filteredKey(key: string): string {
    const search = /([^]@)/gi;
    const replace = '';

    if (key.match(/d@/gi)) {
      this.defaultValue = true;
    }
    if (key.match(/r@/gi)) {
      this.required = this.defaultValue ? false : true;
    }

    if (this.defaultValue || this.required) {
      this.nullable = false;
    }

    this.jsonKey = key.replace(search, replace);

    return this.jsonKey;
  }

  getName(isPrivate: boolean = false): string {
    return isPrivate ? `_${this.name}` : this.name;
  }

  updateImport(name: string) {
    if (!this.isPrimitive) {
      this._importName = changeCase.snakeCase(name);
    } else {
      throw new Error('TypeDefinition: import can\'t be added to a primitive object.');
    }
  }

  updateObjectType(name: string) {
    if (!this.isPrimitive) {
      this.type = changeCase.pascalCase(name);
    } else {
      throw new Error('TypeDefinition: primitive objects can\'t be updated.');
    }
  }

  hasValue(other: any): boolean {
    return _.isEqual(this.value, other);
  }
}

export function typeDefinitionFromAny(obj: any, astNode: ASTNode) {
  var isAmbiguous = false;
  var type: string = getTypeName(obj);

  if (type === 'List') {
    var list = obj;
    var elemType: string = getListSubtype(list);
    if (elemType !== getListSubtype(list)) {
      isAmbiguous = true;
    }
    return new TypeDefinition(
      null, '', '', elemType, type, obj, isAmbiguous, astNode
    );
  }
  return new TypeDefinition(
    null, '', '', type, '', obj, isAmbiguous, astNode
  );
}

export function getListSubtype(arr: any[]): string {
  let sb = '';
  const typeSet = new Set();
  const typeName = Array.from(typeSet).toString();
  for (const element of arr) {
    if (arr.every((e) => e instanceof Array)) {
      sb += getListSubtype(element);
    } else {
      typeSet.add(getListTypeName(arr));
    }
  }
  sb += !sb.length ? getListTypeName(arr) : typeName;
  return 'List<' + sb + '>';
}

export const getListTypeName = (arr: any[]): string => {
  if (Array.isArray(arr) && !arr.length) {
    return 'dynamic';
  } else {
    if (arr.every((i) => getTypeName(i) === 'DateTime')) {
      return 'DateTime';
    } else if (arr.every((i) => getTypeName(i) === 'String')) {
      return 'String';
    } else if (arr.every((i) => getTypeName(i) === 'bool')) {
      return 'bool';
    } else if (arr.every((i) => typeof i === 'number')) {
      if (arr.every((i) => getTypeName(i) === 'int')) {
        return 'int';
      } else if (arr.every((i) => getTypeName(i) === 'double')) {
        return 'double';
      } else {
        return 'num';
      }
    } else if (arr.every((i) => isPrimitiveType(getTypeName(i)))) {
      return 'dynamic';
    } else {
      return 'Class';
    }
  }
};

export const isPrimitiveType = (typeName: string): boolean => {
  const identical = typeName === typeName.trim() ? true : false;
  const lists = typeName.match(/List/g) ?? [];
  const values = typeName.split(/<|>|\ /g).filter((v) => v !== '');
  const toLeft = typeName.match(/</g) ?? [];
  const leftArrows = toLeft.map((_, i) => typeName.split('')[(i + 1) * 5 - 1]);
  const toRight = typeName.match(/>/g) ?? [];
  const rightArrows = typeName.split('').splice(-toRight.length);
  const validListSyntax =
    leftArrows.every((e) => e === '<') &&
    rightArrows.every((e) => e === '>') &&
    toRight.length === toLeft.length &&
    lists.length === toRight.length &&
    lists.length === toLeft.length;
  const validValue = values.every((e) => ['List', ...keywords].includes(e));
  const validSyntax = lists.length
    ? validListSyntax && validValue
      ? true
      : false
    : validValue
      ? true
      : false;
  return identical && validSyntax ? true : false;
};

export const isList = (text: string): boolean => text.startsWith('List<');
interface LiteralNode extends ASTNode {
  type: "Literal";
  value: string | number | boolean | null;
  raw: string;
}

function _isDoubleWithExponential(integer: string, comma: string, exponent: string): boolean {
  var integerNumber = +integer ?? 0;
  var exponentNumber = +exponent ?? 0;
  var commaNumber = +comma ?? 0;
  if (exponentNumber !== null) {
    if (exponentNumber === 0) {
      return commaNumber > 0;
    }
    if (exponentNumber > 0) {
      return exponentNumber < comma.length && commaNumber > 0;
    }
    return commaNumber > 0 ||
      ((integerNumber * Math.pow(10, exponentNumber)) % 1 > 0);
  }
  return false;
}

var _pattern = /([0-9]+)\.{0,1}([0-9]*)e(([-0-9]+))/g;

export function isASTLiteralDouble(astNode: ASTNode): boolean {
  if (astNode !== null && astNode !== undefined && astNode.type === 'Literal') {
    var literalNode: LiteralNode = astNode as LiteralNode;
    var containsPoint = literalNode.raw.includes('.');
    var containsExponent = literalNode.raw.includes('e');
    if (containsPoint || containsExponent) {
      var isDouble = containsPoint;
      if (containsExponent) {
        var matches = literalNode.raw.split(_pattern);
        if (matches !== null) {
          var integer = matches[1];
          var comma = matches[2];
          var exponent = matches[3];
          isDouble = _isDoubleWithExponential(integer, comma, exponent);
        }
      }
      return isDouble;
    }
  }
  return false;
}
