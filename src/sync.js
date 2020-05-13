const path = require("path");
var fs = require("fs");
const { execSync } = require("child_process");

// 取出需要升级的包
const g_packageNames =  process.argv.slice(2);  // 第3个参数开始是包名：也就是需要升级的包
if (g_packageNames.length > 0) {
  printLog("需要检查的包：" + g_packageNames.join("  "));
  printLog("升级包开始.................");
} else {
  printLog("没有包需要升级.................");
}

/**
 * 终端有颜色打印
 * @param {*} text 打印的文本
 * @param {*} colorKey 颜色对就的key
 */
function printLog(text, colorKey) {
  colorKey = colorKey ? colorKey : "indigo";
  var colorObj = {
    black: "\033[30m {{}} \033[0m",
    red: "\033[31m {{}} \033[0m",
    green: "\033[32m {{}} \033[0m",
    yellow: "\033[33m {{}} \033[0m",
    blue: "\033[34m {{}} \033[0m",
    popurse: "\033[35m {{}} \033[0m", // 紫色
    indigo: "\033[36m {{}} \033[0m",   // 浅蓝
    white: "\033[37m {{}} \033[0m"
  }

  var regTxt = colorObj[colorKey] ? colorObj[colorKey] : colorObj["indigo"];
  console.log(regTxt.replace("{{}}", text));
}

/**
 * 安装
 * @param {*} packageName  包名
 * @param {*} curVerionInfo { version, fromDev }
 */
function install(packageName, curVerionInfo) {
  var command;
  if (curVerionInfo) {
    command =
      "npm install --save" +
      (curVerionInfo.fromDev ? "-dev " : " ") +
      packageName +
      "@" +
      curVerionInfo.version;
  } else {
    command = "npm install --save-dev " + packageName + "@latest";
  }

  printLog(
    "开始安装/升级" +
    packageName +
    "包（若未成功，也可手动执行： " +
    command +
    " ），请稍等--------------"
  );
  try {
    execSync(command);
    printLog("成功升级" + packageName + "--------------", "green");
  } catch (e) {
    printLog("升级" + packageName + "失败（注意是否系统权限不够）", "red");
    printLog(packageName + "必须升级，否则会导致版本不一致...", "red");
    throw "升级失败，运行中断...";
  }
}

/**
 * 根据包名取出当前的版本号
 * @param {*} packageName 包名
 * @returns { version, fromDev }
 */
function getCurProjectVersion(packageName) {
  var version = false;
  var fromDev = true;
  var curProjectPath = path.resolve(__dirname, "../package.json");
  var packageJson = require(curProjectPath);
  let rawVersion = false;
  if (packageJson.devDependencies[packageName]) {
    rawVersion = packageJson.devDependencies[packageName];
    fromDev = true;
  } else if (packageJson.dependencies[packageName]) {
    rawVersion = packageJson.dependencies[packageName];
    fromDev = false;
  }

  if (rawVersion) {
    var verReg = /\d+(\.\d+)*/g;
    var arr = rawVersion.match(verReg);
    if (arr) {
      version = arr[0];
    }
  }

  packageJson = null;
  return version ? { version, fromDev } : false;
}

/**
 * 两版本比较：格式如1.7.3
 * @param {*} serverVersion 
 * @param {*} localVersion 
 */
function compare(serverVersion, localVersion) {
  var serverNums = serverVersion.split(".").map(id => {
    return parseInt(id);
  });
  var localNums = localVersion.split(".").map(id => {
    return parseInt(id);
  });

  var len;
  var result;

  // 设置默认值
  if (serverNums.length > localNums.length) {
    len = localNums.length;
    result = 1;
  } else if (serverNums.length < localNums.length) {
    len = serverNums.length;
    result = -1;
  } else {
    len = serverNums.length;
    result = 0;
  }

  // 比较
  for (var i = 0; i < len; i++) {
    if (serverNums[i] > localNums[i]) {
      result = 1;
      break;
    } else if (serverNums[i] < localNums[i]) {
      result = -1;
      break;
    } else {
      // continue;
    }
  }

  return result;
}

// 判断执行开始：根据包名，比较当前package.json的版本和本地node_modules>package.json的版本
g_packageNames.forEach(packageName => {
  var nodeModulesPath = path.resolve(
    __dirname,
    "../node_modules/" + packageName + "/package.json"
  );

  var curVerionInfo;
  if (fs.existsSync(nodeModulesPath)) {
    var nodeModulesVersion = require(nodeModulesPath).version;

    curVerionInfo = getCurProjectVersion(packageName);

    if (curVerionInfo) {
      var compareResult = compare(curVerionInfo.version, nodeModulesVersion);
      if (compareResult > 0) {  // 大于，要升级
        printLog(
          packageName +
          "包node_modules版本（" +
          nodeModulesVersion +
          "）低，需要升级为（" +
          curVerionInfo.version +
          "）----------"
        );
        install(packageName, curVerionInfo);
      } else if (compareResult < 0) {
        printLog(
          packageName +
          "包node_modules版本（" +
          nodeModulesVersion +
          "）高于当前工程指定的版本（" +
          curVerionInfo.version +
          "）；\n若要回退到当前工程指定的版本，请手动回退再编译----------", "yellow"
        );
      } else {
        // 相等: 无需要理会
        printLog(
          packageName +
          "包node_modules版本（" +
          nodeModulesVersion +
          "）与当前工程指定的版本相等，无需要升级----------", "green"
        );
      }
    } else {
      printLog(
        "当前package.json没有" + packageName + "，将不再进行升级----------", "yellow"
      );
    }
  } else {
    curVerionInfo = getCurProjectVersion(packageName);
    if (curVerionInfo) {    // node_modules不存在此包，要升级
      printLog(
        packageName +
        "包node_modules不存在，需要安装" +
        curVerionInfo.version +
        "版本--------------"
      );
      install(packageName, curVerionInfo);
    } else {
      printLog(
        "当前package.json没有" + packageName + "，将不再进行更新----------", "yellow"
      );
    }
  }
});

printLog("升级包结束.................");
