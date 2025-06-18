import * as changeCase from "change-case";

export function getPageTemplate(feature: string): string {
  const pascalCaseFeature = changeCase.pascalCase(feature.toLowerCase());
  const camelCaseFeature = changeCase.camelCase(feature.toLowerCase());
  const snakeCaseFeature = changeCase.snakeCase(feature.toLowerCase());
  return `import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../../../index.dart';

@RoutePage()
class ${pascalCaseFeature}Page extends BasePage<${pascalCaseFeature}State,
    AutoDisposeStateNotifierProvider<${pascalCaseFeature}ViewModel, CommonState<${pascalCaseFeature}State>>> {
      const ${pascalCaseFeature}Page({super.key});
  
  @override
  ScreenViewEvent get screenViewEvent => ScreenViewEvent(screenName: ScreenName.${camelCaseFeature}Page);
      
  @override
  AutoDisposeStateNotifierProvider<${pascalCaseFeature}ViewModel, CommonState<${pascalCaseFeature}State>> get provider =>
      ${camelCaseFeature}ViewModelProvider;

  @override
  Widget buildPage(BuildContext context, WidgetRef ref) {
    return CommonScaffold(
      body: Center(

      ),
    );
  }
}  
`;
}