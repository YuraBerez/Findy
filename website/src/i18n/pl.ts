import type { Messages } from './en'

/** Spec 027: the Polish text of the website */
export const pl: Messages = {
  meta: {
    homeTitle: 'Findy — darmowy tracker aplikacji o pracę na tablicy kanban',
    homeDescription:
      'Findy to darmowy tracker aplikacji o pracę z otwartym kodem dla Windows, macOS i Linuksa. Trzymaj każdą aplikację na tablicy kanban, od pierwszej odpowiedzi do oferty. Twoje dane zostają na Twoim komputerze.',
    guideTitle: '{title} — Findy',
    guideDescriptions: {
      install:
        'Jak zainstalować tracker aplikacji o pracę Findy w Windows, macOS i Linuksie: Homebrew, Scoop, sprawdzenie pobranego pliku i pierwsze uruchomienie.',
      'browser-extension':
        'Jak zainstalować rozszerzenie Findy w Chrome, Edge, Brave, Operze, Vivaldi lub Firefoksie i dodać ofertę pracy do tablicy jednym kliknięciem.',
      'ai-assistant':
        'Jak połączyć Findy z Claude lub innym asystentem AI przez MCP i zainstalować umiejętność Findy, aby przygotować się do rozmów.',
    },
    category: 'Tracker aplikacji o pracę',
    notFoundTitle: 'Nie znaleziono strony — Findy',
  },
  nav: {
    label: 'Główna',
    openMenu: 'Otwórz menu',
    closeMenu: 'Zamknij menu',
    skip: 'Przejdź do treści',
    home: 'Strona główna',
    download: 'Pobierz',
    features: 'Funkcje',
    guides: 'Poradniki',
    language: 'Język',
  },
  guides: {
    install: 'Instalacja',
    'browser-extension': 'Rozszerzenie przeglądarki',
    'ai-assistant': 'Asystent AI',
  },
  theme: {
    toDark: 'Włącz ciemny motyw',
    toLight: 'Włącz jasny motyw',
  },
  hero: {
    title: 'Śledź szukanie pracy na jednej tablicy',
    lead: 'Dziesiątki aplikacji łatwo pomylić. Findy trzyma je wszystkie na jednej tablicy kanban, od pierwszej odpowiedzi do oferty.',
    facts: 'Projekt open source',
    repository: 'Zobacz na GitHubie',
  },
  download: {
    title: 'Pobierz Findy',
    version: 'Wersja {version}',
    mainFor: 'Pobierz dla {os}',
    os: { windows: 'Windows', mac: 'macOS', linux: 'Linux' },
    osNote: {
      windows: 'Windows 10 i 11, 64-bit',
      mac: 'macOS 13 Ventura lub nowszy',
      linux: '64-bit (x64)',
    },
    whichMacShort: 'Który Mac?',
    kinds: {
      windowsInstaller: { title: 'Instalator', detail: 'Windows 10/11 · .exe' },
      windowsPortable: { title: 'Wersja przenośna', detail: 'Bez instalacji · .zip' },
      macAppleSilicon: { title: 'Apple Silicon', detail: 'M1 i nowsze · .dmg' },
      macIntel: { title: 'Intel', detail: 'Starsze Maki · .dmg' },
      linuxAppImage: { title: 'AppImage', detail: 'Każda dystrybucja' },
      linuxDeb: { title: 'Debian, Ubuntu', detail: 'Pakiet .deb' },
      extensionChromium: {
        title: 'Przeglądarki Chromium',
        detail: 'Chrome, Edge, Brave, Opera, Vivaldi · .zip',
      },
      extensionFirefox: { title: 'Firefox', detail: '.zip' },
      checksums: { title: 'Sumy kontrolne', detail: 'SHA256SUMS.txt' },
    },
    recommended: 'Zalecane',
    whichMac: 'Jaki mam Mac?',
    whichMacAnswer:
      'Menu Apple → Ten Mac. „Czip: Apple M…” to Apple Silicon, „Procesor: Intel…” to Intel.',
    free: 'Za darmo',
    packageManagers: 'Menedżery pakietów',
    copy: 'Kopiuj',
    copied: 'Skopiowano',
    all: 'Wszystkie pliki',
    packageManagersHint: 'Instaluj i aktualizuj Findy z terminala.',
    extension: 'Rozszerzenie przeglądarki',
    extensionHint: 'Dodaje do Findy ofertę pracy otwartą w przeglądarce jednym kliknięciem.',
    howToInstall: 'Jak zainstalować',
    installHelp: 'Poradnik instalacji: Homebrew, Scoop, sumy kontrolne, pierwsze uruchomienie',
    releasePage: 'Informacje o wydaniu i wszystkie pliki',
    unsigned:
      'Wersje nie są jeszcze podpisane, więc macOS i Windows pokazują ostrzeżenie przy pierwszym otwarciu Findy.',
    /** The heading id of the first-start steps in the Polish install guide (a test checks it) */
    unsignedAnchor: 'pierwsze-uruchomienie-wersje-nie-są-jeszcze-podpisane',
    unsignedLink: 'Jak otworzyć Findy za pierwszym razem',
  },
  features: {
    title: 'Co robi Findy',
    lead: 'Każda aplikacja to karta, która przechodzi przez etapy rekrutacji.',
    flow: 'Etapy aplikacji',
    outcomes: 'Wynik',
    groups: [
      {
        title: 'Śledź',
        items: [
          {
            icon: 'board',
            title: 'Tablica kanban',
            text: 'Przeciągaj karty między etapami myszą lub klawiaturą.',
          },
          {
            icon: 'note',
            title: 'Notatki i przypomnienia',
            text: 'Notatki, wynagrodzenie i kontakty na każdej karcie. Findy przypomina o następnym kroku.',
          },
          {
            icon: 'chart',
            title: 'Analityka',
            text: 'Aplikacje w tygodniu, rozmowy i lejek Twojego szukania.',
          },
        ],
      },
      {
        title: 'Dodawaj szybciej',
        items: [
          {
            icon: 'link',
            title: 'Z linku',
            text: 'Wklej link do oferty, a stanowisko i firma wypełnią się same.',
          },
          {
            icon: 'puzzle',
            title: 'Z przeglądarki',
            text: 'Rozszerzenie dodaje otwartą ofertę jednym kliknięciem.',
          },
          {
            icon: 'search',
            title: 'Portale z ofertami',
            text: 'Jedno wyszukiwanie, otwarte na Djinni, DOU, LinkedIn, Indeed i innych.',
          },
        ],
      },
      {
        title: 'Twoje dane',
        items: [
          {
            icon: 'lock',
            title: 'Prywatnie',
            text: 'Offline, bez konta, bez telemetrii. Dane zostają na Twoim komputerze.',
          },
          {
            icon: 'table',
            title: 'Eksport i import CSV',
            text: 'Przenieś tablicę do dowolnego arkusza i z powrotem.',
          },
          {
            icon: 'sparkles',
            title: 'Asystent AI',
            text: 'Jeśli to włączysz, Claude może czytać Twoją tablicę i pomóc Ci się przygotować.',
          },
        ],
      },
    ],
  },
  screenshots: {
    label: 'Zrzuty ekranu Findy',
    previous: 'Poprzedni zrzut ekranu',
    next: 'Następny zrzut ekranu',
    show: 'Zrzut ekranu {number} z {total}',
    pause: 'Zatrzymaj pokaz',
    play: 'Odtwórz pokaz',
    board: 'Tablica Findy: aplikacje w kolumnach etapów',
    details: 'Szczegóły aplikacji z notatkami, polami i historią etapów',
    analytics: 'Analityka: wysłane aplikacje, etapy w czasie, lejek i podsumowanie',
    sites: 'Portale z ofertami: jedno wyszukiwanie, otwarte na dowolnym portalu',
  },
  privacy: {
    title: 'Prywatność od podstaw',
    points: [
      'Działa offline',
      'Bez konta i bez telemetrii',
      'Twoje dane zostają w lokalnej bazie danych, w otwartym formacie',
    ],
    online:
      'Findy łączy się z internetem tylko na Twoją prośbę: aby sprawdzić aktualizacje, odczytać stronę oferty, której link wklejasz, i pobrać ikony portali z ofertami.',
    policy: 'Polityka prywatności',
  },
  support: {
    title: 'Wesprzyj Findy',
    text: 'Findy jest darmowy i powstaje w wolnym czasie. Jeśli pomaga Ci znaleźć pracę, możesz go wesprzeć.',
    button: 'Wesprzyj na Ko-fi',
    star: 'Gwiazdka na GitHubie',
  },
  notFound: {
    title: 'Nie znaleziono strony',
    text: 'Ta strona nie istnieje albo została przeniesiona.',
    home: 'Przejdź do strony głównej',
  },
  footer: {
    support: 'Wsparcie',
    source: 'Kod źródłowy',
    issues: 'Zgłoś problem',
    licence: 'Licencja MIT',
    project: 'Projekt',
    copyright: '© {year} Twórcy Findy',
    notAffiliated: 'Findy nie jest powiązany z żadnym portalem z ofertami pracy.',
  },
}
