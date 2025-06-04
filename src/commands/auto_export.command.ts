import * as _ from "lodash";
import * as vscode from "vscode";
import * as path from "path";
import { fetchPackageInfoFor, writeFile, readFile } from "../utils/utils";
import { configResolver } from "../utils/configResolver";

export const autoExport = async () => {
  let excludeExt = configResolver.excludeFilesWhenAutoExport;
  let barrier = configResolver.autoExportBarrier.trim();

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
  // const editor = new VSCodeEditorAccess(rawEditor);
  // const currentPath = editor.getFileName().replace(/(\/|\\)[^/\\]*.dart$/, '');
  const libFolder = `${packageInfo.projectRoot}${path.sep}lib`;
  // const app = `${libFolder}/app/app.dart`;
  // const data = `${libFolder}/data/data.dart`;
  // const domain = `${libFolder}/domain/domain.dart`;
  // const shared = `${libFolder}/shared/shared.dart`;
  // const resources = `${libFolder}/resources/resources.dart`;

  await Promise.all([
    writeExport(excludeExt, barrier, libFolder),
    // writeExport(excludeExt, barrier, 'resources', libFolder),
  ]);

  vscode.window.showInformationMessage(`Auto export completed!`);
};

async function writeExport(excludeExt, barrier, libFolder) {
  const modulePath = vscode.workspace.asRelativePath(libFolder);
  const f = await vscode.workspace.findFiles(`${modulePath}/**/**.dart`);
  const filesUris = await await vscode.workspace.findFiles(
    `${modulePath}/**/**.dart`,
    `${modulePath}/**/**.{${excludeExt}}`
  );
  const indexFilePath = `${libFolder}/index.dart`;
  if (filesUris.length === 0) {
    vscode.window.showInformationMessage(`No dart files were found`);
    return;
  }

  const moduleFolder = `${libFolder}/`;
  if (barrier === "") {
    await writeFile(
      indexFilePath,
      filesUris
        .map(
          (e) =>
            `export '${e.path.substring(
              e.path.indexOf(`${moduleFolder}`) + `${moduleFolder}`.length
            )}';`
        )
        .sort()
        .join("\n") + "\n"
    );
  } else {
    let currentContent = await readFile(indexFilePath);

    if (currentContent.includes(barrier)) {
      let keepContent = currentContent.substring(
        0,
        currentContent.indexOf(barrier) + barrier.length
      );
      await writeFile(
        indexFilePath,
        `${keepContent}\n` +
          filesUris
            .map(
              (e) =>
                `export '${e.path.substring(
                  e.path.indexOf(`${moduleFolder}`) + `${moduleFolder}`.length
                )}';`
            )
            .sort()
            .join("\n") +
          "\n"
      );
    } else {
      await writeFile(
        indexFilePath,
        filesUris
          .map(
            (e) =>
              `export '${e.path.substring(
                e.path.indexOf(`${moduleFolder}`) + `${moduleFolder}`.length
              )}';`
          )
          .sort()
          .join("\n") + "\n"
      );
    }
  }
}
