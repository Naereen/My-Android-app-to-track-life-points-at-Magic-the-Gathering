# Makefile to send this to my website
SHELL=/usr/bin/env /bin/bash

all:	build-web send

build:	build-web build-apk

build-web:
	npm run build

build-apk:
	npx tauri android build

install-apk:
	adb install src-tauri/gen/android/app/build/outputs/apk/debug/app-debug.apk

dev:
	npm run dev

send:	send_zamok
send_zamok:
	CP --exclude=.git ./build/ ${Szam}publis/My-Android-app-to-track-life-points-at-Magic-the-Gathering/
