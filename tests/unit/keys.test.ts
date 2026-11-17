import { describe, expect, it } from "vitest";
import { inkShortcut } from "../../src/components/keys";

const key = (k: string, mods: Partial<KeyboardEvent> = {}) =>
  ({
    key: k,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    ...mods,
  }) as KeyboardEvent;

describe("手書きのショートカット", () => {
  it("Ctrl/⌘+Z は戻す、Shift 付きか Ctrl+Y はやり直す、修飾なしは何もしない", () => {
    expect(inkShortcut(key("z", { ctrlKey: true }))).toBe("undo");
    expect(inkShortcut(key("z", { metaKey: true }))).toBe("undo");
    expect(inkShortcut(key("Z", { metaKey: true, shiftKey: true }))).toBe(
      "redo",
    );
    expect(inkShortcut(key("y", { ctrlKey: true }))).toBe("redo");
    expect(inkShortcut(key("z"))).toBeNull();
    expect(inkShortcut(key("a", { ctrlKey: true }))).toBeNull();
  });
});
