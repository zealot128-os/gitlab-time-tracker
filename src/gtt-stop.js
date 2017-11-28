const program = require('commander');
const colors = require('colors');
const moment = require('moment');

const Config = require('./include/file-config');
const Cli = require('./include/cli');
const Tasks = require('./include/tasks');

program
    .option('--verbose', 'show verbose output')
    .parse(process.argv);

Cli.verbose = program.verbose;

let config = new Config(__dirname),
    tasks = new Tasks(config);

tasks.stop()
    .then(frames => {
        frames.forEach(frame => {
            if(!frame.resource.new)
                return console.log(`Stopping project ${frame.project.magenta} ${frame.resource.type.blue} ${('#' + frame.resource.id).blue}, started ${moment(frame.start).fromNow().green} (id: ${frame.id})`)

            console.log(`Stopping project ${frame.project.magenta} for new ${frame.resource.type} "${(frame.resource.id).blue}", started ${moment(frame.start).fromNow().green} (id: ${frame.id})`)
        });
        tasks.syncInit()
            .then(() => tasks.sync.frames.length === 0 ? process.exit(0) : null)
            .then(() => {
                Cli.bar(`${Cli.fetch}  Fetching or creating issues & merge requests...`, tasks.sync.frames.length);
                return tasks.syncResolve(Cli.advance);
            })
            .then(() => {
                Cli.bar(`${Cli.process}  Processing issues & merge requests...`, tasks.sync.frames.length);
                return tasks.syncNotes(Cli.advance);
            })
            .then(() => {
                Cli.bar(`${Cli.update}  Syncing time records...`, tasks.sync.frames.length);
                return tasks.syncUpdate(Cli.advance)
            })
            .catch(error => Cli.x(error));
            })
            .catch(error => Cli.error(error));
