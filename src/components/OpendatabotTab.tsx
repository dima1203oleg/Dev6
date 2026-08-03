import React from "react";
import KeyedLookupSurface from "./KeyedLookupSurface";
export default function OpendatabotTab(_props: Record<string, unknown>) {
  return <KeyedLookupSurface title="Opendatabot" envVar="OPENDATABOT_API_KEY" endpoint="/api/opendatabot/search" />;
}
