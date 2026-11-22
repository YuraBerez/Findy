import { PassThrough } from 'node:stream'
import { describe, expect, it } from 'vitest'
import {
  encodeFrame,
  FrameError,
  MAX_REQUEST_BYTES,
  readFrame,
} from '../../src/main/connector/codec'
import { handleRequest } from '../../src/main/connector/handler'
import { runConnector } from '../../src/main/connector/run'
import { CONNECTOR_PROTOCOL } from '../../src/shared/extension'
import { memoryRepository } from './helpers/db'

const deps = () => ({ ...memoryRepository(), version: '1.2.3', storageProblem: 'no database' })

const frameOf = (value: unknown): PassThrough => {
  const input = new PassThrough()
  input.end(encodeFrame(value))
  return input
}

/** Reads what a test wrote into an output stream */
const decoded = async (output: PassThrough): Promise<unknown> => {
  output.end()
  return readFrame(output)
}

describe('connector frames (spec 019 NFR-002)', () => {
  it('writes and reads a frame with a little-endian length', async () => {
    const frame = encodeFrame({ type: 'hello', text: 'Київ' })
    expect(frame.readUInt32LE(0)).toBe(frame.length - 4)
    expect(await readFrame(frameOf({ type: 'hello', text: 'Київ' }))).toEqual({
      type: 'hello',
      text: 'Київ',
    })
  })

  it('reads a frame that comes in parts', async () => {
    const input = new PassThrough()
    const frame = encodeFrame({ type: 'hello' })
    const result = readFrame(input)
    input.write(frame.subarray(0, 2))
    input.write(frame.subarray(2, 7))
    input.end(frame.subarray(7))
    expect(await result).toEqual({ type: 'hello' })
  })

  it('refuses a frame larger than the limit, a short input and a body that is not JSON', async () => {
    const big = Buffer.alloc(4)
    big.writeUInt32LE(MAX_REQUEST_BYTES + 1, 0)
    const input = new PassThrough()
    input.end(big)
    await expect(readFrame(input)).rejects.toThrow(FrameError)

    const short = new PassThrough()
    short.end(Buffer.from([1]))
    await expect(readFrame(short)).rejects.toThrow('ended')

    const text = Buffer.from('nope')
    const header = Buffer.alloc(4)
    header.writeUInt32LE(text.length, 0)
    const broken = new PassThrough()
    broken.end(Buffer.concat([header, text]))
    await expect(readFrame(broken)).rejects.toThrow('not JSON')
  })
})

describe('connector requests (spec 019)', () => {
  it('answers hello with the protocol and the version (FR-010)', () => {
    expect(handleRequest({ type: 'hello' }, deps())).toEqual({
      ok: true,
      protocol: CONNECTOR_PROTOCOL,
      version: '1.2.3',
    })
  })

  it('adds an application in Applied with the source from the link (FR-004)', () => {
    const d = deps()
    const answer = handleRequest(
      { type: 'add', title: ' Senior QA ', company: 'Acme', url: 'https://djinni.co/jobs/1/' },
      d,
    )
    expect(answer).toEqual({ ok: true, stage: 'applied' })
    const [created] = d.repository.listApplications()
    expect(created).toMatchObject({
      title: 'Senior QA',
      company: 'Acme',
      url: 'https://djinni.co/jobs/1/',
      stage: 'applied',
      source: { kind: 'site', id: 'djinni' },
    })
  })

  it('finds the last updated application with the same link, and gives only its stage (FR-006, FR-008)', () => {
    const d = deps()
    const first = d.repository.createApplication({
      title: 'QA',
      company: 'Acme',
      url: 'https://a.com/jobs/1',
    } as never)
    d.repository.createApplication({
      title: 'QA',
      company: 'Other',
      url: 'https://a.com/jobs/2',
    } as never)
    d.repository.moveApplication(first.id, { stage: 'hr_interview', index: 0 })
    expect(
      handleRequest({ type: 'lookup', url: 'https://A.com/jobs/1/?utm_source=x#top' }, d),
    ).toEqual({ ok: true, match: { stage: 'hr_interview' } })
    expect(handleRequest({ type: 'lookup', url: 'https://a.com/jobs/3' }, d)).toEqual({
      ok: true,
      match: null,
    })
  })

  it('refuses invalid input with VALIDATION and unknown requests with PROTOCOL', () => {
    const d = deps()
    expect(
      handleRequest({ type: 'add', title: '', company: 'A', url: 'https://a.com' }, d),
    ).toMatchObject({
      ok: false,
      error: { code: 'VALIDATION' },
    })
    expect(handleRequest({ type: 'lookup', url: 'javascript:alert(1)' }, d)).toMatchObject({
      ok: false,
      error: { code: 'VALIDATION' },
    })
    expect(handleRequest({ type: 'list' }, d)).toMatchObject({
      ok: false,
      error: { code: 'PROTOCOL' },
    })
    expect(handleRequest(null, d)).toMatchObject({ ok: false, error: { code: 'PROTOCOL' } })
    expect(d.repository.listApplications()).toHaveLength(0)
  })

  it('reports a hidden Applied stage and a missing database', () => {
    const d = deps()
    d.repository.setHiddenStages(['applied'])
    expect(
      handleRequest({ type: 'add', title: 'QA', company: 'A', url: 'https://a.com' }, d),
    ).toMatchObject({ ok: false, error: { code: 'VALIDATION' } })
    expect(
      handleRequest({ type: 'lookup', url: 'https://a.com' }, { ...d, repository: null }),
    ).toEqual({ ok: false, error: { code: 'STORAGE', message: 'no database' } })
  })

  it('reports a failed write as STORAGE', () => {
    const d = deps()
    d.db.close()
    expect(
      handleRequest({ type: 'add', title: 'QA', company: 'A', url: 'https://a.com' }, d),
    ).toMatchObject({ ok: false, error: { code: 'STORAGE' } })
  })
})

describe('connector run (spec 019 FR-009)', () => {
  it('answers hello without opening the database', async () => {
    const output = new PassThrough()
    let opened = false
    const code = await runConnector({
      version: '1.0.0',
      open: () => {
        opened = true
        throw new Error('not expected')
      },
      input: frameOf({ type: 'hello' }),
      output,
    })
    expect(code).toBe(0)
    expect(opened).toBe(false)
    expect(await decoded(output)).toMatchObject({ ok: true, version: '1.0.0' })
  })

  it('opens and closes the database for an add', async () => {
    const d = deps()
    const output = new PassThrough()
    let closed = false
    await runConnector({
      version: '1.0.0',
      open: () => ({ repository: d.repository, storageProblem: '', close: () => (closed = true) }),
      input: frameOf({ type: 'add', title: 'QA', company: 'A', url: 'https://a.com/1' }),
      output,
    })
    expect(closed).toBe(true)
    expect(await decoded(output)).toEqual({ ok: true, stage: 'applied' })
  })

  it('answers PROTOCOL and exits with 1 for a broken frame', async () => {
    const output = new PassThrough()
    const input = new PassThrough()
    input.end(Buffer.from([1, 0]))
    const code = await runConnector({ version: '1', open: () => ({}) as never, input, output })
    expect(code).toBe(1)
    expect(await decoded(output)).toMatchObject({ ok: false, error: { code: 'PROTOCOL' } })
  })
})
