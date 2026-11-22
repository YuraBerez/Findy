// Spec 019 plan D-1: a host manifest cannot set environment variables or arguments, so
// it starts this script, and the script starts Findy's binary in Node mode.

export interface LauncherTarget {
  /** Findy's binary (`process.execPath`) */
  execPath: string
  /** `out/main/connector.js` (inside app.asar when packaged) */
  script: string
  /** The AppImage file: its mount path changes on every start, so it runs `--connector` */
  appImage?: string
  /**
   * `FINDY_USER_DATA_DIR` of a development or e2e run. The browser starts the launcher
   * without it, so the launcher sets it: the connector then uses the same test database.
   */
  userDataDir?: string
}

export interface LauncherFile {
  name: string
  content: string
}

const HEADER =
  'Findy browser extension connector (spec 019). Findy writes this file on every start.'

/** A value in double quotes for sh: `\`, `"`, `$` and the backtick are escaped */
const shQuote = (value: string): string => `"${value.replace(/[\\"$`]/g, (sign) => `\\${sign}`)}"`

/** A value in double quotes for cmd: `%` is doubled; `"` cannot be in a Windows path */
const cmdQuote = (value: string): string => `"${value.replace(/%/g, '%%')}"`

export function launcherFile(platform: NodeJS.Platform, target: LauncherTarget): LauncherFile {
  if (platform === 'win32')
    return {
      name: 'findy-connector.cmd',
      content: [
        '@echo off',
        `rem ${HEADER}`,
        'set ELECTRON_RUN_AS_NODE=1',
        ...(target.userDataDir
          ? [`set ${cmdQuote(`FINDY_USER_DATA_DIR=${target.userDataDir}`)}`]
          : []),
        `${cmdQuote(target.execPath)} ${cmdQuote(target.script)}`,
        '',
      ].join('\r\n'),
    }
  const command = target.appImage
    ? `exec ${shQuote(target.appImage)} --connector`
    : `ELECTRON_RUN_AS_NODE=1 exec ${shQuote(target.execPath)} ${shQuote(target.script)}`
  const data = target.userDataDir
    ? [`export FINDY_USER_DATA_DIR=${shQuote(target.userDataDir)}`]
    : []
  return {
    name: 'findy-connector.sh',
    content: ['#!/bin/sh', `# ${HEADER}`, ...data, command, ''].join('\n'),
  }
}
