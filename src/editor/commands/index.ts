import type { DesignValue, ID } from "../schema";

export interface Command {
  execute(): DesignValue;
  undo(): DesignValue;
  description: string;
}

export interface HistoryState {
  commands: Command[];
  currentIndex: number;
}

export class HistoryManager {
  private history: Command[] = [];
  private currentIndex = -1;
  private maxHistorySize = 50;

  executeCommand(command: Command): DesignValue {
    // Remove any commands after current index (when we're in the middle of history)
    this.history = this.history.slice(0, this.currentIndex + 1);

    // Add new command
    this.history.push(command);

    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    } else {
      this.currentIndex++;
    }

    return command.execute();
  }

  canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  undo(): DesignValue | null {
    if (!this.canUndo()) {
      return null;
    }

    const command = this.history[this.currentIndex];
    this.currentIndex--;
    return command.undo();
  }

  redo(): DesignValue | null {
    if (!this.canRedo()) {
      return null;
    }

    this.currentIndex++;
    const command = this.history[this.currentIndex];
    return command.execute();
  }

  getState(): HistoryState {
    return {
      commands: [...this.history],
      currentIndex: this.currentIndex,
    };
  }

  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }
}

// Base command implementations
export abstract class BaseCommand implements Command {
  protected previousValue: DesignValue;
  protected nextValue: DesignValue;

  constructor(
    previousValue: DesignValue,
    nextValue: DesignValue,
    public description: string
  ) {
    this.previousValue = structuredClone(previousValue);
    this.nextValue = structuredClone(nextValue);
  }

  execute(): DesignValue {
    return structuredClone(this.nextValue);
  }

  undo(): DesignValue {
    return structuredClone(this.previousValue);
  }
}

export class CreateShapeCommand extends BaseCommand {
  constructor(previousValue: DesignValue, nextValue: DesignValue, shapeId: ID) {
    super(previousValue, nextValue, `Create shape ${shapeId}`);
  }
}

export class DeleteShapeCommand extends BaseCommand {
  constructor(previousValue: DesignValue, nextValue: DesignValue, shapeIds: ID[]) {
    const description = shapeIds.length === 1
      ? `Delete shape ${shapeIds[0]}`
      : `Delete ${shapeIds.length} shapes`;
    super(previousValue, nextValue, description);
  }
}

export class UpdateShapeCommand extends BaseCommand {
  constructor(previousValue: DesignValue, nextValue: DesignValue, shapeIds: ID[], operation: string) {
    const description = shapeIds.length === 1
      ? `${operation} shape ${shapeIds[0]}`
      : `${operation} ${shapeIds.length} shapes`;
    super(previousValue, nextValue, description);
  }
}