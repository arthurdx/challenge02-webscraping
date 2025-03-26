const puppeter = require("puppeteer");
const { writeFileSync } = require("fs");

const BATCH_SIZE = 5;

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

initScraping = async () => {
  const startTime = Date.now();
  let browser;
  browser = await puppeter.launch({ headless: true });
  await setLocation(browser);
  const results = [];
  let count = 1;
  while (true) {
    const batchResult = await runBatch(browser, count);
    if (batchResult.every((result) => result === null)) {
      break;
    }
    results.push(batchResult);
    count += BATCH_SIZE;
  }

  writeFileSync("output.json", JSON.stringify(results, null, 2));
  console.log(`Tempo total de execução: ${(Date.now() - startTime) / 1000}s`);
  if (browser) await browser.close();
};

runBatch = async (browser, start) => {
  const startTime = Date.now();
  const promisesArray = [];
  for (let i = start; i <= start + BATCH_SIZE; i++) {
    promisesArray.push(scrapePage(browser, i));
  }
  const batchResult = await Promise.all(promisesArray);
  console.log(
    `Tempo de execução da leva ${start === 1 ? start : (start + BATCH_SIZE - 1)/BATCH_SIZE}: ${(Date.now() - startTime) / 1000}s`
  );
  return batchResult.flat();
};

setLocation = async (browser) => {
  const page = await browser.newPage();

  await page.goto("https://mercado.carrefour.com.br/,", {
    waitUntil: "domcontentloaded",
    timeout: 40000,
  });

  await page.setViewport({ width: 1920, height: 1080 });

  await page.locator('button[title= "Insira seu CEP"]')?.click();

  await page.locator('button[role = "tab"] ::-p-text(Retire na Loja)')?.click();

  await page.locator('select[id = "selectCity"]')?.click();

  await page.select('select[id = "selectCity"]', "Piracicaba");

  await page.locator('article[role = "presentation"]')?.click();
};

const scrapePage = async (browser, currentPage) => {
  let page;

  try {
    page = await browser.newPage();

    await page.goto(
      "https://mercado.carrefour.com.br/bebidas?page=" + currentPage,
      {
        waitUntil: "networkidle2",
        timeout: 40000,
      }
    );

    await page.setViewport({ width: 1920, height: 1080 });

    const content = await page.evaluate(() => {
      const products = [];
      const productElements = document.querySelectorAll(
        'section[data-testid="store-product-card-content"]'
      );
      for (const productElement of productElements) {
        const productName = productElement.querySelector("h3")?.innerText;
        const productPrice = productElement.querySelector(
          'span[data-test-id="price"]'
        )?.innerText;
        const productOnSale = productElement.querySelector(".mb-2")?.innerText;

        products.push({
          title: productName,
          price: productPrice,
          onSale: productOnSale ? productOnSale : false,
        });
      }
      return products;
    });

    return content;
  } catch (error) {
    console.error(`Erro na página ${currentPage}`);
    return null;
  } finally {
    if (page) await page.close();
  }
};

initScraping();
