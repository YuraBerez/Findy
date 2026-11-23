/** Spec 020: the English text of the website, the source for every other language */
export const en = {
  meta: {
    homeTitle: 'Findy — track your job search on a kanban board',
    homeDescription:
      'Free, open-source desktop app for Windows, macOS and Linux. Keep every job application on one board, from the first response to the offer. Your data stays on your computer.',
    guideTitle: '{title} — Findy',
  },
  nav: {
    label: 'Main',
    openMenu: 'Open the menu',
    closeMenu: 'Close the menu',
    skip: 'Skip to content',
    home: 'Home',
    download: 'Download',
    features: 'Features',
    guides: 'Guides',
    language: 'Language',
  },
  guides: {
    install: 'Install',
    'browser-extension': 'Browser extension',
    'ai-assistant': 'AI assistant',
  },
  theme: {
    toDark: 'Switch to the dark theme',
    toLight: 'Switch to the light theme',
  },
  hero: {
    title: 'Track your job search on one board',
    lead: 'Dozens of applications are easy to mix up. Findy keeps them all on one kanban board, from the first response to the offer.',
    facts: 'Open source project',
    repository: 'View on GitHub',
  },
  download: {
    title: 'Download Findy',
    version: 'Version {version}',
    mainFor: 'Download for {os}',
    os: { windows: 'Windows', mac: 'macOS', linux: 'Linux' },
    kinds: {
      windowsInstaller: { title: 'Installer', detail: 'Windows 10/11 · .exe' },
      windowsPortable: { title: 'Portable', detail: 'No install · .zip' },
      macAppleSilicon: { title: 'Apple Silicon', detail: 'M1, M2, M3, M4… · .dmg' },
      macIntel: { title: 'Intel', detail: 'Intel processor · .dmg' },
      linuxAppImage: { title: 'AppImage', detail: 'Any distribution' },
      linuxDeb: { title: 'Debian, Ubuntu', detail: '.deb package' },
      extensionChromium: { title: 'Chrome, Edge, Brave, Opera, Vivaldi', detail: '.zip' },
      extensionFirefox: { title: 'Firefox', detail: '.zip' },
      checksums: { title: 'Checksums', detail: 'SHA256SUMS.txt' },
    },
    recommended: 'Recommended',
    whichMac: 'Which Mac do I have?',
    whichMacAnswer:
      'Apple menu → About This Mac. “Chip: Apple M…” is Apple Silicon, “Processor: Intel…” is Intel.',
    free: 'Free',
    packageManagers: 'Package managers',
    copy: 'Copy',
    copied: 'Copied',
    all: 'All downloads',
    homebrew: 'macOS · Homebrew',
    scoop: 'Windows · Scoop',
    extension: 'Browser extension',
    extensionHint: 'Adds the vacancy that is open in your browser to Findy in one click.',
    howToInstall: 'How to install',
    installHelp: 'Install guide: Homebrew, Scoop, checksums, first start',
    releasePage: 'Release notes and all files',
    unsigned:
      'The builds are not signed yet, so macOS and Windows show a warning the first time you open Findy.',
    /** The heading id of the first-start steps in the install guide (a test checks it) */
    unsignedAnchor: 'first-start-the-builds-are-not-signed-yet',
    unsignedLink: 'How to open Findy the first time',
  },
  features: {
    title: 'What Findy does',
    lead: 'Every application is a card that moves through the stages of hiring.',
    flow: 'The stages of an application',
    outcomes: 'The result',
    groups: [
      {
        title: 'Track',
        items: [
          {
            icon: 'board',
            title: 'Kanban board',
            text: 'Drag cards between stages with the mouse or the keyboard.',
          },
          {
            icon: 'note',
            title: 'Notes and reminders',
            text: 'Notes, salary and contacts on each card. Findy reminds you of the next step.',
          },
          {
            icon: 'chart',
            title: 'Analytics',
            text: 'Applications per week, interviews and the funnel of your search.',
          },
        ],
      },
      {
        title: 'Add faster',
        items: [
          {
            icon: 'link',
            title: 'From a link',
            text: 'Paste a vacancy link, and the job title and the company fill in.',
          },
          {
            icon: 'puzzle',
            title: 'From the browser',
            text: 'The extension adds the open vacancy in one click.',
          },
          {
            icon: 'search',
            title: 'Job sites',
            text: 'One search, opened on Djinni, DOU, LinkedIn, Indeed and more.',
          },
        ],
      },
      {
        title: 'Your data',
        items: [
          {
            icon: 'lock',
            title: 'Private',
            text: 'Offline, no account, no telemetry. The data stays on your computer.',
          },
          {
            icon: 'table',
            title: 'CSV export and import',
            text: 'Move your board to and from any spreadsheet.',
          },
          {
            icon: 'sparkles',
            title: 'AI assistant',
            text: 'If you turn it on, Claude can read your board and help you prepare.',
          },
        ],
      },
    ],
  },
  screenshots: {
    label: 'Screenshots of Findy',
    previous: 'Previous screenshot',
    next: 'Next screenshot',
    show: 'Screenshot {number} of {total}',
    pause: 'Pause the slideshow',
    play: 'Play the slideshow',
    board: 'Findy board: applications in stage columns',
    details: 'Application details with notes, fields and stage history',
    analytics: 'Analytics: applications sent, stages over time, funnel and totals',
    sites: 'Job sites: one search query, opened on any job site',
  },
  privacy: {
    title: 'Private by design',
    text: 'Findy works offline and has no account and no telemetry. Your applications and notes stay in a local database on your computer, in an open format. Findy goes online only when you ask: to check for updates, to read a vacancy page whose link you paste, and to get the icons of job sites.',
  },
  support: {
    title: 'Support Findy',
    text: 'Findy is free and made in spare time. If it helps you find a job, you can support it.',
    button: 'Support on Ko-fi',
  },
  footer: {
    support: 'Support',
    source: 'Source code',
    issues: 'Report an issue',
    licence: 'MIT licence',
    notAffiliated: 'Findy is not affiliated with any job platform.',
  },
}

type Text<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? Text<U>[]
    : { [K in keyof T]: Text<T[K]> }

/** The shape of every language: a missing key is a type error (plan D-3) */
export type Messages = Text<typeof en>
