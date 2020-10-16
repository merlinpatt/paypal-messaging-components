import selectors from '../../utils/selectors';
import logTestName from '../../utils/logTestName';
import modalSnapshot from '../../utils/modalSnapshot';

/**
 * Runs inside modalTextCalc and modalFlexCalc for the DE locale.
 */

export const nonQualErrorMsg = ({ account, viewport, groupString }) => async () => {
    const testNameParts = 'non-qualifying ezp amount error message';
    logTestName({ account, viewport, groupString, testNameParts });

    const elementModal = await page.$(selectors.banner.iframe);

    const modalFrame = await elementModal.contentFrame();
    await page.waitFor(2000);
    await modalFrame.waitForSelector(selectors.calculator.calcForm);
    await page.waitFor(1000);
    await modalFrame.click(selectors.calculator.calcInput, { clickCount: 3 });
    await page.waitFor(1000);
    await modalFrame.type(selectors.calculator.calcInput, '2');
    await modalFrame.click(selectors.button.closeBtn);
    await modalFrame.waitForSelector(selectors.calculator.calcInstructions);
    await page.waitFor(2000);
    const calcInstructions = await modalFrame.evaluate(
        () => document.querySelector(selectors.calculate.calcInstructions).innerHTML
    );
    expect(calcInstructions).toContain('Geben Sie einen Betrag zwischen 199,00€ und 5.000,00€ ein.');
    await page.waitFor(800);

    await modalSnapshot(`${groupString} ${testNameParts}`, viewport, account);
};

export const updateFinanceTerms = ({ account, viewport, groupString }) => async () => {
    const testNameParts = 'DE update finance terms';
    logTestName({ account, viewport, groupString, testNameParts });

    await page.waitForFunction(() =>
        Array.from(document.querySelectorAll(selectors.banner.iframe)).find(
            el => el.parentElement.parentElement.style.display !== 'none'
        )
    );
    const elementModal = await page.$(selectors.banner.iframe);
    const modalFrame = await elementModal.contentFrame();
    await modalFrame.waitForSelector(selectors.modal.container, {
        visible: true
    });
    await page.waitFor(2000);
    await modalFrame.waitForSelector(selectors.calculator.calc, {
        visible: true
    });
    await modalFrame.click(selectors.calculator.calcInput, { clickCount: 3 });
    await modalFrame.type(selectors.calculator.calcInput, '650');
    await modalFrame.click(selectors.button.closeBtn);
    await page.waitFor(800);

    await modalSnapshot(`${groupString} ${testNameParts}`, viewport, account);
};

export const deModalContentAndCalc = ({ account, viewport, groupString }) => async () => {
    const testNameParts = 'ezp message content';
    logTestName({ account, viewport, groupString, testNameParts });

    const elementModal = await page.$(selectors.banner.iframe);
    const modalFrame = await elementModal.contentFrame();
    await modalFrame.waitForSelector(selectors.calculator.calc);

    expect(await modalFrame.evaluate(() => document.querySelector(selectors.calculator.calc))).toBeTruthy();

    const calcTitle = await modalFrame.evaluate(() => document.querySelector(selectors.calculator.calcTitle).innerText);

    expect(calcTitle).toContain('Monatliche Raten berechnen');
    await page.waitFor(800);

    await modalSnapshot(`${groupString} ${testNameParts}`, viewport, account);
};
