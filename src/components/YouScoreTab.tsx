import React from "react";
import KeyedLookupSurface from "./KeyedLookupSurface";
export default function YouScoreTab(_props: Record<string, unknown>) {
  return <KeyedLookupSurface title="YouScore / YouControl" envVar="YOUSCORE_API_KEY" endpoint="/api/youscore/query" />;
}
