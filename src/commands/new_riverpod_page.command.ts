import * as vscode from "vscode";
import * as lo from "lodash";
import * as changeCase from "change-case";
import * as fs from "fs";
import { getPageTemplate } from "../templates/riverpod_page.template";
import { getViewModelTemplate } from "../templates/view_model.template";
import { getStateTemplate } from "../templates/state.template";
import { showPrompt, writeFile } from "../utils/utils";
import { fetchPackageInfoFor } from "./auto_fix_imports/convert_to_relative_import";
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
            'Failed to initialize extension. Is this a valid Dart/Flutter project?',
        );
        return;
    }
    
  const targetDirectory = `${packageInfo.projectRoot}/${configResolver.uiFolderPath}`;
  let featureName = await showPrompt("Enter your feature", "register_user");

  if (lo.isNil(featureName)) {
    vscode.window.showErrorMessage("Please enter a feature name");
    return;
  }
  // lib/state_logic/state_notifiers/save_condition/save_condition_notifier.dart
  // lib/ui/pages/save_condition_page.dart
  
  let featureNameSnakeCase = changeCase.snakeCase(featureName!);
  let viewModelFolderPath = `${targetDirectory}/${featureNameSnakeCase}/view_model`;

  await Promise.all([
    genFile(`${targetDirectory}/${featureNameSnakeCase}`, `${featureNameSnakeCase}_page.dart`, getPageTemplate(featureName!)),
    genFile(viewModelFolderPath, `${featureNameSnakeCase}_view_model.dart`, getViewModelTemplate(featureName!)),
    genFile(viewModelFolderPath, `${featureNameSnakeCase}_state.dart`, getStateTemplate(featureName!)),
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
