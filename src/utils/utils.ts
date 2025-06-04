import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

class StringEscapeSequence {
  private readonly unescapedStringRegex: RegExp;

  constructor(readonly start: string) {
    this.unescapedStringRegex = new RegExp(
      `^${start}([\\s\\S]*?)${start.replace("r", "")}$`,
      "iu"
    );
  }

  getUnescapedString = (input: string): string =>
    (input.match(this.unescapedStringRegex) ?? [])[1].replace(/\\n/gu, "\n");
}

export const escapeSequences = [
  'r"""',
  "r'''",
  'r"',
  "r'",
  '"""',
  "'''",
  '"',
  "'",
].map((start) => new StringEscapeSequence(start));

export const getUnescapedString = (input: string): string =>
  escapeSequences
    .find((e) => input.startsWith(e.start))
    ?.getUnescapedString(input) ?? "";

export const extractInterpolatedVariables = (input: string): string[] =>
  Array.from(input.matchAll(/\$\{?([^\s{}]+)\}?/gu), (match) => match[1]);

const PARENT_DIRECTORY = "..";

export const resolvePath = (inputPath: string): string =>
  path.join(
    ...path
      .normalize(inputPath)
      .split(path.sep)
      .filter((segment) => segment !== PARENT_DIRECTORY)
  );

export const currentFile = () => vscode.window.activeTextEditor!.document.uri;
export const currentPath = () => currentFile().path;
export const currentFileName = () =>
  currentPath().substring(
    currentPath().lastIndexOf("/") + 1,
    currentPath().lastIndexOf(".")
  );
export const selectedText = () =>
  vscode.window.activeTextEditor!.document.getText(
    vscode.window.activeTextEditor!.selection
  );

export function editSelection(newText: string) {
  vscode.window.activeTextEditor?.edit((builder) => {
    builder.replace(vscode.window.activeTextEditor!.selection, newText);
  });
}

export function showPrompt(
  title: string,
  placeholder: string
): Thenable<string | undefined> {
  const inputText: vscode.InputBoxOptions = {
    prompt: title,
    placeHolder: placeholder,
  };

  return vscode.window.showInputBox(inputText);
}

export function readFile(path: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    fs.readFile(path, "utf8", (err, data) => {
      if (err) {
        reject(new Error(`Couldn't read file due to error: ${err}`));
      } else {
        resolve(data);
      }
    });
  });
}

export function writeFile(path: string, data: string) {
  return new Promise<void>((resolve, reject) => {
    fs.writeFile(path, data, "utf8", (err) => {
      if (err) {
        reject(new Error(`Couldn't write file due to error: ${err}`));
      } else {
        resolve();
      }
    });
  });
}

export function openFile(path: string) {
  return vscode.commands.executeCommand("vscode.open", vscode.Uri.file(path));
}

export async function showInputBox(
  title: string,
  value: string
): Promise<string> {
  const disposables: vscode.Disposable[] = [];
  try {
    return await new Promise<string>((resolve) => {
      const inputBox = vscode.window.createInputBox();
      inputBox.title = title;
      inputBox.value = value;
      disposables.push(
        inputBox.onDidAccept(() => {
          inputBox.enabled = false;
          inputBox.busy = true;
          resolve(inputBox.value);
          inputBox.enabled = true;
          inputBox.busy = false;
          inputBox.hide();
        })
      );
      inputBox.show();
    });
  } finally {
    disposables.forEach((d) => {
      d.dispose();
    });
  }
}

export class LionizationPickItem implements vscode.QuickPickItem {
  constructor(readonly label: string) {}
}

export async function showQuickPick(
  title: string,
  items: LionizationPickItem[]
): Promise<string> {
  const disposables: vscode.Disposable[] = [];
  try {
    return await new Promise<string>((resolve) => {
      const quickPick = vscode.window.createQuickPick();
      quickPick.title = title;
      quickPick.items = items;
      disposables.push(
        quickPick.onDidChangeSelection((selected) => {
          quickPick.enabled = false;
          quickPick.busy = true;
          const item = selected[0];
          resolve(item.label);
          quickPick.enabled = true;
          quickPick.busy = false;
          quickPick.hide();
        })
      );
      quickPick.show();
    });
  } finally {
    disposables.forEach((d) => d.dispose());
  }
}

export const camelize = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036F]/u, "")
    .split(/[^a-zA-Z0-9]/u)
    .map((element, index) =>
      index === 0
        ? element.toLowerCase()
        : element.charAt(0).toUpperCase() + element.substring(1).toLowerCase()
    )
    .join("");

export const getSelectedText = (
  editor: vscode.TextEditor
): vscode.Selection => {
  const emptySelection = new vscode.Selection(
    editor.document.positionAt(0),
    editor.document.positionAt(0)
  );
  const language = editor.document.languageId;
  if (language != "dart") return emptySelection;

  const line = editor.document.lineAt(editor.selection.start);
  const lineText = line.text;
  const openBracket = "(";
  const closeBracket = ")";
  const openBracketIndex = line.text.indexOf(
    openBracket,
    editor.selection.anchor.character
  );

  let widgetStartIndex =
    openBracketIndex > 1
      ? openBracketIndex - 1
      : editor.selection.anchor.character;
  for (widgetStartIndex; widgetStartIndex > 0; widgetStartIndex--) {
    const currentChar = lineText.charAt(widgetStartIndex);
    const isBeginningOfWidget =
      currentChar === openBracket ||
      (currentChar === " " && lineText.charAt(widgetStartIndex - 1) !== ",");
    if (isBeginningOfWidget) break;
  }
  widgetStartIndex++;

  if (openBracketIndex < 0) {
    const commaIndex = lineText.indexOf(",", widgetStartIndex);
    const bracketIndex = lineText.indexOf(closeBracket, widgetStartIndex);
    const endIndex =
      commaIndex >= 0
        ? commaIndex
        : bracketIndex >= 0
        ? bracketIndex
        : lineText.length;

    return new vscode.Selection(
      new vscode.Position(line.lineNumber, widgetStartIndex),
      new vscode.Position(line.lineNumber, endIndex)
    );
  }

  let bracketCount = 1;
  for (let l = line.lineNumber; l < editor.document.lineCount; l++) {
    const currentLine = editor.document.lineAt(l);
    let c = l === line.lineNumber ? openBracketIndex + 1 : 0;
    for (c; c < currentLine.text.length; c++) {
      const currentChar = currentLine.text.charAt(c);
      if (currentChar === openBracket) bracketCount++;
      if (currentChar === closeBracket) bracketCount--;
      if (bracketCount === 0) {
        return new vscode.Selection(
          new vscode.Position(line.lineNumber, widgetStartIndex),
          new vscode.Position(l, c + 1)
        );
      }
    }
  }

  return emptySelection;
};

export const wrapWith = async (snippet: (widget: string) => string) => {
  let editor = vscode.window.activeTextEditor;
  if (!editor) return;
  const selection = getSelectedText(editor);
  const widget = editor.document.getText(selection).replace("$", "\\$");
  editor.insertSnippet(new vscode.SnippetString(snippet(widget)), selection);
  await vscode.commands.executeCommand("editor.action.formatDocument");
};

export const findPubspec = async (activeFileUri: vscode.Uri) => {
  const allPubspecUris = await vscode.workspace.findFiles("**/pubspec.yaml");
  return allPubspecUris.filter((pubspecUri) => {
    const packageRootUri =
      pubspecUri.with({ path: path.dirname(pubspecUri.path) }) + "/";

    return activeFileUri.toString().startsWith(packageRootUri.toString());
  });
};

export const fetchPackageInfoFor = async (
  activeDocumentUri: vscode.Uri
): Promise<PackageInfo | null> => {
  const pubspecUris = await findPubspec(activeDocumentUri);
  const pubspec: vscode.TextDocument = await vscode.workspace.openTextDocument(
    pubspecUris[0]
  );
  const projectRoot = path.dirname(pubspec.fileName);
  const possibleNameLines = pubspec
    .getText()
    .split("\n")
    .filter((line: string) => line.match(/^name:/));
  if (possibleNameLines.length !== 1) {
    vscode.window.showErrorMessage(
      `Expected to find a single line starting with 'name:' on pubspec.yaml file, ${possibleNameLines.length} found.`
    );
    return null;
  }
  const nameLine = possibleNameLines[0];
  const packageNameMatch = /^name:\s*(.*)$/gm.exec(nameLine);
  if (!packageNameMatch) {
    vscode.window.showErrorMessage(
      `Expected line 'name:' on pubspec.yaml to match regex, but it didn't (line: ${nameLine}).`
    );
    return null;
  }
  return {
    projectRoot: projectRoot,
    projectName: packageNameMatch[1].trim(),
  };
};
