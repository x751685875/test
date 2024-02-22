import { glob } from "glob";
import { promises as fs } from "fs";
import _fs from "fs";
import cheerio from "cheerio";
import pLimit from "p-limit";
import ProgressBar from "progress";

const searchDirectory =
  "/Users/xuyongheng/Projects/Mbyte/bestmovietime.com/server/**/*.html";
const outputFilename = "./season_ids.json";
const limit = pLimit(100); // Limit the number of concurrent file processes

let allLinks = new Set();

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

        $("li[data-sea-id]").each(function () {
          const id = $(this).attr("data-sea-id");

          allLinks.add(id);
        });

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
