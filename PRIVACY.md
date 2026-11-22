# Privacy

Findy is a desktop app that keeps your job search on your computer. This page tells what
the app and its browser extension do with your data.

## The app

- Your applications, notes and settings are in a local SQLite database on your computer.
  Findy has no account, no server and no telemetry.
- Findy goes online only for what you ask: the update check (when you start it or turn
  it on), the vacancy page whose link you paste, and the icons of job sites (once each).
  None of these requests sends data about you or your board.
- An AI assistant that you connect (MCP) gets the data that it asks for, only after you
  turn on access in Findy. The assistant sends it to its own AI provider.

## The browser extension

- The extension reads the open page only when you click its button. It finds the job
  title, the company and the link of the vacancy.
- It sends these three values only to the Findy app on the same computer, through the
  native messaging of the browser. It makes no network requests.
- Findy tells the extension only if an application with the same link exists, and its
  stage.
- The extension keeps no copy of the page, no history and no settings.

## Contact

Questions: open an issue at https://github.com/YuraBerez/findy/issues.
