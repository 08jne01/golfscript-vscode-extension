/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
/*
 * extension.ts (and activateMockDebug.ts) forms the "plugin" that plugs into VS Code and contains the code that
 * connects VS Code with the debug adapter.
 * 
 * extension.ts contains code for launching the debug adapter in three different ways:
 * - as an external program communicating with VS Code via stdin/stdout,
 * - as a server process communicating with VS Code via sockets or named pipes, or
 * - as inlined code running in the extension itself (default).
 * 
 * Since the code in extension.ts uses node.js APIs it cannot run in the browser.
 */

'use strict';


import * as vscode from 'vscode';

import { ProviderResult } from 'vscode';
import * as Net from 'net';

let outputChannel: vscode.OutputChannel;
let outputTerminal: vscode.Terminal | undefined;

function startDebugging(path, noDebug: boolean | false)
{

	let config = {
		type: 'golfscript',
		name: 'Run file',
		request: 'launch',
		program: path
	}

	if (!noDebug)
	{
		config["stopOnEntry"] = true;
	}

	vscode.debug.startDebugging(undefined, config, { noDebug: noDebug });
}

export function activate(context: vscode.ExtensionContext) 
{
	outputChannel = vscode.window.createOutputChannel('Golfscript');

	console.log(outputChannel);
	context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider('golfscript', new GolfscriptInitialConfigurationProvider));
	context.subscriptions.push(vscode.debug.registerDebugAdapterDescriptorFactory('golfscript', new GolfscriptDebugAdapterDescriptorFactory()));
	context.subscriptions.push(vscode.debug.registerDebugAdapterTrackerFactory('golfscript', new GolfscriptDebugAdapterTrackerFactory()));

	context.subscriptions.push(vscode.commands.registerCommand('golfscript-debug.runEditorContents', (resource: vscode.Uri) =>
	{
		let target = resource;
		if (!target && vscode.window.activeTextEditor)
		{
			target = vscode.window.activeTextEditor.document.uri;
		}

		if (target)
		{
			startDebugging(target.fsPath, true);
		}
	}));


	context.subscriptions.push(vscode.commands.registerCommand('golfscript-debug.debugEditorContents', (resource: vscode.Uri) =>
	{
		let target = resource;
		if (!target && vscode.window.activeTextEditor)
		{
			target = vscode.window.activeTextEditor.document.uri;
		}

		if (target)
		{
			startDebugging(target.fsPath, false);
		}
	}));





}

export function deactivate()
{
	// nothing to do
}

class GolfscriptInitialConfigurationProvider implements vscode.DebugConfigurationProvider
{
	resolveDebugConfiguration(folder: vscode.WorkspaceFolder | undefined, config: vscode.DebugConfiguration, token?: vscode.CancellationToken): ProviderResult<vscode.DebugConfiguration>
	{
		if (config.script || config.request === 'attach')
		{
			return config;
		}

		return {
			type: 'golfscript',
			name: 'Launch',
			request: 'launch',
			script: '${file}',
			askParameters: true,
		};
	}
}

class GolfscriptDebugAdapterDescriptorFactory implements vscode.DebugAdapterDescriptorFactory
{

	// The following use of a DebugAdapter factory shows how to control what debug adapter executable is used.
	// Since the code implements the default behavior, it is absolutely not neccessary and we show it here only for educational purpose.

	createDebugAdapterDescriptor(session: vscode.DebugSession, executable: vscode.DebugAdapterExecutable | undefined): Promise<vscode.DebugAdapterDescriptor>
	{
		let result = new Promise<vscode.DebugAdapterServer>((resolve, reject) =>
		{
			const port = 65432;
			const ip = "127.0.0.1";
			let client = new Net.Socket();
			let retries = 5;

			client.on('connect', () =>
			{
				outputChannel.appendLine("Server is running");
				client.end();
				client.destroy();

				setTimeout(() =>
				{
					resolve(new vscode.DebugAdapterServer(65432, "127.0.0.1"));
				}, 1000); //resolve after 4 seconds
			});

			client.connect(port, ip);

			client.on('error', (error) =>
			{
				retries--;

				if (retries < 0)
				{
					reject("Could not connect to debug adapter");
				}
				else
				{
					outputChannel.appendLine("Refused: retrying...");
					setTimeout(() =>
					{
						client.connect(port, ip);
					}, 1000);
				}
			});
		});

		return result;
	}
}

class GolfscriptDebugAdapterTrackerFactory implements vscode.DebugAdapterTrackerFactory
{
	createDebugAdapterTracker(session: vscode.DebugSession): ProviderResult<vscode.DebugAdapterTracker>
	{
		const tracker: vscode.DebugAdapterTracker = {
			onWillStartSession(): void
			{
				outputChannel.appendLine("[Start session]\n" + JSON.stringify(session, null, 2));
			},
			onWillStopSession(): void
			{
				if (outputTerminal)
				{
					outputTerminal.show();
				}
			},
			onError(e)
			{
				outputChannel.appendLine("[Error on session]\n" + e.name + ": " + e.message + "\nerror: " + JSON.stringify(e, null, 2));
			}
		};

		if (true || session.configuration.showProtocalLog)
		{
			tracker.onDidSendMessage = (message: any): void => 
			{
				outputChannel.appendLine("[DebugAdapter->VSCode] " + JSON.stringify(message, null, 2));
			};

			tracker.onWillReceiveMessage = (message: any): void =>
			{
				outputChannel.appendLine("[VSCode->DebugAdapter] " + JSON.stringify(message, null, 2));
			};
		}
		return tracker;
	}
}