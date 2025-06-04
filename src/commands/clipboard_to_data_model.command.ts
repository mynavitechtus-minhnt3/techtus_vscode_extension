import { InputBoxOptions, OpenDialogOptions, Uri, window } from "vscode";
import * as _ from 'lodash';
import * as path from 'path';
import * as changeCase from "change-case";
import * as fs from 'fs';
import * as vscode from 'vscode';
import * as copyPaste from 'copy-paste';
import { jsonc } from 'jsonc';
import { ClassNameModel, Settings } from "./clipboard_to_data_model/settings";
import { ModelGenerator } from "./clipboard_to_data_model/model-generator";
import { ClassDefinition } from "./clipboard_to_data_model/syntax";
import { fetchPackageInfoFor } from "./auto_fix_imports/convert_to_relative_import";
import { configResolver } from "./fix_imports.command";
import { getDataMapperTemplate } from "../templates/data-mapper.template";
import { getEntityTemplate } from "../templates/entity.template";
import { autoExport } from "./auto_export.command";

export const transformFromClipboardToDataModel = async () => {
    // let input = new Input();
    const rawEditor = vscode.window.activeTextEditor;
    if (!rawEditor) {
        vscode.window.showErrorMessage(`text editor is null`);
        return;
    }
  const packageInfo = await fetchPackageInfoFor(rawEditor.document.uri);
    if (!packageInfo) {
        vscode.window.showErrorMessage(
            'Failed to initialize extension. Is this a valid Dart/Flutter project?',
        );
        return;
    }
    
  var targetDirectory = `${packageInfo.projectRoot}/${configResolver.dataModelPath}`;
  if (!fs.existsSync(targetDirectory)) {
      targetDirectory = `${
        packageInfo.projectRoot
      }/lib/src/${configResolver.dataModelPath.substring(
        "lib/".length,
        configResolver.dataModelPath.length
      )}`;
    }
  const entityDirectory = `${packageInfo.projectRoot}/${configResolver.entityPath}`;
    const className = await promptForBaseClassName();

    if (_.isNil(className) || className!.trim() === '') {
        window.showErrorMessage('Please enter a valid name');
        return;
    }

    // if (!input.primaryConfiguration) {
    //     input = await getUserInput(true);
    // }

    // let targetDirectory: String | undefined;

    // if (_.isNil(_.get(uri, 'fsPath')) || !fs.lstatSync(uri.fsPath).isDirectory()) {
    //     targetDirectory = await promptForTargetDirectory();
    //     if (_.isNil(targetDirectory)) {
    //         window.showErrorMessage('Please select a valid directory');
    //         return;
    //     }
    // } else {
    //     targetDirectory = uri.fsPath;
    // }

    const json: string = await getClipboardText().then(validateJSON).catch(handleError);
    window.showInformationMessage(`${targetDirectory}, Converting: ${json}`);
    // const genMapper = await promptForMapperGen();
    // const genEntity = await promptForEntityGen();
    const model = new ClassNameModel(className!);
    const config: Settings = {
        model: model,
        targetDirectory: targetDirectory as string,
        json: json,
        // genMapper: genMapper,
        // genEntity: genEntity,
        // entityDirectory: entityDirectory,
    };
    // Create new settings.
    const settings = new Settings(config);
    await createClass(settings).catch(handleError);
};

export const promptForBaseClassName = (): Thenable<string | undefined> => {
    const classNamePromptOptions: InputBoxOptions = {
        prompt: 'Enter the entry file name (note that the name does not include `data` in postfix and `api` in prefix)',
        placeHolder: 'user_info',
    };
    return window.showInputBox(classNamePromptOptions);
};

export async function promptForMapperGen(): Promise<boolean> {
    const selection = await window.showQuickPick(
        [
            {
                label: 'Yes',
                picked: true,
            },
            { label: 'No' },
        ],
        { placeHolder: 'Gen mapper classes?' }
    );

    switch (selection?.label) {
        case 'Yes':
            return true;
        default:
            return false;
    }
} 

export async function promptForEntityGen(): Promise<boolean> {
    const selection = await window.showQuickPick(
        [
            {
                label: 'Yes',
                picked: true,
            },
            { label: 'No' },
        ],
        { placeHolder: 'Gen entity classes?' }
    );

    switch (selection?.label) {
        case 'Yes':
            return true;
        default:
            return false;
    }
} 

export const promptForTargetDirectory = async (): Promise<string | undefined> => {
    const options: OpenDialogOptions = {
        canSelectMany: false,
        openLabel: "Select a folder to create the classes in",
        canSelectFolders: true,
    };

    return window.showOpenDialog(options).then((uri) => {
        if (_.isNil(uri) || _.isEmpty(uri)) {
            return undefined;
        }
        return uri![0].fsPath;
    });
};

export function getClipboardText(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        copyPaste.paste((err, text) => {
            if (err !== null) {
                reject(err);
            }
            resolve(text);
        });
    });
}

export function handleError(error: Error) {
    const text = error.message;
    window.showErrorMessage(text);
}

export const validateJSON = (text: any) => {
    if (!text.trim().startsWith('{')) {
        text = `{${text}`;
    }
    if (!text.trim().endsWith('}')) {
        if (text.trim().endsWith(',')) {
            text = text.trim().substring(0, text.trim().length - 1);
        }
        text = `${text}}`;
    }

    console.log(`validateJSON: ${text}`);
    const [err, result] = jsonc.safe.parse(text.trim());

    if (text.length === 0) {
        return Promise.reject(new Error('Chưa copy Json à?'));
    } else {
        if (err) {
            return Promise.reject(new Error(`Parsing Json failed. This is not a Json: ${err.name}: ${err.message}`));
        } else {
            return Promise.resolve(JSON.stringify(result) as any);
        }
    }
};

export async function createClass(settings: Settings) {
    var modelGenerator = new ModelGenerator(settings);
    var classes: ClassDefinition[] = await modelGenerator.generateDartClasses(settings.json);
    if (classes.length == 0) {
        window.showErrorMessage("Incorrect JSON format");
    }

    for await (var classDef of classes) {
        const enhancement = settings.model.enhancement;
        const fileName = `api_${classDef.path}${enhancement}_data.dart`;
        // const mapperFileName = `api_${classDef.path}${enhancement}_data_mapper.dart`
        // const entityFileName = `${classDef.path}${enhancement}.dart`
        const file = path.join(`${settings.targetDirectory}`, fileName);
        // const mapperFile = path.join(`${settings.targetDirectory}/mapper`, mapperFileName);
        // const entityFile = path.join(`${settings.entityDirectory}`, entityFileName);

        if (existsSync(file)) {
            window.showInformationMessage(`The file ${fileName} does exist`);
        } else {
            const data = classDef.toCodeGenString();
            // console.log(`write to file: ${file} with data ${data}`);
            await writeFile(file, data);
        }

        // if (settings.genMapper) {
        //     if (existsSync(mapperFile)) {
        //         window.showInformationMessage(`file ${mapperFileName} đã tồn tại`);
        //     } else {
        //         const data = getDataMapperTemplate(classDef);
        //         await writeFile(mapperFile, data);
        //     }
        // }

        // if (settings.genEntity) {
        //     if (existsSync(entityFile)) {
        //         window.showInformationMessage(`file ${entityFileName} đã tồn tại`);
        //     } else {
        //         const data = getEntityTemplate(classDef);
        //         await writeFile(entityFile, data);
        //     }
        // }

        autoExport();
    }
}

function existsSync(path: string): boolean {
    return fs.existsSync(path);
}

export function writeFile(path: string, data: string) {
    return new Promise<void>((resolve, reject) => {
        fs.writeFile(path, data, 'utf8', (err) => {
            if (err) {
                reject(new Error(`Couldn't write file due to error: ${err}`));
            } else {
                resolve();
            }
        });
    });
}