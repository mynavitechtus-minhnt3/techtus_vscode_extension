import * as vscode from "vscode";
import { CommandParameters, EditFilesParameters } from "../../utils/classes";
import {
  getChangesForArbFiles,
  runGeneration,
  setEditFilesParameters,
} from "../../utils/utils";

export const translateAndExtractValueToArbFiles = async () => {
  const text = await vscode.env.clipboard.readText();
  doTransform(text!.trim());
};

async function doTransform(text: string): Promise<void> {
  text = text.replace(/^['"]|['"]$/g, "");
  // translate text from japanese to english
  try {
    const tr = require("googletrans").default;
    const translated = await tr(text, { from: "ja", to: "en" });
    console.log("translated:", translated);
    const editFilesParameters = await setEditFilesParameters(
      new CommandParameters(
        vscode.window.activeTextEditor!.document.uri,
        vscode.window.activeTextEditor!.selection,
        translated.text,
        text
      )
    );
    applySaveAndRunGeneration(editFilesParameters);
  } catch (error) {
    console.error("Translation error:", error);
  }
}

async function applySaveAndRunGeneration(
  editFilesParameters: EditFilesParameters
): Promise<void> {
  const { workspace } = vscode;
  await workspace.applyEdit(await getChangesForArbFiles(editFilesParameters), {
    isRefactoring: true,
  });
  await workspace.saveAll();
  await runGeneration();
}
