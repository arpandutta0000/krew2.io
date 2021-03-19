const urlObject = new URL(location);
let version = `v2.0.3`;

let swPath, host;

if (urlObject.searchParams.get(`swPath`)) swPath = urlObject.searchParams.get(`swPath`);
else {
    if (urlObject.searchParams.get(`version`)) version = urlObject.searchParams.get(`version`);
    host = urlObject.searchParams.get(`swJSHost`)
        ? `https://${urlObject.searchParams.get(`swJSHost`)}`
        : `https://sdki.truepush.com/sdk/`;

    swPath = `${host + version}/sw.js`;
}

importScripts(swPath);
