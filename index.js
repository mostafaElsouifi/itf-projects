require("dotenv").config();
const puppeteer = require("puppeteer");
const { delay, writeToJson, writeToCsv, readJsonFile } = require("./helpers");
const { MAIN_URL } = process.env;

const getDetailPages = async (page, pagesUrls) => {
  let allData = [];
  let lastUrlNumber = 0;
  // read if there is data tracking error
  const detailPages_tracking = readJsonFile("detailPages_tracking.json");
  if (detailPages_tracking) {
    allData = detailPages_tracking.allData;
    lastUrlNumber = detailPages_tracking.lastUrlNumber;
  }
  let i = lastUrlNumber;
  try {
    for (i; i < pagesUrls.length; i++) {
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
      console.log(`done collecting data of url : ${i}`);
    }
    return allData;
  } catch (e) {
    if (i === 0) return;
    const errorTraking = {
      lastUrlNumber: i,
      allData: allData,
    };
    console.log(`error happen in url : ${i}`);
    writeToJson(errorTraking, "detailPages_tracking.json");
  }
};

const getPagesLinks = async (page, url) => {
  let allPagesUrls = [];
  let lastPageNum;
  let pageNumber;
  // check if there is pages error happen
  const pagesTracking = readJsonFile("pages_tracking.json");
  if (pagesTracking && pagesTracking.pageNumber === pagesTracking.lastPageNum)
    return pagesTracking.urls;

  if (!pagesTracking) {
    pageNumber = 1;
    await page.goto(url);
    await delay(2);
    await page.click(".last.arrow");
    await delay(2);
    lastPageNum = await page.$eval(
      ".page.selected span",
      (el) => el.textContent
    );
  }
  if (pagesTracking) {
    lastPageNum = pagesTracking.lastPageNum;
    pageNumber = pagesTracking.pageNumber;
    allPagesUrls = pagesTracking.urls;
  }

  // loop through all pages to get all detail pages links
  let i = pageNumber;
  try {
    for (i; i <= lastPageNum; i++) {
      console.log(`in progress with page number : ${i}`);

      await page.goto(`${MAIN_URL}&Page=${i}`);
      await delay(2);
      const hrefs = await page.$$eval("#searchResultTbl .rowlink", (links) =>
        links.map((link) => {
          return link.href;
        })
      );
      allPagesUrls.push(...hrefs);
    }
    const pagesTraking = {
      pageNumber: i,
      lastPageNum: +lastPageNum,
      urls: allPagesUrls,
    };
    console.log("done : collecting all pages");

    writeToJson(pagesTraking, "pages_tracking.json");
  } catch (e) {
    const pagesTraking = {
      pageNumber: i,
      lastPageNum: +lastPageNum,
      urls: allPagesUrls,
    };
    console.log(`error in page number ${i}`);

    writeToJson(pagesTraking, "pages_tracking.json");
  }
  return allPagesUrls;
};

const init = async () => {
  console.log(
    "started at: " +
      new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );

  const browser = await puppeteer.launch({
    headless: false,
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
    console.log(e);
  }

  await browser.close();
};

init().then(() => {
  console.log(
    "finished at: " +
      new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
});
