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
#	-npx cap build --keystorepath ~/naereen.jks --keystorepass naereenapk --keystorealias key0 --keystorealiaspass naereenapk  --signing-type jarsigner --androidreleasetype APK android
	-npx cap build --keystorepath ~/naereen.jks --keystorepass naereenapk --keystorealias key0 --keystorealiaspass naereenapk  --signing-type apksigner --androidreleasetype APK android
	cp -v --update=older android/app/build/outputs/apk/release/app-release.apk android/app/build/outputs/apk/release/app-release-signed.apk

run-android:
	npx cap run android

install-android-studio-debug-apk:
	@echo "TODO: finish to work on the chosen technology to build an .apk and install it on my phone."
	adb install android/app/debug/app-debug.apk

install-android-studio-apk:
	@echo "TODO: finish to work on the chosen technology to build an .apk and install it on my phone."
	adb install android/app/release/app-release.apk

install-capacitor-apk:
	@echo "TODO: finish to work on the chosen technology to build an .apk and install it on my phone."
	adb install android/app/build/outputs/apk/release/app-release-signed.apk

dev:
	npm run dev

send:	send_zamok
send_zamok:
	CP --exclude=.git ./build/ ${Szam}publis/My-Android-app-to-track-life-points-at-Magic-the-Gathering/
	CP --exclude=.git ./android/app/build/outputs/apk/release/app-release-signed.apk ${Szam}publis/My-Android-app-to-track-life-points-at-Magic-the-Gathering/app.apk
