import {
  CodeAction,
  CodeActionProvider,
  Command,
  ProviderResult,
  Range,
  Selection,
  TextDocument
} from "vscode";
import { registerCodeAction } from "../utils/utils";

export class ConvertBasePageCodeActionProvider implements CodeActionProvider {
  provideCodeActions(
    document: TextDocument,
    range: Range | Selection
  ): ProviderResult<(CodeAction | Command)[]> {
    const actions: CodeAction[] = [];
    const documentTextArray = document.getText().split(/\r?\n/g);
    const selectedLineText = documentTextArray[range.start.line];

    // Determine widget types
    if (/class(.+)extends(.+)BasePage(.*)/.test(selectedLineText)) {
      registerCodeAction(
        "Convert to BaseStatefulPage",
        "mynavimobiletool.convertBasePageToBaseStatefulPage",
        document,
        range,
        actions
      );
    }
    if (
      /class(.+)extends(.+)StatefulHookConsumerWidget(.*)/.test(
        selectedLineText
      )
    ) {
      registerCodeAction(
        "Convert to BasePage",
        "mynavimobiletool.convertBaseStatefulPageToBasePage",
        document,
        range,
        actions
      );
    }

    return actions;
  }

  resolveCodeAction?(codeAction: CodeAction): ProviderResult<CodeAction> {
    return codeAction;
  }
}
