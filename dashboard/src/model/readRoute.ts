/** 에이전트 프롬프트 끝의 "작업 지식 (Vault)" 절에서 읽은 경로와 노트 목록을 뽑는다. */
export interface ReadRoute {
  /** 그래프를 따라 읽었으면 "작업 · 구현 → knowledge" 같은 단계, 단계 노트로 대신했으면 빈 배열 */
  steps: string[]
  /** 붙은 노트의 Vault 경로, 붙은 순서대로 */
  notes: string[]
}

export function readRoute(prompt: string): ReadRoute | null {
  const at = prompt.indexOf('\n## 작업 지식 (Vault)')
  if (at < 0) return null
  const sec = prompt.slice(at)
  const steps = /^읽은 경로: (.+)$/m.exec(sec)?.[1]?.split(' · ').map((s) => s.trim()).filter(Boolean) ?? []
  const notes = [...sec.matchAll(/^### (.+\.md)$/gm)].map((m) => m[1]!)
  return { steps, notes }
}
