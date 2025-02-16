const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const { exec } = require("child_process");
const PDFDocument = require("pdfkit");

const app = express();
const PORT = process.env.PORT || 3000; // Use dynamic port for Render

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// Root route for testing
app.get("/", (req, res) => {
    res.send("Backend is running! Use /run-java to execute code.");
});

// Route to execute Java code
app.post("/run-java", (req, res) => {
    const { code } = req.body;

    if (!code) {
        return res.status(400).json({ error: "No code provided" });
    }

    fs.writeFileSync("Main.java", code);

    exec("javac Main.java && java Main", (error, stdout, stderr) => {
        if (error || stderr) {
            return res.json({ error: stderr || error.message });
        }
        res.json({ output: stdout });
    });
});

// Route to generate PDF
app.post("/generate-pdf", (req, res) => {
    const { code, output } = req.body;

    if (!code || !output) {
        return res.status(400).json({ error: "Code and output required" });
    }

    const doc = new PDFDocument();
    const filePath = "JavaCode.pdf";
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);
    doc.fontSize(16).text("Java Code", { underline: true }).moveDown();
    doc.fontSize(12).text(code).moveDown(2);
    doc.fontSize(16).text("Output", { underline: true }).moveDown();
    doc.fontSize(12).text(output);
    doc.end();

    stream.on("finish", () => res.download(filePath, () => fs.unlinkSync(filePath)));
    stream.on("error", () => res.status(500).send("Error generating PDF"));
});

// Start the server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});
