// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { autoExport } from "./commands/auto_export.command";
import { transformFromClipboardToDataModel } from "./commands/clipboard_to_data_model.command";
import { createUTFile } from "./commands/create_unit_test_file.command";
import { extractApiUrl } from "./commands/extract_api_url.command";
import { configChanges, documentSave } from "./commands/fix_imports.command";
import { jsonToDataModel } from "./commands/json_to_data_model.command";
import { jsonToParams } from "./commands/json_to_params.command";
import { createNewPage } from "./commands/new_riverpod_page.command";
import {
  convertBasePageToBaseStatefulPage,
  convertBaseStatefulPageToBasePage,
} from "./commands/riverpod/commands/convert_from_base_page";
import RiverpodCodeActionProvider from "./commands/riverpod/provider/riverpod_code_action_provider";
import { translateAndExtractValueToArbFiles } from "./commands/translate_and_extract_value_to_arb/translate_and_extract_value_to_arb.command";
import { ConsumerCodeActionProvider } from "./commands/wrap_widget/consumer-code-action-provider";
import {
  wrapWithCommonContainer,
  wrapWithConsumer,
  wrapWithExpanded,
  wrapWithFlexible,
  wrapWithGestureDetector,
  wrapWithHorizontalPadding,
  wrapWithInkWell,
  wrapWithSingleChildScrollView,
  wrapWithStack,
  wrapWithVerticalPadding,
} from "./commands/wrap_widget/wrap_with_widget.command";
import { sortAndSave } from "./extension/sortAndSave";

const DART_MODE = { language: "dart", scheme: "file" };

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "nalsmobiletool.createNewPage",
      createNewPage
    ),
    // vscode.commands.registerCommand("nalsmobiletool.transformParams", transformParams),
    // vscode.commands.registerCommand('nalsmobiletool.fixImport', fixImport),
    // vscode.commands.registerCommand('nalsmobiletool.fixAllImports', fixAllImports),
    vscode.commands.registerCommand(
      "nalsmobiletool.jsonToDataModel",
      jsonToDataModel
    ),
    vscode.commands.registerCommand(
      "nalsmobiletool.clipboardToDataModel",
      transformFromClipboardToDataModel
    ),
    vscode.commands.registerCommand(
      "nalsmobiletool.jsonToParams",
      jsonToParams
    ),
    vscode.commands.registerCommand("nalsmobiletool.autoExport", autoExport),
    vscode.commands.registerCommand(
      "nalsmobiletool.createUTFile",
      createUTFile
    ),
    vscode.commands.registerCommand(
      "nalsmobiletool.extractApiUrl",
      extractApiUrl
    ),
    vscode.commands.registerCommand(
      "nalsmobiletool.translateAndExtractValueToArbFiles",
      translateAndExtractValueToArbFiles
    ),
    vscode.commands.registerCommand("nalsmobiletool.sortArbFiles", sortAndSave),
    configChanges,
    documentSave,
    vscode.languages.registerCodeActionsProvider(
      "dart",
      new RiverpodCodeActionProvider()
    ),
    vscode.languages.registerCodeActionsProvider(
      "dart",
      new ConsumerCodeActionProvider()
    ),
    vscode.commands.registerCommand(
      "nalsmobiletool.wrapWithConsumer",
      wrapWithConsumer
    ),
    vscode.commands.registerCommand(
      "nalsmobiletool.wrapWithExpanded",
      wrapWithExpanded
    ),
    vscode.commands.registerCommand(
      "nalsmobiletool.wrapWithFlexible",
      wrapWithFlexible
    ),
    vscode.commands.registerCommand(
      "nalsmobiletool.wrapWithInkWell",
      wrapWithInkWell
    ),
    vscode.commands.registerCommand(
      "nalsmobiletool.wrapWithGestureDetector",
      wrapWithGestureDetector
    ),
    vscode.commands.registerCommand(
      "nalsmobiletool.wrapWithStack",
      wrapWithStack
    ),
    vscode.commands.registerCommand(
      "nalsmobiletool.wrapWithSingleChildScrollView",
      wrapWithSingleChildScrollView
    ),
    vscode.commands.registerCommand(
      "nalsmobiletool.wrapWithCommonContainer",
      wrapWithCommonContainer
    ),
    vscode.commands.registerCommand(
      "nalsmobiletool.wrapWithHorizontalPadding",
      wrapWithHorizontalPadding
    ),
    vscode.commands.registerCommand(
      "nalsmobiletool.wrapWithVerticalPadding",
      wrapWithVerticalPadding
    ),
    vscode.commands.registerCommand(
      "nalsmobiletool.convertBasePageToBaseStatefulPage",
      convertBasePageToBaseStatefulPage
    ),
    vscode.commands.registerCommand(
      "nalsmobiletool.convertBaseStatefulPageToBasePage",
      convertBaseStatefulPageToBasePage
    )
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
