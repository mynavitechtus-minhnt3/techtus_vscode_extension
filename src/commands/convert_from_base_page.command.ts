import {
  Position,
  Range,
  TextDocument,
  WorkspaceEdit,
  commands,
  workspace,
  window,
} from "vscode";
import { indexFrom, replaceLine } from "../utils/utils";

export async function convertBasePageToBaseStatefulPage(
  document: TextDocument,
  range: Range
) {
  await commands.executeCommand("editor.action.formatDocument");
  const documentTextArray = document.getText().split(/\n|\r\n/g);

  const classDefinitionRegex = new RegExp(
    /class\s(\w+)\sextends\s([><,\s\w]+)/
  );
  const widgetClassDefinitionLineNumber = range.start.line;
  let braceLine = widgetClassDefinitionLineNumber;
  while (!documentTextArray[braceLine].includes("{")) {
    braceLine++;
  }
  const widgetClassDefinitionLineText = documentTextArray
    .slice(widgetClassDefinitionLineNumber, braceLine + 1)
    .join("\n");
  const widgetClassDefinitionLineRange = new Range(
    new Position(widgetClassDefinitionLineNumber, 0),
    new Position(braceLine, widgetClassDefinitionLineText.length)
  );

  const widgetClassDefinitionLineMatch = widgetClassDefinitionLineText.match(
    classDefinitionRegex
  ) as RegExpMatchArray;

  const className = widgetClassDefinitionLineMatch[1];

  const consumerStatefulWidgetLineText = `class ${className} extends StatefulHookConsumerWidget {`;

  const createStateLineText = `  @override\n  ConsumerState<${className}> createState() => _${className}State();`;

  const buildMethodRegex = new RegExp(/Widget\s+buildPage\((.*?)\)/);
  const buildMethodLineNumber = indexFrom(
    documentTextArray,
    buildMethodRegex,
    widgetClassDefinitionLineNumber
  );
  const buildMethodLineText = documentTextArray[buildMethodLineNumber];

  const consumerWidgetBuildMethodLineText = buildMethodLineText.replace(
    buildMethodRegex,
    "Widget buildPage(BuildContext context)"
  );

  // remove getter provider
  const providerRegex = new RegExp(/(.*) get provider =>(.*)/);
  const providerLineNumber = indexFrom(
    documentTextArray,
    providerRegex,
    widgetClassDefinitionLineNumber
  );

  let endProviderLineNumber = providerLineNumber;
  while (!documentTextArray[endProviderLineNumber].includes(";")) {
    endProviderLineNumber++;
  }
  const beforeProviderLineText = documentTextArray[providerLineNumber - 1];
  let startProviderLineNumber = providerLineNumber;
  if (beforeProviderLineText.includes("@override")) {
    startProviderLineNumber = providerLineNumber - 1;
  }
  const providerLineRange = new Range(
    new Position(startProviderLineNumber, 0),
    new Position(
      endProviderLineNumber,
      documentTextArray[endProviderLineNumber].length
    )
  );

  // copy providerLineRange
  const providerText = documentTextArray
    .slice(startProviderLineNumber, endProviderLineNumber + 1)
    .join("\n");

  const edit = new WorkspaceEdit();
  // prefix = className remove 'Page'
  const prefix = className.substring(0, className.length - 4);
  const stateClassLineText = `}\nclass _${className}State extends BaseStatefulPageState<${prefix}State, ${prefix}ViewModel, AutoDisposeStateNotifierProvider<${prefix}ViewModel, CommonState<${prefix}State>>, ${className}> {\n\n ${providerText}  \n\n  @override\n  ${prefix}ViewModel get vm => ref.read(provider.notifier);\n\n`;

  const buildMethodLineRange = new Range(
    new Position(buildMethodLineNumber, 0),
    new Position(buildMethodLineNumber, buildMethodLineText.length)
  );
  const insertCreateStatePosition = new Position(buildMethodLineNumber - 1, 0);
  edit.insert(
    document.uri,
    insertCreateStatePosition,
    createStateLineText + "\n"
  );
  const insertStateClassPosition = new Position(buildMethodLineNumber - 1, 0);
  edit.insert(
    document.uri,
    insertStateClassPosition,
    stateClassLineText + "\n"
  );

  // delete provider
  edit.delete(document.uri, providerLineRange);

  replaceLine(
    edit,
    document,
    buildMethodLineRange,
    consumerWidgetBuildMethodLineText
  );

  replaceLine(
    edit,
    document,
    widgetClassDefinitionLineRange,
    consumerStatefulWidgetLineText
  );

  // insertImportStatement(
  //   edit,
  //   document,
  //   documentTextArray,
  //   "import 'package:flutter_riverpod/flutter_riverpod.dart';"
  // );

  workspace.applyEdit(edit);

  await commands.executeCommand("editor.action.formatDocument");
}

export async function convertBaseStatefulPageToBasePage(
  document: TextDocument,
  range: Range
) {
  await commands.executeCommand("editor.action.formatDocument");
  // Split the document text into an array of lines
  const documentTextArray = document.getText().split(/\n|\r\n/g);
  const classDefinitionRegex = /class\s(\w+)\sextends\s(\w+)/;
  const buildMethodRegex = new RegExp(/Widget\s+buildPage\((.*?)\)/);

  // Get the starting line number of the class definition
  const startingClassDefinitionLineNumber = range.start.line;
  let braceLine = startingClassDefinitionLineNumber;
  while (!documentTextArray[braceLine].includes("{")) {
    braceLine++;
  }
  const widgetClassDefinitionLineText = documentTextArray
    .slice(startingClassDefinitionLineNumber, braceLine + 1)
    .join("\n");

  // Match the widget class definition line against the regex
  const widgetClassDefinitionLineMatch =
    widgetClassDefinitionLineText.match(classDefinitionRegex);

  // Show an error message if the class definition is not found
  if (!widgetClassDefinitionLineMatch) {
    window.showErrorMessage("Unable to find class definition.");
    return;
  }

  // Extract the class name from the match
  const className = widgetClassDefinitionLineMatch[1];

  const edit = new WorkspaceEdit();

  // Define regex to find the createState method and the @override annotation
  const createStateRegex = new RegExp(
    `ConsumerState<${className}> createState\\(\\) => _${className}State\\(\\);`
  );
  const overrideRegex = /@override/;

  // Find the line number for the createState method
  const createStateLineNumber = indexFrom(
    documentTextArray,
    createStateRegex,
    startingClassDefinitionLineNumber
  );
  if (createStateLineNumber !== -1) {
    const overrideLineNumber = createStateLineNumber - 1;

    // Remove the @override annotation if it exists
    if (overrideRegex.test(documentTextArray[overrideLineNumber].trim())) {
      const overrideRange = new Range(
        new Position(overrideLineNumber, 0),
        new Position(overrideLineNumber + 1, 0)
      );
      edit.delete(document.uri, overrideRange);
    }

    // Remove the createState method line
    const createStateRange = new Range(
      new Position(createStateLineNumber, 0),
      new Position(createStateLineNumber + 1, 0)
    );
    edit.delete(document.uri, createStateRange);
  }

  // Find and remove the state class definition
  const stateClassRegex = new RegExp(
    `class _${className}State extends BaseStatefulPageState(.*)`
  );

  const stateClassLineNumber = indexFrom(
    documentTextArray,
    stateClassRegex,
    startingClassDefinitionLineNumber
  );
  let braceOfStateClassLine = stateClassLineNumber;
  while (!documentTextArray[braceOfStateClassLine].includes("{")) {
    braceOfStateClassLine++;
  }
  if (stateClassLineNumber !== -1) {
    const stateClassRange = new Range(
      new Position(stateClassLineNumber, 0),
      new Position(braceOfStateClassLine + 1, 0)
    );
    edit.delete(document.uri, stateClassRange);
  }

  // Replace the widget class definition with the new ConsumerWidget definition
  const classWidgetRange = new Range(
    new Position(startingClassDefinitionLineNumber, 0),
    new Position(braceLine, widgetClassDefinitionLineText.length)
  );
  const prefix = className.substring(0, className.length - 4);
  const consumerWidgetLineText = `class ${className} extends BasePage<${prefix}State,
    AutoDisposeStateNotifierProvider<${prefix}ViewModel, CommonState<${prefix}State>>> {`;
  replaceLine(edit, document, classWidgetRange, consumerWidgetLineText);

  // Find the end of the class to remove the closing brace
  let endOfClassLineNumber = startingClassDefinitionLineNumber + 1;
  while (endOfClassLineNumber < documentTextArray.length) {
    const lineText = documentTextArray[endOfClassLineNumber].trim();
    if (lineText === "}") {
      break;
    }
    endOfClassLineNumber++;
  }

  // Remove the closing brace of the class
  const classEndRange = new Range(
    new Position(endOfClassLineNumber, 0),
    new Position(endOfClassLineNumber + 1, 0)
  );

  edit.delete(document.uri, classEndRange);

  const vmRegex = new RegExp(`(.*) get vm => (.*);`);
  const vmLineNumber = indexFrom(
    documentTextArray,
    vmRegex,
    startingClassDefinitionLineNumber
  );
  let startVmLineNumber = vmLineNumber;
  if (documentTextArray[vmLineNumber - 1].includes("@override")) {
    startVmLineNumber = vmLineNumber - 1;
  }
  edit.delete(
    document.uri,
    new Range(
      new Position(startVmLineNumber, 0),
      new Position(vmLineNumber + 1, 0)
    )
  );

  // Find and update the build method to fit the new ConsumerWidget
  const buildMethodLineNumber = indexFrom(
    documentTextArray,
    buildMethodRegex,
    startingClassDefinitionLineNumber
  );

  const buildMethodLineText = documentTextArray[buildMethodLineNumber];
  const consumerWidgetBuildMethodLineText = buildMethodLineText.replace(
    buildMethodRegex,
    "Widget buildPage(BuildContext context, WidgetRef ref)"
  );
  const buildMethodLineRange = new Range(
    new Position(buildMethodLineNumber, 0),
    new Position(buildMethodLineNumber, buildMethodLineText.length)
  );
  replaceLine(
    edit,
    document,
    buildMethodLineRange,
    consumerWidgetBuildMethodLineText
  );

  // Apply all the edits made to the document
  workspace.applyEdit(edit);
}
