# Instalacja Findy

[English](install.md) · [Українською](install.uk.md)

Jak zainstalować Findy za pomocą menedżera pakietów, sprawdzić pobrany plik i otworzyć
aplikację po raz pierwszy.

## Instalacja przez Homebrew (macOS)

```bash
brew tap yuraberez/findy
brew trust yuraberez/findy
brew install --cask findy
```

`brew trust` wystarczy wykonać raz: Homebrew wczytuje casky z tapów spoza swojego
katalogu dopiero wtedy, gdy im zaufasz. Aktualizacja: `brew upgrade --cask findy`.
[Tap](https://github.com/YuraBerez/homebrew-findy) dostaje każde nowe wydanie w ciągu
doby. Pierwsze uruchomienie i tak wymaga kroków opisanych niżej.

## Instalacja przez Scoop (Windows)

```powershell
scoop bucket add findy https://github.com/YuraBerez/scoop-findy
scoop install findy
```

Aktualizacja: `scoop update findy`. [Bucket](https://github.com/YuraBerez/scoop-findy)
instaluje wersję przenośną dla Twojego użytkownika, bez uprawnień administratora (od
Findy 0.4.1).

## Sprawdzenie pobranego pliku

Każde wydanie (od 0.4.1) zawiera `SHA256SUMS.txt` z sumą kontrolną każdego pliku, a
GitHub zapisuje, który workflow i który commit zbudowały każdy z nich:

```bash
shasum -a 256 -c SHA256SUMS.txt --ignore-missing      # macOS, Linux
gh attestation verify Findy-x.y.z-macOS-Apple-Silicon.dmg --repo YuraBerez/findy
```

W Windows: `Get-FileHash Findy-Setup-x.y.z.exe` i porównaj wynik z `SHA256SUMS.txt`.

## Pierwsze uruchomienie: wersje nie są jeszcze podpisane

Certyfikaty do podpisywania kodu są płatne, więc wersje Findy nie są podpisane. Przy
pierwszym otwarciu Findy macOS i Windows pokazują ostrzeżenie. Wersje powstają z
otwartego kodu źródłowego w GitHub Actions. Te kroki wykonujesz tylko raz.

### macOS

Jaki masz Mac, zobaczysz w menu Apple → **Ten Mac**: **Układ: Apple M…** oznacza Apple
Silicon, **Procesor: Intel…** oznacza Intel.

1. Otwórz plik `.dmg` i przeciągnij **Findy** do **Aplikacji** (Applications).
2. Otwórz Findy. macOS pokaże *Nie otwarto „Findy”* (albo *nie można otworzyć, ponieważ
   Apple nie może tego sprawdzić*). Kliknij **Gotowe**. Nie klikaj *Przenieś do kosza*.
3. Otwórz **Ustawienia systemowe → Prywatność i ochrona**. Przewiń w dół do sekcji
   **Ochrona**. Obok *Zablokowano „Findy”, aby chronić Twój Mac* kliknij **Otwórz mimo
   to**.
4. Wpisz hasło i jeszcze raz kliknij **Otwórz mimo to**. Findy się uruchomi.

W macOS 14 i starszych możesz też kliknąć Findy w Aplikacjach z klawiszem Control →
**Otwórz** → **Otwórz**.

Jeśli macOS pisze *„Findy” jest uszkodzony i nie można go otworzyć*, otwórz **Terminal**,
uruchom to polecenie i znów otwórz Findy:

```bash
xattr -dr com.apple.quarantine /Applications/Findy.app
```

Otwórz Findy raz w ten sposób, zanim podłączysz asystenta AI (MCP). Do tego czasu macOS
nie pozwala też asystentowi uruchomić Findy.

### Windows

1. Pobierz `Findy-Setup-x.y.z.exe`. Jeśli przeglądarka ostrzega, że ten plik nie jest
   często pobierany, wybierz **Zachowaj** (Edge: **⋯ → Zachowaj → Pokaż więcej → Zachowaj
   mimo to**).
2. Uruchom plik. W oknie *System Windows ochronił Twój komputer* (SmartScreen) kliknij
   **Więcej informacji**, a potem **Uruchom mimo to**.
3. Przejdź kroki instalatora. Potem uruchom Findy z menu Start.

### Linux

- **AppImage:** nadaj plikowi prawo do uruchamiania i uruchom go:
  ```bash
  chmod +x Findy-*.AppImage
  ./Findy-*.AppImage
  ```
  W Ubuntu 22.04 i nowszych AppImage potrzebuje FUSE 2:
  `sudo apt install libfuse2` (Ubuntu 24.04: `sudo apt install libfuse2t64`).
- **Pakiet Debian / Ubuntu:** `sudo apt install ./findy_x.y.z_amd64.deb`.


← [Wróć do README](../../README.pl.md)
