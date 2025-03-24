// import * as _ from "lodash";
// import * as vscode from "vscode";
// import * as changeCase from "change-case";
// import { getDefaultValueByType } from "./data_model_to_entity.command";

// export const convertToCopyWith = async () => {
//     if (vscode.window.activeTextEditor == null) {
//         vscode.window.showErrorMessage(`text editor is null`);
//         return;
//     }
//     // debug
//     // vscode.window.showErrorMessage(`debug: ${vscode.window.activeTextEditor!.selection.isEmpty}`);
//     // vscode.window.showErrorMessage(`debug: ${vscode.window.activeTextEditor!.selection.active.line}`);
//     // vscode.window.showErrorMessage(`debug: ${vscode.window.activeTextEditor!.selection.start.line} - ${vscode.window.activeTextEditor!.selection.end.line}`);

//     const text = vscode.window.activeTextEditor!.document.getText(vscode.window.activeTextEditor!.selection);
//     // vscode.window.showErrorMessage(`${editor!.selection.start} - ${editor!.selection.end}`);
//     if (_.isNil(text) || text!.trim() === "") {
//         vscode.window.showErrorMessage(`Selection text = ${text} is empty. Please select the text`);
//         return;
//     }

//     vscode.window.activeTextEditor?.edit((builder) => {
//         builder.replace(vscode.window.activeTextEditor!.selection, doConvert(text!.trim()))
//     });
// };

// function doConvert(text: string): string {
//     // if (text.startsWith('enum')) {
//     //     if (text.endsWith("g")) {
//     //         vscode.window.showInformationMessage("convertGraphQLEnumToMapper");
//     //         return convertGraphQlEnumToMapper(text);
//     //     } else {
//     //         vscode.window.showInformationMessage("convertEnumToMapper");
//     //         return convertEnumToMapper(text);
//     //     }
//     // }

//     if (text.includes('@Default')) {
//         vscode.window.showInformationMessage("convertEntityToMapper");
//         return convertEntityToMapper(text);
//     }

//     if (text.startsWith('@JsonKey')) {
//         vscode.window.showInformationMessage("convertJsonKeyToMapper");
//         return convertJsonKeyToMapper(text);
//     }

//     vscode.window.showInformationMessage("convertGraphQLDataToMapper");
//     return convertGraphQLDataToMapper(text);
// }

// function convertJsonKeyToMapper(text: string): string {
//     const filename = vscode.window.activeTextEditor?.document.fileName!;
//     const output = text.trim().split(RegExp("\n+"))
//         .map((e) => {
//             const arr = e.trim().split(" ")
//             console.log(arr)
//             const property = arr[arr.length - 1].replace(",", "")
//             const valueType = arr[arr.length - 2]
//             return [valueType, property]
//         }).map((e) => {
//             const valueType = e[0]

//             if (valueType.startsWith("List<") && !["List<double>", "List<int>", "List<bool>", "List<String>", "List<num>"].includes(valueType)) {
//                 const t = valueType.substring(valueType.indexOf("<") + 1, valueType.lastIndexOf(">"))
//                 return `${e[1]}: _${t.charAt(0).toLowerCase()}${t.substring(1)}Mapper.mapToListEntity(data?.${e[1]}),`
//                 return `${e[1]}: _${t.charAt(0).toLowerCase()}${t.substring(1)}Mapper.mapToListEntity(safeCast(data?.${e[1]})),`
//             }

//             if (!["double", "int", "bool", "String", "num", "dynamic", "double?", "int?", "bool?", "String?", "num?"].includes(valueType)) {
//                 return `${e[1]}: _${valueType.charAt(0).toLowerCase()}${valueType.substring(1).replace("?", "")}Mapper.mapToEntity(data?.${e[1]}),`
//                 return `${e[1]}: _${valueType.charAt(0).toLowerCase()}${valueType.substring(1).replace("?", "")}Mapper.mapToEntity(safeCast(data?.${e[1]})),`
//             }

//             console.log(e)
//             return `${e[1]}: data?.${e[1]} ?? ${changeCase.pascalCase(filename.substring(filename.lastIndexOf('/') + 1, filename.lastIndexOf('_data_mapper.') == -1 ? filename.lastIndexOf('_data.') : filename.lastIndexOf('_data_mapper.')))}.default${changeCase.pascalCase(e[1])},`
//             return `${e[1]}: safeCast(data?.${e[1]}) ?? ${changeCase.pascalCase(filename.substring(filename.lastIndexOf('/') + 1, filename.lastIndexOf('_data_mapper.') == -1 ? filename.lastIndexOf('_data.') : filename.lastIndexOf('_data_mapper.'))).substring(3)}.default${changeCase.pascalCase(e[1])},`
//         }).join("\n")

//     return output;
// }

// function convertGraphQlEnumToMapper(enumText: string): string {
//     const output = enumText.replace(/\n/g, ' ').match(RegExp('enum +(.*) +{(.*)}')) ?? []
//     if (output.length == 0) {
//         vscode.window.showErrorMessage("Lỗi: Text bạn đang chọn không có từ khoá enum")
//         return enumText;
//     }

//     const enumClassName = output[1].trim()
//     const enumValues = output[2].split(",")
//         .map((e) => e.trim())
//         .filter((e) => e.length > 0 && e != 'unknown')
//         .map((e) => `case graphql.${enumClassName}.${e}:\nreturn ${enumClassName}.${e};`)
//         .join("\n")

//     /// map chiều ngược lại    
//     const enumValues2 = output[2].split(",")
//         .map((e) => e.trim())
//         .filter((e) => e.length > 0 && e != 'unknown')
//         .map((e) => `case ${enumClassName}.${e}:\nreturn graphql.${enumClassName}.${e};`)
//         .join("\n")

//     return `@Injectable()
//     class ${enumClassName}Mapper extends BaseRemoteDataMapper<graphql.${enumClassName}, ${enumClassName}>
//         with RemoteDataMapperMixin {
//       @override
//       ${enumClassName} mapToEntity(graphql.${enumClassName}? data) {
//         switch (data) {
//             ${enumValues}
//             default:
//               return ${enumClassName}.unknown;
//           }
//       }
    
//       @override
//       graphql.${enumClassName}? mapToRemoteData(${enumClassName}? entity) {
//         switch (entity) {
//           ${enumValues2}
//           default:
//             return null;
//         }
//       }
//     }`
// }

// function convertEnumToMapper(enumText: string): string {
//     const output = enumText.replace(/\n/g, ' ').match(RegExp('enum +(.*) +{(.*)}')) ?? []
//     if (output.length == 0) {
//         vscode.window.showErrorMessage("Lỗi: Text bạn đang chọn không có từ khoá enum")
//         return enumText;
//     }

//     const enumClassName = output[1].trim()
//     const enumValues = output[2].split(",")
//         .map((e) => e.trim())
//         .filter((e) => e.length > 0 && e != 'unknown')
//         .map((e) => `case ServerRequestResponseConstants.${e}:\nreturn ${enumClassName}.${e};`)
//         .join("\n")

//     /// map chiều ngược lại    
//     const enumValues2 = output[2].split(",")
//         .map((e) => e.trim())
//         .filter((e) => e.length > 0 && e != 'unknown')
//         .map((e) => `case ${enumClassName}.${e}:\nreturn ServerRequestResponseConstants.${e};`)
//         .join("\n")

//     return `import 'package:domain/domain.dart';
// import 'package:injectable/injectable.dart';
// import 'package:shared/shared.dart';

// import 'base/base_data_mapper.dart';

// @Injectable()
// class ${enumClassName}DataMapper extends BaseDataMapper<String, ${enumClassName}> with DataMapperMixin {
//   @override
//   ${enumClassName} mapToEntity(String? data) {
//     switch (data) {
//       ${enumValues}
//       default:
//         return ${enumClassName}.unknown;
//     }
//   }

//   @override
//   String mapToData(${enumClassName} entity) {
//     switch (entity) {
//       ${enumValues2}
//       default:
//         return '';
//     }
//   }
// }
// `
// }

// function convertEntityToMapper(entity: string): string {
//     return entity.split(RegExp(" *, *\n*")).filter(t => t.trim().length > 0).map((e) => {
//         const arr = e.trim().split(" ")
//         var defaultValue = arr[0].replace("@Default(", "").replace(/.$/, '')
//         if (!arr[0].trim().startsWith("@Default")) {
//             defaultValue = "null"
//         }
//         const valueType = arr[arr.length - 2]
//         const property = arr[arr.length - 1]
//         return [defaultValue, property, valueType]
//     }).map((e) => {
//         const defValue = e[0]
//         const valueType = e[2]
//         const elseValue = defValue == "null" ? "" : ` ?? ${defValue}`

//         if (valueType.startsWith("List<") && !["List<double>", "List<int>", "List<bool>", "List<String>", "List<num>"].includes(valueType)) {
//             const t = valueType.substring(valueType.indexOf("<") + 1, valueType.lastIndexOf(">"))
//             return `${e[1]}: _${t.charAt(0).toLowerCase()}${t.substring(1)}DataMapper.mapToListEntity(data?.${e[1]}),`
//             return `${e[1]}: _api${t}DataMapper.mapToListEntity(safeCast(data?.${e[1]})),`
//         }

//         if (valueType == "BigDecimal" || valueType == "BigDecimal?") {
//             return `${e[1]}: BigDecimal.tryParse(data?.${e[1]})${elseValue},`
//             return `${e[1]}: BigDecimal.tryParse(safeCast(data?.${e[1]}))${elseValue},`
//         }

//         if (valueType == "DateTime" || valueType == "DateTime?") {
//             return `${e[1]}: DateTimeUtils.tryParse(date: data?.${e[1]}, format: DateTimeFormatConstants.appServerResponse,)${elseValue},`
//             return `${e[1]}: DateTimeUtils.tryParse(date: safeCast(data?.${e[1]}), format: DateTimeFormatConstants.appServerResponse,)${elseValue},`
//         }

//         // class type
//         if (!["double", "int", "bool", "String", "num", "dynamic", "double?", "int?", "bool?", "String?", "num?"].includes(valueType)) {
//             return `${e[1]}: _${valueType.charAt(0).toLowerCase()}${valueType.substring(1)}DataMapper.mapToEntity(data?.${e[1]}),`
//             return `${e[1]}: _api${valueType}DataMapper.mapToEntity(safeCast(data?.${e[1]})),`
//         }

//         return `${e[1]}: data?.${e[1]}${elseValue},`
//         return `${e[1]}: safeCast(data?.${e[1]})${elseValue},`
//     }).join("\n")
// }

// function convertGraphQLDataToMapper(data: string): string {
//     const filename = vscode.window.activeTextEditor?.document.fileName!;
//     const output = data.trim().split(RegExp("\n+")).map((e) => {
//         const arr = e.trim().split(" ")
//         const property = arr[arr.length - 1].replace(";", "")
//         const valueType = arr[arr.length - 2]
//         return [valueType, property]
//     }).map((e) => `${e[1]}: data?.${e[1]} ?? ${changeCase.pascalCase(filename.substring(filename.lastIndexOf('/') + 1, filename.lastIndexOf('_graphql.graphql.')))}.default${changeCase.pascalCase(e[1])},`).join("\n")

//     return output;
// }