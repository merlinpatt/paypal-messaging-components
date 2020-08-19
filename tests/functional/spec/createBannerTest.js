/* istanbul ignore file */
import { configureToMatchImageSnapshot } from 'jest-image-snapshot';

const toMatchImageSnapshot = configureToMatchImageSnapshot({
    failureThresholdType: 'percent',
    failureThreshold: 0.002,
    customDiffConfig: {
        threshold: 0.05
    }
});

expect.extend({ toMatchImageSnapshot });

const getConfigStrParts = (obj, keyPrefix = '') => {
    return Object.entries(obj).reduce((accumulator, [key, val]) => {
        const totalKey = keyPrefix === '' ? key : `${keyPrefix}.${key}`;
        if (typeof val === 'object') return [...accumulator, ...getConfigStrParts(val, totalKey)];

        // Do not include the markup url in filename
        if (key === 'markup') return accumulator;

        return [...accumulator, `${totalKey}-${val}`];
    }, []);
};

const getConfigStr = obj =>
    getConfigStrParts(obj)
        .sort()
        .join('_');

const getTestNameParts = (locale, { account, style: { layout, ...style } }) => {
    const styleStr = getConfigStr(style);

    return [locale, account, layout, styleStr];
};

const waitForBanner = async timeout => {
    try {
        await page.waitForFunction(
            async () => {
                const iframe = document.querySelector('[data-pp-id] iframe');
                if (iframe) {
                    const iframeBody = iframe.contentWindow.document.body;
                    const banner = iframeBody.querySelector('.message__container');
                    return banner && banner.clientHeight > 0;
                }

                const legacyBanner = document.querySelector('div[role="button"].message');
                return legacyBanner && legacyBanner.clientHeight > 0;
            },
            {
                polling: 10,
                timeout
            }
        );

        // Give time for fonts to load after banner is rendered
        await new Promise(resolve => setTimeout(resolve, 500));
    } catch (e) {
        console.log('waitForBanner error', e); // eslint-disable-line no-console
    }
};

export default function createBannerTest(locale, testPage = 'banner.html') {
    return (viewport, config) => {
        const testNameParts = getTestNameParts(locale, config);
        test(testNameParts.slice(-1)[0], async () => {
            await page.setViewport(viewport);
            page.on('console', consoleObj => {
                const text = consoleObj.text();
                if (text.startsWith('[WDS]') || text.includes('::req') || text.includes('::res')) {
                    return;
                }
                console.log(text); // eslint-disable-line no-console
            });

            // nav done when 0 network connections for at least 500 ms
            const waitForNavPromise = page.waitForNavigation({ waitUntil: 'networkidle0' });
            await page.goto(`http://localhost.paypal.com:8080/${testPage}?config=${JSON.stringify(config)}`);
            await waitForNavPromise;

            await waitForBanner(10000);

            const image = await page.screenshot(
                {
                    clip: {
                        ...viewport,
                        x: 0,
                        y: 0
                    }
                },
                3
            );

            const customSnapshotIdentifier = `${testNameParts.pop()}-${viewport.width}`;
            expect(image).toMatchImageSnapshot({
                customSnapshotsDir: ['./tests/functional/snapshots', ...testNameParts].join('/'),
                customSnapshotIdentifier
            });
        });
    };
}
