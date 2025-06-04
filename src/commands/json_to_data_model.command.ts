import * as changeCase from "change-case";
import * as _ from "lodash";
import * as vscode from "vscode";
import { getDefaultValueByType, getTypeByValue } from "../utils/utils";

export const jsonToDataModel = async () => {
  if (vscode.window.activeTextEditor == null) {
    vscode.window.showErrorMessage(`text editor is null`);
    return;
  }

  const text = vscode.window.activeTextEditor!.document.getText(
    vscode.window.activeTextEditor!.selection
  );
  if (_.isNil(text) || text!.trim() === "") {
    vscode.window.showErrorMessage(
      `Selection text = ${text} is empty. Please select the text`
    );
    return;
  }

  vscode.window.activeTextEditor?.edit((builder) => {
    builder.replace(
      vscode.window.activeTextEditor!.selection,
      doTransform(text!.trim())
    );
  });
};

function doTransform(text: string): string {
  const filename = vscode.window.activeTextEditor?.document.fileName!;
  // const input = " \"id\": 2, \n \"name\": \"Nghỉ kết hôn\", \n \"code\": \"LT-2\", \n \"salary_ratio\": 80, \n \"usable_leave_days\": 10, \n \"description\": \"nothing to say hello\" ";
  return `${text.replace(/\\\"/g, "")}\n`
    .split(RegExp(" *, *\n+"))
    .filter((t) => t.trim().length > 0)
    .map((e) => {
      const arr = e
        .trim()
        .replace(RegExp("\n+", "g"), "")
        .match(RegExp('"(.+)"s*:s*(.*)'))!;
      const type = getTypeByValue(arr[2].trim());
      return `@Default(${getDefaultValueByType(type)})  @JsonKey(name: '${
        arr[1]
      }') ${getTypeByValue(arr[2].trim())} ${changeCase.lowerCaseFirst(
        changeCase.pascalCase(arr[1].trim())
      )},`;
    })
    .join("\n");
}
