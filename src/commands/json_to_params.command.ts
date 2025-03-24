import * as _ from "lodash";
import * as vscode from "vscode";
import * as changeCase from "change-case";
import { getTypeByValue } from "./json_to_data_model.command";

export const jsonToParams = async () => {
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
    // const input = " \"id\": 2, \n \"name\": \"Nghỉ kết hôn\", \n \"code\": \"LT-2\", \n \"salary_ratio\": 80, \n \"usable_leave_days\": 10, \n \"description\": \"nothing to say hello\" ";
    const typeAndName = `${text.replace(/\\\"/g, "")}\n`.split(RegExp(" *, *\n+")).filter(t => t.trim().length > 0).map((e) => {
        const arr = e.trim().replace(RegExp("\n+", "g"), "").match(RegExp('\"(.+)\"\s*:\s*(.*)'))!;
        const valueType = getTypeByValue(arr[2].trim());
        const property = changeCase.lowerCaseFirst(changeCase.pascalCase(arr[1].trim()));
        const snakeCase = arr[1].trim();
        return [valueType, property, snakeCase];
    });

    const params = typeAndName.map((e) => `required ${e[0]} ${e[1]},`).join("\n")
    const body = typeAndName.map((e) => `'${e[2]}': ${e[1]},`).join("\n")

    return `${params}\n\n${body}`;
}