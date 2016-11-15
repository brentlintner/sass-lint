#!/usr/bin/env node
'use strict';

var program = require('commander'),
    meta = require('../package.json'),
    lint = require('../index');

var configPath,
    config,
    configOptions = {},
    allDetects = [],
    exitCode = 0;

var tooManyWarnings = function (detects, userConfig) {
  var warningCount = lint.warningCount(detects).count;

  return warningCount > 0 && warningCount > userConfig.options['max-warnings'];
};

var detectPattern = function (pattern) {
  var detects = lint.lintFiles(pattern, configOptions, configPath);

  allDetects = allDetects.concat(detects);

  // Note: does this even work? no-exit is an option, but not exit...
  if (program.exit) {
    lint.failOnError(detects, configOptions, configPath);
  }
};

var run = function (userConfig) {
  if (program.args.length === 0) {
    detectPattern(null);
  }
  else {
    program.args.forEach(function (path) {
      detectPattern(path);
    });
  }

  if (program.verbose) {
    lint.outputResults(allDetects, configOptions, configPath);
  }

  if (lint.errorCount(allDetects).count ||
      tooManyWarnings(allDetects, userConfig)) {
    exitCode = 1;
  }
};

program
  .version(meta.version)
  .usage('[options] <pattern>')
  .option('-c, --config [path]', 'path to custom config file')
  .option('-i, --ignore [pattern]', 'pattern to ignore. For multiple ignores, separate each pattern by `, ` within a string')
  .option('-q, --no-exit', 'do not exit on errors')
  .option('-v, --verbose', 'verbose output')
  .option('-f, --format [format]', 'pass one of the available eslint formats')
  .option('-o, --output [output]', 'the path and filename where you would like output to be written')
  .option('-s, --syntax [syntax]', 'syntax to evaluate the file(s) with (either sass or scss)')
  .option('--max-warnings [integer]', 'Number of warnings to trigger nonzero exit code')
  .parse(process.argv);

configOptions.files = configOptions.files || {};
configOptions.options = configOptions.options || {};

if (program.config && program.config !== true) {
  configPath = program.config;
}

if (program.ignore && program.ignore !== true) {
  configOptions.files.ignore = program.ignore.split(', ');
}

if (program.syntax && ['sass', 'scss'].indexOf(program.syntax) > -1) {
  configOptions.syntax = program.syntax;
}

if (program.format && program.format !== true) {
  configOptions.options.formatter = program.format;
}

if (program.output && program.output !== true) {
  configOptions.options['output-file'] = program.output;
}

if (program.maxWarnings && program.maxWarnings !== true) {
  configOptions.options['max-warnings'] = program.maxWarnings;
}

// load our config here so we only load it once for each file
config = lint.getConfig(configOptions, configPath);

run(config);

process.on('exit', function () {
  process.exit(exitCode); // eslint-disable-line no-process-exit
});
