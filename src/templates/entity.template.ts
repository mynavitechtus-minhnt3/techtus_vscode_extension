import { ClassDefinition } from "../commands/clipboard_to_data_model/syntax";
import * as changeCase from "change-case";
import { getDefaultValueByType } from "../commands/data_model_to_entity.command";
export function getEntityTemplate(classDefinition: ClassDefinition): string {
  const dataClassName = `Api${classDefinition.name}Data`;
  const entityClassName = dataClassName.substring(3, dataClassName.length - 4);
  const properties = classDefinition.fields
    .map((field) => {
      return `@Default(${entityClassName}.default${changeCase.pascalCase(
        field.typeDef.name
      )}) ${
        field.typeDef.type != "dynamic" ? field.typeDef.type : "UnknownType"
      } ${changeCase.camelCase(field.typeDef.name)},`;
    })
    .join("\n");

  const defaultDeclare = classDefinition.fields
    .map((field) => {
      return `static const default${changeCase.pascalCase(
        field.typeDef.name
      )} = ${
        field.typeDef.type != null && field.typeDef.type != "dynamic"
          ? getDefaultValueByType(field.typeDef.type)
          : null
      };`;
    })
    .join("\n");
  return `import 'package:freezed_annotation/freezed_annotation.dart';

import '../../domain.dart';

part '${changeCase.snakeCase(entityClassName)}.freezed.dart';
  
@freezed
class ${entityClassName} with _$${entityClassName} {
    const factory ${entityClassName}({
        ${properties}
    }) = _User;
  
    ${defaultDeclare}
}  
`;
}
