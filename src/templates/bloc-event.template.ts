import * as changeCase from "change-case";

export function getBlocEventTemplate(blocName: string): string {
  const pascalCaseBlocName = changeCase.pascalCase(blocName.toLowerCase());
  const snakeCaseBlocName = changeCase.snakeCase(blocName.toLowerCase());
  return `import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../../app.dart';
  
part '${snakeCaseBlocName}_event.freezed.dart';

abstract class ${pascalCaseBlocName}Event extends BaseBlocEvent {
  const ${pascalCaseBlocName}Event();
}

@freezed
class ${pascalCaseBlocName}PageInitiated extends ${pascalCaseBlocName}Event with _$${pascalCaseBlocName}PageInitiated {
  const factory ${pascalCaseBlocName}PageInitiated() = _${pascalCaseBlocName}PageInitiated;
}
`;
}
