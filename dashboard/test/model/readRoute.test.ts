import { describe, expect, it } from 'vitest'
import { readRoute } from '../../src/model/readRoute'

describe('읽은 지식 경로', () => {
  it('그래프 경로와 노트를 순서대로 뽑는다', () => {
    const prompt = '지시\n\n## 작업 지식 (Vault) — 따르세요.\n읽은 경로: 작업 · 구현 → knowledge · 구현 → done\n\n### P/00 파이프라인 설계.md\n본문\n\n### wiki/G/작업/구현.md\n구현\n'
    expect(readRoute(prompt)).toEqual({ steps: ['작업', '구현 → knowledge', '구현 → done'], notes: ['P/00 파이프라인 설계.md', 'wiki/G/작업/구현.md'] })
  })
  it('단계 노트로 대신했으면 경로는 비고, 절이 없으면 null', () => {
    expect(readRoute('x\n## 작업 지식 (Vault) — y\n### P/02 시드.md\n시드')).toEqual({ steps: [], notes: ['P/02 시드.md'] })
    expect(readRoute('그냥 프롬프트')).toBeNull()
  })
})
