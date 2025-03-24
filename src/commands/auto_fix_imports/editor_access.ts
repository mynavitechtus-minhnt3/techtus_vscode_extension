import * as vscode from 'vscode';

interface EditorAccess {
    getFileName(): string;
    getLineAt(idx: number): string;
    getLineCount(): number;
    replaceLineAt(idx: number, newLine: string): Thenable<boolean>;
}

class VSCodeEditorAccess implements EditorAccess {
    editor: vscode.TextEditor;

    constructor(editor: vscode.TextEditor) {
        this.editor = editor;
    }

    getFileName(): string {
        return this.editor.document.fileName;
    }

    getLineAt(idx: number): string {
        return this.editor.document.lineAt(idx).text;
    }

    getLineCount(): number {
        return this.editor.document.lineCount;
    }

    replaceLineAt(idx: number, newLine: string): Thenable<boolean> {
        return this.editor.edit((builder) => {
            const line = this.getLineAt(idx);
            const start = new vscode.Position(idx, 0);
            const end = new vscode.Position(idx, line.length);
            builder.replace(new vscode.Range(start, end), newLine);
        });
    }
}

export { EditorAccess, VSCodeEditorAccess }