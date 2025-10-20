import { useMemo } from "react";
import type { IPlatformClient } from "../data/clients/IPlatformClient";
import { platformClientRegistry } from "../handler/getClient";
import Platform from "../types/platform";

export function usePlatformClient(platform: Platform): IPlatformClient {
  return useMemo(() => platformClientRegistry.get(platform), [platform]);
}
