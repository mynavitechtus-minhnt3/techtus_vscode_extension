import * as path from 'path';
import * as vscode from 'vscode';
import { EditorAccess, VSCodeEditorAccess } from "./editor_access";

const relativize = (filePath: string, importPath: string, pathSep: string) => {
    const dartSep = '/';
    const pathSplit = (path: string, sep: string) => path.length === 0 ? [] : path.split(sep);
    const fileBits = pathSplit(filePath, pathSep);
    const importBits = pathSplit(importPath, dartSep);
    let dotdotAmount = 0, startIdx;
    for (startIdx = 0; startIdx < fileBits.length; startIdx++) {
        if (fileBits[startIdx] === importBits[startIdx]) {
            continue;
        }
        dotdotAmount = fileBits.length - startIdx;
        break;
    }
    const relativeBits = new Array(dotdotAmount).fill('..').concat(importBits.slice(startIdx));
    return relativeBits.join(dartSep);
};

const fixImports = async (editor: EditorAccess, packageInfo: PackageInfo, pathSep: string): Promise<number> => {
    const currentPath = editor.getFileName().replace(/(\/|\\)[^/\\]*.dart$/, '');
    const libFolder = `${packageInfo.projectRoot}${pathSep}lib`;
    if (!currentPath.startsWith(libFolder)) {
        const l1 = 'Current file is not on project root or not on lib folder? File must be on $root/lib.';
        const l2 = `Your current file path is: '${currentPath}' and the lib folder according to the pubspec.yaml file is '${libFolder}'.`;
        throw Error(`${l1}\n${l2}`);
    }
    const relativePath = currentPath.substring(libFolder.length + 1);
    const lineCount = editor.getLineCount();
    let count = 0;
    for (let currentLine = 0; currentLine < lineCount; currentLine++) {
        const line: string = editor.getLineAt(currentLine);
        if (line.trim().length === 0) {
            continue;
        }
        const content = line.trim();
        if (!content.startsWith('import ')) {
            break;
        }
        const packageNameRegex = new RegExp(`^\\s*import\\s*(['"])package:${packageInfo.projectName}/([^'"]*)['"]([^;]*);\\s*$`);
        const packageNameExec = packageNameRegex.exec(content);
        if (packageNameExec) {
            const quote = packageNameExec[1];
            const importPath = packageNameExec[2];
            const ending = packageNameExec[3];
            const relativeImport = relativize(relativePath, importPath, pathSep);
            const newContent = `import ${quote}${relativeImport}${quote}${ending};`;
            await editor.replaceLineAt(currentLine, newContent);
            count++;
        } else {
            const standardPrefixRegex = new RegExp('^\\s*import\\s*([\'"])\\./(.*)$');
            const standardPrefixExec = standardPrefixRegex.exec(content);
            if (standardPrefixExec) {
                const quote = standardPrefixExec[1];
                const end = standardPrefixExec[2];
                const newContent = `import ${quote}${end}`;
                await editor.replaceLineAt(currentLine, newContent);
                count++;
            }
        }
    }
    return count;
};

const findPubspec = async (activeFileUri: vscode.Uri) => {
    const allPubspecUris = await vscode.workspace.findFiles('**/pubspec.yaml');
    return allPubspecUris.filter((pubspecUri) => {
        const packageRootUri = pubspecUri.with({
            path: path.dirname(pubspecUri.path),
        }) + '/';

        return activeFileUri.toString().startsWith(packageRootUri.toString());
    });
};

const fetchPackageInfoFor = async (activeDocumentUri: vscode.Uri): Promise<PackageInfo | null> => {
    const pubspecUris = await findPubspec(activeDocumentUri);
    if (pubspecUris.length !== 1) {
        vscode.window.showErrorMessage(
            `Expected to find a single pubspec.yaml file above ${activeDocumentUri}, ${pubspecUris.length} found.`,
        );
        return null;
    }

    const pubspec: vscode.TextDocument = await vscode.workspace.openTextDocument(pubspecUris[0]);
    const projectRoot = path.dirname(pubspec.fileName);
    const possibleNameLines = pubspec.getText().split('\n').filter((line: string) => line.match(/^name:/));
    if (possibleNameLines.length !== 1) {
        vscode.window.showErrorMessage(
            `Expected to find a single line starting with 'name:' on pubspec.yaml file, ${possibleNameLines.length} found.`,
        );
        return null;
    }
    const nameLine = possibleNameLines[0];
    const packageNameMatch = /^name:\s*(.*)$/mg.exec(nameLine);
    if (!packageNameMatch) {
        vscode.window.showErrorMessage(
            `Expected line 'name:' on pubspec.yaml to match regex, but it didn't (line: ${nameLine}).`,
        );
        return null;
    }
    return {
        projectRoot: projectRoot,
        projectName: packageNameMatch[1].trim(),
    };
};

const runFixImportTask = async (rawEditor: vscode.TextEditor) => {
    const packageInfo = await fetchPackageInfoFor(rawEditor.document.uri);
    if (!packageInfo) {
        vscode.window.showErrorMessage(
            'Failed to initialize extension. Is this a valid Dart/Flutter project?',
        );
        return;
    }

    const editor = new VSCodeEditorAccess(rawEditor);
    try {
        const count = await fixImports(editor, packageInfo, path.sep);
        vscode.commands.executeCommand('editor.action.organizeImports');
        // vscode.window.showInformationMessage(
        //     (count === 0 ? 'No lines changed.' : `${count} imports fixed.`) +
        //     ' All imports sorted.',
        // );
    } catch (ex) {
        if (ex instanceof Error) {
            vscode.window.showErrorMessage(ex.message);
        } else {
            throw ex;
        }
    }
};

export { relativize, fixImports, runFixImportTask, fetchPackageInfoFor, findPubspec };
