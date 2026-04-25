import { describe, expect, it } from "vitest";
import { calculateToolbarTooltipPlacement, type RectLike } from "../src/sidepanel/toolbarTooltip";

function makeRect(left: number, top: number, width: number, height: number): RectLike {
  return {
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height
  };
}

describe("toolbarTooltip", () => {
  it("centers below the button when there is enough space", () => {
    expect(
      calculateToolbarTooltipPlacement({
        anchorRect: makeRect(80, 20, 28, 28),
        tooltipSize: { width: 64, height: 30 },
        containerRect: makeRect(0, 0, 200, 160)
      })
    ).toEqual({
      left: 62,
      top: 54,
      placement: "bottom"
    });
  });

  it("clamps to the left safe margin", () => {
    expect(
      calculateToolbarTooltipPlacement({
        anchorRect: makeRect(2, 20, 28, 28),
        tooltipSize: { width: 80, height: 30 },
        containerRect: makeRect(0, 0, 200, 160)
      })
    ).toEqual({
      left: 8,
      top: 54,
      placement: "bottom"
    });
  });

  it("clamps to the right safe margin", () => {
    expect(
      calculateToolbarTooltipPlacement({
        anchorRect: makeRect(178, 20, 28, 28),
        tooltipSize: { width: 80, height: 30 },
        containerRect: makeRect(0, 0, 200, 160)
      })
    ).toEqual({
      left: 112,
      top: 54,
      placement: "bottom"
    });
  });

  it("flips above when there is not enough room below", () => {
    expect(
      calculateToolbarTooltipPlacement({
        anchorRect: makeRect(80, 72, 28, 28),
        tooltipSize: { width: 64, height: 30 },
        containerRect: makeRect(0, 0, 200, 120)
      })
    ).toEqual({
      left: 62,
      top: 36,
      placement: "top"
    });
  });

  it("keeps the tooltip inside the container even after flipping", () => {
    expect(
      calculateToolbarTooltipPlacement({
        anchorRect: makeRect(80, 6, 28, 28),
        tooltipSize: { width: 64, height: 40 },
        containerRect: makeRect(0, 0, 120, 50)
      })
    ).toEqual({
      left: 48,
      top: 8,
      placement: "top"
    });
  });
});
