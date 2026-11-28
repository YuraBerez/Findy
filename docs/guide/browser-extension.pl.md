# Dodaj ofertę pracy z przeglądarki

[English](browser-extension.md) · [Українською](browser-extension.uk.md)

Rozszerzenie przeglądarki Findy jednym kliknięciem dodaje ofertę, którą widzisz, do Twojej
tablicy. Na stronie oferty kliknij przycisk Findy na pasku narzędzi (albo naciśnij
**Alt+Shift+F**). Rozszerzenie pokaże stanowisko, firmę i link ze strony. W razie potrzeby
popraw je i kliknij **Dodaj do Findy**. Aplikacja trafi do etapu „Wysłano”. Jeśli ta oferta
jest już w Findy, rozszerzenie pokaże jej etap.

Rozszerzenie działa też na stronach, które wymagają logowania, na przykład na LinkedIn, bo
czyta stronę tak, jak ją widzisz. Łączy się tylko z aplikacją Findy na Twoim komputerze:
nie wysyła żadnych zapytań do sieci i nie zapisuje kopii strony.

Rozszerzenia nie ma jeszcze w sklepach przeglądarek. Zainstaluj je z wydania:

1. Zainstaluj Findy 0.7.0 lub nowszy i otwórz go raz. Wtedy Findy podaje Twoim
   przeglądarkom, gdzie jest.
2. Pobierz `Findy-<wersja>-browser-extension.zip` z
   [najnowszego wydania](https://github.com/YuraBerez/findy/releases/latest) i rozpakuj go
   do folderu, którego nie usuniesz (przeglądarka wczytuje rozszerzenie z tego folderu).
   W nowych wersjach Findy plik dla Twojej wersji otwiera
   **⋯ → Ustawienia… → Rozszerzenie przeglądarki**.
3. Wczytaj je w przeglądarce:

**Chrome, Edge, Brave, Opera, Vivaldi**

1. Otwórz `chrome://extensions` (Edge: `edge://extensions`, Brave: `brave://extensions`).
2. Włącz **Developer mode** (tryb dewelopera).
3. Kliknij **Load unpacked** i wybierz rozpakowany folder.
4. Kliknij ikonę puzzla na pasku narzędzi i przypnij Findy.

**Firefox**

1. Pobierz `Findy-<wersja>-browser-extension-Firefox.zip` z tego samego wydania.
2. Otwórz `about:debugging#/runtime/this-firefox` i kliknij **Load Temporary Add-on…**.
3. Wybierz plik zip.

Firefox usuwa tymczasowy dodatek po zamknięciu, więc po każdym ponownym uruchomieniu
wczytujesz go jeszcze raz. Stała instalacja pojawi się razem z podpisaną wersją.

**Jeśli rozszerzenie pisze, że nie znaleziono Findy:** otwórz Findy raz i spróbuj ponownie.
Przeglądarki z Flatpak lub Snap nie mogą uruchomić Findy, więc rozszerzenie w nich nie
działa.

Szczegóły o prywatności: [PRIVACY.md](../../PRIVACY.md) (po angielsku).

← [Wróć do README](../../README.pl.md)
