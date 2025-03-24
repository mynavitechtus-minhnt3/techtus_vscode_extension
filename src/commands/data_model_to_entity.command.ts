import * as _ from "lodash";
import * as vscode from "vscode";
import * as changeCase from "change-case";
import { VSCodeEditorAccess } from "./auto_fix_imports/editor_access";

export const dataModelToEntity = async () => {
    if (vscode.window.activeTextEditor == null) {
        vscode.window.showErrorMessage(`text editor is null`);
        return;
    }

    const text = vscode.window.activeTextEditor!.document.getText(vscode.window.activeTextEditor!.selection);
    if (_.isNil(text) || text!.trim() === "") {
        vscode.window.showErrorMessage(`Selection text = ${text} is empty. Please select the text`);
        return;
    }

    vscode.window.activeTextEditor?.edit((builder) => {
        builder.replace(vscode.window.activeTextEditor!.selection, doTransform(text!.trim()))
    });
};

function doTransform(text: string): string {
    // const input = "  @JsonKey(name: 'id') int? id, @JsonKey(name: 'name') String name,  "
    const filename = vscode.window.activeTextEditor?.document.fileName!;

    return "// Xin hãy review cẩn thận lại: Default value (Đặc biệt là kiểu int: chọn 0 hay -1), enum, BigDecimal,...\n" + `${text}\n`
        .split(RegExp(" *, *\n+"))
        .filter(t => t.trim().length > 0)
        .map((e) => {
            const t = e.trim().replace(RegExp("\n+", "g"), "")
            let arr
            if (t.includes("required")) {
                arr = t.replace("required", "").match(RegExp('^[^)]+\\)\\s+([\\w<>,\\s]+)\\??\\s+(\\w+)$'))!;
            } else {
                arr = t.match(RegExp('^[^)]+\\)\\s+([\\w<>,\\s?]+)\\?\\s+(\\w+)$'))!;
            }

            return `@Default(${changeCase.pascalCase(filename.substring(filename.lastIndexOf('/') + 1, filename.lastIndexOf('.')))}.default${changeCase.pascalCase(arr[2])}) ${convertRemoteDataTypeToEntityType(arr[1].trim())} ${arr[2]},`;
        }).join("\n") + '\n' + `${text}\n`.split(RegExp(" *, *\n+"))
        .filter(t => t.trim().length > 0)
        .map((e) => {
            const t = e.trim().replace(RegExp("\n+", "g"), "")
            let arr
            if (t.includes("required")) {
                arr = t.replace("required", "").match(RegExp('^[^)]+\\)\\s+([\\w<>,\\s]+)\\??\\s+(\\w+)$'))!;
            } else {
                arr = t.match(RegExp('^[^)]+\\)\\s+([\\w<>,\\s?]+)\\?\\s+(\\w+)$'))!;
            }

            return `static const ${convertRemoteDataTypeToEntityType(arr[1].trim())} default${changeCase.pascalCase(arr[2])} = ${getDefaultValueByType(arr[1].trim())};`;
        }).join("\n");
}

export function convertRemoteDataTypeToEntityType(t: string): string {
    const valueType = convertNullableTypeToNonNullableType(t).trim()

    if (valueType.startsWith("List")) {
        return "List<" + convertDataClassNameToEntityClassName(valueType.substring(5, valueType.length - 1)) + ">"
    }

    return convertDataClassNameToEntityClassName(valueType)
}

export function getDefaultValueByType(v: string): string {
    const valueType = convertNullableTypeToNonNullableType(v.replace("required", "").trim())
    switch (valueType) {
        case "int":
            return "0";
        case "String":
            return "''";
        case "bool":
            return "false";
        case "double":
            return "0.0";
    }

    if (valueType.startsWith("List")) {
        return "<" + convertDataClassNameToEntityClassName(valueType.substring(5, valueType.length - 1)) + ">[]";
    }

    if (valueType.startsWith("Map")) {
        const mapType = valueType.replace("Map", "").trim()

        return convertNullableTypeToNonNullableType(mapType) + "{}"
    }

    // Object
    return convertDataClassNameToEntityClassName(valueType) + "()";
}

function convertDataClassNameToEntityClassName(className: string): string {
    const arr = className.match('(.*)Data');
    return arr != null ? arr[1] : className;
}

export function convertNullableTypeToNonNullableType(t: string): string {
    if (t.endsWith("?")) {
        return t.substring(0, t.length - 1);
    }

    return t
}