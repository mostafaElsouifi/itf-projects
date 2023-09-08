const fs = require("fs");
const XLSX = require("xlsx");
const delay = (seconds) => {
  return new Promise((resolve) => {
    setTimeout(resolve, seconds * 1000);
  });
};

const writeToJson = (data, fileName) => {
  const jsonData = JSON.stringify(data, null, 2);
  fs.writeFile(fileName, jsonData, (err) => {
    if (err) {
      console.error("Error writing to the file:", err);
    } else {
      console.log("Data has been written to", fileName);
    }
  });
};

const writeToCsv = (data, fileName, sheetName = "data") => {
  try {
    const newWB = XLSX.utils.book_new();
    const newWS = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(newWB, newWS, sheetName);
    XLSX.writeFile(newWB, fileName);
    console.log("Data has been written to", fileName);
  } catch (e) {
    console.log(e);
  }
};

const readJsonFile = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      console.error(`NO '${filePath}' file.`);
    } else {
      console.error(`An error occurred: ${error.message}`);
    }
    return null;
  }
};
const deleteFile = (filePath) => {
  try {
    fs.unlinkSync(filePath);
    console.log(`File '${filePath}' successfully deleted.`);
  } catch (error) {
    console.error(`An error occurred: ${error.message}`);
  }
};
module.exports = { delay, writeToJson, writeToCsv, readJsonFile, deleteFile };
