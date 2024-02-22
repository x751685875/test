import { promises as fs } from "fs";

const data = await fs.readFile("./need-urls.json", "utf-8");
const urlValues = JSON.parse(data);

let num = [];
let num1 = [];
let num2 = [];
let num3 = [];

for (let i = 0; i < urlValues.length; i++) {
  const urlItem = urlValues[i];

  if (
    urlItem.startsWith("https://www.chilimovie.com/movies/") ||
    urlItem.startsWith("https://www.chilimovie.com/movie/") ||
    urlItem.startsWith("https://www.chilimovie.com/review/")
  ) {
    num1.push(urlItem);
  } else if (
    urlItem.startsWith("https://www.chilimovie.com/tv/") ||
    urlItem.startsWith("https://www.chilimovie.com/actor/") ||
    urlItem.startsWith("https://www.chilimovie.com/images/")
  ) {
    num2.push(urlItem);
  } else if (urlItem.startsWith("https://www.chilimovie.com/crew/")) {
    num3.push(urlItem);
  } else if (urlItem.startsWith("https://www.chilimovie.com/location/amazon")) {
  } else {
    num.push(urlItem);
  }
}

await fs.writeFile(
  "./need_links/num.json",
  JSON.stringify(Array.from(num), null, 2)
);
await fs.writeFile(
  "./need_links/num1.json",
  JSON.stringify(Array.from(num1), null, 2)
);
await fs.writeFile(
  "./need_links/num2.json",
  JSON.stringify(Array.from(num2), null, 2)
);
await fs.writeFile(
  "./need_links/num3.json",
  JSON.stringify(Array.from(num3), null, 2)
);
