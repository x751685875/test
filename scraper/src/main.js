// For more information, see https://crawlee.dev/
import path from "path";
import { promises as fs } from "fs";
import { CheerioCrawler, log } from "crawlee";

const startUrls = [
  "https://www.chilimovie.com/",
  "https://www.chilimovie.com/movies/",
  "https://www.chilimovie.com/tv/",
  "https://www.chilimovie.com/actor/1492326.html",
  "https://www.chilimovie.com/actor/224513.html",
  "https://www.chilimovie.com/review/the-man-with-the-answers-vid-7679122.html",
  "https://www.chilimovie.com/editorial-review/trigger-point-vid-7721937.html",
  "https://www.chilimovie.com/content/",
  "https://www.chilimovie.com/images/life-in-pieces-vid-27071.html",
  "https://www.chilimovie.com/free-movie-channel-prime",
  "https://www.chilimovie.com/free-movie",
  "https://www.chilimovie.com/sitemap",
];
const basePath = "../server"; // 替换为您希望存放文件的路径

// 独立计数器
let count = 0;

const crawler = new CheerioCrawler({
  minConcurrency: 10,
  maxConcurrency: 50,
  requestHandlerTimeoutSecs: 30,
  maxRequestRetries: 1,
  // maxRequestsPerCrawl: 5,
  async requestHandler({ request, body, enqueueLinks, log, $ }) {
    const _url = new URL(request.url);
    let pagePath = path.join(basePath, "pages", _url.pathname);

    try {
      await fs.access(pagePath);
      log.warning(`[${count}] 直接跳过: ${request.url}`);
      return;
    } catch {}

    await downloadFile(request.url, body);

    count++;

    await enqueueLinks({
      globs: ["http?(s)://www.chilimovie.com/**"],
    });
  },
});

await crawler.run(startUrls);

console.log("Crawler finished.");

async function downloadFile(url, body) {
  const _url = new URL(url);
  let pagePath = path.join(basePath, "pages", _url.pathname);

  if (_url.pathname === "/sitemap" && _url.searchParams.size >= 1) {
    const [paramName, paramValue] = _url.searchParams.entries().next().value;
    const fileName = `${paramValue}.html`;

    pagePath = path.join(pagePath, paramName, fileName);
  } else {
    // 如果 URL 以 / 结尾，则视为目录，并添加 index.html
    if (_url.pathname.endsWith("/")) {
      pagePath = path.join(pagePath, "index.html");
    } else {
      pagePath = pagePath + ".html";
    }
  }

  await fs.mkdir(path.dirname(pagePath), { recursive: true });

  try {
    await fs.access(pagePath);
    log.warning(`[${count}] 跳过: ${url}`);
    return "skipped";
  } catch {
    try {
      log.info(`[${count}] 下载: ${url}`);
      await fs.writeFile(pagePath, body);
      return "downloaded";
    } catch (error) {
      log.error(`[${count}] 失败: ${url}`);
      return "failed";
    }
  }
}
