const TurndownService = require("turndown");
const fs = require("fs");
const marked = require("marked");

// From https://github.com/ckeditor/ckeditor5/blob/92aa0b3c999397c8f87cd29595fe4d9ad9d4c376/packages/ckeditor5-markdown-gfm/src/html2markdown/html2markdown.js#L12-L54
// Overrides the escape() method, enlarging it.
{
  const originalEscape = TurndownService.prototype.escape;
  TurndownService.prototype.escape = function (string) {
    // Urls should not be escaped. Our strategy is using a regex to find them and escape everything
    // which is out of the matches parts.

    const regex =
      /\b(?:https?:\/\/|www\.)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()[\]{};:'".,<>?«»“”‘’])/g;

    let escaped = "";
    let lastIndex = 0;
    let m;
    do {
      m = regex.exec(string);

      // The substring should to to the matched index or, if nothing found, the end of the string.
      const index = m ? m.index : string.length;

      // Append the substring between the last match and the current one (if anything).
      if (index > lastIndex) {
        escaped += escape(string.substring(lastIndex, index));
      }

      // Append the match itself now, if anything.
      m && (escaped += m[0]);

      lastIndex = regex.lastIndex;
    } while (m);

    return escaped;

    function escape(string) {
      string = originalEscape(string);

      // Escape "<".
      string = string.replace(/</g, "\\<");

      return string;
    }
  };
}

const turndownService = new TurndownService({
  codeBlockStyle: "fenced",
  hr: "---",
  headingStyle: "atx",
});
const inputDir = "./input/";
const outDir = "./output/";

try {
  const files = fs.readdirSync(inputDir);

  files.forEach((file) => {
    fs.readFile(inputDir + file, "utf-8", (err, content) => {
      if (err) {
        throw err;
      }
      const frontmatterRegex = /^---\n(.*\n)+---\n$/im;
      const result = content.match(frontmatterRegex);
      const contentWithoutFrontmatter = result
        ? content.substring(result[0].length, content.length)
        : content;
      const html = marked(contentWithoutFrontmatter);
      const markdown = turndownService.turndown(html);
      const data = result ? result[0] + markdown : markdown;
      fs.writeFile(outDir + file, data, (err) => {
        if (err) {
          throw err;
        }
        console.info("Data has been written to file successfully.");
      });
    });
  });
} catch (err) {
  throw err;
}
