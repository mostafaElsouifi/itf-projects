const puppeteer = require("puppeteer");

const delay = (seconds) => {
  return new Promise((resolve) => {
    setTimeout(resolve, seconds * 1000);
  });
};

const getData = async () => {
  console.log(
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );

  const allPagesUrls = [];
  const allData = [];
  const browser = await puppeteer.launch({
    headless: "new",
    ignoreDefaultArgs: [
      "--enable-automation",
      "--disable-extensions",
      "--disable-default-apps",
      "--disable-component-extensions-with-background-pages",
    ],
  });

  const page = await browser.newPage();
  await page.goto(
    "https://www.itf.gov.hk/en/project-search/search-result/index.html?isAdvSearch"
  );
  await delay(2);
  await page.waitForSelector(".last.arrow");
  await page.click(".last.arrow");
  await delay(2);
  await page.waitForSelector(".page.selected");
  const lastPageNum = await page.$eval(
    ".page.selected span",
    (el) => el.textContent
  );

  // loop through all pages to get all detail pages links
  for (let i = 1; i <= 100; i++) {
    await page.goto(
      `https://www.itf.gov.hk/en/project-search/search-result/index.html?isAdvSearch=&Page=${i}`
    );
    await delay(2);
    const hrefs = await page.$$eval("#searchResultTbl .rowlink", (links) =>
      links.map((link) => link.href)
    );
    allPagesUrls.push(...hrefs);
  }
  // loop through each page to get data
  for (let i = 0; i < allPagesUrls.length; i++) {
    await page.goto(allPagesUrls[i]);
    await delay(1);
    const data = await page.evaluate(() => {
      const obj = {};
      const allRows = document.querySelectorAll("#projectProfile tr");
      for (let i = 0; i < allRows.length; i++) {
        obj[allRows[i].querySelector("th").textContent.trim()] = allRows[i]
          .querySelector("td")
          .textContent.trim();
      }

      return obj;
    });
    allData.push(data);
  }
  console.log(
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
  return allData;
};
getData().then();
