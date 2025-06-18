import * as copyPaste from "copy-paste";
import * as fs from "fs";
import { jsonc } from "jsonc";
import * as path from "path";
import * as vscode from "vscode";
import * as yaml from "yaml";
import {
  CommandParameters,
  EditFilesParameters,
  KeyValuePair,
  L10nObject,
  LionizationPickItem,
  PackageInfo,
  Placeholder,
  PlaceholderType,
  PlaceholderTypeItem,
  StringEscapeSequence,
} from "./classes";

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
  placeholder: string,
  value?: string
): Thenable<string | undefined> {
  const inputOptions: vscode.InputBoxOptions = {
    prompt: title,
    placeHolder: placeholder,
    value: value,
  };

  return vscode.window.showInputBox(inputOptions);
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
    disposables.forEach((d) => {
      d.dispose();
    });
  }
}

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
  const openBracketIndex = line.text.indexOf(
    "(",
    editor.selection.anchor.character
  );

  let widgetStartIndex =
    openBracketIndex > 1
      ? openBracketIndex - 1
      : editor.selection.anchor.character;
  for (widgetStartIndex; widgetStartIndex > 0; widgetStartIndex--) {
    const currentChar = lineText.charAt(widgetStartIndex);
    const isBeginningOfWidget =
      currentChar === "(" ||
      (currentChar === " " && lineText.charAt(widgetStartIndex - 1) !== ",");
    if (isBeginningOfWidget) break;
  }
  widgetStartIndex++;

  if (openBracketIndex < 0) {
    const commaIndex = lineText.indexOf(",", widgetStartIndex);
    const bracketIndex = lineText.indexOf(")", widgetStartIndex);
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
      if (currentChar === "(") bracketCount++;
      if (currentChar === ")") bracketCount--;
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

export const validNumberFormats = [
  "compact",
  "compactCurrency",
  "compactSimpleCurrency",
  "compactLong",
  "currency",
  "decimalPattern",
  "decimalPercentPattern",
  "percentPattern",
  "scientificPattern",
  "simpleCurrency",
];

export const numberFormatsWithSymbol = ["compactCurrency", "currency"];

export function includeInSymbol(value: string) {
  return numberFormatsWithSymbol.includes(value);
}

export const numberFormatsWithDecimalDigits = [
  "compactCurrency",
  "compactSimpleCurrency",
  "currency",
  "decimalPercentPattern",
  "simpleCurrency",
];

export function includeInDecimalDigits(value: string) {
  return numberFormatsWithDecimalDigits.includes(value);
}

export const numberFormatsWithCustomPattern = ["currency"];

export function includeInCustomPattern(value: string) {
  return numberFormatsWithCustomPattern.includes(value);
}

export const validDateFormats = [
  "d",
  "E",
  "EEEE",
  "LLL",
  "LLLL",
  "M",
  "Md",
  "MEd",
  "MMM",
  "MMMd",
  "MMMEd",
  "MMMM",
  "MMMMd",
  "MMMMEEEEd",
  "QQQ",
  "QQQQ",
  "y",
  "yM",
  "yMd",
  "yMEd",
  "yMMM",
  "yMMMd",
  "yMMMEd",
  "yMMMM",
  "yMMMMd",
  "yMMMMEEEEd",
  "yQQQ",
  "yQQQQ",
  "H",
  "Hm",
  "Hms",
  "j",
  "jm",
  "jms",
  "jmv",
  "jmz",
  "jv",
  "jz",
  "m",
  "ms",
  "s",
];

export function notInclude(value: string) {
  return !validDateFormats.includes(value);
}

export async function showDateFormatQuickPick(
  variable: string
): Promise<string> {
  const disposables: vscode.Disposable[] = [];
  try {
    return await new Promise<string>((resolve) => {
      const quickPick = vscode.window.createQuickPick();
      quickPick.title = `Choose the number format for the variable ${variable}`;
      quickPick.items = validDateFormats.map((s) => new LionizationPickItem(s));
      quickPick.onDidChangeValue(() => {
        if (notInclude(quickPick.value))
          quickPick.items = [quickPick.value, ...validDateFormats].map(
            (label) => ({
              label,
            })
          );
      });
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
    disposables.forEach((d) => {
      d.dispose();
    });
  }
}

export function getPlaceholderTypes() {
  return Object.keys(PlaceholderType).filter((p) => isNaN(Number(p)));
}

export function getPlaceholderType(placeholderTypeValue: string) {
  return Object.values(PlaceholderType).filter(
    (p) => p.toString() === placeholderTypeValue
  )[0] as PlaceholderType;
}

export async function showPlaceholderQuickPick(
  variable: string
): Promise<PlaceholderType> {
  const placeholderTypeValue = await showQuickPick(
    `Choose the type for the variable ${variable}`,
    getPlaceholderTypes().map((p) => new PlaceholderTypeItem(p))
  );
  return getPlaceholderType(placeholderTypeValue);
}

export const findPubspec = async (activeFileUri: vscode.Uri) => {
  const allPubspecUris = await vscode.workspace.findFiles("**/pubspec.yaml");
  return allPubspecUris.filter((pubspecUri) => {
    const packageRootUri =
      (pubspecUri.with({
        path: path.dirname(pubspecUri.path),
      }) as unknown as vscode.Uri) + "/";

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

export function convertNullableTypeToNonNullableType(t: string): string {
  if (t.endsWith("?")) {
    return t.substring(0, t.length - 1);
  }

  return t;
}

export function getTypeByValue(v: string): string {
  // return 'dynamic';

  const value = v.trim();
  if (value.startsWith('"')) {
    return "String";
  }

  if (value.startsWith("true") || value.startsWith("false")) {
    return "bool";
  }

  if (value.startsWith("[")) {
    const arr = value.split(",");
    if (arr.length == 0) {
      return "dynamic";
    }
    return `List<${getTypeByValue(
      arr[0].trim().replace("[", "").replace("]", "")
    )}>`;
  }

  if (value.match(RegExp("^\\d+\\.\\d+$")) != null) {
    return "double";
  }

  if (value.match(RegExp("^\\d+$")) != null) {
    return "int";
  }

  return "dynamic";
}

export function getDefaultValueByType(v: string): string {
  const valueType = convertNullableTypeToNonNullableType(
    v.replace("required", "").trim()
  );
  switch (valueType) {
    case "int":
      return "0";
    case "String":
      return "''";
    case "bool":
      return "false";
    case "double":
      return "0.0";
    case "dynamic":
      return "null";
  }

  if (valueType.startsWith("List")) {
    return "<" + valueType.substring(5, valueType.length - 1) + ">[]";
  }

  if (valueType.startsWith("Map")) {
    const mapType = valueType.replace("Map", "").trim();

    return convertNullableTypeToNonNullableType(mapType) + "{}";
  }

  // Object
  return valueType + "()";
}

export function genFile(
  folder: string,
  filename: string,
  content: string
): Promise<void> {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }

  return writeFile(`${folder}/${filename}`, content);
}

function existsSync(path: string): boolean {
  return fs.existsSync(path);
}

export function getClipboardText(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    copyPaste.paste((err, text) => {
      if (err !== null) {
        reject(err);
      }
      resolve(text);
    });
  });
}

export function handleError(error: Error) {
  const text = error.message;
  vscode.window.showErrorMessage(text);
}

export const validateJSON = (text: any) => {
  if (!text.trim().startsWith("{")) {
    text = `{${text}`;
  }
  if (!text.trim().endsWith("}")) {
    if (text.trim().endsWith(",")) {
      text = text.trim().substring(0, text.trim().length - 1);
    }
    text = `${text}}`;
  }

  console.log(`validateJSON: ${text}`);
  const [err, result] = jsonc.safe.parse(text.trim());

  if (text.length === 0) {
    return Promise.reject(new Error("Error: Empty Json"));
  } else {
    if (err) {
      return Promise.reject(
        new Error(
          `Parsing Json failed. This is not a Json: ${err.name}: ${err.message}`
        )
      );
    } else {
      return Promise.resolve(JSON.stringify(result) as any);
    }
  }
};

export function registerCodeAction(
  commandTitle: string,
  commandName: string,
  document: vscode.TextDocument,
  range: vscode.Range | vscode.Selection,
  actions: vscode.CodeAction[]
) {
  const codeAction = new vscode.CodeAction(
    commandTitle,
    vscode.CodeActionKind.Refactor
  );

  codeAction.command = {
    title: commandTitle,
    command: commandName,
    arguments: [document, range],
  };

  actions.push(codeAction);
}

export function indexFrom(
  documentTextArray: string[],
  regex: RegExp,
  startingFrom: number
) {
  for (let i = startingFrom; i < documentTextArray.length; i++) {
    if (regex.test(documentTextArray[i])) {
      return i;
    }
  }

  return -1;
}

export function replaceLine(
  edit: vscode.WorkspaceEdit,
  document: vscode.TextDocument,
  range: vscode.Range,
  newLineText: string
) {
  edit.replace(document.uri, range, newLineText);
}

async function findYamlFiles(
  projectName: string,
  yamlFileName: string
): Promise<vscode.Uri[]> {
  const yamlFiles = await vscode.workspace.findFiles(
    `**/${projectName}/${yamlFileName}`
  );
  if (yamlFiles.length !== 0) {
    return yamlFiles;
  }
  return await vscode.workspace.findFiles(`**/${yamlFileName}`);
}

async function findFiles(include: string): Promise<vscode.Uri[]> {
  return await vscode.workspace.findFiles(resolvePath(include));
}

async function findArbFiles(
  projectName: string,
  arbDir: string
): Promise<vscode.Uri[]> {
  const arbFiles = await findFiles(`**/${projectName}/${arbDir}/*.arb`);
  if (arbFiles.length !== 0) {
    return arbFiles;
  }
  return await findFiles(`**/${arbDir}/*.arb`);
}

export async function getArbFiles(
  projectName: string
): Promise<[vscode.Uri[], vscode.Uri | undefined]> {
  const yamlFileName = "l10n.yaml";
  const yamlFiles = (await findYamlFiles(projectName, yamlFileName)).filter(
    (yamlFile) => yamlFile.path.includes(".fvm") === false
  );

  if (yamlFiles.length === 0) {
    const errorMessage = `The ${yamlFileName} file was not found.`;
    vscode.window.showErrorMessage(errorMessage);
    throw new Error(errorMessage);
  }
  const yamlFile = yamlFiles[0];
  const textDocument = await vscode.workspace.openTextDocument(yamlFile);
  const parsedConfiguration = yaml.parseDocument(textDocument.getText());

  const arbDir = parsedConfiguration.get("arb-dir") as string;
  const arbFiles = await findArbFiles(projectName, arbDir);

  const templateArbFileName =
    (parsedConfiguration.get("template-arb-file") as string | undefined) ??
    "app_en.arb";
  const templateArbFile = arbFiles.find((arbFile) =>
    arbFile.path.endsWith(templateArbFileName)
  );
  return [arbFiles, templateArbFile];
}

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

export function getFunctionCall(
  appLocalizationsVariable: string,
  key: string,
  variables: string[]
): string {
  const functionCall = `${appLocalizationsVariable}.${key}`;
  if (variables.length === 0) {
    return functionCall;
  }
  const variablesString = variables
    .map((v, i) => (i === variables.length - 1 ? `${v}` : `${v}, `))
    .reduce((a, p) => a + p);
  return `${functionCall}(${variablesString})`;
}

export function getProjectName(documentUri: vscode.Uri): string {
  return documentUri.path.split("/lib/")[0].split("/").pop() ?? "";
}

export async function runGeneration(): Promise<void> {
  await runIfExist("flutter.task.genl10n");
}

export async function runIfExist(
  flutterPackagesGetCommand: string
): Promise<void> {
  const commands = await vscode.commands.getCommands();
  if (!commands.includes(flutterPackagesGetCommand)) {
    return;
  }
  await vscode.commands.executeCommand(flutterPackagesGetCommand);
}

export async function getPlaceholder(variable: string) {
  const name = await showInputBox(
    `Enter the name of the variable ${variable}`,
    camelize(variable)
  );
  const placeholderType = await showPlaceholderQuickPick(name);

  let placeholder = new Placeholder(name, variable, placeholderType);

  switch (placeholderType) {
    case PlaceholderType.DateTime: {
      const format = await showDateFormatQuickPick(name);
      placeholder = placeholder.addFormat(format);
      break;
    }
    case PlaceholderType.int:
    case PlaceholderType.num:
    case PlaceholderType.double: {
      const numberFormats: string[] = [];
      if (placeholderType === PlaceholderType.int) {
        numberFormats.push("none");
      }
      numberFormats.push(...validNumberFormats);
      const format = await showQuickPick(
        `Choose the number format for the variable ${variable}`,
        numberFormats.map((p) => new LionizationPickItem(p))
      );
      if (format !== "none") {
        placeholder = placeholder.addFormat(format);
        if (includeInSymbol(format)) {
          const symbol = await showInputBox(
            `Choose the symbol for the variable ${name}`,
            ""
          );
          placeholder = placeholder.addSymbol(symbol);
        }
        if (includeInDecimalDigits(format)) {
          const decimalDigits = await showInputBox(
            `Choose the decimal digits for the variable ${name}`,
            ""
          );
          placeholder = placeholder.addDecimalDigits(Number(decimalDigits));
        }
        if (includeInCustomPattern(format)) {
          const customPattern = await showInputBox(
            `Choose the custom pattern for the variable ${name}`,
            ""
          );
          placeholder = placeholder.addCustomPattern(customPattern);
        }
      }
      break;
    }
    default:
      break;
  }

  return placeholder;
}

export async function setEditFilesParameters(
  commandParameters: CommandParameters
): Promise<EditFilesParameters> {
  const key = await showInputBox(
    "Enter the message name",
    camelize(commandParameters.key)
  );

  let description: string | null = null;
  // if (Configuration.getInstance().getHaveDescription()) {
  //   description = await showInputBox("Enter the description", "");
  // }

  const variables = extractInterpolatedVariables(commandParameters.value);
  const placeholders: Placeholder[] = [];
  if (Array.isArray(variables)) {
    for (const variable of variables) {
      placeholders.push(await getPlaceholder(variable));
    }
  }

  return new EditFilesParameters(
    commandParameters.uri,
    commandParameters.range,
    new KeyValuePair(key, commandParameters.value),
    description,
    placeholders
  );
}

export function getOptionalParametersMap(
  placeholder: Placeholder
): Map<string, unknown> {
  const optionalParametersMap = new Map<string, unknown>();
  if (typeof placeholder.symbol !== "undefined") {
    optionalParametersMap.set("symbol", placeholder.symbol);
  }
  if (typeof placeholder.decimalDigits !== "undefined") {
    optionalParametersMap.set("decimalDigits", placeholder.decimalDigits);
  }
  if (typeof placeholder.customPattern !== "undefined") {
    optionalParametersMap.set("customPattern", placeholder.customPattern);
  }
  return optionalParametersMap;
}

export function getPlaceholderMap(placeholder: Placeholder) {
  const placeholderMap = new Map<string, unknown>();

  if (placeholder.type !== PlaceholderType.plural) {
    placeholderMap.set("type", placeholder.type);
  }

  switch (placeholder.type) {
    case PlaceholderType.DateTime:
      if (typeof placeholder.format !== "undefined") {
        placeholderMap.set("format", placeholder.format);
        if (notInclude(placeholder.format)) {
          placeholderMap.set("isCustomDateFormat", "true");
        }
      }
      return placeholderMap;
    case PlaceholderType.int:
    case PlaceholderType.num:
    case PlaceholderType.double:
      if (typeof placeholder.format !== "undefined") {
        placeholderMap.set("format", placeholder.format);
        if (
          typeof placeholder.symbol !== "undefined" ||
          typeof placeholder.decimalDigits !== "undefined" ||
          typeof placeholder.customPattern !== "undefined"
        ) {
          placeholderMap.set(
            "optionalParameters",
            Object.fromEntries(getOptionalParametersMap(placeholder))
          );
        }
      }
      return placeholderMap;
    default:
      return placeholderMap;
  }
}

export function toJson(
  text: string,
  l10nKey: L10nObject | null,
  sorted: boolean
): string {
  const map = new Map<string, unknown>(
    Object.entries<string>(JSON.parse(text) as string)
  );
  if (l10nKey) {
    const { isMetadataEnabled, key, description, value, placeholders } =
      l10nKey;
    map.set(
      key,
      placeholders.length > 0 ? replacePlaceholders(value, placeholders) : value
    );

    if (isMetadataEnabled && (description || placeholders.length > 0)) {
      const entry = {
        ...(description && { description }),
        ...(placeholders.length > 0 && {
          placeholders: Object.fromEntries(getPlaceholdersMap(placeholders)),
        }),
      };
      map.set(`@${key}`, entry);
    }
  }
  return JSON.stringify(
    Object.fromEntries(sorted ? sortArb(map) : map),
    (_key: string, _value: unknown): unknown => {
      if (typeof _value === "string") {
        return _value.replace(/\\'/gu, "'");
      }
      return _value;
    },
    2
  );
}

export function sortArb(map: Map<string, unknown>): Map<string, unknown> {
  return new Map(
    [...map].sort((a, b) => {
      if (a[0] === "@@locale") {
        return -1;
      }
      if (b[0] === "@@locale") {
        return 1;
      }
      const compared = String(a[0].replace("@", "")).localeCompare(
        b[0].replace("@", "")
      );
      if (compared === 0) {
        if (a[0].startsWith("@")) {
          return 1;
        }
        if (b[0].startsWith("@")) {
          return -1;
        }
      }

      return compared;
    })
  );
}

export const getPlaceholdersMap = (
  placeholders: Placeholder[]
): Map<string, unknown> =>
  placeholders.reduce(
    (map, placeholder) =>
      map.set(
        placeholder.name,
        Object.fromEntries(getPlaceholderMap(placeholder))
      ),
    new Map<string, unknown>()
  );

export const replacePlaceholders = (
  value: string,
  placeholders: Placeholder[]
): string =>
  placeholders.reduce((v, p) => {
    const current = v.replace(/\$\{?([^\s{}]+)\}?/u, `{${p.name}}`);
    return p.type === PlaceholderType.plural
      ? `{${p.name}, plural, other{${current}}}`
      : current;
  }, value);

