import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { loadGraph } from '../../src/context/expertGraph.js'
import { lintGraph, lintReport } from '../../src/context/graphLint.js'

describe('그래프 점검', () => {
  it('깨진 연결·완료 기준 없음·실행 키 없음·고아·긴 노트·알 수 없는 종류를 찾는다', () => {
    const root = mkdtempSync(join(tmpdir(), 'lint-'))
    const g = join(root, 'G')
    mkdirSync(g)
    const w = (n: string, fm: string, body = 'x') => writeFileSync(join(g, `${n}.md`), `---\n${fm}\n---\n${body}`)
    w('구현', 'type: 작업\napplies_to: [dev]\nknowledge: ["[[없는 지식]]"]\ndone: "[[구현 기준]]"')
    w('기획', 'type: 작업')
    w('구현 기준', 'type: 기준')
    w('남은 지식', 'type: 지식', '가'.repeat(3100))
    w('이상한', 'type: 메모')
    const r = lintGraph(loadGraph(g, root), new Date('2026-11-02T00:00:00Z'))
    const kinds = r.findings.map((f) => `${f.kind}:${f.node}`).sort()
    expect(kinds).toEqual(['bad-type:이상한', 'broken:구현', 'no-applies:기획', 'no-done:기획', 'orphan:남은 지식', 'too-long:남은 지식'])
    expect(r).toMatchObject({ nodes: 5, tasks: 2 })
    expect(lintReport(r, 'G')).toContain('| 깨진 연결 | [[G/구현|구현]] | knowledge → [[없는 지식]] 노트 없음 |')
  })
})
