import type { Mode, QuestionId, RangeSpec } from "../domain/types";

/** 結果画面から「練習してからもう一度」を選んだときの予定（画面の中だけ。保存しない） */
export interface PracticePlan {
  /** 練習する問題（その回で間違えた問題） */
  questionIds: QuestionId[];
  /** 練習のあとに解き直す回 */
  retry: { questionIds: QuestionId[]; mode: Mode; range?: RangeSpec };
}

class PracticePlanState {
  current = $state.raw<PracticePlan | null>(null);

  set(plan: PracticePlan) {
    this.current = plan;
  }
  clear() {
    this.current = null;
  }
}

export const practicePlan = new PracticePlanState();
