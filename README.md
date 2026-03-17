# adblock-detector-service

Lightweight frontend adblock detector based on real ad and bait script requests.

This library detects ad blockers by attempting to load known ad-related resources and analyzing whether they are blocked by the browser.

## Installation

```bash
npm install adblock-detector-service
```

## USAGE
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
## How it works

The detector dynamically injects script tags pointing to:
1. 	well-known ad provider domains (Google Ads, Facebook, etc.)
2. 	bait endpoints designed to mimic ad-related routes

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