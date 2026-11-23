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
    skip: 'Skip to content',
    home: 'Home',
    download: 'Download',
    otherLanguage: 'Українською',
  },
  guides: {
    install: 'Install',
    'browser-extension': 'Browser extension',
    'ai-assistant': 'AI assistant',
  },
  hero: {
    title: 'Track your job search on one board',
    lead: 'Sending dozens of applications and losing track of which company is at which stage? Findy keeps every application on a kanban board, from the moment you apply until you get an offer.',
    facts:
      'Free and open source · Windows, macOS, Linux · No account · Your data stays on your computer',
  },
  download: {
    title: 'Download Findy',
    version: 'Version {version}',
    mainFor: 'Download for {os}',
    os: { windows: 'Windows', mac: 'macOS', linux: 'Linux' },
    kinds: {
      windowsInstaller: 'Windows installer (.exe)',
      windowsPortable: 'Windows, portable (no install)',
      macAppleSilicon: 'Mac with Apple Silicon (M1, M2, M3, M4…)',
      macIntel: 'Mac with an Intel processor',
      linuxAppImage: 'Linux, any distribution (AppImage)',
      linuxDeb: 'Debian, Ubuntu (.deb)',
      extensionChromium: 'Chrome, Edge, Brave, Opera, Vivaldi',
      extensionFirefox: 'Firefox',
      checksums: 'Checksums (SHA256SUMS.txt)',
    },
    whichMac:
      'Which Mac do I have? Open the Apple menu → About This Mac. “Chip: Apple M…” means Apple Silicon, “Processor: Intel…” means Intel.',
    all: 'All downloads',
    packageManagers: 'With a package manager',
    homebrew: 'macOS, Homebrew',
    scoop: 'Windows, Scoop',
    extension: 'Browser extension',
    extensionHint: 'Adds the vacancy that is open in your browser to Findy in one click.',
    howToInstall: 'How to install',
    releasePage: 'Release notes and all files',
    unsigned:
      'The builds are not signed yet, so macOS and Windows show a warning the first time you open Findy.',
    /** The heading id of the first-start steps in the install guide (a test checks it) */
    unsignedAnchor: 'first-start-the-builds-are-not-signed-yet',
    unsignedLink: 'How to open Findy the first time',
  },
  features: {
    title: 'What Findy does',
    items: [
      {
        title: 'Kanban board',
        text: 'Every application is a card. Columns are the stages: applied, HR interview, test task, technical interview, C-level interview, offer, rejected. Drag cards with the mouse or the keyboard.',
      },
      {
        title: 'Notes and next step',
        text: 'Keep notes, the salary, the work format and the recruiter on each application. Set the next step with a date, and Findy reminds you before it.',
      },
      {
        title: 'Add from a link or the browser',
        text: 'Paste a vacancy link and Findy fills in the job title and the company. The browser extension adds the open vacancy in one click.',
      },
      {
        title: 'Analytics',
        text: 'See how many applications you send, how many interviews you get, and how far your applications go in a funnel.',
      },
      {
        title: 'Job sites',
        text: 'Type your search once and open it on Djinni, DOU, Work.ua, LinkedIn, Indeed and more in one click.',
      },
      {
        title: 'AI assistant',
        text: 'If you turn it on, an AI assistant such as Claude can read and update your board, for example to prepare for an interview.',
      },
      {
        title: 'CSV export and import',
        text: 'Save the whole board to a file that opens in any spreadsheet, or add applications from your own table.',
      },
      {
        title: 'English and Ukrainian',
        text: 'The interface is in English and Ukrainian, with a light and a dark theme.',
      },
    ],
  },
  screenshots: {
    title: 'Screenshots',
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
