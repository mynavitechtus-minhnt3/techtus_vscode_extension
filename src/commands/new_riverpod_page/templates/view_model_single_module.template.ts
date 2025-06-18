import * as changeCase from "change-case";

export function getViewModelTemplate(feature: string): string {
  const pascalCaseFeature = changeCase.pascalCase(feature.toLowerCase());
  const snakeCaseFeature = changeCase.snakeCase(feature.toLowerCase());
  const camelCaseFeature = changeCase.camelCase(feature.toLowerCase());
  return `import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../../../../index.dart';

final ${camelCaseFeature}ViewModelProvider =
    StateNotifierProvider.autoDispose<${pascalCaseFeature}ViewModel, CommonState<${pascalCaseFeature}State>>(
  (ref) => ${pascalCaseFeature}ViewModel(),
);

class ${pascalCaseFeature}ViewModel extends BaseViewModel<${pascalCaseFeature}State> {
  ${pascalCaseFeature}ViewModel() : super(const CommonState(data: ${pascalCaseFeature}State()));
}   
`;
}
