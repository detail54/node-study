/* eslint-disable node/no-unsupported-features/node-builtins */
require('dotenv').config()

const { GITHUB_ACCESS_TOKEN } = process.env

const { program } = require('commander')
const { Octokit } = require('octokit')

program.version('0.0.1')

const octokit = new Octokit({ auth: GITHUB_ACCESS_TOKEN })

const OWNER = 'detail54'
const REPO = 'node-study'

program
  .command('me')
  .description('Check my profile')
  .action(async () => {
    const {
      data: { login },
    } = await octokit.rest.users.getAuthenticated()
    console.log('Hello, %s', login)
  })

program
  .command('list-bugs')
  .description('List issues with bug label')
  .action(async () => {
    const result = await octokit.rest.issues.listForRepo({
      owner: OWNER,
      repo: REPO,
      labels: 'bug',
    })

    console.log(result)
  })

program
  .command('check-prs')
  .description('Check pull request status')
  .action(async () => {
    const rersult = await octokit.rest.pulls.list(() => ({
      owner: OWNER,
      repo: REPO,
    }))
    console.log(rersult)
  })

program.parseAsync()
