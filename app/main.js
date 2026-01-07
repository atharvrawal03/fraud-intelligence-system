const { app, BrowserWindow } = require("electron");

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    transparent: true,
    frame: false,
    backgroundColor: "#00000000"
  });
  win.loadURL("http://localhost:3000");
});
