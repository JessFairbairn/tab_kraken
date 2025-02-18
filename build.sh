#!/bin/bash
npm install
mkdir external
cp node_modules/webextension-polyfill/dist/browser-polyfill.min.js external/browser-polyfill.min.js
web-ext build --overwrite-dest
