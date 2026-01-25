# TODO / Roadmap

## "Small" improvements to the usability of the app

- [x] Maximize to full screen on mobile devices: the "window" should take all the screen space, especially on the left/right sides

- [x] Write a `manifest.json` for PWA support
  - [x] It had MANY issues! I think I fixed them all now.
  - [x] Test installing the PWA on desktop (Windows, macOS, Linux)
  - [x] Test installing the PWA on Android devices
  - [ ] Test installing the PWA on Apple devices (iOS/iPadOS)

- [x] Turn off the zooming on mobile devices (pinch to zoom), as it breaks the UI
- [x] Turn off the feature of mobile devices to shut down the screen after some time of inactivity (it breaks the immersive experience of the games)

- [ ] Turn off the feature of mobile devices to show the "download / share / print" menu on long click (it breaks the UI)

## State saving improvements

- [ ] Save the state in the local storage of the browser, so that reloading the page does not reset everything

## Translating the app

- [ ] Add internationalization (i18n) support
  - [x] English (default)
  - [x] French (my native language)

- [ ] Add more languages, if the technical framework is working well:
  - [ ] Spanish
  - [ ] German
  - [ ] Italian

## Bugs fixing:

- [ ] Fix the bug where the "download / share / print" long click menu appear (on mobile devices)
- [ ] Fix a weird bug: when clicking fast on +1/-1 buttons, sometimes the life points are not updated correctly or the update continue to happen after releasing the button (worse with long clicks)

## Player status improvements

- [ ] Dead player icon
  - [ ] Allow a player to not be dead if life is below 0 (e.g. with a "Lich's Mastery" effect)

## Successfully build a working apk file

- [ ] Configure the build process to generate a working apk file
- [ ] Set up deployment to GitHub Releases so that the latest apk file is always available for download
- [ ] Test it on my devices
- [ ] Publish it as a beta on the Google Play Store

## Better menus and dialogs

- [ ] Confirmation menus overhaul
  - [ ] Improve the "reset game" dialog
  - [ ] Improve the "new player" dialog
  - [ ] Improve the "edit player" dialog

- [ ] Implement the "settings" dialog
- [ ] Implement the "about" dialog

---------------------------------------------------------------------------

## New features

- [ ] Custom Player backgrounds
  - [ ] With a simple color picker : one color of mana, and that's it
  - [ ] With a color gradient picker
  - [ ] With a card search to pick a card as background
  - [ ] Allow partners and backgrounds and all pairs of legendary commanders

- [ ] Player damage type tracking
- [ ] Multiplayer game modes (Two-Headed Giant, Commander, etc.)

---------------------------------------------------------------------------

## Dream features, they'll never happen!

- [ ] Game history and undo functionality
- [ ] Enhanced statistics and analytics
- [ ] Cloud sync and backup
- [ ] Customizable themes and UI options

## On the development side

- [ ] Tests? I literally have no idea how to write tests for a SvelteKit app.
