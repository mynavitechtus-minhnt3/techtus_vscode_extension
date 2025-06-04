import * as vscode from 'vscode';

export class ConfigResolver {
    public excludeFilesWhenFixImport: Array<string>;
    public excludeFilesWhenAutoExport: Array<string>;
    public packages: Array<string>;
    public fixOnSave: boolean;
    public autoExportOnSave: boolean;
    public autoExportBarrier: string;
    public uiFolderPath: string;
    public dataModelPath: string;
    public entityPath: string;
    public riverpodPageTemplate: string;
    public appName: string;

    constructor() {
        const config = vscode.workspace.getConfiguration(
            'mynavimobiletool',
        ) as vscode.WorkspaceConfiguration;

        this.excludeFilesWhenFixImport = config.get('excludeFilesWhenFixImport') || [];
        this.excludeFilesWhenAutoExport = config.get('excludeFilesWhenAutoExport') || [];
        this.packages = config.get('packages') || [];
        this.fixOnSave = !!config.get('fixImportsOnSave');
        this.autoExportOnSave = !!config.get('autoExportOnSave');
        this.autoExportBarrier = config.get('autoExportBarrier') || '';
        this.uiFolderPath = config.get('uiFolderPath') || '';
        this.dataModelPath = config.get('dataModelPath') || '';
        this.entityPath = config.get('entityPath') || '';
        this.appName = config.get('appName') || '';
        this.riverpodPageTemplate = config.get('riverpodPageTemplate') || 'template1';
    }

}
