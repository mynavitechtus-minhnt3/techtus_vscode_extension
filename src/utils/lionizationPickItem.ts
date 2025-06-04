import * as vscode from 'vscode';

export class LionizationPickItem implements vscode.QuickPickItem {
    constructor(readonly label: string) {}
}
