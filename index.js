const puppeter = require('puppeteer');
const { writeFileSync } = require('fs');
const { timeout } = require('puppeteer');

const sleep = (ms) => {
    return new Promise(resolve => 
        setTimeout(resolve, ms));
}

initScraping = async () => {
    const startTime = Date.now();
    const browser = await puppeter.launch({headless: false});
    const promisesArray = [];
    for(let i = 1; i <= 5; i++){
        promisesArray.push(scrapePage(browser, i));
    }
    const results =  await Promise.all(promisesArray);
    console.log(results.flat());
    console.log('Execution time: ', Date.now() - startTime);
    await browser.close();
    writeFileSync('output.json', JSON.stringify(results.flat(), null, 2));
    
}

const scrapePage = async (browser, currentPage) => {

    const page = await browser.newPage();

    await page.goto('https://mercado.carrefour.com.br/bebidas?page=' + currentPage, {
        waitUntil: 'domcontentloaded',
        timeout: 15000
    });
    
    await page.setViewport({width: 1920, height: 1080});

    //recarregando a página, o menu para aceitar os cookies esconde o botão de inserir o CEP

    // await page.reload({waitUntil: 'networkidle2', timeout: 15000});

    await page.locator('button[title= "Insira seu CEP"]')?.click();

    await page.locator('button[role = "tab"] ::-p-text(Retire na Loja)')?.click();

    await page.locator('select[id = "selectCity"]')?.click();

    await page.select('select[id = "selectCity"]', 'Piracicaba');

    await page.locator('article[role = "presentation"]')?.click();

    await sleep(30);

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
    

    
    
    
}

initScraping();