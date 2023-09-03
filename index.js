require("dotenv").config();
const puppeteer = require("puppeteer");
const { delay, writeToJson, writeToCsv } = require("./helpers");
const { MAIN_URL } = process.env;

const getDetailPages = async (page, pagesUrls) => {
  const allData = [];
  for (let i = 0; i < pagesUrls.length; i++) {
    await page.goto(pagesUrls[i]);

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
  return allData;
};

const getPagesLinks = async (page, url) => {
  const allPagesUrls = [];
  await page.goto(url);
  await delay(2);
  // await page.waitForSelector(".last.arrow");
  await page.click(".last.arrow");
  await delay(2);
  // await page.waitForSelector(".page.selected");
  const lastPageNum = await page.$eval(
    ".page.selected span",
    (el) => el.textContent
  );

  // loop through all pages to get all detail pages links
  for (let i = 1; i <= lastPageNum; i++) {
    await page.goto(`${MAIN_URL}&Page=${i}`);
    await delay(2);
    const hrefs = await page.$$eval("#searchResultTbl .rowlink", (links) =>
      links.map((link) => link.href)
    );
    allPagesUrls.push(...hrefs);
  }
  return allPagesUrls;
};

const init = async () => {
  console.log(
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
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

  const links = await getPagesLinks(page, MAIN_URL);
  const allData = await getDetailPages(page, links);

  writeToCsv(allData, "data.xlsx");
  writeToJson(allData, "data.json");

  console.log(
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
  await browser.close();
};
init().then(() => console.log("done"));
