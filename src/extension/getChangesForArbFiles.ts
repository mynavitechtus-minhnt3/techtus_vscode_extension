import * as vscode from "vscode";
import { L10nObject } from "./l10nObject";
import { getArbFiles } from "./getArbFiles";
import { getFunctionCall } from "./getFunctionCall";
import { getProjectName } from "./getProjectName";
import { toJson } from "./toJson";
import { EditFilesParameters } from "../commands/translate_and_extract_value_to_arb/editFilesParameters";

export async function getChangesForArbFiles(
  parameters: EditFilesParameters
): Promise<vscode.WorkspaceEdit> {
  const projectName = getProjectName(parameters.uri);
  const [files, templateFile] = await getArbFiles(projectName);
  if (files.length === 0) {
    vscode.window.showErrorMessage(`No arb files found.`);
    throw new Error(`No arb files found.`);
  }
  if (!templateFile) {
    vscode.window.showErrorMessage(`No template arb file found.`);
    throw new Error(`No template arb file found.`);
  }
  const openTextDocuments: Thenable<vscode.TextDocument>[] = [];
  files.forEach((file) => {
    openTextDocuments.push(vscode.workspace.openTextDocument(file));
  });
  const workspaceEdit = new vscode.WorkspaceEdit();
  const { key, value } = parameters.keyValue;
  const { description, placeholders } = parameters;
  const sortArbEnabled = true;
  (await Promise.all(openTextDocuments)).forEach((content, index) => {
    const file = files[index];
    const isMetadataEnabled = true;
    workspaceEdit.replace(
      file,
      new vscode.Range(
        new vscode.Position(0, 0),
        new vscode.Position(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER)
      ),
      toJson(
        content.getText(),
        new L10nObject(
          isMetadataEnabled || file === templateFile,
          key,
          description,
          value,
          placeholders
        ),
        sortArbEnabled
      )
    );
  });

  const appLocalizationsVariable = "l10n";
  workspaceEdit.replace(
    parameters.uri,
    parameters.range,
    getFunctionCall(
      appLocalizationsVariable,
      key,
      placeholders.map((p) => p.value)
    )
  );
  return workspaceEdit;
}
