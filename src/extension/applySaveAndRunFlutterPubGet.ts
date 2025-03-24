import * as vscode from "vscode";
import { getChangesForArbFiles } from "./getChangesForArbFiles";
import { runGeneration } from "./runGeneration";
import { EditFilesParameters } from "../commands/translate_and_extract_value_to_arb/editFilesParameters";

export async function applySaveAndRunGeneration(
  editFilesParameters: EditFilesParameters
): Promise<void> {
  const { workspace } = vscode;
  await workspace.applyEdit(await getChangesForArbFiles(editFilesParameters), {
    isRefactoring: true,
  });
  await workspace.saveAll();
  await runGeneration();
}
