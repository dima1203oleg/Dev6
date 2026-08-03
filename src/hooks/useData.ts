import React from "react";
import type { DataSourceError, DataSourceResult, Provenance } from "../services/dataTypes";

export interface AsyncData<T> {
  loading: boolean;
  data?: T;
  provenance?: Provenance;
  error?: DataSourceError;
}

export const useData = <T>(
  loader: () => Promise<DataSourceResult<T>>,
  dependencies: React.DependencyList,
): AsyncData<T> & { reload: () => Promise<void> } => {
  const loaderRef = React.useRef(loader);
  loaderRef.current = loader;
  const [state, setState] = React.useState<AsyncData<T>>({ loading: true });
  const load = React.useCallback(async () => {
    setState({ loading: true });
    const result = await loaderRef.current();
    setState(
      "error" in result
        ? { loading: false, error: result.error }
        : { loading: false, data: result.data, provenance: result.provenance },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
  // The caller owns the dependency list; the loader itself is intentionally held in a ref.
  React.useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
  return { ...state, reload: load };
};
