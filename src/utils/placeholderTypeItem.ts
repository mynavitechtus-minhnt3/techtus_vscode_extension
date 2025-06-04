import * as vscode from 'vscode';

export class PlaceholderTypeItem implements vscode.QuickPickItem {
    constructor(readonly label: string) {}
}
