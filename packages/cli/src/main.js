/* eslint-disable node/no-unsupported-features/es-syntax */
require('dotenv').config()

const { GITHUB_ACCESS_TOKEN } = process.env

const { program } = require('commander')
const { Octokit } = require('octokit')
const prompts = require('prompts')
const chalk = require('chalk')
const marked = require('marked')

program.version('0.0.1')

const octokit = new Octokit({ auth: GITHUB_ACCESS_TOKEN })

const OWNER = 'detail54'
const REPO = 'node-study'

const LABEL_TOO_BIG = 'too-big'
const LABEL_BUG = 'bug'
const LABEL_NEEDS_SCREENSHOT = 'needs-screenshot'

program
  .command('me')
  .description('Check my profile')
  .action(async () => {
    const {
      data: { login },
    } = await octokit.rest.users.getAuthenticated()
    console.log('Hello, %s', login)
  })

/**
 * @param {Array<*>} labels
 * @param {string} labelName
 * @return {boolean}
 */
function hasLabel(labels, labelName) {
  return labels.find((label) => label.name === labelName) !== undefined
}

program
  .command('list-bugs')
  .description('List issues with bug label')
  .action(async () => {
    const result = await octokit.rest.issues.listForRepo({
      owner: OWNER,
      repo: REPO,
      labels: LABEL_BUG,
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
          if (!hasLabel(labels, LABEL_TOO_BIG)) {
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

/**
 * @param {string} md
 * @return {boolean}
 */
function isAnyScreenshotInMarkdownDocument(md) {
  const tokens = marked.lexer(md)

  let didFind = false
  marked.walkTokens(tokens, (token) => {
    if (token.type === 'image') {
      didFind = true
      console.log('Found image!')
    }
  })

  return didFind
}

// git issue 중 bug 레이블이 달려있으나, 스크린샷이 없는 이슈에 대해서 needs-screenshot 레이블 달아주기
program
  .command('check-screenshots')
  .description(
    'Check if any issue is missing screenshot even if it has bug label on it'
  )
  .action(async () => {
    const result = await octokit.rest.issues.listForRepo({
      owner: OWNER,
      repo: REPO,
      labels: LABEL_BUG,
    })

    const issuesWithBugLabel = result.data
    // 1. bug 레이블이 있고 스크린샷 없음 -> + needs-screenshot
    const issuesWithoutScreenshot = issuesWithBugLabel.filter(
      (issue) =>
        (!issue.body || !isAnyScreenshotInMarkdownDocument(issue.body)) &&
        !hasLabel(issue.labels, LABEL_NEEDS_SCREENSHOT)
    )

    await Promise.all(
      issuesWithoutScreenshot.map(async (issue) => {
        const rersponse = await prompts({
          type: 'confirm',
          name: 'shouldContinue',
          message: `Add ${LABEL_NEEDS_SCREENSHOT} to issue #${issue.number}?`,
        })

        if (rersponse.shouldContinue) {
          await octokit.rest.issues.addLabels({
            owner: OWNER,
            repo: REPO,
            issue_number: issue.number,
            labels: [LABEL_NEEDS_SCREENSHOT],
          })
        }
      })
    )

    // 2. bug 레이블이 있고 needs-screenshot 레이블이 있고, 스크린샷 있음 -> - needs-screenshot
    const issuesResolved = issuesWithBugLabel.filter(
      (issue) =>
        issue.body &&
        isAnyScreenshotInMarkdownDocument(issue.body) &&
        hasLabel(issue.labels, LABEL_NEEDS_SCREENSHOT)
    )

    await Promise.all(
      issuesResolved.map(async (issue) => {
        const response = await prompts({
          type: 'confirm',
          name: 'shouldContinue',
          message: `Remove ${LABEL_NEEDS_SCREENSHOT} from issue #${issue.number}`,
        })

        if (response.shouldContinue) {
          await octokit.rest.issues.removeLabel({
            owner: OWNER,
            repo: REPO,
            issue_number: issue.number,
            name: LABEL_NEEDS_SCREENSHOT,
          })
        }
      })
    )
  })

program.parseAsync()
