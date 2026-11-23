import type { Messages } from './en'

/** Spec 020: the Ukrainian text of the website */
export const uk: Messages = {
  meta: {
    homeTitle: 'Findy — пошук роботи на канбан-дошці',
    homeDescription:
      'Безкоштовний застосунок з відкритим кодом для Windows, macOS і Linux. Усі заявки на одній дошці: від першого відгуку до оферу. Дані лишаються на вашому компʼютері.',
    guideTitle: '{title} — Findy',
  },
  nav: {
    label: 'Головне меню',
    openMenu: 'Відкрити меню',
    closeMenu: 'Закрити меню',
    skip: 'Перейти до вмісту',
    home: 'Головна',
    download: 'Завантажити',
    features: 'Можливості',
    guides: 'Інструкції',
    language: 'Мова',
  },
  guides: {
    install: 'Встановлення',
    'browser-extension': 'Розширення для браузера',
    'ai-assistant': 'AI-асистент',
  },
  theme: {
    toDark: 'Увімкнути темну тему',
    toLight: 'Увімкнути світлу тему',
  },
  hero: {
    title: 'Увесь пошук роботи на одній дошці',
    lead: 'Десятки заявок легко переплутати. Findy тримає їх на одній канбан-дошці — від першого відгуку до оферу.',
    facts: 'Проєкт з відкритим кодом',
    repository: 'Переглянути на GitHub',
  },
  download: {
    title: 'Завантажити Findy',
    version: 'Версія {version}',
    mainFor: 'Завантажити для {os}',
    os: { windows: 'Windows', mac: 'macOS', linux: 'Linux' },
    kinds: {
      windowsInstaller: { title: 'Інсталятор', detail: 'Windows 10/11 · .exe' },
      windowsPortable: { title: 'Портативна версія', detail: 'Без встановлення · .zip' },
      macAppleSilicon: { title: 'Apple Silicon', detail: 'M1, M2, M3, M4… · .dmg' },
      macIntel: { title: 'Intel', detail: 'Процесор Intel · .dmg' },
      linuxAppImage: { title: 'AppImage', detail: 'Будь-який дистрибутив' },
      linuxDeb: { title: 'Debian, Ubuntu', detail: 'Пакет .deb' },
      extensionChromium: { title: 'Chrome, Edge, Brave, Opera, Vivaldi', detail: '.zip' },
      extensionFirefox: { title: 'Firefox', detail: '.zip' },
      checksums: { title: 'Контрольні суми', detail: 'SHA256SUMS.txt' },
    },
    recommended: 'Рекомендовано',
    whichMac: 'Який у мене Mac?',
    whichMacAnswer:
      'Меню Apple → «Про цей Mac». «Чип: Apple M…» — це Apple Silicon, «Процесор: Intel…» — Intel.',
    free: 'Безкоштовно',
    packageManagers: 'Менеджери пакетів',
    copy: 'Копіювати',
    copied: 'Скопійовано',
    all: 'Усі завантаження',
    homebrew: 'macOS · Homebrew',
    scoop: 'Windows · Scoop',
    extension: 'Розширення для браузера',
    extensionHint: 'Додає відкриту в браузері вакансію у Findy в один клік.',
    howToInstall: 'Як встановити',
    installHelp: 'Інструкція: Homebrew, Scoop, контрольні суми, перший запуск',
    releasePage: 'Опис релізу й усі файли',
    unsigned:
      'Збірки поки не підписані, тому macOS і Windows показують попередження, коли ви вперше відкриваєте Findy.',
    /** The heading id of the first-start steps in the install guide (a test checks it) */
    unsignedAnchor: 'перший-запуск-збірки-поки-не-підписані',
    unsignedLink: 'Як відкрити Findy вперше',
  },
  features: {
    title: 'Що вміє Findy',
    lead: 'Кожна заявка — це картка, що проходить етапи найму.',
    flow: 'Етапи заявки',
    outcomes: 'Результат',
    groups: [
      {
        title: 'Відстежуйте',
        items: [
          {
            icon: 'board',
            title: 'Канбан-дошка',
            text: 'Перетягуйте картки між етапами мишею або з клавіатури.',
          },
          {
            icon: 'note',
            title: 'Нотатки й нагадування',
            text: 'Нотатки, зарплата й контакти в кожній картці. Findy нагадає про наступний крок.',
          },
          {
            icon: 'chart',
            title: 'Аналітика',
            text: 'Заявки за тиждень, співбесіди й воронка вашого пошуку.',
          },
        ],
      },
      {
        title: 'Додавайте швидше',
        items: [
          {
            icon: 'link',
            title: 'З посилання',
            text: 'Вставте посилання на вакансію — посада й компанія заповняться самі.',
          },
          {
            icon: 'puzzle',
            title: 'З браузера',
            text: 'Розширення додає відкриту вакансію в один клік.',
          },
          {
            icon: 'search',
            title: 'Сайти вакансій',
            text: 'Один запит — на Djinni, DOU, LinkedIn, Indeed та інших.',
          },
        ],
      },
      {
        title: 'Ваші дані',
        items: [
          {
            icon: 'lock',
            title: 'Приватно',
            text: 'Офлайн, без акаунта й телеметрії. Дані лишаються на вашому компʼютері.',
          },
          {
            icon: 'table',
            title: 'Експорт та імпорт CSV',
            text: 'Переносьте дошку в будь-яку таблицю й назад.',
          },
          {
            icon: 'sparkles',
            title: 'AI-асистент',
            text: 'Якщо ввімкнете, Claude зможе читати вашу дошку й допоможе підготуватися.',
          },
        ],
      },
    ],
  },
  screenshots: {
    label: 'Скріншоти Findy',
    previous: 'Попередній скріншот',
    next: 'Наступний скріншот',
    show: 'Скріншот {number} з {total}',
    pause: 'Зупинити показ',
    play: 'Продовжити показ',
    board: 'Дошка Findy: заявки в колонках етапів',
    details: 'Деталі заявки з нотатками, полями та історією етапів',
    analytics: 'Аналітика: надіслані заявки, етапи в часі, воронка й підсумки',
    sites: 'Сайти вакансій: один пошуковий запит для будь-якого сайту',
  },
  privacy: {
    title: 'Приватність за замовчуванням',
    points: [
      'Працює офлайн',
      'Без акаунта й телеметрії',
      'Дані лишаються в локальній базі, у відкритому форматі',
    ],
    online:
      'Findy виходить в інтернет, лише коли ви про це просите: щоб перевірити оновлення, прочитати сторінку вакансії за вставленим посиланням і отримати іконки сайтів вакансій.',
    policy: 'Політика приватності',
  },
  support: {
    title: 'Підтримати Findy',
    text: 'Findy безкоштовний і створюється у вільний час. Якщо він допоміг вам знайти роботу, ви можете його підтримати.',
    button: 'Підтримати на Ko-fi',
    star: 'Поставити зірку на GitHub',
  },
  footer: {
    support: 'Підтримати',
    source: 'Вихідний код',
    issues: 'Повідомити про проблему',
    licence: 'Ліцензія MIT',
    project: 'Проєкт',
    copyright: '© {year} Автори Findy',
    notAffiliated: 'Findy не повʼязаний з жодною платформою вакансій.',
  },
}
