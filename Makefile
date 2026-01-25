# Makefile to send this to my website
SHELL=/usr/bin/env /bin/bash

all:	build send

build:
	npm run build

send:	send_zamok
send_zamok:
	CP --exclude=.git ./build/ ${Szam}publis/My-Android-app-to-track-life-points-at-Magic-the-Gathering/
