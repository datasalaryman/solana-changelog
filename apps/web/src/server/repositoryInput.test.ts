import { describe, expect, test } from 'bun:test'
import { batchInput, discussionsInput, repoInput } from './repositoryInput'

describe('repoInput', () => {
  test('accepts configured repositories with preserved casing', () => {
    expect(repoInput.parse({ owner: 'Overclock-Validator', repository: 'mithril' })).toEqual({
      owner: 'Overclock-Validator',
      repository: 'mithril',
    })
    expect(repoInput.parse({ owner: 'LiteSVM', repository: 'litesvm' })).toEqual({
      owner: 'LiteSVM',
      repository: 'litesvm',
    })
  })

  test('rejects malformed owners', () => {
    const owners = [
      '',
      ' ',
      'solana/foundation',
      'https://github.com/solana-foundation',
      '%2e%2e',
      '-solana',
      'solana-',
      'a'.repeat(40),
    ]

    for (const owner of owners) {
      expect(repoInput.safeParse({ owner, repository: 'anchor' }).success).toBe(false)
    }
  })

  test('rejects malformed repositories', () => {
    const repositories = [
      '',
      ' ',
      'solana/anchor',
      '..',
      'https://github.com/solana-foundation/anchor',
      '%2e%2e',
      'a'.repeat(101),
    ]

    for (const repository of repositories) {
      expect(repoInput.safeParse({ owner: 'solana-foundation', repository }).success).toBe(false)
    }
  })

  test('rejects syntactically valid repositories outside the allowlist', () => {
    expect(repoInput.safeParse({ owner: 'facebook', repository: 'react' }).success).toBe(false)
  })
})

describe('batchInput', () => {
  test('accepts bounded pagination values', () => {
    expect(batchInput.safeParse({
      owner: 'solana-foundation',
      repository: 'anchor',
      batchPage: 1,
      uiPage: 100,
    }).success).toBe(true)
  })

  test('rejects unsupported pagination values', () => {
    for (const page of [0, -1, 1.5, 101]) {
      expect(batchInput.safeParse({
        owner: 'solana-foundation',
        repository: 'anchor',
        batchPage: page,
        uiPage: 1,
      }).success).toBe(false)

      expect(batchInput.safeParse({
        owner: 'solana-foundation',
        repository: 'anchor',
        batchPage: 1,
        uiPage: page,
      }).success).toBe(false)
    }
  })
})

describe('discussionsInput', () => {
  test('accepts null and opaque discussion cursors', () => {
    expect(discussionsInput.safeParse({
      owner: 'solana-foundation',
      repository: 'anchor',
      cursor: null,
      uiPage: 1,
    }).success).toBe(true)

    expect(discussionsInput.safeParse({
      owner: 'solana-foundation',
      repository: 'anchor',
      cursor: 'Y3Vyc29yOnYyOpHOA1zVxA==',
      uiPage: 1,
    }).success).toBe(true)
  })

  test('rejects malformed discussion cursors', () => {
    for (const cursor of ['', 'abc\ndef', 'a'.repeat(513)]) {
      expect(discussionsInput.safeParse({
        owner: 'solana-foundation',
        repository: 'anchor',
        cursor,
        uiPage: 1,
      }).success).toBe(false)
    }
  })
})
