import { promises as fs } from "fs";
import path from "path";

const outputFilename = "./need-urls.txt";
const outputFilename2 = "./need-urls.json";
const basePath = `/Users/xuyongheng/Projects/Mbyte/bestmovietime.com/server`;

// Function to check if either path exists
async function checkPathExists(pagePath) {
  const htmlPath = pagePath + ".html";
  const indexPath = path.join(pagePath, "index.html");

  try {
    await fs.access(htmlPath);
    return true;
  } catch (error) {
    try {
      await fs.access(indexPath);
      return true;
    } catch (error) {
      return false;
    }
  }
}

async function processUrls() {
  try {
    const data = await fs.readFile("./miss-urls.json", "utf-8");
    const urlValues = JSON.parse(data);
    let num = 0;
    const allLinks = new Set(); // Set to store all links
    let res = ``;

    for (let i = 0; i < urlValues.length; i++) {
      const urlItem = urlValues[i];
      const urlObj = new URL(urlItem);
      let pagePath = path.join(basePath, "pages", urlObj.pathname);

      if (!(await checkPathExists(pagePath))) {
        // If neither file exists, log the URL
        num += 1;
        res += urlItem + "\n";
        allLinks.add(urlItem);
      }
    }

    console.log("新增数量：", num);

    // Append the result to a file
    await fs.writeFile(outputFilename, res, { encoding: "utf-8", flag: "a" });
    await fs.writeFile(
      outputFilename2,
      JSON.stringify(Array.from(allLinks), null, 2)
    );
    console.log("写入成功...");
  } catch (error) {
    console.error("Error processing URLs:", error);
  }
}

processUrls();
