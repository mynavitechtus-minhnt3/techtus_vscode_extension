import { ClassDefinition } from "../commands/clipboard_to_data_model/syntax";
import * as changeCase from "change-case";
export function getDataMapperTemplate(
  classDefinition: ClassDefinition
): string {
  const dataClassName = `Api${classDefinition.name}Data`;
  const entityClassName = dataClassName.substring(3, dataClassName.length - 4);
  const mapping = classDefinition.fields.map((field) => {
    return `${changeCase.camelCase(field.typeDef.name)}: data?.${
        changeCase.camelCase(field.typeDef.name)
    } ?? ${entityClassName}.default${changeCase.pascalCase(field.typeDef.name)},`;
  }).join('\n');
  return `import 'package:injectable/injectable.dart';

import '../../../../../../../data/data.dart';
import '../../../../../../../domain/domain.dart';
  
@Injectable()
class ${dataClassName}Mapper extends BaseDataMapper<${dataClassName}, ${entityClassName}> {
    @override
    ${entityClassName} mapToEntity(${dataClassName}? data) {
      return ${entityClassName}(
        ${mapping}
      );
    }
}  
`;
}
