// deploy.js (ES Module 版)
import express from "express";
import { exec } from "child_process";

const app = express();

// 解析 JSON body（GitHub webhook 的 payload）
app.use(express.json());

const PORT = process.env.DEPLOY_PORT || 5000;
const SECRET = process.env.WEBHOOK_SECRET || "your_secret_here";

app.post("/webhook", (req, res) => {
    console.log("Webhook payload:", req.body);
    const deployCommand = `
    git pull &&
    npm install &&
    npm run build &&
    (pm2 delete frontend || true) &&
    pm2 serve dist 3000 --spa --name frontend
  `;
    exec(deployCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`部署錯誤: ${error}`);
            return res.status(500).send("部署失敗");
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
        res.send("部署成功");
    });
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: "伺服器錯誤" });
});

app.listen(PORT, () => {
    console.log(`Webhook server running on port ${PORT}`);
});
