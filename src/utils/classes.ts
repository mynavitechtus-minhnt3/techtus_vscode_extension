import * as vscode from "vscode";

export class KeyValuePair {
  constructor(readonly key: string, readonly value: string) {}
}

export class L10nObject {
  readonly isMetadataEnabled: boolean;
  readonly key: string;
  readonly description: string | null;
  readonly value: string;
  readonly placeholders: Placeholder[];

  constructor(
    isMetadataEnabled: boolean,
    key: string,
    description: string | null,
    value: string,
    placeholders: Placeholder[]
  ) {
    this.isMetadataEnabled = isMetadataEnabled;
    this.key = key;
    this.description = description;
    this.value = value;
    this.placeholders = placeholders;
  }
}

export class CommandParameters {
  constructor(
    readonly uri: vscode.Uri,
    readonly range: vscode.Range,
    readonly key: string,
    readonly value: string
  ) {}
}

export class EditFilesParameters {
  constructor(
    readonly uri: vscode.Uri,
    readonly range: vscode.Range,
    readonly keyValue: KeyValuePair,
    readonly description: string | null,
    readonly placeholders: Placeholder[]
  ) {}
}

export class LionizationPickItem implements vscode.QuickPickItem {
  constructor(readonly label: string) {}
}

export enum PlaceholderType {
  String = "String",
  int = "int",
  num = "num",
  double = "double",
  DateTime = "DateTime",
  plural = "plural",
}

export class PlaceholderTypeItem implements vscode.QuickPickItem {
  constructor(readonly label: string) {}
}

export interface PackageInfo {
  projectRoot: string;
  projectName: string;
}

export class StringEscapeSequence {
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

export class Placeholder {
  public format?: string;

  public symbol?: string;

  public decimalDigits?: number;

  public customPattern?: string;

  constructor(
    readonly name: string,
    readonly value: string,
    readonly type: PlaceholderType
  ) {}

  addFormat(value: string): this {
    this.format = value;
    return this;
  }

  addSymbol(value: string): this {
    this.symbol = value;
    return this;
  }

  addDecimalDigits(value: number): this {
    this.decimalDigits = value;
    return this;
  }

  addCustomPattern(format: string): this {
    this.customPattern = format;
    return this;
  }
}
