// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { autoExport } from "./commands/auto_export.command";
import { transformFromClipboardToDataModel } from "./commands/clipboard_to_data_model.command";
import { createUTFile } from "./commands/create_unit_test_file.command";
import { extractApiUrl } from "./commands/extract_api_url.command";
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
import { configChanges, documentSave } from "./utils/configResolver";

const DART_MODE = { language: "dart", scheme: "file" };

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "mynavimobiletool.createNewPage",
      createNewPage
    ),
    vscode.commands.registerCommand(
      "mynavimobiletool.jsonToDataModel",
      jsonToDataModel
    ),
    vscode.commands.registerCommand(
      "mynavimobiletool.clipboardToDataModel",
      transformFromClipboardToDataModel
    ),
    vscode.commands.registerCommand(
      "mynavimobiletool.jsonToParams",
      jsonToParams
    ),
    vscode.commands.registerCommand("mynavimobiletool.autoExport", autoExport),
    vscode.commands.registerCommand(
      "mynavimobiletool.createUTFile",
      createUTFile
    ),
    vscode.commands.registerCommand(
      "mynavimobiletool.extractApiUrl",
      extractApiUrl
    ),
    vscode.commands.registerCommand(
      "mynavimobiletool.translateAndExtractValueToArbFiles",
      translateAndExtractValueToArbFiles
    ),
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
      "mynavimobiletool.wrapWithConsumer",
      wrapWithConsumer
    ),
    vscode.commands.registerCommand(
      "mynavimobiletool.wrapWithExpanded",
      wrapWithExpanded
    ),
    vscode.commands.registerCommand(
      "mynavimobiletool.wrapWithFlexible",
      wrapWithFlexible
    ),
    vscode.commands.registerCommand(
      "mynavimobiletool.wrapWithInkWell",
      wrapWithInkWell
    ),
    vscode.commands.registerCommand(
      "mynavimobiletool.wrapWithGestureDetector",
      wrapWithGestureDetector
    ),
    vscode.commands.registerCommand(
      "mynavimobiletool.wrapWithStack",
      wrapWithStack
    ),
    vscode.commands.registerCommand(
      "mynavimobiletool.wrapWithSingleChildScrollView",
      wrapWithSingleChildScrollView
    ),
    vscode.commands.registerCommand(
      "mynavimobiletool.wrapWithCommonContainer",
      wrapWithCommonContainer
    ),
    vscode.commands.registerCommand(
      "mynavimobiletool.wrapWithHorizontalPadding",
      wrapWithHorizontalPadding
    ),
    vscode.commands.registerCommand(
      "mynavimobiletool.wrapWithVerticalPadding",
      wrapWithVerticalPadding
    ),
    vscode.commands.registerCommand(
      "mynavimobiletool.convertBasePageToBaseStatefulPage",
      convertBasePageToBaseStatefulPage
    ),
    vscode.commands.registerCommand(
      "mynavimobiletool.convertBaseStatefulPageToBasePage",
      convertBaseStatefulPageToBasePage
    )
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
