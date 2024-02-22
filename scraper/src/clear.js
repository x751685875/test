import { glob } from "glob";
import { promises as fs } from "fs";
import cheerio from "cheerio";
import pLimit from "p-limit";
import ProgressBar from "progress";

const limit = pLimit(100); // Limit the number of concurrent file processes

const searchDirectory =
  "/Users/xuyongheng/Projects/Mbyte/bestmovietime.com/server/**/*.html";

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
        let content = await fs.readFile(file, "utf8");
        const $ = cheerio.load(content);

        $(
          `script[src="https://www.googletagmanager.com/gtag/js?id=AW-579782972"]`
        ).remove();

        // 寻找包含 gtag('config', 'G-M1BZB7JY62'); 内容的 script 标签
        const targetScriptTags = $("script").filter(function () {
          return (
            $(this).text().indexOf(`//bat.bing.com/bat.js`) !== -1 ||
            $(this).text().indexOf(`track_page_event`) !== -1 ||
            $(this).text().indexOf(`AW-579782972`) !== -1 ||
            $(this).text().indexOf(`GTM-N5XC2V`) !== -1 ||
            $(this).text().indexOf(`UA-75239839-1`) !== -1
          );
        });

        // 删除符合条件的 script 标签
        targetScriptTags.remove();
        const html = $.html().replace(/<!--[\s\S]*?-->/g, "");

        await fs.writeFile(file, html);

        // Update the progress bar for each file processed
        bar.tick();
      })
    )
  );
})();
