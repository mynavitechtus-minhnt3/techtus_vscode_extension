import * as _ from "lodash";
import * as changeCase from "change-case";
import * as mkdirp from "mkdirp";
import * as vscode from "vscode";

import { InputBoxOptions, OpenDialogOptions, Uri, window } from "vscode";
import { existsSync, lstatSync, writeFile } from "fs";
import {
  getBlocEventTemplate,
  getBlocStateTemplate,
  getBlocTemplate,
  getPageTemplate,
  getExportBlocTemplate,
} from "../templates";
import { configResolver } from "./fix_imports.command";
import { fetchPackageInfoFor } from "./auto_fix_imports/convert_to_relative_import";

export const newBloc = async () => {
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
  const blocName = await promptForBlocName();
  if (_.isNil(blocName) || blocName!.trim() === "") {
    window.showErrorMessage("The bloc name must not be empty");
    return;
  }

  // let targetDirectory;
  // if (_.isNil(_.get(uri, "fsPath")) || !lstatSync(uri.fsPath).isDirectory()) {
  //   targetDirectory = await promptForTargetDirectory();
  //   if (_.isNil(targetDirectory)) {
  //     window.showErrorMessage("Please select a valid directory");
  //     return;
  //   }
  // } else {
  //   targetDirectory = uri.fsPath;
  // }

  const pascalCaseBlocName = changeCase.pascalCase(blocName!.toLowerCase());
  try {
    await generateBlocCode(blocName!, targetDirectory);
    window.showInformationMessage(
      `Successfully Generated ${pascalCaseBlocName} Bloc`
    );
  } catch (error) {
    window.showErrorMessage(
      `Error:
          ${error instanceof Error ? error.message : JSON.stringify(error)}`
    );
  }
};

function promptForBlocName(): Thenable<string | undefined> {
  const blocNamePromptOptions: InputBoxOptions = {
    prompt: "Bloc Name",
    placeHolder: "register_account",
  };
  return window.showInputBox(blocNamePromptOptions);
}

async function promptForTargetDirectory(): Promise<string | undefined> {
  const options: OpenDialogOptions = {
    canSelectMany: false,
    openLabel: "Select a folder to create the bloc in",
    canSelectFolders: true,
  };

  return window.showOpenDialog(options).then((uri) => {
    if (_.isNil(uri) || _.isEmpty(uri)) {
      return undefined;
    }
    return uri![0].fsPath;
  });
}

async function generateBlocCode(blocName: string, targetDirectory: string) {
  const pageDirectoryPath = `${targetDirectory}/${blocName}`;
  const blocDirectoryPath = `${targetDirectory}/${blocName}/bloc`;
  if (!existsSync(pageDirectoryPath)) {
    await createDirectory(pageDirectoryPath);
  }

  if (!existsSync(blocDirectoryPath)) {
    await createDirectory(blocDirectoryPath);
  }

  await Promise.all([
    createBlocEventTemplate(blocName, targetDirectory),
    createBlocStateTemplate(blocName, targetDirectory),
    createBlocTemplate(blocName, targetDirectory),
    createExportBlocTemplate(blocName, targetDirectory),
    createPageTemplate(blocName, targetDirectory),
  ]);
}

function createDirectory(targetDirectory: string): Promise<void> {
  return new Promise((resolve, reject) => {
    mkdirp(targetDirectory, (error) => {
      if (error) {
        return reject(error);
      }
      resolve();
    });
  });
}

function createBlocEventTemplate(blocName: string, targetDirectory: string) {
  const snakeCaseBlocName = changeCase.snakeCase(blocName.toLowerCase());
  const targetPath = `${targetDirectory}/${blocName}/bloc/${snakeCaseBlocName}_event.dart`;
  if (existsSync(targetPath)) {
    throw Error(`${snakeCaseBlocName}_event.dart already exists`);
  }
  return new Promise<void>(async (resolve, reject) => {
    writeFile(targetPath, getBlocEventTemplate(blocName), "utf8", (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

function createBlocStateTemplate(blocName: string, targetDirectory: string) {
  const snakeCaseBlocName = changeCase.snakeCase(blocName.toLowerCase());
  const targetPath = `${targetDirectory}/${blocName}/bloc/${snakeCaseBlocName}_state.dart`;
  if (existsSync(targetPath)) {
    throw Error(`${snakeCaseBlocName}_state.dart already exists`);
  }
  return new Promise<void>(async (resolve, reject) => {
    writeFile(targetPath, getBlocStateTemplate(blocName), "utf8", (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

function createBlocTemplate(blocName: string, targetDirectory: string) {
  const snakeCaseBlocName = changeCase.snakeCase(blocName.toLowerCase());
  const targetPath = `${targetDirectory}/${blocName}/bloc/${snakeCaseBlocName}_bloc.dart`;
  if (existsSync(targetPath)) {
    throw Error(`${snakeCaseBlocName}_bloc.dart already exists`);
  }
  return new Promise<void>(async (resolve, reject) => {
    writeFile(targetPath, getBlocTemplate(blocName), "utf8", (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

function createPageTemplate(blocName: string, targetDirectory: string) {
  const snakeCaseBlocName = changeCase.snakeCase(blocName.toLowerCase());
  const targetPath = `${targetDirectory}/${snakeCaseBlocName}/${snakeCaseBlocName}_page.dart`;
  if (existsSync(targetPath)) {
    throw Error(`${snakeCaseBlocName}_page.dart already exists`);
  }
  return new Promise<void>(async (resolve, reject) => {
    writeFile(targetPath, getPageTemplate(blocName), "utf8", (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

function createExportBlocTemplate(blocName: string, targetDirectory: string) {
  const snakeCaseBlocName = changeCase.snakeCase(blocName.toLowerCase());
  const targetPath = `${targetDirectory}/${blocName}/bloc/${snakeCaseBlocName}.dart`;
  if (existsSync(targetPath)) {
    throw Error(`${snakeCaseBlocName}.dart already exists`);
  }
  return new Promise<void>(async (resolve, reject) => {
    writeFile(targetPath, getExportBlocTemplate(blocName), "utf8", (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}