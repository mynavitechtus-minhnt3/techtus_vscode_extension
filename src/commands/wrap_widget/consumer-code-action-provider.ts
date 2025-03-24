import { window, CodeAction, CodeActionProvider, CodeActionKind } from "vscode";
import { getSelectedText } from "../../utils";

export class ConsumerCodeActionProvider implements CodeActionProvider {
  public provideCodeActions(): CodeAction[] {
    const editor = window.activeTextEditor;
    if (!editor) return [];

    const selectedText = editor.document.getText(getSelectedText(editor));
    if (selectedText === "") return [];

    return [
      {
        command: "nalsmobiletool.wrapWithConsumer",
        title: "Wrap with Consumer",
      },
      {
        command: "nalsmobiletool.wrapWithStack",
        title: "Wrap with Stack",
      },
      {
        command: "nalsmobiletool.wrapWithExpanded",
        title: "Wrap with Expanded",
      },
      {
        command: "nalsmobiletool.wrapWithFlexible",
        title: "Wrap with Flexible",
      },
      {
        command: "nalsmobiletool.wrapWithSingleChildScrollView",
        title: "Wrap with SingleChildScrollView",
      },
      {
        command: "nalsmobiletool.wrapWithHorizontalPadding",
        title: "Wrap with Horizontal Padding",
      },
      {
        command: "nalsmobiletool.wrapWithVerticalPadding",
        title: "Wrap with Vertical Padding",
      },
      {
        command: "nalsmobiletool.wrapWithCommonContainer",
        title: "Wrap with CommonContainer",
      },
      {
        command: "nalsmobiletool.wrapWithInkWell",
        title: "Wrap with InkWell",
      },
      {
        command: "nalsmobiletool.wrapWithGestureDetector",
        title: "Wrap with GestureDetector",
      },
    ].map((c) => {
      let action = new CodeAction(c.title, CodeActionKind.Refactor);
      action.command = {
        command: c.command,
        title: c.title,
      };
      return action;
    });
  }
}
