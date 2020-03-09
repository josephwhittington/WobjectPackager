const electron = require("electron");

const { app, BrowserWindow } = require("electron");
const { ipcMain } = require("electron");
const { dialog } = require("electron");

const fs = require("fs");
const { exec } = require("child_process");

const Data = {};

const DATA = {
    MODEL: "model",
    ALBEDO: "diffuse",
    METALLIC: "metallic",
    ROUGHNESS: "roughness",
    NORMAL: "normal",
    AO: "ao"
};

ipcMain.on("drop", (event, type, filePath) => {
    if (type && filePath) {
        console.log("Type:", type, "Path: ", filePath);
        Data[type] = filePath;
    }
});

ipcMain.on("export", () => {
    let boolcount = 0;
    // Validate the model name
    if (Data[DATA.MODEL]) {
        console.log(DATA.MODEL, Data[DATA.MODEL]);
        boolcount++;
    }
    // Validate the albedo
    if (Data[DATA.ALBEDO]) {
        console.log(DATA.ALBEDO, Data[DATA.ALBEDO]);
        boolcount++;
    }
    // Validate the metallic
    if (Data[DATA.METALLIC]) {
        console.log(DATA.METALLIC, Data[DATA.METALLIC]);
        boolcount++;
    }
    // Validate the roughness
    if (Data[DATA.ROUGHNESS]) {
        console.log(DATA.ROUGHNESS, Data[DATA.ROUGHNESS]);
        boolcount++;
    }
    // Validate the normal
    if (Data[DATA.NORMAL]) {
        console.log(DATA.NORMAL, Data[DATA.NORMAL]);
        boolcount++;
    }
    // Validate the ao
    if (Data[DATA.AO]) {
        console.log(DATA.AO, Data[DATA.AO]);
        boolcount++;
    }

    if (boolcount > 5) {
        dialog
            .showOpenDialog({
                properties: ["openDirectory", "createDirectory"]
            })
            .then(args => {
                if (!args.canceled && args.filePaths[0]) {
                    output_path = args.filePaths[0];
                    // Construct string
                    let output_str = `# Whittington Material File 
# Version Rc0.1

#BEGIN
#diffuse
${extractpathend(Data[DATA.ALBEDO])}
#metallic
${extractpathend(Data[DATA.METALLIC])}
#roughness
${extractpathend(Data[DATA.ROUGHNESS])}
#normal
${extractpathend(Data[DATA.NORMAL])}
#ao
${extractpathend(Data[DATA.AO])}
#END
                    `;
                    console.log(output_str);

                    // Generate material file
                    fs.writeFile(
                        output_path +
                            "/" +
                            extractNoExtention(Data[DATA.MODEL]) +
                            ".wmf",
                        output_str,
                        function(err) {
                            if (err) {
                                return console.log(err);
                            }
                            console.log("The file was saved!");
                        }
                    );

                    // Copy the files
                    let files = [
                        Data[DATA.MODEL],
                        Data[DATA.ALBEDO],
                        Data[DATA.METALLIC],
                        Data[DATA.ROUGHNESS],
                        Data[DATA.NORMAL],
                        Data[DATA.AO]
                    ];

                    let newfiles = [];

                    for (let i = 0; i < files.length; i++) {
                        let output =
                            output_path + "/" + simpleExtract(files[i]);
                        newfiles[i] = output;
                        fs.copyFile(files[i], output, err => {
                            if (err) throw err;
                            console.log("source was copied to destination");
                        });
                    }

                    zipfiles(
                        newfiles,
                        extractNoExtention(Data[DATA.MODEL]),
                        output_path
                    );
                }
            })
            .catch(err => () => {
                console.log("broke");
                console.log(err);
                modal();
            });
    } else {
        modal();
    }
});

function zipfiles(filelist, zipname, outputplace) {
    // Generate file list
    let list = "";
    let command = "zip " + outputplace + "/" + zipname + ".zip";

    for (let i = 0; i < filelist.length; i++) {
        list += " " + filelist[i];
    }
    command = command + list;
    console.log(command);

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(error);
            modal();
        }
        if (stdout) {
            console.log("out:", stdout);
        }
        if (stderr) {
            console.log("Error", stderr);
        }

        if (!error) {
            let deletecommand =
                "rm" + list + " " + outputplace + "/" + zipname + ".wmf";
            console.log(deletecommand);

            exec(deletecommand, (error, stdout, stderr) => {
                if (error) {
                    console.error(error);
                    modal();
                }
                if (stdout) {
                    console.log("out:", stdout);
                }
                if (stderr) {
                    console.log("Error", stderr);
                }
            });
        }
    });
}

function extractpathend(path) {
    paths = path.split("/");
    end = paths[paths.length - 1];
    end = end.substring(0, end.lastIndexOf(".")) + ".dds";
    return end;
}

function extractNoExtention(path) {
    paths = path.split("/");
    end = paths[paths.length - 1];
    end = end.substring(0, end.lastIndexOf("."));
    return end;
}

function simpleExtract(path) {
    paths = path.split("/");
    end = paths[paths.length - 1];
    return end;
}

function modal() {
    // Create the browser window.
    const modal = new BrowserWindow({
        width: 300,
        height: 180,
        webPreferences: {
            nodeIntegration: true
        }
    });

    // and load the index.html of the app.
    modal.loadFile("./view/error.html");
}

function createWindow() {
    // Create the browser window.
    const win = new BrowserWindow({
        width: 400,
        height: 550,
        webPreferences: {
            nodeIntegration: true
        }
    });

    // and load the index.html of the app.
    win.loadFile("./view/index.html");

    // Open the DevTools.
    // win.webContents.openDevTools();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
