#!/usr/bin/env node
/**
 * new-node-service
 */
var program = require('commander');
var prompt = require('prompt');
var colors = require('colors/safe');
var ejs = require('ejs');

var execSync = require('child_process').execSync;
var fs = require('fs');
var path = require('path');

function cw(string) {
  return colors.white(string);
}

function tryCommand(command) {
  try {
    execSync(command);
  } catch(e) {
    execSync('sudo ' + command);
  }
}

function ensureFolder(folderName) {
  tryCommand('mkdir -p ' + folderName);
}

function ensureResourcesApps() {
  ensureFolder('/resources/apps');
}

function folderExists(path) {
  try {
    return fs.statSync(path).isDirectory();
  } catch (e) {
    if (e.code === 'ENOENT') return false;

    console.log("Exception fs.statSync (" + path + "): " + e);
    return false;
  }
}

program
  .version(require('../package').version);
  // .option('-p, --peppers', 'Add peppers')
  // .option('-P, --pineapple', 'Add pineapple')
  // .option('-b, --bbq-sauce', 'Add bbq sauce')
  // .option('-c, --cheese [type]', 'Add the specified type of cheese [marble]', 'marble')

program.parse(process.argv);

prompt.start();
prompt.delimiter = ':';
prompt.message = '';

var infoPrompts = [
  {
    name: 'service',
    description: cw('Service Name'),
    default: path.basename(process.cwd())
  },
  {
    name: 'folder',
    description: cw('Service Folder'),
    default: process.cwd()
  },
  {
    name: 'user',
    description: cw('User to run service as'),
    default: process.env.USER
  },
  {
    name: 'env',
    description: cw('NODE_ENV value'),
    default: 'production'
  },
  {
    name: 'kwargs',
    description: cw('Keyword arguments'),
    type: 'string'
  }
];

var commandPrompt = [
  {
    name: 'command',
    description: cw('App launch command'),
    default: null,
    type: 'string',
    required: 'true',
    conform: function (value) {
      var re = /(?:^|\ )(node)(?:\b|$)/;
      if (re.test(value)) {
        console.log("Relative path to 'node' detected, use current user's node?");

        var absNode = execSync('which node').toString().trim();
        commandPrompt[0].default = value.replace(re, absNode);
        return false;
      }
      return true;
    }
  }
];

// console.log(prompt.message, prompt.delimiter, prompt.delimiter);
// process.exit(0);

if (!folderExists('/resources/apps'))
  ensureResourcesApps();

// conditional on which information needed (template, os, service system)
prompt.get(infoPrompts, function (err, information) {
  if (err) throw err;

  try {
    var packagePath = path.join(information.folder, 'package.json');
    var package = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

    commandPrompt[0].default = package.scripts.start;
  } catch (e) { /* silence is golden */ }

  prompt.get(commandPrompt, function (err, cmd) {
    if (err) throw err;

    var initLocation = path.join(__dirname, '..', 'templates', 'init.ejs');

    ejs.renderFile(initLocation, {
      service: information.service,
      folder:  information.folder,
      user:    information.user,
      env:     information.env,
      kwargs:  information.kwargs,
      command: cmd.command
    }, {}, function (err, initString) {
      if (err) throw err;

      var initPreview = initString.split("\n").slice(0, 34).join("\n");
      console.log(initPreview);

      console.log("\nLook good?\n");

      var destLocation = '/etc/init.d/'

      prompt.get([{
        name: 'confirm',
        description: cw('Confirm service script'),
        type: 'boolean',
        default: true
      }], function (err, confirmation) {
        if (confirmation.confirm) {
          var filename = information.service + '-app';
          fs.writeFileSync(filename, initString, { mode: 0o755, flag: 'w' });
          
          console.log("Wrote out file (" + filename + ")!");

          prompt.get([{
            name: 'cp',
            description: cw('Copy to system (/etc/init.d)'),
            type: 'boolean',
            default: true
          }], function (err, cp) {
            if (err) throw err;

            if (!cp.cp) {
              console.log("Cancelled.");
              process.exit(0);
            }

            var cpCmd = 'cp ' + filename + ' /etc/init.d/';
            var inCmd = 'update-rc.d -f ' + filename + ' defaults';
            var unCmd = 'update-rc.d -f ' + filename + ' remove';
            var rmCmd = 'rm -f /etc/init.d/' + filename;

            console.log(cpCmd);
            tryCommand(cpCmd);
            console.log(inCmd);
            tryCommand(inCmd);

            console.log("To remove, uninstall and remove file:");
            console.log(unCmd);
            console.log(rmCmd);
          });
        }

        else {
          console.log("Cancelled.");
          process.exit(0);
        }
      });
    });
  });
});
