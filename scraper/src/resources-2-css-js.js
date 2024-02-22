import { glob } from "glob";
import { promises as fs } from "fs";
import _fs from "fs";
import path from "path";
import https from "https";
import pLimit from "p-limit";
import ProgressBar from "progress";

const searchDirectory =
  "/Users/xuyongheng/Projects/Mbyte/bestmovietime.com/server/**/*.css";
const outputFilename = "./resources-2-css-js.json";
const limit = pLimit(100); // Limit the number of concurrent file processes

const logoPath = `/Users/xuyongheng/Projects/Mbyte/bestmovietime.com/server/static`;
const allLinks = new Set(); // Set to store all links

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
        const regex = /url\((?!['"]?:)['"]?([^'"\)]*)['"]?\)/g;
        let match;

        while ((match = regex.exec(content)) !== null) {
          const url = match[1];
          if (
            url &&
            (url.startsWith("/") ||
              url.startsWith("https://www.chilimovie.com"))
          ) {
            allLinks.add(
              url.startsWith("/") ? `https://www.chilimovie.com${url}` : url
            );
          }
        }

        // Update the progress bar for each file processed
        bar.tick();
      })
    )
  );

  // Write the extracted links to a file
  await fs.writeFile(
    outputFilename,
    JSON.stringify(Array.from(allLinks), null, 2)
  );

  console.log("Processing complete. Output saved to:", outputFilename);
})();

async function downloadResources() {
  for (const item of links) {
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
      failedDownloads.push(item);
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
