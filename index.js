const puppeter = require('puppeteer');
const { writeFileSync } = require('fs');

const sleep = (ms) => {
    return new Promise(resolve => 
        setTimeout(resolve, ms));
}

initScraping = async () => {
    const startTime = Date.now();
    const browser = await puppeter.launch({headless: true});
    const promisesArray = [];
    await setLocation(browser);
    for(let i = 1; i <= 10; i++){
        promisesArray.push(scrapePage(browser, i));
        console.log(promisesArray);
    }
    const results =  await Promise.all(promisesArray);
    console.log(results.flat());
    console.log('Execution time: ', (Date.now() - startTime)/1000, 's');
    await browser.close();
    writeFileSync('output.json', JSON.stringify(results.flat(), null, 2));
    
}

setLocation = async (browser) => {

    const page = await browser.newPage();

    await page.goto('https://mercado.carrefour.com.br/,', {
        waitUntil: 'domcontentloaded',
        timeout: 40000
    });

    await page.setViewport({width: 1920, height: 1080});

    await page.locator('button[title= "Insira seu CEP"]')?.click();

    await page.locator('button[role = "tab"] ::-p-text(Retire na Loja)')?.click();

    await page.locator('select[id = "selectCity"]')?.click();

    await page.select('select[id = "selectCity"]', 'Piracicaba');

    await page.locator('article[role = "presentation"]')?.click();

}

const scrapePage = async (browser, currentPage) => {

    let page;

    try{
    page = await browser.newPage();

    await page.goto('https://mercado.carrefour.com.br/bebidas?page=' + currentPage, {
        waitUntil: 'networkidle2',
        timeout: 40000
    });
    
    await page.setViewport({width: 1920, height: 1080});

    const content = await page.evaluate(() => {
        const products = [];
        const productElements = document.querySelectorAll('section[data-testid="store-product-card-content"]');
        for(const productElement of productElements){
            const productName = productElement.querySelector('h3')?.innerText;
            const productPrice = productElement.querySelector('span[data-test-id="price"]')?.innerText;
            const productOnSale = productElement.querySelector('.mb-2')?.innerText;

            products.push({
                "title": productName,
                "price": productPrice,
                "onSale": productOnSale ? productOnSale : false
            });
        }
        return products;
    });

    return content;
    } catch (error) {
        console.error(`Erro na página ${currentPage}`);
        return null;
    }finally{
        if(page) await page.close();
    }
}

initScraping();