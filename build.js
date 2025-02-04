const fs = require("fs");

const template = fs.readFileSync(__dirname + "/lsw-dialogs.html").toString();
const component = fs.readFileSync(__dirname + "/lsw-dialogs.js").toString();
const compiledComponent = component.replace("$template", template);

fs.writeFileSync(__dirname + "/lsw-dialogs.compiled.js", compiledComponent, "utf8");
