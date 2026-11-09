import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { ReadRoute } from '../model/readRoute'

let vaultName: Promise<string | undefined> | undefined
/** 노트를 Obsidian에서 열 링크용 Vault 이름. 화면마다 묻지 않게 한 번만 읽는다. */
function useVaultName(): string | undefined {
  const [name, setName] = useState<string>()
  useEffect(() => {
    vaultName ??= api.vault().then((v) => (v.state === 'connected' ? v.name : undefined)).catch(() => undefined)
    let live = true
    void vaultName.then((n) => { if (live) setName(n) })
    return () => { live = false }
  }, [])
  return name
}

/** 에이전트·스킬 실행이 Vault에서 읽은 경로와 노트 목록. 노트는 Vault가 연결돼 있으면 Obsidian 링크다. */
export function ReadRouteList({ route }: { route: ReadRoute }) {
  const name = useVaultName()
  return (
    <>
      <p className="read-route-mode">{route.steps.length ? '전문가 그래프를 따라 읽음' : '파이프라인 단계 노트로 대신 읽음'}</p>
      {route.steps.length > 0 && <ol className="read-route-steps">{route.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>}
      <ul className="read-route-notes">
        {route.notes.map((n) => (
          <li key={n}>{name
            ? <a href={`obsidian://open?vault=${encodeURIComponent(name)}&file=${encodeURIComponent(n.replace(/\.md$/, ''))}`}>{n}</a>
            : <span className="mono">{n}</span>}</li>
        ))}
      </ul>
    </>
  )
}
