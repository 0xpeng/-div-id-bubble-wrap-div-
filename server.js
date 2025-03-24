const express = require('express');
const path = require('path');
const app = express();

// 設定靜態檔案目錄
app.use(express.static(__dirname));

// 設定路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 設定端口
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 