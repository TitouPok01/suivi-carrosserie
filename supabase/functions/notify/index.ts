// Edge Function "notify" : envoie les notifications aux téléphones et tablettes.
// Appelée automatiquement par la base (voir supabase/notifications.sql) quand
// une urgence ou un message est ajouté, ou quand une voiture change d'étape.
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
webpush.setVapidDetails(
  Deno.env.get("VAPID_SUBJECT") ?? "mailto:atelier@example.com",
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  Deno.env.get("VAPID_PRIVATE_KEY")!,
);

const STAGE: Record<string, string> = {
  pcl: "Entrée au PCL", reparation: "Réparation", finition: "Finition",
  controle: "Contrôle final", lavage: "Lavage", pret: "Prête",
};

type Row = { id?: string; data?: Record<string, any> };

async function carName(id: string): Promise<string> {
  const { data } = await sb.from("vehicles").select("data").eq("id", id).maybeSingle();
  const d = data?.data;
  return d ? `${d.plate ?? ""} · ${d.model ?? ""}` : "";
}
function lastBy(d: Record<string, any>): string {
  const h = Array.isArray(d.history) ? d.history : [];
  return h.length ? (h[h.length - 1].by ?? "") : "";
}

Deno.serve(async (req) => {
  if (req.headers.get("x-webhook-secret") !== Deno.env.get("WEBHOOK_SECRET")) {
    return new Response("forbidden", { status: 401 });
  }
  const p = await req.json() as { type: string; table: string; record: Row; old_record: Row | null };
  const rec = p.record?.data ?? {};
  const old = p.old_record?.data ?? {};

  let target = "all"; // "atelier", "deviseur" ou "all"
  let actor = "";
  let title = "";
  let body = "";
  let vid = "";

  if (p.table === "tasks" && p.type === "INSERT") {
    vid = rec.vehicle; target = rec.for || "all"; actor = rec.by || "";
    title = `Urgence · ${await carName(vid)}`;
    body = `${rec.kind === "piece" ? "Pièce à commander" : "À faire"} : ${rec.text ?? ""}`;
  } else if (p.table === "messages" && p.type === "INSERT") {
    vid = rec.vehicle; actor = rec.by || "";
    target = rec.role === "atelier" ? "deviseur" : rec.role === "deviseur" ? "atelier" : "all";
    title = `Message${rec.by ? " de " + rec.by : ""} · ${await carName(vid)}`;
    body = rec.text ?? "";
  } else if (p.table === "vehicles" && p.type === "INSERT") {
    vid = p.record.id!; actor = lastBy(rec);
    title = "Nouvelle voiture";
    body = `${rec.plate ?? ""} · ${rec.model ?? ""}`;
  } else if (p.table === "vehicles" && p.type === "UPDATE" && rec.stage !== old.stage &&
             ["finition", "pret"].includes(rec.stage) && !rec.delivered) {
    vid = p.record.id!; actor = lastBy(rec);
    title = rec.stage === "finition" ? "Bientôt finie" : "Prête à livrer";
    body = `${rec.plate ?? ""} · ${rec.model ?? ""} → ${STAGE[rec.stage]}`;
  } else {
    return new Response("ignored");
  }

  const { data: subs } = await sb.from("push_subs").select("endpoint, sub, name, role");
  const list = (subs ?? []).filter((s) =>
    (target === "all" || s.role === target) && (!actor || s.name !== actor)
  );
  const payload = JSON.stringify({ title, body, url: `./#v=${vid}`, tag: `${p.table}-${vid}` });

  let sent = 0;
  await Promise.all(list.map(async (s) => {
    try {
      await webpush.sendNotification(s.sub, payload, { TTL: 86400 });
      sent++;
    } catch (e: any) {
      if (e?.statusCode === 404 || e?.statusCode === 410) {
        await sb.from("push_subs").delete().eq("endpoint", s.endpoint);
      }
    }
  }));
  return new Response(JSON.stringify({ sent, of: list.length }), { headers: { "Content-Type": "application/json" } });
});
