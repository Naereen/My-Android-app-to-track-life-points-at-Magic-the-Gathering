# TODO / Roadmap

## "Small" improvements to the usability of the app

- [x] Maximize to full screen on mobile devices: the "window" should take all the screen space, especially on the left/right sides

- [x] Write a `manifest.json` for PWA support
  - [x] It had MANY issues! I think I fixed them all now.
  - [x] Test installing the PWA on desktop (Windows, macOS, Linux)
  - [x] Test installing the PWA on Android devices
  - [ ] Test installing the PWA on Apple devices (iOS/iPadOS) - TODO: need an Apple device for that!

- [x] Turn off the zooming on mobile devices (pinch to zoom), as it breaks the UI
- [x] Turn off the feature of mobile devices to shut down the screen after some time of inactivity (it breaks the immersive experience of the games)

- [x] Turn off the feature of mobile devices to show the "download / share / print" menu on long click (it breaks the UI)

- [x] Reduce the vertical space taken by the "ressources" menu (mana/storm symbols) ==> NOPE
- [x] Increase the font-size of the names of the players, especially on mobile devices

## State saving improvements

- [x] Save the state in the local storage of the browser, so that reloading the page does not reset everything
  - [x] Save the app settings (number of players, starting life total, etc.)
  - [x] Save the players state (life totals, commander damage, etc.)
  - [ ] Add a button to reset the local storage (clear saved settings and game state), FIXME: need to center it on the bottom of the settings menu

## DONE - Translating the app : 5 languages so far!

- [x] Add internationalization (i18n) support
  - [x] English (default)
  - [x] French (my native language)

- [x] Add more languages, if the technical framework is working well:
  - [x] Spanish
  - [x] German
  - [x] Italian

## Bugs fixing:

- [x] Fix the bug where the "download / share / print" long click menu appear (on mobile devices)
- [ ] Fix a weird bug: when clicking fast on +1/-1 buttons, sometimes the life points are not updated correctly or the update continue to happen after releasing the button (worse with long clicks)

## Player status and visualization improvements

- [x] Dead player icon: when a player is dead (life <= 0 or poison >= 10), show a skull icon next to their name, and gray out their life total
  - [x] Allow a player to not be dead if life is below 0 (e.g. with a "Lich's Mastery" effect), by adding a toggle for that feature, in the player edit dialog (playerwise)

- [x] Replace all `window.confirm` calls with custom modal dialogs integrated in the app, much nicer and prettier

- [ ] Add support for the poison counter
  - [ ] A +1/-1 button for poison counter, in the "commander damage" section, like the Lifetap app
  - [ ] Show the poison counter next to the life total, as soon as it is > 0
  - [ ] When poison counter >= 10, the player is dead (show the skull icon, gray out their life total)

- [ ] Implement a way to know whose turn it is
  - [ ] A button to advance to the next player's turn
  - [ ] A button to go back to the previous player's turn
  - [ ] Show the current player's turn somewhere on the screen

- [ ] Improve the visibility of the "current player" (the one whose turn it is)
  - [ ] Maybe a glowing border around their panel?
  - [ ] Maybe a different background color?
  - [ ] Maybe an icon next to their name?

- [ ] Implement two layouts for the four-players mode:
  - [ ] A "1 / 2 / 1" layout, if players are seated on a round table
  - [ ] A "2 x 2" layout, if players are seated on opposite sides of a rectangular table (classic mode for Two-Headed Giant, it is already implemented)

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
  - [x] With a simple color picker : one color of mana, and that's it
  - [x] If clicking on a color after it is already selected, deselect it (go back to default background)
  - [x] With a color gradient picker: two colors of mana, gradient between the two

- [ ] Even better custom Player backgrounds
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
