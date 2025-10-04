import * as fs from "fs";
import * as vscode from "vscode";
import * as changeCase from "change-case";
import { openFile, readFile, writeFile } from "../utils/utils";
import { configResolver } from "../utils/config_resolver";

export const createUTFile = async () => {
  const currentFile = vscode.window.activeTextEditor!.document.uri;
  const currentPath = normalizePath(currentFile.fsPath);
  const currentFileName = currentPath.substring(
    currentPath.lastIndexOf("/") + 1,
    currentPath.lastIndexOf(".")
  );

  if (currentFileName.endsWith("_view_model")) {
    createVMUTFile(currentFile, currentPath, currentFileName);
    return;
  }

  if (shouldCreateWidgetTestFile(currentFile)) {
    createPageWidgetTestFile(currentFile, currentPath, currentFileName);
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

void main() {
    setUp(() {
        
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

const normalizePath = (value: string): string => value.replace(/\\/g, "/");

const shouldCreateWidgetTestFile = (file: vscode.Uri): boolean => {
  const patterns = configResolver.widgetTestGlobPatterns || [];
  if (!patterns.length) {
    return false;
  }

  const absolutePath = normalizePath(file.fsPath);
  const relativePath = normalizePath(
    vscode.workspace.asRelativePath(file, false) || ""
  );
  const pathCandidates = new Set<string>([absolutePath]);
  if (relativePath) {
    pathCandidates.add(relativePath);
  }

  const lowerCaseCandidates = Array.from(pathCandidates).map((candidate) =>
    candidate.toLowerCase()
  );

  if (lowerCaseCandidates.some((candidate) => candidate.includes("/view_model/"))) {
    return false;
  }

  let isMatch = false;

  for (const rawPattern of patterns) {
    const trimmedPattern = rawPattern.trim();
    if (!trimmedPattern) {
      continue;
    }

    const isNegated = trimmedPattern.startsWith("!");
    const effectivePattern = isNegated
      ? trimmedPattern.substring(1).trim()
      : trimmedPattern;

    if (!effectivePattern) {
      continue;
    }

    const matched = Array.from(pathCandidates).some((candidate) =>
      matchesGlob(effectivePattern, candidate)
    );

    if (matched) {
      isMatch = !isNegated;
    }
  }

  return isMatch;
};

const globRegExpCache = new Map<string, RegExp>();

const matchesGlob = (pattern: string, target: string): boolean => {
  if (!globRegExpCache.has(pattern)) {
    globRegExpCache.set(pattern, globToRegExp(pattern));
  }
  return globRegExpCache.get(pattern)!.test(target);
};

const globToRegExp = (pattern: string): RegExp => {
  let regex = "^";
  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i];
    if (char === "*") {
      const isDoubleStar = pattern[i + 1] === "*";
      if (isDoubleStar) {
        regex += ".*";
        i++;
      } else {
        regex += "[^/]*";
      }
    } else if (char === "?") {
      regex += "[^/]";
    } else {
      regex += escapeRegExp(char);
    }
  }
  regex += "$";
  return new RegExp(regex, "i");
};

const escapeRegExp = (value: string): string =>
  value.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");


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

void main() {
    setUp(() {
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
