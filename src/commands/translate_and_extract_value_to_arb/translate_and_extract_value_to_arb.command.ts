import * as _ from "lodash";
import * as vscode from "vscode";
import tr from "googletrans";
import * as changeCase from "change-case";
import { setEditFilesParameters } from "../../extension/setEditFilesParameters";
import { CommandParameters } from "./commandParameters";
import { applySaveAndRunGeneration } from "../../extension/applySaveAndRunFlutterPubGet";
import { EditFilesParameters } from "./editFilesParameters";

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
        text,
      )
    );
    applySaveAndRunGeneration(editFilesParameters);
  } catch (error) {
    console.error("Translation error:", error);
  }
}
