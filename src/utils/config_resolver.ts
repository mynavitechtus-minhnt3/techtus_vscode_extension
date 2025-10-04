import * as vscode from "vscode";
import { autoExport } from "../commands/auto_export.command";

export class ConfigResolver {
  public excludeFilesWhenAutoExport: Array<string>;
  public autoExportOnSave: boolean;
  public autoExportBarrier: string;
  public uiFolderPath: string;
  public dataModelPath: string;
  public riverpodPageTemplate: string;
  public widgetTestGlobPatterns: Array<string>;

  constructor() {
    const config = vscode.workspace.getConfiguration(
      "mynavimobiletool"
    ) as vscode.WorkspaceConfiguration;

    this.excludeFilesWhenAutoExport =
      config.get("excludeFilesWhenAutoExport") || [];
    this.autoExportOnSave = !!config.get("autoExportOnSave");
    this.autoExportBarrier = config.get("autoExportBarrier") || "";
    this.uiFolderPath = config.get("uiFolderPath") || "";
    this.dataModelPath = config.get("dataModelPath") || "";
    this.riverpodPageTemplate =
      config.get("riverpodPageTemplate") || "singleModule";
    this.widgetTestGlobPatterns =
      config.get<string[]>("widgetTestGlobPatterns") || [
        "**/ui/page/**",
        "**/ui/popup/**",
        "**/ui/component/**",
      ];
  }
}

export let configResolver = new ConfigResolver();

export const configChanges = vscode.workspace.onDidChangeConfiguration((e) => {
  if (e.affectsConfiguration("mynavimobiletool")) {
    configResolver = new ConfigResolver();
  }
});

export const documentSave = vscode.workspace.onDidSaveTextDocument(
  async (e: vscode.TextDocument) => {
    if (!configResolver.autoExportOnSave) {
      return;
    }
    const rawEditor = await vscode.window.showTextDocument(e);

    if (configResolver.autoExportOnSave) {
      autoExport();
    }
  }
);
