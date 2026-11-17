import type { Mode, QuestionId, RangeSpec } from "../domain/types";
import { activeQuiz } from "./active-quiz.svelte";
import { router } from "./router.svelte";

interface LaunchRequest {
  questionIds: QuestionId[];
  mode: Mode;
  range?: RangeSpec;
}

/**
 * 新しい回を始める窓口。採点が終わっていない回があれば、破棄してよいかを先に聞く（仕様書 4.4）。
 * 確認のダイアログは App が `launcher.waiting` を見て出す。
 */
class Launcher {
  waiting = $state.raw<LaunchRequest | null>(null);

  async launch(questionIds: QuestionId[], mode: Mode, range?: RangeSpec) {
    if (questionIds.length === 0) return;
    const request: LaunchRequest = {
      questionIds,
      mode,
      ...(range ? { range } : {}),
    };
    if (activeQuiz.hasUnfinished) {
      this.waiting = request;
      return;
    }
    await this.#start(request);
  }

  /** 途中の回を破棄して始める */
  async confirm() {
    const request = this.waiting;
    this.waiting = null;
    if (!request) return;
    await activeQuiz.discard();
    await this.#start(request);
  }

  cancel() {
    this.waiting = null;
  }

  async #start(r: LaunchRequest) {
    await activeQuiz.start(r.questionIds, r.mode, r.range);
    router.go("answer");
  }
}

export const launcher = new Launcher();
