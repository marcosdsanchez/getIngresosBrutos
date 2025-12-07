import 'dotenv/config';
import { chromium, type Browser, type Page } from 'playwright';

/**
 * Parse command line arguments
 */
function parseArgs(): { fromDate: Date; toDate: Date } {
    const args = process.argv.slice(2);
    let fromDateStr: string | null = null;
    let toDateStr: string | null = null;

    // Parse arguments
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--help' || args[i] === '-h') {
            console.log(`
Usage: npm start -- [options]

Options:
  --from <date>    Start date in DD/MM/YYYY format (default: first day of previous month)
  --to <date>      End date in DD/MM/YYYY format (default: last day of previous month)
  --help, -h       Show this help message

Examples:
  npm start -- --from 01/11/2025 --to 30/11/2025
  npm start -- --from 15/11/2025
  npm start
            `);
            process.exit(0);
        } else if (args[i] === '--from' && i + 1 < args.length) {
            fromDateStr = args[i + 1] ?? null;
            i++;
        } else if (args[i] === '--to' && i + 1 < args.length) {
            toDateStr = args[i + 1] ?? null;
            i++;
        }
    }

    // Default to previous month if not specified
    const today = new Date();
    const previousMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastDayOfPreviousMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    let fromDate: Date;
    let toDate: Date;

    // Parse from date
    if (fromDateStr) {
        const match = fromDateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (!match) {
            console.error(`Error: Invalid --from date format. Expected DD/MM/YYYY, got: ${fromDateStr}`);
            process.exit(1);
        }
        const [, day, month, year] = match;
        fromDate = new Date(parseInt(year!), parseInt(month!) - 1, parseInt(day!));
    } else {
        fromDate = previousMonthDate;
    }

    // Parse to date
    if (toDateStr) {
        const match = toDateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (!match) {
            console.error(`Error: Invalid --to date format. Expected DD/MM/YYYY, got: ${toDateStr}`);
            process.exit(1);
        }
        const [, day, month, year] = match;
        toDate = new Date(parseInt(year!), parseInt(month!) - 1, parseInt(day!));
    } else {
        toDate = lastDayOfPreviousMonth;
    }

    // Validate date range
    if (fromDate > toDate) {
        console.error('Error: --from date must be before or equal to --to date');
        process.exit(1);
    }

    return { fromDate, toDate };
}

(async () => {
    // 1. Parse command line arguments
    const { fromDate, toDate } = parseArgs();

    console.log(`Date Range: ${fromDate.toLocaleDateString('es-AR')} to ${toDate.toLocaleDateString('es-AR')}`);

    // 2. Validation
    const dni = process.env.ING_BRUTOS_DOCUMENTO;
    const password = process.env.ING_BRUTOS_PASSWORD;
    const user = process.env.ING_BRUTOS_USER;
    const accountTarget = process.env.ING_BRUTOS_ACCOUNT_NUMBER;

    if (!dni || !password || !user || !accountTarget) {
        console.error('Error: Please set ING_BRUTOS_DOCUMENTO, ING_BRUTOS_PASSWORD, ING_BRUTOS_USER, and ING_BRUTOS_ACCOUNT_NUMBER environment variables in your .env file.');
        process.exit(1);
    }

    // 3. Browser Setup
    const browser: Browser = await chromium.launch({ headless: false }); // Headless: false for debugging/visibility
    const context = await browser.newContext();
    const page: Page = await context.newPage();

    try {
        console.log('Navigating to login page...');
        await page.goto('https://onlinebanking.bancogalicia.com.ar/login');

        // 3. Login Flow
        console.log('Handling login form...');

        // Fill DNI
        await page.fill('input#DocumentNumber', dni);

        // Trigger next state (simulate user interaction)
        await page.keyboard.press('Tab');
        // await page.click('body'); // Removed to avoid clicking ads/banners

        // Wait for User or Password field to become visible
        // We look for either, as behavior might depend on the account type
        try {
            // If USER is required/exists, wait for it
            if (user) {
                await page.waitForSelector('input#UserName', { state: 'visible', timeout: 5000 });
                await page.fill('input#UserName', user);
            }

            // Wait for password
            await page.waitForSelector('input#Password', { state: 'visible', timeout: 5000 });
            await page.fill('input#Password', password);

            // Submit
            console.log('Submitting credentials...');
            await page.click('text=Iniciar sesión'); // Try text selector

            // Wait for navigation
            await page.waitForLoadState('networkidle');
            console.log('Login attempt finished.');

            // EXPLORATION: Print all visible links and buttons
            console.log('--- Dashboard Links ---');
            const links = await page.getByRole('link').allInnerTexts();
            const buttons = await page.getByRole('button').allInnerTexts();
            console.log('Links:', links.filter(l => l.trim().length > 0));
            console.log('Buttons:', buttons.filter(b => b.trim().length > 0));

            // Check for specific keywords
            const keywords = ['Comprobantes', 'Retenciones', 'Impuestos', 'Ingresos Brutos', 'Descargar'];
            for (const word of keywords) {
                const count = await page.getByText(word).count();
                if (count > 0) {
                    console.log(`FOUND KEYWORD: "${word}" (${count} times)`);
                }
            }

            // NAVIGATION: Find specific account
            console.log('Current URL:', page.url());
            console.log(`Searching for account: ${accountTarget}`);

            // Try to find the element containing the account number
            const accountElement = page.getByText(accountTarget);

            // Prevent new tab: Remove target="_blank" from all links
            await page.evaluate(() => {
                const links = document.querySelectorAll('a[target="_blank"]');
                links.forEach(link => link.removeAttribute('target'));
                console.log(`Sanitized ${links.length} links to prevent new tabs.`);
            });

            if (await accountElement.count() > 0) {
                console.log('Found account element! Clicking...');
                await accountElement.first().click();
            } else {
                console.log(`Account "${accountTarget}" not found directly. Searching for "Cuentas" container...`);
                // await page.screenshot({ path: 'dashboard_accounts.png' });

                // Fallback: Click "Cuentas" to list them if they are not all visible
                const cuentasLink = page.getByRole('link', { name: 'Cuentas' }).first();
                if (await cuentasLink.isVisible()) {
                    await cuentasLink.click();
                    console.log('Clicked "Cuentas". Waiting...');
                    await page.waitForLoadState('networkidle');

                    // Try searching again
                    // Try searching again
                    const accountElementRetry = page.getByText(accountTarget);
                    if (await accountElementRetry.count() > 0) {
                        await accountElementRetry.first().click();
                        console.log('Found account after clicking "Cuentas".');
                    } else {
                        console.error('Account still not found. Dumping visible text to debug:');
                        const bodyText = await page.innerText('body');
                        console.log(bodyText.substring(0, 1000)); // Print first 1000 chars
                        throw new Error('Account not found');
                    }
                }
            }

            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(5000); // Give it a good wait

            console.log('Post-click URL:', page.url());

            // Debug logging removed for cleaner output
            // const bodyPreview = await page.innerText('body');
            // console.log('--- Body Text Preview ---', ...);

            // Now look for "Todos los movimientos" or "Movimientos" again
            const movimientosBtn = page.getByText('Todos los movimientos').first();
            const movimientosLink = page.getByText('Movimientos').first();

            // Prevent new tab before clicking movements
            await page.evaluate(() => {
                const links = document.querySelectorAll('a[target="_blank"]');
                links.forEach(link => link.removeAttribute('target'));
            });

            if (await movimientosBtn.isVisible()) {
                console.log('Clicking "Todos los movimientos"...');
                await movimientosBtn.click();
                await page.waitForLoadState('networkidle');
            } else if (await movimientosLink.isVisible()) {
                console.log('Clicking "Movimientos"...');
                await movimientosLink.click();
                await page.waitForLoadState('networkidle');
            } else {
                console.log('"Todos los movimientos" / "Movimientos" button not visible. We might be on the summary page.');
            }

            // Wait for table/list
            await page.waitForTimeout(5000);

            // OPTIMIZATION: Click "Egresos de dinero" to filter
            console.log('Looking for "Egresos de dinero" filter...');
            const egresosFilter = page.getByText('Egresos de dinero').first();
            if (await egresosFilter.isVisible()) {
                console.log('Applying "Egresos de dinero" filter...');
                await egresosFilter.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(3000); // Wait for list to update
            } else {
                console.log('"Egresos de dinero" filter not found, proceeding with all transactions.');
            }

            // Scraping and Calculation
            console.log('Scraping transactions...');

            // We'll parse the full text of the movements list to avoid selector fragility
            const containerText = await page.evaluate(() => {
                const listContainer = document.querySelector('div[class*="list"], div[class*="grid"]');
                return (listContainer as HTMLElement)?.innerText || document.body.innerText;
            });

            // Regex pattern to match: Date \n Description \n Amount
            // Example: 28/11/2025 \n Ing. Brutos S/ Cred \n -$10.035,36
            const transactionPattern = /(\d{2}\/\d{2}\/\d{4})[\r\n]+([^\r\n]+)[\r\n]+([-\$0-9.,]+)/g;

            let match;
            let totalRetention = 0;
            const foundTransactions = [];

            console.log('--- Processing Transactions ---');

            while ((match = transactionPattern.exec(containerText)) !== null) {
                const [fullMatch, dateStr, description, amountStr] = match;

                if (!dateStr || !description || !amountStr) continue;

                // Parse Date
                const [day, month, year] = dateStr.split('/').map(Number);
                const transDate = new Date(year!, month! - 1, day);

                // Filter by Attributes
                const isInDateRange = (transDate >= fromDate && transDate <= toDate);
                const isTaxRetention = /Ing\.? Brutos S\/? Cred/i.test(description);

                if (isInDateRange && isTaxRetention) {
                    // Parse Amount: -$10.035,36 -> -10035.36
                    const cleanAmount = amountStr.replace(/[$.]/g, '').replace(',', '.');
                    const value = Math.abs(parseFloat(cleanAmount)); // Use absolute value for total

                    totalRetention += value;
                    foundTransactions.push({ date: dateStr, description, amount: value });
                    console.log(`[MATCH] ${dateStr} - ${description} - $${value.toFixed(2)}`);
                }
            }

            console.log('-------------------------------');
            console.log(`Summary for ${fromDate.toLocaleDateString('es-AR')} to ${toDate.toLocaleDateString('es-AR')}:`);
            console.log(`Total "Ing. Brutos s/ cred": $${totalRetention.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`);

            // Visual Evidence removed per user request
            // await page.screenshot({ path: 'final_calculation.png' });

            // Final Output for User
            console.log(`\n>>> TOTAL RETENTIONS (${fromDate.toLocaleDateString('es-AR')} to ${toDate.toLocaleDateString('es-AR')}): $${totalRetention.toFixed(2)} <<<\n`);





        } catch (e) {
            console.warn('Could not complete login flow (fields not visible?):', e);
        }



    } catch (error) {
        console.error('An error occurred:', error);
        console.error('An error occurred:', error);
        // await page.screenshot({ path: 'error.png' });
    } finally {
        await browser.close();
    }
})();
