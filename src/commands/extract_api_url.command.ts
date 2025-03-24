import * as _ from "lodash";
import { URL } from "url";
import * as changeCase from "change-case";
import * as vscode from "vscode";

export const extractApiUrl = async () => {
  if (vscode.window.activeTextEditor == null) {
    vscode.window.showErrorMessage(`text editor is null`);
    return;
  }

  const text = vscode.window.activeTextEditor!.document.getText(
    vscode.window.activeTextEditor!.selection
  );
  if (_.isNil(text) || text!.trim() === "") {
    vscode.window.showErrorMessage(
      `Selection text = ${text} is empty. Please select the text`
    );
    return;
  }

  vscode.window.activeTextEditor?.edit((builder) => {
    builder.replace(
      vscode.window.activeTextEditor!.selection,
      doTransform(text!.trim())
    );
  });
};
// method: RestMethod.get,
//       path: '',
//       queryParameters: {
//         'page': page,
//         'results': limit,
//       },
// {{url}}/training/my-courses/getJoiningCourse?page=1&limit=10&sortBy=created_at&sortDesc=desc&course_id=13&training_type_id=4&platform=1&onlineLearningFormat=zoom&teacher_id=19&persons_charge_id=6&from_time=2024-05-11&to_time=2024-05-12
// https://google.com/training/my-courses/getJoiningCourse?page=1&limit=10&sortBy=created_at&sortDesc=desc&course_id=13&training_type_id=4&platform=1&onlineLearningFormat=zoom&teacher_id=19&persons_charge_id=6&from_time=2024-05-11&to_time=2024-05-12
// https://google.com/api/training/my-courses/getJoiningCourse?page=1&limit=10&sortBy=created_at&sortDesc=desc&course_id=13&training_type_id=4&platform=1&onlineLearningFormat=zoom&teacher_id=19&persons_charge_id=6&from_time=2024-05-11&to_time=2024-05-12
function doTransform(text: string): string {
  // Future<DataListResponse<SoKhoaDaHoc>> getSoKhoaDaHoc({
  //     required int page,
  //     required int limit,
  //     required int courseIds,
  //   }) {
  //     return authAppServerClient.request(
  //       method: RestMethod.get,
  //       path: 'v1/training/my-courses/getCoursesLearned',
  //       decoder: SoKhoaDaHoc.fromJson,
  //       successResponseMapperType: SuccessResponseMapperType.dataJsonArray,
  //       queryParameters: {
  //         'page': page,
  //         'limit': limit,
  //         'sortBy': 'id',
  //         'course_ids': courseIds,
  //       },
  //     );
  //   }
  let apiUrl = text.replace("{{url}}", "https://google.com");
  // if (!apiUrl.startsWith('https://') && !apiUrl.startsWith('http://')) {
  //     if (apiUrl.startsWith('?')) {
  //         apiUrl = 'https://google.com/' + apiUrl;
  //     } else {
  //         apiUrl = 'https://google.com/?' + apiUrl;
  //     }
  // }
  console.log(apiUrl);
  let url;
  try {
    url = new URL(apiUrl);
  } catch (error) {
    if (apiUrl.startsWith("?")) {
      apiUrl = "https://google.com/" + apiUrl;
      url = new URL(apiUrl);
    } else if (apiUrl.startsWith("/")) {
      apiUrl = "https://google.com" + apiUrl;
      url = new URL(apiUrl);
    } else {
      try {
        let oldApiUrl = apiUrl;
        apiUrl = "https://google.com/" + apiUrl;
        url = new URL(apiUrl);
        console.log(`url.pathname = ${url.pathname}`)
        if (url.pathname.includes("=")) {
            apiUrl = "https://google.com/?" + oldApiUrl;
            console.log(`oldApiUrl: ${oldApiUrl} === apiUrl: ${apiUrl}`)
            url = new URL(apiUrl);
        }
      } catch (error) {
        apiUrl = "https://google.com/?" + apiUrl;
        url = new URL(apiUrl);
      }
    }
  }
  console.log(`apiUrl: ${apiUrl} === url: ${url}`);
  // const url = new URL(apiUrl);
  let path = url.pathname;
  console.log(path);
  if (path.startsWith("/api/")) {
    path = path.substring(5);
  } else if (path.startsWith("/")) {
    path = path.substring(1);
  }

  const params = url.searchParams;
  console.log(params);
  let q = "";
  let p = "";
  params.forEach((value, key) => {
    q += `'${key}': ${changeCase.camelCase(key)},\n`;
    p += `required ${getTypeByValue(value)} ${changeCase.lowerCaseFirst(
      changeCase.pascalCase(key.trim())
    )},\n`;
  });

  return `Future<XXX> get(${p.length == 0 ? '' : '{\n'}${p}${p.length == 0 ? '' : '}'}) {\nreturn authAppServerClient.request(\nmethod: RestMethod.get,\npath: '${path}'${p.length == 0 ? '' : ',\nqueryParameters: {\n'}${q}${p.length == 0 ? '' : '}'},\n// decoder: XXX.fromJson,\n// successResponseMapperType: SuccessResponseMapperType.yyy,\n);\n}`;
}

function getTypeByValue(v: string): string {
  // return 'dynamic';

  const value = v.trim();
  if (value.startsWith('"')) {
    return "String";
  }

  if (value.startsWith("true") || value.startsWith("false")) {
    return "bool";
  }

  if (value.startsWith("[")) {
    const arr = value.split(",");
    if (arr.length == 0) {
      return "dynamic";
    }
    return `List<${getTypeByValue(
      arr[0].trim().replace("[", "").replace("]", "")
    )}>`;
  }

  if (value.match(RegExp("^\\d+\\.\\d+$")) != null) {
    return "double";
  }

  if (value.match(RegExp("^\\d+$")) != null) {
    return "int";
  }

  return "String";
}
