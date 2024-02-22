import { glob } from "glob";
import { promises as fs } from "fs";
import _fs from "fs";
import path from "path";
import cheerio from "cheerio";
import pLimit from "p-limit";
import ProgressBar from "progress";
import https from "https";

const searchDirectory =
  "/Users/xuyongheng/Projects/Mbyte/bestmovietime.com/server/**/*.html";
const limit = pLimit(100); // Limit the number of concurrent file processes

const outputFilename = "./resources-1-image.json";
const outputFilename1 = "./resources-1-css.json";
const outputFilename2 = "./resources-1-js.json";

const logoPath = `/Users/xuyongheng/Projects/Mbyte/bestmovietime.com/server/static`;

const allImages = new Set(); // Set to store all links
const allCSSs = new Set(); // Set to store all links
const allJSs = new Set(); // Set to store all links

await (async () => {
  const files = await glob(searchDirectory);

  // Initialize the progress bar
  const bar = new ProgressBar("[:bar] :percent :etas", {
    total: files.length,
    width: 40,
    complete: "=",
    incomplete: " ",
  });

  await Promise.all(
    files.map((file) =>
      limit(async () => {
        const content = await fs.readFile(file, "utf8");
        const $ = cheerio.load(content);

        $("img").each(function () {
          const src = $(this).attr("src");
          const original = $(this).attr("data-original");

          // 排除 base64 格式的图片，并正确处理逻辑判断
          if (
            src &&
            (src.startsWith("/") ||
              src.startsWith("https://image.chilimovie.com/region2") ||
              src.startsWith("https://image.chilimovie.com") ||
              src.startsWith("https://static.chilimovie.com") ||
              src.startsWith("https://www.chilimovie.com"))
          ) {
            allImages.add(
              src.startsWith("/") ? `https://www.chilimovie.com${src}` : src
            );
          }
          if (
            original &&
            (original.startsWith("/") ||
              original.startsWith("https://image.chilimovie.com") ||
              original.startsWith("https://static.chilimovie.com") ||
              original.startsWith("https://www.chilimovie.com"))
          ) {
            allImages.add(
              original.startsWith("/")
                ? `https://www.chilimovie.com${original}`
                : original
            );
          }
        });

        $(`link[rel="shortcut icon"]`).each(function () {
          const href = $(this).attr("href");
          // 排除 base64 格式的图片，并正确处理逻辑判断
          if (
            href &&
            !href.startsWith("//") &&
            (href.startsWith("/") ||
              href.startsWith("https://www.chilimovie.com"))
          ) {
            allImages.add(
              href.startsWith("/") ? `https://www.chilimovie.com${href}` : href
            );
          }
        });

        $(`link[rel="stylesheet"]`).each(function () {
          const href = $(this).attr("href");
          // 排除 base64 格式的图片，并正确处理逻辑判断
          if (
            href &&
            !href.startsWith("//") &&
            (href.startsWith("/") ||
              href.startsWith("https://www.chilimovie.com"))
          ) {
            allCSSs.add(
              href.startsWith("/") ? `https://www.chilimovie.com${href}` : href
            );
          }
        });

        $("script[src]").each(function () {
          const src = $(this).attr("src");
          // 排除 base64 格式的图片，并正确处理逻辑判断
          if (
            src &&
            !src.startsWith("//") &&
            (src.startsWith("/") ||
              src.startsWith("https://www.chilimovie.com"))
          ) {
            allJSs.add(
              src.startsWith("/") ? `https://www.chilimovie.com${src}` : src
            );
          }
        });

        // Update the progress bar for each file processed
        bar.tick();
      })
    )
  );

  // Write the extracted links to a file
  await fs.writeFile(
    outputFilename,
    JSON.stringify(Array.from(allImages), null, 2)
  );
  await fs.writeFile(
    outputFilename1,
    JSON.stringify(Array.from(allCSSs), null, 2)
  );
  await fs.writeFile(
    outputFilename2,
    JSON.stringify(Array.from(allJSs), null, 2)
  );

  console.log("Processing complete. Output saved to:", outputFilename);
})();

async function downloadResources() {
  for (const item of allCSSs) {
    // 使用 URL 对象解析 downloadUrl 并提取路径
    const parsedUrl = new URL(item);
    // 去除查询字符串，只保留路径名
    const relativePath = parsedUrl.pathname;

    const filePath = path.join(logoPath, relativePath);

    if (await fileExists(filePath)) {
      console.log(` - skipping: ${item}`);
      continue;
    }

    const dirPath = path.dirname(filePath);
    if (!(await fileExists(dirPath))) {
      await fs.mkdir(dirPath, { recursive: true });
    }

    try {
      await download(item, filePath);
      console.log(` - Downloaded: ${item}`);
    } catch (error) {
      console.error(`Error downloading ${item}: ${error.message}`);
    }
  }
}

function download(url, filepath) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode === 200) {
          const stream = _fs.createWriteStream(filepath);
          res.pipe(stream);
          stream.on("finish", () => {
            stream.close(() => {
              resolve();
            });
          });
        } else {
          res.resume();
          reject(
            new Error(`Request Failed With a Status Code: ${res.statusCode}`)
          );
        }
      })
      .on("error", (e) => {
        reject(e);
      });
  });
}

async function fileExists(path) {
  try {
    await fs.access(path, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

// downloadResources();
