require("dotenv").config();
const puppeteer = require("puppeteer");
const { delay, writeToJson, writeToCsv } = require("./helpers");
const { MAIN_URL } = process.env;

const getDetailPages = async (page, pagesUrls) => {
  const allData = [];
  let i = 0;
  try {
    for (i; i < pagesUrls.length; i++) {
      await page.goto(pagesUrls[i].url);

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
      console.log(`done collecting data of url : ${i}`);
    }
    return allData;
  } catch (e) {
    if (i === 0) return;
    console.log(`error happen in url : ${i}`);
    writeToJson(allData, "data_scraped.json");
  }
};

const getPagesLinks = async (page, url) => {
  const allPagesUrls = [];
  await page.goto(url);
  await delay(2);
  await page.click(".last.arrow");
  await delay(2);
  const lastPageNum = await page.$eval(
    ".page.selected span",
    (el) => el.textContent
  );
  // loop through all pages to get all detail pages links
  let i = 1;
  try {
    for (i; i <= lastPageNum; i++) {
      console.log(`in progress with page number : ${i}`);

      await page.goto(`${MAIN_URL}&Page=${i}`);
      await delay(2);
      const hrefs = await page.$$eval("#searchResultTbl .rowlink", (links) =>
        links.map((link) => {
          return { url: link.href };
        })
      );
      allPagesUrls.push(...hrefs);
    }
  } catch (e) {
    console.log(`error in page number ${i}`);

    writeToJson(allPagesUrls, "pages_urls.json");
  }
  return allPagesUrls;
};

const init = async () => {
  console.log(
    "started at: " +
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
  try {
    const links = await getPagesLinks(page, MAIN_URL);

    const allData = await getDetailPages(page, links);
    if (!allData) return;
    writeToCsv(allData, "data.xlsx");
    writeToJson(allData, "data.json");
  } catch (e) {
    console.log("Error happen ");
  }

  await browser.close();
};

init().then(() => {
  console.log(
    "finished at: " +
      new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
});
