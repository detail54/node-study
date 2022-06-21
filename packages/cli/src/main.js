const { program } = require('commander')

program.version('0.0.1')

program
  .command('list-bugs')
  .description('List issues with bug label')
  .action(() => {
    console.log('List bugs!')
  })

program
  .command('check-prs')
  .description('Check pull request status')
  .action(() => {
    console.log('Check Prs!!')
  })

program.parse()
