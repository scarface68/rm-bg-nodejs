const axios = require("axios");
const express = require("express");
const app = express();
const FormData = require("form-data");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const cors = require("cors");

app.use(
  cors({
    origin: "*",
  })
);

const upload = multer({ dest: "uploads/" });
const PORT = 5000;

app.use(express.static("public"));
app.use(express.json());

function deleteFilesInDirectory(directory) {
  fs.readdir(directory, (err, files) => {
    if (err) throw err;

    for (const file of files) {
      fs.unlink(path.join(directory, file), (err) => {
        if (err) throw err;
      });
    }
  });
}

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/remove", upload.single("image_file"), (req, res) => {
  deleteFilesInDirectory("./uploads");
  deleteFilesInDirectory("./public");
  if (!req.file) {
    return res.status(400).send("No file was uploaded.");
  }
  const inputPath = req.file.path;
  const formData = new FormData();
  formData.append("size", "auto");
  formData.append(
    "image_file",
    fs.createReadStream(inputPath),
    path.basename(inputPath)
  );

  axios({
    method: "post",
    url: "https://api.remove.bg/v1.0/removebg",
    data: formData,
    responseType: "arraybuffer",
    headers: {
      ...formData.getHeaders(),
      "X-Api-Key": "iWx38rXcVrUSrRuTQE52GmFS",
    },
    encoding: null,
  })
    .then((response) => {
      if (response.status != 200)
        return console.error("Error:", response.status, response.statusText);

      const originalFileName = path.parse(req.file.originalname).name;

      const outputPath = `public/no-bg-${originalFileName}.png`;
      const outputDir = path.dirname(outputPath);

      // Create the "public" directory if it doesn't exist
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
      }

      fs.writeFileSync(outputPath, response.data);

      // Send the URL of the image back to the client
      res.send(`https://removebgapiscarface68.onrender.com/no-bg-${originalFileName}.png`);
    })
    .catch((error) => {
      return console.error("Request failed:", error);
    });
});

app.listen(PORT, () => {
  console.log(`App listening at http://localhost:${PORT}`);
});
