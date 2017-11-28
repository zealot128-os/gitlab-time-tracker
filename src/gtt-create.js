const colors = require('colors');
const moment = require('moment');
const program = require('commander');

const Config = require('./include/file-config');
const Cli = require('./include/cli');
const Tasks = require('./include/tasks');

const Issue = require('./models/issue');

program
    .arguments('[project] [title]')
    .option('-t, --type <type>', 'specify resource type: issue, merge_request')
    .option('-s, --skip-create', "don't create issue immediately")
    .option('--verbose', 'show verbose output')
    .parse(process.argv);

Cli.verbose = program.verbose;

let config = new Config(process.cwd()),
    tasks = new Tasks(config),
    type = program.type ? program.type : 'issue',
    title = program.args.length === 1 ? program.args[0] : program.args[1],
    now = program.now,
    project = program.args.length === 2 ? program.args[0] : null;

if (program.args.length < 2 && !config.get('project'))
    Cli.error('No project set');

if (!title)
    Cli.error('Wrong or missing title');

tasks.start(project, type, title)
  .then((frame) => {
    console.log(`Starting project ${config.get('project').magenta} and create ${type} "${title.blue}" at ${moment().format('HH:mm').green}`)
    if (type == 'issue' && !program.skipCreate) {
      const issue = new Issue(frame.config, {})
      issue.make(frame.project, title, true).then((response) => {
        console.log(`Issue created: ${response.body.web_url}`)
        frame.resource.id = response.body.iid
        delete frame.resource.new
        frame.write()
      }).catch((d) => {
        console.log(`Issue not created`)
        console.log(d.body)
      })
    }
  })
  .catch(error => Cli.error(error));
