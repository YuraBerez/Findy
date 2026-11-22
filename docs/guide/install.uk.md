# Встановлення Findy

[English](install.md)

Як встановити Findy через менеджер пакетів, перевірити завантаження й відкрити
застосунок уперше.

## Встановлення через Homebrew (macOS)

```bash
brew tap yuraberez/findy
brew trust yuraberez/findy
brew install --cask findy
```

`brew trust` потрібен один раз: Homebrew завантажує cask зі сторонніх tap лише після
того, як ви їм довірилися. Оновлення: `brew upgrade --cask findy`.
[Tap](https://github.com/YuraBerez/homebrew-findy) переходить на кожен опублікований
реліз протягом доби. Перший запуск усе одно потребує кроків нижче.

## Встановлення через Scoop (Windows)

```powershell
scoop bucket add findy https://github.com/YuraBerez/scoop-findy
scoop install findy
```

Оновлення: `scoop update findy`. [Bucket](https://github.com/YuraBerez/scoop-findy)
встановлює портативну версію для вашого користувача, без прав адміністратора (починаючи
з Findy 0.4.1).

## Перевірка завантаження

Кожен реліз (починаючи з 0.4.1) містить `SHA256SUMS.txt` із контрольною сумою кожного
файлу, а GitHub фіксує, який workflow і коміт зібрали кожен із них:

```bash
shasum -a 256 -c SHA256SUMS.txt --ignore-missing      # macOS, Linux
gh attestation verify Findy-x.y.z-macOS-Apple-Silicon.dmg --repo YuraBerez/findy
```

У Windows: `Get-FileHash Findy-Setup-x.y.z.exe` і порівняйте з `SHA256SUMS.txt`.

## Перший запуск: збірки поки не підписані

Сертифікати для підпису коду платні, тому збірки не підписані. Під час першого
відкриття macOS і Windows показують попередження. Збірки зроблено з відкритого
коду в GitHub Actions. Ці кроки потрібні лише один раз.

### macOS

Тип свого Mac видно в меню Apple → **Про цей Mac**: **Чип: Apple M…** означає
Apple Silicon, **Процесор: Intel…** означає Intel.

1. Відкрийте файл `.dmg` і перетягніть **Findy** у **Програми** (Applications).
2. Відкрийте Findy. macOS покаже *«Findy» не відкрито* (або *не вдається
   відкрити, бо Apple не може перевірити*). Натисніть **Готово**. Не натискайте
   *Перемістити в Смітник*.
3. Відкрийте **Системні параметри → Приватність і безпека**. Прокрутіть до
   розділу **Безпека**. Біля *«Findy» заблоковано для захисту вашого Mac*
   натисніть **Усе одно відкрити**.
4. Введіть пароль і ще раз натисніть **Усе одно відкрити**. Findy запуститься.

У macOS 14 і старіших можна також клацнути Findy у Програмах із Control →
**Відкрити** → **Відкрити**.

Якщо macOS пише *«Findy» пошкоджено, і його не можна відкрити*, відкрийте
**Термінал**, виконайте команду й знову відкрийте Findy:

```bash
xattr -dr com.apple.quarantine /Applications/Findy.app
```

Відкрийте Findy цими кроками хоча б раз, перш ніж підключати AI-асистента (MCP):
доти macOS не дає й асистентові запустити Findy.

### Windows

1. Завантажте `Findy-Setup-x.y.z.exe`. Якщо браузер попереджає, що файл
   завантажують нечасто, оберіть **Зберегти** (Edge: **⋯ → Зберегти → Показати
   більше → Усе одно зберегти**).
2. Запустіть файл. У вікні *Windows захистив ваш ПК* (SmartScreen) натисніть
   **Докладніше**, потім **Усе одно запустити**.
3. Пройдіть кроки інсталятора й запустіть Findy з меню «Пуск».

### Linux

- **AppImage:** зробіть файл виконуваним і запустіть:
  ```bash
  chmod +x Findy-*.AppImage
  ./Findy-*.AppImage
  ```
  В Ubuntu 22.04 і новіших AppImage потребує FUSE 2:
  `sudo apt install libfuse2` (Ubuntu 24.04: `sudo apt install libfuse2t64`).
- **Пакет Debian / Ubuntu:** `sudo apt install ./findy_x.y.z_amd64.deb`.


← [Назад до README](../../README.uk.md)
