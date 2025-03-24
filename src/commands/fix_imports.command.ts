import * as path from 'path';
import * as vscode from "vscode";
import { autoExport } from './auto_export.command';
import { ConfigResolver } from "./auto_fix_imports/configResolver";
import { fetchPackageInfoFor, fixImports, runFixImportTask } from "./auto_fix_imports/convert_to_relative_import";
import { VSCodeEditorAccess } from "./auto_fix_imports/editor_access";

export let configResolver = new ConfigResolver();

export const configChanges = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('nalsMobileBrain')) {
        configResolver = new ConfigResolver();
    }
});

export const documentSave = vscode.workspace.onDidSaveTextDocument(
    async (e: vscode.TextDocument) => {
        if (!configResolver.fixOnSave && !configResolver.autoExportOnSave) {
            return;
        }
        const rawEditor = await vscode.window.showTextDocument(e);

        if (configResolver.fixOnSave) {
            runFixImportTask(rawEditor);
        }

        if (configResolver.autoExportOnSave) {
            autoExport();
        }
    },
);

export const fixImport = async () => {
    const rawEditor = vscode.window.activeTextEditor;
    if (!rawEditor) {
        return;
    }

    runFixImportTask(rawEditor);
};

export const fixAllImports = async () => {
    const excludeExt = configResolver.excludeFilesWhenFixImport;
    // const packages = configResolver.packages;

    // for (let packageName of packages) {
        const excludeFiles = excludeExt ? `lib/**/*.{${excludeExt}}` : null;
        const filesUris = await vscode.workspace.findFiles(`lib/**/**.dart`, excludeFiles);

        if (filesUris.length === 0) {
            vscode.window.showInformationMessage(`No dart files were found`);
            return;
        }

        const packageInfo = await fetchPackageInfoFor(filesUris[0]);

        if (!packageInfo) {
            vscode.window.showErrorMessage(
                `Failed to initialize extension. Is this a valid Dart/Flutter project?`,
            );
            return;
        }

        let totalCount = 0;
        for await (const uri of filesUris) {
            const document = await vscode.workspace.openTextDocument(uri);
            const rawEditor = await vscode.window.showTextDocument(document);
            const editor = new VSCodeEditorAccess(rawEditor);
            try {
                const count = await fixImports(editor, packageInfo, path.sep);
                vscode.commands.executeCommand('editor.action.organizeImports');
                totalCount += count;
            } catch (ex) {
                if (ex instanceof Error) {
                    vscode.window.showErrorMessage(`${ex.message}`);
                } else {
                    throw ex;
                }
            }
        }
        vscode.window.showInformationMessage(
            totalCount === 0
                ? `Done. No lines changed`
                : `All done. ${totalCount} lines changed.`,
        );
    // }
};