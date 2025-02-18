call npm install --save=false
mkdir external
copy node_modules\webextension-polyfill\dist\browser-polyfill.min.js external\browser-polyfill.min.js
web-ext build --overwrite-dest
