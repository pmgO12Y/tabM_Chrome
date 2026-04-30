export interface RectLike {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface TooltipSize {
  width: number;
  height: number;
}

export interface ToolbarTooltipPlacementInput {
  anchorRect: RectLike;
  tooltipSize: TooltipSize;
  containerRect: RectLike;
  gap?: number;
  safeMargin?: number;
  preferredPlacement?: "top" | "bottom";
}

export interface ToolbarTooltipPlacement {
  left: number;
  top: number;
  placement: "bottom" | "top";
}

export function calculateToolbarTooltipPlacement({
  anchorRect,
  tooltipSize,
  containerRect,
  gap = 6,
  safeMargin = 8,
  preferredPlacement
}: ToolbarTooltipPlacementInput): ToolbarTooltipPlacement {
  const anchorLeft = anchorRect.left - containerRect.left;
  const anchorTop = anchorRect.top - containerRect.top;

  const rawLeft = anchorLeft + anchorRect.width / 2 - tooltipSize.width / 2;
  const maxLeft = Math.max(safeMargin, containerRect.width - safeMargin - tooltipSize.width);
  const left = clamp(rawLeft, safeMargin, maxLeft);

  const preferredBottomTop = anchorTop + anchorRect.height + gap;
  const fitsBelow = preferredBottomTop + tooltipSize.height <= containerRect.height - safeMargin;
  const preferredTopTop = anchorTop - gap - tooltipSize.height;
  let top: number;
  let placement: "bottom" | "top";

  if (preferredPlacement === "top") {
    top = preferredTopTop;
    placement = "top";
  } else if (preferredPlacement === "bottom") {
    top = preferredBottomTop;
    placement = "bottom";
  } else if (fitsBelow) {
    top = preferredBottomTop;
    placement = "bottom";
  } else {
    top = preferredTopTop;
    placement = "top";
  }

  const maxTop = Math.max(safeMargin, containerRect.height - safeMargin - tooltipSize.height);
  top = clamp(top, safeMargin, maxTop);

  return {
    left,
    top,
    placement
  };
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}
