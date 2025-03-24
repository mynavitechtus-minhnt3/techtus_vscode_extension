import * as _ from "lodash";
import * as vscode from "vscode";

export const transformParams = async () => {
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
    if (text.includes("input.")) {
        return convertParamsToArgs(text);
    }

    if (text.includes(": ")) {
        return text.split(RegExp("\n+")).filter((e) => e.length > 0).map((e) => e.replace(": ",": input.")).join("\n");
    }

    return convertParamsToInputArgs(text);
}

function convertParamsToInputArgs(data: string): string {
    const output = `${data}\n`.trim().split(RegExp('(?:,|;)\n+')).filter((e) => e.length > 0).map((e) => {
        const arr = e.trim().split(" ")
        return arr[arr.length - 1].replace(",", "").replace(";", "")
    }).map((e) => `${e}: input.${e},`).join("\n")

    return output;
}

function convertParamsToArgs(data: string): string {
    return data.split(",").filter((e) => e.length > 0).map((e) => e.replace("input.","")).join(",") + ",";
}