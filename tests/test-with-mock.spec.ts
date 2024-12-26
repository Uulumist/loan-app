import {test, expect} from '@playwright/test';

const routeToMock = '**/api/loan-calc?amount=*&period=*'

test('open and verify default calculation (using body)', async ({page}) => {
    const valueMock = 11.22
    await page.route(routeToMock, async (route) => {
        const mockResponse = {
            paymentAmountMonthly: valueMock,
        };
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockResponse),
        });
    });
    await page.goto('http://localhost:3000/small-loan');
    await page.waitForResponse(routeToMock)
    const amountText = await page
        .getByTestId('ib-small-loan-calculator-field-monthlyPayment')
        .textContent();
    expect(amountText).toBe(valueMock + ' €');
});

test('open and verify bad request', async ({page}) => {
    await page.route(routeToMock, async (route) => {
        await route.fulfill({
            status: 400
        });
    });
    await page.goto('http://localhost:3000/small-loan');
    await page.waitForResponse(routeToMock)
    const errorText = await page
        .getByTestId('id-small-loan-calculator-field-error')
        .textContent();
    expect(errorText).toBe('Oops, something went wrong');
});

test('open and verify internal server error', async ({page}) => {
    await page.route(routeToMock, async (route) => {
        await route.fulfill({
            status: 500
        });
    });
    const responsePromise = page.waitForResponse(routeToMock);
    await page.goto('http://localhost:3000/small-loan');
    await responsePromise
    const errorText = await page
        .getByTestId('id-small-loan-calculator-field-error')
        .textContent();
    expect(errorText).toBe('Oops, something went wrong');
});

test('verify response with code 200 and no body', async ({page}) => {
    await page.route(routeToMock, async (route) => {
        await route.fulfill({
            status: 200
        });
    });
    const responsePromise = page.waitForResponse(routeToMock);
    await page.goto('http://localhost:3000/small-loan');
    await responsePromise
    const amountText = await page
        .getByTestId('ib-small-loan-calculator-field-monthlyPayment')
        .textContent();
    expect(amountText).toBe(undefined + ' €');
});

test('verify response with code 200 and invalid key for monthly value', async ({page}) => {
    const valueMock = 11.22
    await page.route(routeToMock, async (route) => {
        const mockResponse = {
            invalidKey: valueMock,
        };
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockResponse),
        });
    })
    const responsePromise = page.waitForResponse(routeToMock);
    await page.goto('http://localhost:3000/small-loan');
    await responsePromise
    const amountText = await page
        .getByTestId('ib-small-loan-calculator-field-monthlyPayment')
        .textContent();
    expect(amountText).toBe(undefined + ' €');
});
