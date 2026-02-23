import * as vscode from 'vscode';
import { loadExtensionConfig, buildScanArgs } from './config';
import { runScan, findCliPath } from './scanner';
import { parseSarifToDiagnostics, sarifLevelToSeverity } from './diagnostics';

let diagnosticCollection: vscode.DiagnosticCollection;

export function activate(context: vscode.ExtensionContext) {
  diagnosticCollection = vscode.languages.createDiagnosticCollection('faultline');
  context.subscriptions.push(diagnosticCollection);

  // Command: Scan current file
  context.subscriptions.push(
    vscode.commands.registerCommand('faultline.scanFile', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('Faultline: No active file to scan.');
        return;
      }
      await scanDocument(editor.document, context);
    }),
  );

  // Command: Scan workspace
  context.subscriptions.push(
    vscode.commands.registerCommand('faultline.scanWorkspace', async () => {
      vscode.window.showInformationMessage('Faultline: Workspace scan not yet implemented.');
    }),
  );

  // Scan on save
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(async (document) => {
      const config = loadExtensionConfig(
        () => vscode.workspace.getConfiguration('faultline'),
        vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
      );
      if (config.scanOnSave) {
        await scanDocument(document, context);
      }
    }),
  );
}

async function scanDocument(document: vscode.TextDocument, context: vscode.ExtensionContext) {
  const filePath = document.uri.fsPath;
  const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  const config = loadExtensionConfig(
    () => vscode.workspace.getConfiguration('faultline'),
    workspacePath,
  );

  const args = buildScanArgs(filePath, config);
  const cliPath = findCliPath(context.extensionPath);

  const result = await runScan({
    filePath,
    args,
    cliPath,
    cwd: workspacePath,
  });

  if (!result.success) {
    vscode.window.showErrorMessage(`Faultline scan failed: ${result.stderr}`);
    return;
  }

  const faultlineDiagnostics = parseSarifToDiagnostics(result.stdout);

  const vscodeDiagnostics = faultlineDiagnostics.map((d) => {
    const range = new vscode.Range(
      d.range.startLine, d.range.startCharacter,
      d.range.endLine, d.range.endCharacter,
    );
    const diag = new vscode.Diagnostic(range, d.message, d.severity);
    diag.source = d.source;
    diag.code = d.code;
    return diag;
  });

  diagnosticCollection.set(document.uri, vscodeDiagnostics);
}

export function deactivate() {
  diagnosticCollection?.dispose();
}
