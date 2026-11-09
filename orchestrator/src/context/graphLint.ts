import { EDGES, type GraphNode } from './expertGraph.js'

/**
 * 전문가 그래프 점검. AI를 부르지 않는 규칙 검사라 매일 돌려도 비용이 없다.
 * - broken: 엣지가 없는 노트를 가리킴 (에이전트가 그 노드를 못 읽음)
 * - no-done / no-applies: 작업에 완료 기준·실행 키가 없음 (끝을 판정 못 하거나, 아무도 안 읽음)
 * - orphan: 어떤 작업에서도 닿지 않는 지식·과정·도구·기준 (읽히지 않는 문서)
 * - too-long: 본문이 노드 상한(3천 자)을 넘어 뒷부분이 잘림
 * - bad-type: 종류가 다섯 가지(작업·지식·과정·도구·기준)나 규칙이 아님
 */
export type LintKind = 'broken' | 'no-done' | 'no-applies' | 'orphan' | 'too-long' | 'bad-type'
export interface LintFinding { kind: LintKind; node: string; path: string; detail: string }
export interface LintResult { checkedAt: string; nodes: number; tasks: number; findings: LintFinding[] }

const TYPES = new Set(['작업', '지식', '과정', '도구', '기준', '규칙'])
const LINK = /\[\[([^\]|#]+)(?:[#|][^\]]*)?\]\]/g
const NODE_MAX = 3000

const targets = (v: unknown): string[] => (Array.isArray(v) ? v : typeof v === 'string' ? [v] : [])
  .filter((x): x is string => typeof x === 'string')
  .flatMap((s) => [...s.matchAll(LINK)].map((m) => m[1]!.trim().split('/').at(-1)!))

export function lintGraph(nodes: Map<string, GraphNode>, now = new Date()): LintResult {
  const findings: LintFinding[] = []
  const reached = new Set<string>()
  const add = (kind: LintKind, n: GraphNode, detail: string) => findings.push({ kind, node: n.title, path: n.path, detail })
  const all = [...nodes.values()]
  for (const n of all) {
    if (!TYPES.has(n.type)) add('bad-type', n, `type: ${n.type || '(없음)'}`)
    if (n.body.trim().length > NODE_MAX) add('too-long', n, `${n.body.trim().length}자 (상한 ${NODE_MAX}자)`)
    if (n.type !== '작업') continue
    if (!targets(n.meta.done).length) add('no-done', n, '완료 기준(done) 없음')
    const applies = n.meta.applies_to
    if (!(Array.isArray(applies) ? applies.length : typeof applies === 'string' && applies)) add('no-applies', n, '실행 키(applies_to) 없음')
    for (const e of [...EDGES, 'requires']) {
      for (const t of targets(n.meta[e])) {
        const hit = nodes.get(t.toLowerCase())
        if (!hit) add('broken', n, `${e} → [[${t}]] 노트 없음`)
        else reached.add(hit.title)
      }
    }
  }
  for (const n of all) if (n.type !== '작업' && n.type !== '규칙' && TYPES.has(n.type) && !reached.has(n.title)) add('orphan', n, '어느 작업에서도 연결되지 않음')
  return { checkedAt: now.toISOString(), nodes: all.length, tasks: all.filter((n) => n.type === '작업').length, findings }
}

const LABEL: Record<LintKind, string> = {
  broken: '깨진 연결', 'no-done': '완료 기준 없음', 'no-applies': '실행 키 없음', orphan: '고아 노트', 'too-long': '너무 긴 노트', 'bad-type': '알 수 없는 종류',
}

/** Vault reports/에 남길 점검 보고서(하루 한 파일, 같은 날은 덮어쓴다). */
export function lintReport(r: LintResult, graphDir: string): string {
  const day = r.checkedAt.slice(0, 10)
  const rows = r.findings.map((f) => `| ${LABEL[f.kind]} | [[${f.path.replace(/\.md$/, '')}|${f.node}]] | ${f.detail} |`)
  return [
    '---', `title: "전문가 그래프 점검 ${day}"`, `checked: ${JSON.stringify(r.checkedAt)}`, 'source: newteam-orchestrator', '---', '',
    `# 전문가 그래프 점검 ${day}`, '',
    `대상: \`${graphDir}\` · 노드 ${r.nodes}개 · 작업 ${r.tasks}개 · 문제 ${r.findings.length}건`, '',
    ...(rows.length ? ['| 종류 | 노트 | 내용 |', '|---|---|---|', ...rows] : ['문제 없음.']), '',
  ].join('\n')
}
