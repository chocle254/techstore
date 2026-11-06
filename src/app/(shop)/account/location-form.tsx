"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ksh } from "@/lib/format";
import { saveLocationAction, type ShopState } from "../actions";

function Save() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="jw-btn">
      {pending ? "Saving…" : "Save location"}
    </button>
  );
}

export function LocationForm({
  areas,
  saved,
}: {
  areas: { id: string; name: string; fee: number }[];
  saved: { areaId: string | null; address: string | null; lat: string | null; lng: string | null } | null;
}) {
  const [state, action] = useActionState<ShopState, FormData>(saveLocationAction, undefined);
  return (
    <form action={action} className="mt-6 space-y-5">
      <input type="hidden" name="lat" value={saved?.lat ?? ""} />
      <input type="hidden" name="lng" value={saved?.lng ?? ""} />
      <label className="block">
        <span className="jw-label">Area</span>
        <select name="areaId" defaultValue={saved?.areaId ?? ""} className="jw-input">
          <option value="">Not set</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} · {a.fee > 0 ? ksh(a.fee) : "free"}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="jw-label">Directions for the rider</span>
        <textarea name="address" rows={3} maxLength={300} defaultValue={saved?.address ?? ""} className="jw-input" />
      </label>
      {saved?.lat && <p className="text-jw-soft">Map pin saved. Move it at your next checkout.</p>}
      <Save />
      {state?.error && <p role="alert">{state.error}</p>}
      {state?.ok && <p role="status">{state.ok}</p>}
    </form>
  );
}
