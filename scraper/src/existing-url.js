import { glob } from "glob";
import { promises as fs } from "fs";
import pLimit from "p-limit";
import ProgressBar from "progress";

const searchDirectory =
  "/Users/xuyongheng/Projects/Mbyte/bestmovietime.com/server/**/*.html";
const outputFilename = "./existing-urls.txt";
const limit = pLimit(100); // Limit the number of concurrent file processes

await (async () => {
  const files = await glob(searchDirectory);
  let allLinks = ``;

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
        const url = file.replace(
          "/Users/xuyongheng/Projects/Mbyte/bestmovietime.com/server/pages",
          "https://www.chilimovie.com"
        );

        allLinks += url + "\n";

        // Update the progress bar for each file processed
        bar.tick();
      })
    )
  );

  // Write the extracted links to a file
  await fs.writeFile(outputFilename, allLinks, {
    encoding: "utf-8",
    flag: "a",
  });

  console.log("Processing complete. Output saved to:", outputFilename);
})();
