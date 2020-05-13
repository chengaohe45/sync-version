# 版本同步

此程序是用node来启动，结合package.json来使用

```
/*
@ src/sync.js 启动路径，根据实现情况调整
@ packageName1 packageName2 需要更新升级的包：名字、个数根据实际情况调整
@ vue-cli-service serve 下一条命令，也就是你的项目启动命令
*/
"scripts": {
    "dev": "node src/sync.js packageName1 packageName2 && vue-cli-service serve"
}
```