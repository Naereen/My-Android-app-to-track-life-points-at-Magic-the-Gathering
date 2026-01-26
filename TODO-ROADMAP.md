# TODO / Roadmap

This file is a life list of features to implement, bugs to fix, and improvements to make to the app.

Instead of using a proper issue tracker (e.g. GitHub Issues), I prefer to keep everything in this single file, easier to manage offline for a small personal project like this one.

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
  - [x] Add a button to reset the local storage (clear saved settings and game state)

## DONE - Translating the app : 5 languages so far!

- [x] Add internationalization (i18n) support
  - [x] English (default)
  - [x] French (my native language)

- [x] Add more languages, if the technical framework is working well:
  - [x] Spanish
  - [x] German
  - [x] Italian

- [x] Add a language selection menu in the settings dialog
  - [x] Reduce the size ot the labels of each language

## Bugs fixing:

- [x] Fix the bug where the "download / share / print" long click menu appear (on mobile devices)
- [ ] Fix a weird bug: when clicking fast on +1/-1 buttons, sometimes the life points are not updated correctly or the update continue to happen after releasing the button (worse with long clicks) - FIXME: I couldn't reproduce this bug anymore...

- [x] When throwing a die, the result is displayed too close to the die icon, spacen then a bit more!

## Player status and visualization improvements

- [x] Dead player icon: when a player is dead (life <= 0 or poison >= 10), show a skull icon next to their name, and gray out their life total
  - [x] Allow a player to not be dead if life is below 0 (e.g. with a "Lich's Mastery" effect), by adding a toggle for that feature, in the player edit dialog (playerwise)
  - [x] Allow negative life totals! (global setting)

- [x] Replace all `window.confirm` calls with custom modal dialogs integrated in the app, much nicer and prettier

- [x] Add a « about section » at the bottom of the settings menu, with:
  - [x] App version, name of the author, license
  - [x] Huge thank you to Michael Bourkas for the Lifetap app, which this is a personnal clone of
  - [x] Link to the GitHub repository
  - [ ] ?? Link to the Google Play Store page (when published)
  - [ ] ?? Link to a feedback form (Google Forms or similar)

- [x] Keep the small "medal" which indicates who started the game, during all the game (not only at the beginning)

- [x] Add a way to directly set the life total to a specific value, in the player pane

- [x] Improve the text contrast of the life total number, especially on mobile devices (hard to read sometimes) : add a white shadow, and make it bold

- [x] In the PlayerDataModal.svelte, allow to scroll all the window, but keep the top always visible (fixed position). Do this by allowing the modal content to scroll, but not the modal header.
- [ ] In the PlayerDataModal.svelte, add a third virtual "tab" (first two are Backgrounds and Colors), the "status_effects" should live in a separate pseudo tab view, to save some space?

- [ ] In the PlayerDataModal.svelte, when selecting a card from Scryfall as background, after a search success, add a "Choose at random" button to pick a random card from the search results (instead of having to pick one by one). Also translate into fr/es/it/de the "Choose at random" text.

- [x] Add a small section on the bottom of each player panel to show the current status effects on that player
  - [x] E.g. "Poisoned X/10", "Monarch", commander damage from the opponents, etc.
  - [x] Maybe even use small icons for that?
  - [x] List of boolean status effects (e.g. "Monarch"): Monarch, Initiative, Ascend, Day/Night, K.O.
  - [x] List of numeric status effects (e.g. "Poisoned 3/10"): Energy, Experience, Poison, Rad, Command Tax
  - [ ] TODO: improve this section visually, make it prettier (nicer icons, better layout, etc.)

- [ ] Improve the following boolean status effects, as only one player can have them at a time: Monarch Initiative. So when one player gets it, remove it from all the other players automatically.

- [ ] Harder to track: implement the Commander Damage tracker (from each opponent).
  - [ ] make this section visually appealing, make it prettier (nicer icons, better layout, etc.)

- [x] Add support for the poison counter: can you die to them?
  - [x] A +1/-1 button for poison counter, in the "commander damage" section, like the Lifetap app
  - [x] Add a way to increment/decrement poison counter with clicks on some buttons in the player panel (like for life total)
  - [x] Show the poison counter next to the life total, as soon as it is > 0
  - [x] When poison counter >= 10, the player is dead (show the skull icon, gray out their life total)

- [ ] Implement a way to know whose turn it is
  - [ ] A button to advance to the next player's turn
  - [ ] A button to go back to the previous player's turn
  - [ ] Show the current player's turn somewhere on the screen

  [ ] Implement (after that) a timer for each turn (like in Lifetap app)
  - [ ] A way to set the timer duration (global setting)
  - [ ] Show the remaining time for the current player's turn
  - [ ] Sound an alarm when the time is up

- [ ] Improve the visibility of the "current player" (the one whose turn it is)
  - [ ] Maybe a glowing border around their panel?
  - [ ] Maybe a different background color?
  - [ ] Maybe an icon next to their name?

- [x] Implement two layouts for the four-players mode:
  - [x] A "1 / 2 / 1" layout, if players are seated on a round table
  - [x] A "2 x 2" layout, if players are seated on opposite sides of a rectangular table (classic mode for Two-Headed Giant mode, it is already implemented)

- [ ] (much later, I never play with 6 players) Implement two layouts for the six-players mode:
  - [ ] A "|::|" layout (one long | player on the left and the right, and in the middle like a Two-Headed Giant layout), if players are seated on a round table
  - [ ] A ":::" layout (2 lines of 3 columns), if players are seated on opposite sides of a rectangular table (classic mode for Emperor mode, it is already implemented)

## Successfully build a working apk file

> Let's use [CapacitorJS.com](https://capacitorjs.com/) for that!

- [ ] Configure the build process to generate a working apk file
- [ ] Set up deployment to GitHub Releases so that the latest apk file is always available for download
- [ ] Test it on my devices
- [ ] Publish it as a beta on the Google Play Store



## Better menus and dialogs

- [x] Confirmation menus overhaul
  - [x] Improve the "reset game" dialog
  - [x] Improve the "new player" dialog
  - [x] Improve the "edit player" dialog

- [x] Implement the "settings" dialog
- [x] Implement the "about" dialog

- [ ] Improve the spacing of the mana/storm count : reduce the size of the mana symbols ? NOPE, not important.

---------------------------------------------------------------------------

## Very cool features from "Lifetap" app to implement

- [x] Custom Player backgrounds
  - [x] With a simple color picker : one color of mana, and that's it
  - [x] If clicking on a color after it is already selected, deselect it (go back to default background)
  - [x] With a color gradient picker: two colors of mana, gradient between the two

- [x] Even better custom Player backgrounds
  - [x] With a card search to pick a card as background
  - [x] Align the top of the illustration with the top of background area (crop the card image if needed)
  - [x] Works fine for cards with different illustrations for the same name and edition
  - [x] Add a "clear background" button to go back to default background; also when picking a color, if clicking again on a color while an image background had been selected before, remove the image background and go back to the color background
  - [x] When loading the app without any settings saved (new fresh session) or when resetting the settings, randomly assign a background to each player (a simple random choice of two colors)
    - [ ] Later: randomly assign a background image from a predefined list of cards (e.g. the Planeswalker from MTG)
  - [ ] Allow partners and backgrounds and all pairs of legendary commanders

- [ ] Commander damage type tracking
- [ ] Multiplayer game modes (Two-Headed Giant, Commander, etc.)

## Variants already existing in Lifetap but not yet implemented here

- [ ] PlaneChase support (background changes every turn or on a click)
- [ ] Archenemy support (extra damage tracking)

---------------------------------------------------------------------------

## New features to implement

Random ideas:

- [ ] Sound effects on button clicks (life up/down, commander damage up/down, etc.)
- [ ] Haptic feedback on button clicks (life up/down, commander damage up/down, etc.). TODO: Needs testing on mobile devices. I wasn't convinced by the results yet on my Android phone.

Nope:

- [ ] ~~Customizable button sizes (small, medium, large)~~
- [ ] ~~Customizable layout options (compact mode, expanded mode)~~
- [x] ~~Night mode / dark theme~~
- [ ] ~~Customizable fonts (font family, font size)~~

## Variants to implement here, not existing in Lifetap

- [ ] Treachery support (hidden role to check once when the game starts, and hidden after that)
- [ ] 4 Seasons emblems support (track the common emblem, and show it on the board somewhere)
- [ ] Vanguard support (special cards that modify starting life total and starting hand, and give static abilities)

---------------------------------------------------------------------------

## Dream features, they'll never happen!

- [ ] Game history and undo functionality
- [ ] Enhanced statistics and analytics, à la Mythic.Tools
- [ ] Cloud sync and backup, à la Mythic.Tools
- [ ] Multiplayer online mode (connect with friends over the internet)
- [ ] Customizable themes and UI options

## On the development side

- [ ] Tests? I literally have no idea how to write tests for a SvelteKit app.
