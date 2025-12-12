import { type StoreApi } from "zustand/vanilla";

export type ReadonlyStoreApi<T> = Pick<
  StoreApi<T>,
  "getState" | "getInitialState" | "subscribe"
>;
