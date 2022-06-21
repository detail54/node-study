/* eslint-disable node/no-unsupported-features/es-syntax */
require('dotenv').config()

const { GITHUB_ACCESS_TOKEN } = process.env

const { program } = require('commander')
const { Octokit } = require('octokit')
const prompts = require('prompts')
const chalk = require('chalk')

program.version('0.0.1')

const octokit = new Octokit({ auth: GITHUB_ACCESS_TOKEN })

const OWNER = 'detail54'
const REPO = 'node-study'
const LABEL_TOO_BIG = 'too-big'

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
    const result = await octokit.rest.pulls.list({
      owner: OWNER,
      repo: REPO,
    })

    const prsWithDiff = await Promise.all(
      result.data.map(async (pr) => ({
        labels: pr.labels,
        number: pr.number,
        compare: await octokit.rest.repos.compareCommits({
          owner: OWNER,
          repo: REPO,
          base: pr.base.ref,
          head: pr.head.ref,
        }),
      }))
    )

    await Promise.all(
      prsWithDiff
        .map(({ compare, ...rest }) => {
          const totalChanges = compare.data.files.reduce(
            (sum, file) => sum + file.changes,
            0
          )

          return {
            compare,
            totalChanges,
            ...rest,
          }
        })
        .filter(
          (pr) =>
            pr && typeof pr.totalChanges === 'number' && pr.totalChanges > 10
        )
        .map(async ({ labels, number }) => {
          if (!labels.find((label) => label.name === LABEL_TOO_BIG)) {
            console.log(
              chalk.cyan(`Adding ${LABEL_TOO_BIG} label to PR ${number}...`)
            )

            const response = await prompts([
              {
                type: 'confirm',
                name: 'shouldContinue',
                message: `Do you reallyh want to add label ${LABEL_TOO_BIG} to PR #${number}?`,
              },
            ])

            if (response.shouldContinue) {
              return octokit.rest.issues.addLabels({
                owner: OWNER,
                repo: REPO,
                issue_number: number,
                labels: [LABEL_TOO_BIG],
              })
            }
            console.log('Cancelled')
          }
          return undefined
        })
    )
  })

program.parseAsync()
