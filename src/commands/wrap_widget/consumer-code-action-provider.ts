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
        command: "mynavimobiletool.wrapWithConsumer",
        title: "Wrap with Consumer",
      },
      {
        command: "mynavimobiletool.wrapWithStack",
        title: "Wrap with Stack",
      },
      {
        command: "mynavimobiletool.wrapWithExpanded",
        title: "Wrap with Expanded",
      },
      {
        command: "mynavimobiletool.wrapWithFlexible",
        title: "Wrap with Flexible",
      },
      {
        command: "mynavimobiletool.wrapWithSingleChildScrollView",
        title: "Wrap with SingleChildScrollView",
      },
      {
        command: "mynavimobiletool.wrapWithHorizontalPadding",
        title: "Wrap with Horizontal Padding",
      },
      {
        command: "mynavimobiletool.wrapWithVerticalPadding",
        title: "Wrap with Vertical Padding",
      },
      {
        command: "mynavimobiletool.wrapWithCommonContainer",
        title: "Wrap with CommonContainer",
      },
      {
        command: "mynavimobiletool.wrapWithInkWell",
        title: "Wrap with InkWell",
      },
      {
        command: "mynavimobiletool.wrapWithGestureDetector",
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
