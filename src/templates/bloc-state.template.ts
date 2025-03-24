import * as changeCase from "change-case";

export function getBlocStateTemplate(blocName: string): string {
  const pascalCaseBlocName = changeCase.pascalCase(blocName.toLowerCase());
  const snakeCaseBlocName = changeCase.snakeCase(blocName.toLowerCase());
  return `import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../../app.dart';

part '${snakeCaseBlocName}_state.freezed.dart';

@freezed
class ${pascalCaseBlocName}State extends BaseBlocState with _$${pascalCaseBlocName}State {
  const ${pascalCaseBlocName}State._();

  const factory ${pascalCaseBlocName}State({
    @Default('') String id,
  }) = _${pascalCaseBlocName}State;
}
`;
}
