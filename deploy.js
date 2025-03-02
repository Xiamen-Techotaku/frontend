// deploy.js
const express = require("express");
const { exec } = require("child_process");

const app = express();

// 解析 JSON body（GitHub webhook 的 payload）
app.use(express.json());

const PORT = process.env.DEPLOY_PORT || 5000;
const SECRET = process.env.WEBHOOK_SECRET || "your_secret_here";

app.post("/webhook", (req, res) => {
    // 你可以在這裡驗證 webhook 的簽章以提高安全性
    console.log("Webhook payload:", req.body);

    // 部署流程：拉取最新程式碼、安裝依賴、build、刪除舊的 PM2 實例，再重新以 PM2 serve 方式託管
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
