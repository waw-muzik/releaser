#!/usr/bin/env node

'use strict'


require('colors')
const { spawnSync, execSync } = require('child_process')
const release = require('standard-version')
const githubReleaser = require('conventional-github-releaser')

const GIT_DIRTY = 'dirty'

async function start () {
  try {
    const status = spawnSync('git', ['status', '--porcelain']).stdout.toString().length
    if (status) {
      throw new Error(GIT_DIRTY)
    }

    await release({
      commitAll: true,
      firstRelease: process.argv.includes('--first-release') || process.argv.includes('-f')
    })

    console.log('ℹ'.blue, 'Pushing tag ...')
    const { error } = spawnSync('git', ['push', '--follow-tags', 'origin', 'master'])
    if (error) {
      throw error
    }

    await githubReleaser({
      url: 'https://api.github.com/',
      token: process.env.GITHUB_TOKEN
    }, {
      preset: 'angular',
      releaseCount: 1,
      draft: false
    }, (error, data) => {
      if (err) {
        throw error
      }

      console.log('✔'.green, 'Release was created successfully')
    })

  } catch({ message }) {
    if (message === GIT_DIRTY) {
      console.error('✖'.red, 'You have untracked changes. Commit or stash changes first, please')

      return false
    }

    console.error('✖'.red, `Unable to create a release: ${message}`)
  }
}

(async () => start())()
