# adblock-detector-service

Lightweight frontend adblock detector based on real ad and bait script requests.

This library detects ad blockers by attempting to load known ad-related resources and analyzing whether they are blocked by the browser.

## Installation

```bash
npm install adblock-detector-service
```

## Usage
```
import adBlockDetector from 'adblock-detector-service'

const report = await adBlockDetector()

console.log(report.isAdBlockDetected)
```

## Configuration
```
type InputSettings = {
    isBaitDomainsOnly?: boolean
    isAdsDomainsOnly?: boolean
    percentage?: number
    requestsLimit?: number
}
```

### Parameters
* isBaitDomainsOnly (default: false) \
Use only bait (custom) domains for detection.
Useful for browsers with aggressive blocking (e.g. Brave, Firefox).
* isAdsDomainsOnly (default: false) \
Use only real ad provider domains (Google, Facebook, etc.).
* percentage (default: 0.5) \
Detection threshold.
If the ratio of blocked requests exceeds this value → adblock is detected.
* requestsLimit (default: 5) \
Number of domains to test.
Lower values → faster but less reliable detection. Max. value - 5

Notes:
* All the parameters are optional
* You can't use isBaitDomainsOnly and isAdsDomainsOnly parameters with true value at the same time

## Example
```
await adBlockDetector({
    percentage: 0.6,
    requestsLimit: 3
})
```
## Response
```
type IReport = {
    domainsTest: {
        domain: string
        isBlocked: boolean
    }[]
    blockPercent: number
    isAdBlockDetected: boolean
}
```
---

### Example response

```ts
{
  domainsTest: [
    { domain: 'https://.../prebid.js', isBlocked: true },
    { domain: 'https://.../adapter.js', isBlocked: true },
    { domain: 'https://.../banner.js', isBlocked: false }
  ],
  blockPercent: 0.66,
  isAdBlockDetected: true
}
```
## How it works

The detector dynamically injects script tags pointing to:
1. 	Well-known ad provider domains (Google Ads, Facebook, etc.)
2. 	Bait endpoints designed to mimic ad-related routes

If a request fails (onerror), it is treated as blocked.

Detection result is based on the ratio of blocked requests.

Browser behavior
*	Brave and Firefox use bait domains by default
*	Other browsers use real ad domains

## Why this library

Many existing adblock detectors rely on outdated techniques or are easily bypassed.

This implementation:
*	uses real network requests instead of heuristics
*	works without fetch/CORS limitations
*	does not depend on DOM bait elements
*	is minimal and framework-agnostic