# Makefile to send this to my website
SHELL=/usr/bin/env /bin/bash

all:	build-web send

build:	build-web sync-apk

build-web:
	npm run build
	rm -rvf build/icons/icon-1024x1024.png

sync-apk:
	npx cap sync
build-apk:	sync-apk
	npx cap build android

run-android:
	npx cap run android

install-apk:
	@echo "TODO: find a technology to build an .apk and install it on my phone."
	adb install android/app/debug/app-debug.apk

dev:
	npm run dev

send:	send_zamok
send_zamok:
	CP --exclude=.git ./build/ ${Szam}publis/My-Android-app-to-track-life-points-at-Magic-the-Gathering/
