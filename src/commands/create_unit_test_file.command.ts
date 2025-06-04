import * as fs from "fs";
import * as vscode from "vscode";
import * as changeCase from "change-case";
import { openFile, readFile, writeFile } from "../utils/utils";
import { configResolver } from "../utils/configResolver";

export const createUTFile = async () => {
  const currentFile = vscode.window.activeTextEditor!.document.uri;
  const currentPath = currentFile.path;
  const currentFileName = currentPath.substring(
    currentPath.lastIndexOf("/") + 1,
    currentPath.lastIndexOf(".")
  );

  if ((currentFileName.endsWith("_page") && currentPath.includes("ui/page")) || currentPath.includes("ui/component")) {
    createPageWidgetTestFile(currentFile, currentPath, currentFileName);
    return;
  }

  if (currentFileName.endsWith("_view_model")) {
    createVMUTFile(currentFile, currentPath, currentFileName);
    return;
  }

  const content = await readFile(currentPath);
  // get all properties from file .dart
  const properties = content.match(/(?<=final\s)(\w+)(?=\s\w+;)/g);
  console.log(properties);

  const mocks = properties
    ?.map((e) => `class _Mock${e} extends Mock implements ${e} {}`)
    .join("\n");
  const propertyDeclaration = properties
    ?.map((e) => `final _mock${e} = _Mock${e}();`)
    .join("\n");
  const propertyDeclaration2 = `late ${changeCase.pascalCase(
    currentFileName.endsWith("impl")
      ? currentFileName.substring(0, currentFileName.length - 4)
      : currentFileName
  )} ${changeCase.camelCase(
    currentFileName.endsWith("impl")
      ? currentFileName.substring(0, currentFileName.length - 4)
      : currentFileName
  )};`;
  // currentPath: mini/lib/data/src/repository/source/api/app_api_service.dart
  // test path: mini/test/unit_test/data/src/repository/source/api/app_api_service_test.dart
  const arr = currentPath.split("/lib/");
  const testPath =
    arr[0] + "/test/unit_test/" + arr[1].replace(".dart", "_test.dart");
  const testContent = `import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:${configResolver.appName}/index.dart';

${mocks ?? ""}

void main() {
    ${propertyDeclaration2 ?? ""}
    ${propertyDeclaration ?? ""}

    setUp(() {
        ${changeCase.camelCase(
          currentFileName.endsWith("impl")
            ? currentFileName.substring(0, currentFileName.length - 4)
            : currentFileName
        )} = ${changeCase.pascalCase(currentFileName)}(
            ${properties?.map((e) => `_mock${e}`).join(",\n") ?? ""}${
    properties?.length == 0 || properties == null ? "" : ","
  }
        );
    });

    group('xxx', () {
        test('when ', () async {

        });
    });
}
`;
  if (fs.existsSync(testPath) && (await readFile(testPath)).trim() != "") {
    // vscode.window.showErrorMessage(
    //   "Test file is already existed, please check again!"
    // );
    openFile(testPath);
    return;
  }

  if (!fs.existsSync(testPath.substring(0, testPath.lastIndexOf("/")))) {
    fs.mkdirSync(testPath.substring(0, testPath.lastIndexOf("/")), {
      recursive: true,
    });
  }
  await writeFile(testPath, testContent);
  const doc = await vscode.workspace.openTextDocument(testPath);
  await vscode.window.showTextDocument(doc, { preview: false });
  await vscode.commands.executeCommand("editor.action.formatDocument");
};


const createPageWidgetTestFile = async (
  currentFile: vscode.Uri,
  currentPath: string,
  currentFileName: string
) => {
  const arr = currentPath.split("/lib/");
  const testPath =
    arr[0] + "/test/widget_test/" + arr[1].replace(".dart", "_test.dart");

  if (fs.existsSync(testPath) && (await readFile(testPath)).trim() != "") {
    // vscode.window.showErrorMessage(
    //   "Test file is already existed, please check again!"
    // );
    openFile(testPath);
    return;
  }
  const testContent = '';

  if (!fs.existsSync(testPath.substring(0, testPath.lastIndexOf("/")))) {
    fs.mkdirSync(testPath.substring(0, testPath.lastIndexOf("/")), {
      recursive: true,
    });
  }
  await writeFile(testPath, testContent);
  const doc = await vscode.workspace.openTextDocument(testPath);
  await vscode.window.showTextDocument(doc, { preview: false });
  await vscode.commands.executeCommand("editor.action.formatDocument");
};

const createVMUTFile = async (
  currentFile: vscode.Uri,
  currentPath: string,
  currentFileName: string
) => {
  const content = await readFile(currentPath);
  // get all properties from file .dart
  const properties = content.match(/(?<=final\s)(\w+)(?=\s\w+;)/g);
  console.log(properties);

  const propertyDeclaration2 = `late ${changeCase.pascalCase(
    currentFileName.endsWith("impl")
      ? currentFileName.substring(0, currentFileName.length - 4)
      : currentFileName
  )} ${changeCase.camelCase(
    currentFileName.endsWith("impl")
      ? currentFileName.substring(0, currentFileName.length - 4)
      : currentFileName
  )};`;
  const stateClassName =
    changeCase.pascalCase(
      currentFileName.substring(
        0,
        currentFileName.length - "_view_model".length
      )
    ) + "State";
  // currentPath: mini/lib/data/src/repository/source/api/app_api_service.dart
  // test path: mini/test/unit_test/data/src/repository/source/api/app_api_service_test.dart
  const arr = currentPath.split("/lib/");
  const testPath =
    arr[0] + "/test/unit_test/" + arr[1].replace(".dart", "_test.dart");
  const testContent = `import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:${configResolver.appName}/index.dart';
import 'package:state_notifier_test/state_notifier_test.dart';

import '../../../../../common/base_test.dart';

void main() {
    ${propertyDeclaration2 ?? ""}

    setUp(() {
        ${changeCase.camelCase(currentFileName)} = ${changeCase.pascalCase(
    currentFileName
  )}(ref);
    });

    group('xxx', () {
        test('when ', () async {

        });
    });
}

CommonState<${stateClassName}> _${changeCase.camelCase(
    stateClassName
  )}(${stateClassName} data) => CommonState(data: data);

extension ${stateClassName}Ext on CommonState<${stateClassName}> {
  CommonState<${stateClassName}> copyWithData({
  }) {
    return copyWith(
      data: data.copyWith(
      ),
    );
  }
}
`;
  if (fs.existsSync(testPath) && (await readFile(testPath)).trim() != "") {
    // vscode.window.showErrorMessage(
    //   "Test file is already existed, please check again!"
    // );
    openFile(testPath);
    return;
  }

  if (!fs.existsSync(testPath.substring(0, testPath.lastIndexOf("/")))) {
    fs.mkdirSync(testPath.substring(0, testPath.lastIndexOf("/")), {
      recursive: true,
    });
  }
  await writeFile(testPath, testContent);
  const doc = await vscode.workspace.openTextDocument(testPath);
  await vscode.window.showTextDocument(doc, { preview: false });
  await vscode.commands.executeCommand("editor.action.formatDocument");
};
