import * as vscode from 'vscode';

export class ConfigResolver {
    private _excludeFilesWhenFixImport: Array<string>;
    private _excludeFilesWhenAutoExport: Array<string>;
    private _packages: Array<string>;
    private _fixOnSave: boolean;
    private _autoExportOnSave: boolean;
    private _autoExportBarrier: string;
    private _uiFolderPath: string;
    private _dataModelPath: string;
    private _entityPath: string;
    appName: string;

    constructor() {
        const config = vscode.workspace.getConfiguration(
            'mynavimobiletool',
        ) as vscode.WorkspaceConfiguration;

        this._excludeFilesWhenFixImport = config.get('excludeFilesWhenFixImport') || [];
        this._excludeFilesWhenAutoExport = config.get('excludeFilesWhenAutoExport') || [];
        this._packages = config.get('packages') || [];
        this._fixOnSave = !!config.get('fixImportsOnSave');
        this._autoExportOnSave = !!config.get('autoExportOnSave');
        this._autoExportBarrier = config.get('autoExportBarrier') || '';
        this._uiFolderPath = config.get('uiFolderPath') || '';
        this._dataModelPath = config.get('dataModelPath') || '';
        this._entityPath = config.get('entityPath') || '';
        this.appName = config.get('appName') || '';
    }

    public get excludeFilesWhenFixImport() : Array<string> {
        return this._excludeFilesWhenFixImport;
    }

    public get excludeFilesWhenAutoExport() : Array<string> {
        return this._excludeFilesWhenAutoExport;
    }

    public get fixOnSave() : boolean {
        return this._fixOnSave;
    }

    public get packages() : Array<string> {
        return this._packages;
    }

    public get autoExportOnSave(): boolean {
        return this._autoExportOnSave;
    }

    public get autoExportBarrier(): string {
        return this._autoExportBarrier;
    }

    public get uiFolderPath(): string {
        return this._uiFolderPath;
    }

    public get dataModelPath(): string {
        return this._dataModelPath;
    }

    public get entityPath(): string {
        return this._entityPath;
    }
}
