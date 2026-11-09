import { useEffect, useState } from 'react'
import { api, type GraphLint } from '../api/client'

const LABEL: Record<GraphLint['findings'][number]['kind'], string> = {
  broken: '깨진 연결', 'no-done': '완료 기준 없음', 'no-applies': '실행 키 없음', orphan: '고아 노트', 'too-long': '너무 긴 노트', 'bad-type': '알 수 없는 종류',
}
const when = new Intl.DateTimeFormat('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })

/** 기본 루틴: 전문가 그래프 점검(AI 호출 없음). 서버 시작 때 한 번, 매일 07시 이후 하루 한 번. */
export function GraphLintCard() {
  const [r, setR] = useState<GraphLint | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string>()
  useEffect(() => { api.graphLint().then(setR).catch((e: unknown) => setErr(e instanceof Error ? e.message : String(e))) }, [])
  const rerun = async () => {
    setBusy(true); setErr(undefined)
    try { setR(await api.runGraphLint()) } catch (e) { setErr(e instanceof Error ? e.message : String(e)) } finally { setBusy(false) }
  }
  return (
    <section className="ws-lint" aria-labelledby="lint-title">
      <div className="ws-lint-head">
        <h2 id="lint-title">전문가 그래프 점검</h2>
        <button type="button" className="btn" disabled={busy} onClick={() => void rerun()}>{busy ? '점검 중…' : '지금 점검'}</button>
      </div>
      <p className="ws-lint-meta">기본 루틴 · 매일 07:00 이후 하루 한 번 · AI 호출 없음 · 결과는 Vault <span className="mono">reports/</span>에도 남습니다</p>
      {err && <p className="acard-error" role="alert">{err}</p>}
      {r && (
        <>
          <p className="ws-lint-summary">
            <strong className={r.findings.length ? 'is-bad' : 'is-ok'}>{r.findings.length ? `문제 ${r.findings.length}건` : '문제 없음'}</strong>
            <span>노드 {r.nodes}개 · 작업 {r.tasks}개 · {when.format(new Date(r.checkedAt))} 점검</span>
          </p>
          {r.findings.length > 0 && (
            <ul className="ws-lint-list">
              {r.findings.map((f, i) => <li key={i}><span className="ws-kind">{LABEL[f.kind]}</span><strong>{f.node}</strong><small>{f.detail}</small></li>)}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
