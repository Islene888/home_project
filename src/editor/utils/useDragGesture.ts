import { type PointerEvent, type PointerEventHandler, useRef } from "react";

interface DragState<Snapshot> {
  startX: number;
  startY: number;
  snapshot: Snapshot;
}

interface UseDragGestureProps<Snapshot> {
  onMove: (options: {
    deltaX: number;
    deltaY: number;
    snapshot: Snapshot;
  }) => void;
  onEnd?: () => void;
}

const useDragGesture = <Snapshot>({
  onMove,
  onEnd,
}: UseDragGestureProps<Snapshot>) => {
  const dragStateRef = useRef<DragState<Snapshot> | null>(null);

  const onDragEnd = () => {
    if (!dragStateRef.current) {
      return;
    }

    dragStateRef.current = null;
    onEnd?.();
  };

  const onDragStart = (event: PointerEvent<Element>, snapshot: Snapshot) => {
    // In drag scenarios, typically we should only consider the primary mouse button or touch events, in both cases buttons equals 1
    if (event.buttons !== 1) {
      return;
    }

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Continue without pointer capture if it fails
    }

    dragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      snapshot,
    };
  };

  // Events tracked using pointer capture should use the corresponding lostpointercapture event to listen for end events,
  // rather than using pointerup or pointercancel.
  // https://developer.mozilla.org/en-US/docs/Web/API/Shape/lostpointercapture_event
  const onLostPointerCapture: PointerEventHandler<Element> = () => {
    onDragEnd();
  };

  const onPointerMove: PointerEventHandler<Element> = (event) => {
    const dragState = dragStateRef.current;

    if (!dragState) {
      return;
    }
    if (event.buttons !== 1) {
      onDragEnd();
      return;
    }

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;

    onMove({ deltaX, deltaY, snapshot: dragState.snapshot });
  };

  return {
    onDragStart,
    onDragEnd,
    dragProps: { onPointerMove, onLostPointerCapture },
  };
};

export default useDragGesture;
