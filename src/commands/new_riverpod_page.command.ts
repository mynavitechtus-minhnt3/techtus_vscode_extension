import * as vscode from "vscode";
import * as lo from "lodash";
import * as changeCase from "change-case";
import * as fs from "fs";
import { getRiverpodTemplates } from "../templates/riverpodTemplateManager";
import { showPrompt, writeFile, fetchPackageInfoFor } from "../utils/utils";
import { configResolver } from "./fix_imports.command";
import { autoExport } from "./auto_export.command";

export const createNewPage = async () => {
  const rawEditor = vscode.window.activeTextEditor;
  if (!rawEditor) {
    vscode.window.showErrorMessage(`text editor is null`);
    return;
  }
  const packageInfo = await fetchPackageInfoFor(rawEditor.document.uri);
  if (!packageInfo) {
    vscode.window.showErrorMessage(
      "Failed to initialize extension. Is this a valid Dart/Flutter project?"
    );
    return;
  }

  var targetDirectory = `${packageInfo.projectRoot}/${configResolver.uiFolderPath}`;
  if (!fs.existsSync(targetDirectory)) {
    targetDirectory = `${
      packageInfo.projectRoot
    }/lib/src/${configResolver.uiFolderPath.substring(
      "lib/".length,
      configResolver.uiFolderPath.length
    )}`;
  }
  let featureName = await showPrompt("Enter your feature", "register_user");

  if (lo.isNil(featureName)) {
    vscode.window.showErrorMessage("Please enter a feature name");
    return;
  }
  const templates = getRiverpodTemplates(configResolver.riverpodPageTemplate);
  // lib/state_logic/state_notifiers/save_condition/save_condition_notifier.dart
  // lib/ui/pages/save_condition_page.dart

  let featureNameSnakeCase = changeCase.snakeCase(featureName!);
  let viewModelFolderPath = `${targetDirectory}/${featureNameSnakeCase}/view_model`;

  await Promise.all([
    genFile(
      `${targetDirectory}/${featureNameSnakeCase}`,
      `${featureNameSnakeCase}_page.dart`,
      templates.getPageTemplate(featureName!)
    ),
    genFile(
      viewModelFolderPath,
      `${featureNameSnakeCase}_view_model.dart`,
      templates.getViewModelTemplate(featureName!)
    ),
    genFile(
      viewModelFolderPath,
      `${featureNameSnakeCase}_state.dart`,
      templates.getStateTemplate(featureName!)
    ),
  ]);

  await autoExport();
  vscode.window.showInformationMessage("Done!");
};

function genFile(
  folder: string,
  filename: string,
  content: string
): Promise<void> {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }

  return writeFile(`${folder}/${filename}`, content);
}
