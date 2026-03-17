declare global {
    interface Navigator {
        brave?: {
            isBrave: () => Promise<boolean>
        }
    }
}

export interface ITestDomains {
    valid?: string
    invalid: string[]
}

export interface ISettings {
    isBaitDomainsOnly: boolean
    isAdsDomainsOnly: boolean
    percentage: number
    requestsLimit: number
}

export interface IReport {
    domainsTest: {
        domain: string
        isBlocked: boolean
    }[]
    blockPercent: number
    isAdBlockDetected: boolean
}

const DEFAULT_SETTINGS: Required<ISettings> = {
    isBaitDomainsOnly: false,
    isAdsDomainsOnly: false,
    percentage: 0.5,
    requestsLimit: 5
}

export type InputSettings = Partial<ISettings>

const adsDomains: ITestDomains = {
    invalid: [
        'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
        'https://connect.facebook.net/en_US/fbevents.js',
        'https://google-analytics.com/analytics.js',
        'https://c.amazon-adsystem.com/aax2/apstag.js',
        'https://yandex.ru/ads/system/context.js'
    ]
}

const baitDomains: ITestDomains = {
    valid: 'https://probe.ping-domain.site/ping',
    invalid: [
        'https://probe.ping-domain.site/prebid/prebid.js',
        'https://probe.ping-domain.site/prebid/prebid.min.js',
        'https://probe.ping-domain.site/prebid/adapters.js',
        'https://probe.ping-domain.site/prebid/banner.js',
        'https://probe.ping-domain.site/prebid/adscript.js'
    ]
}

function applyScript(url: string, isPing = false, timeout = 3000) {
    return new Promise<boolean>((resolve) => {
        const script = document.createElement('script')
        let finished = false
        let timerId: number | undefined

        const finish = (result: boolean) => {
            if (!finished) {
                finished = true
                window.clearTimeout(timerId)
                script.onload = null
                script.onerror = null
                script.remove()
                resolve(result)
            }
        }
        script.src = url
        script.async = true
        script.onload = () => finish(isPing)
        script.onerror = () => finish(!isPing)
        document.head.appendChild(script)
        timerId = window.setTimeout(() => finish(!isPing), timeout)
    })
}

async function makeReport(domains: ITestDomains, settings: ISettings) {
    const slicedInvalidDomains = domains.invalid.slice(0, settings.requestsLimit)
    let pingIsOk = true
    if (domains.valid) {
        pingIsOk = await applyScript(domains.valid, true)
        if (!pingIsOk) {
            throw new Error('adblock-detector-service: Ping request failed. Please try again')
        }
    }
    const testResults = await Promise.all(
        slicedInvalidDomains.map((domain) => applyScript(domain))
    )
    const report: IReport['domainsTest'] = testResults.map((result, index) => ({
        domain: slicedInvalidDomains[index],
        isBlocked: result
    }))
    return report
}

function inputSettingsCheck(settings?: InputSettings) {
    if (settings?.isAdsDomainsOnly && settings?.isBaitDomainsOnly) {
        throw new Error('adblock-detector-service: Both' +
            'isAdsDomainsOnly and isBaitDomainsOnly cannot be selected at the same time')
    }
    if (settings?.requestsLimit && settings.requestsLimit > adsDomains.invalid.length && settings.requestsLimit > baitDomains.invalid.length) {
        console.warn('adblock-detector-service: requestsLimit is greater than available test domains. All available domains will be used')
    }
}

export default async function adBlockDetector(settings?: InputSettings): Promise<IReport> {
    inputSettingsCheck(settings)
    const finalSettings: Required<ISettings> = {
        ...DEFAULT_SETTINGS,
        ...settings
    }

    let actualDomainList: ITestDomains

    if (finalSettings.isAdsDomainsOnly) {
        actualDomainList = adsDomains
    } else if (finalSettings.isBaitDomainsOnly) {
        actualDomainList = baitDomains
    } else {
        const isBraveBrowser = (await navigator.brave?.isBrave?.()) ?? false
        const isFirefoxBrowser = navigator.userAgent.includes('Firefox')
        actualDomainList = isBraveBrowser || isFirefoxBrowser ? baitDomains : adsDomains
    }

    const domainsTest = await makeReport(actualDomainList, finalSettings)
    const balance = domainsTest.reduce((acc, currentRequest) => {
        if (currentRequest.isBlocked) {
            acc.blocked += 1
        }
        acc.total += 1
        return acc
    }, {
        blocked: 0,
        total: 0
    })
    const blockPercent = balance.blocked / balance.total
    const isAdBlockDetected = blockPercent >= finalSettings.percentage
    return {
        domainsTest,
        blockPercent,
        isAdBlockDetected
    }
}
