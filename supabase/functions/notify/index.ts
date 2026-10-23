// Edge Function "notify" : envoie les notifications aux téléphones et tablettes.
// Appelée automatiquement par la base (voir supabase/notifications.sql) :
//  - quand une urgence ou un message est ajouté, ou une nouvelle voiture entre ;
//  - quand une voiture passe en finition / prête, ou qu'un retard est annoncé ;
//  - chaque matin (rappel des voitures à finir demain et des dates dépassées).
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
type D = Record<string, any>;
type Row = { id?: string; data?: D };

const todayBrussels = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Brussels" }).format(new Date());
const dayNum = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); return Date.UTC(y, m - 1, d) / 864e5; };
const fmtDate = (iso: string) => new Date(iso + "T12:00:00Z").toLocaleDateString("fr-BE", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Brussels" });
const dlTxt = (n: number) => (n < 7 || n % 7 ? `${n} j` : `${n / 7} sem.`);
const car = (d: D) => `${d.plate ?? ""} · ${d.model ?? ""}`;

async function carName(id: string): Promise<string> {
  const { data } = await sb.from("vehicles").select("data").eq("id", id).maybeSingle();
  return data?.data ? car(data.data) : "";
}
function lastBy(d: D): string {
  const h = Array.isArray(d.history) ? d.history : [];
  return h.length ? (h[h.length - 1].by ?? "") : "";
}

async function send(target: string, actor: string, title: string, body: string, vid: string, tag: string) {
  const { data: subs } = await sb.from("push_subs").select("endpoint, sub, name, role");
  const list = (subs ?? []).filter((s) => (target === "all" || s.role === target) && (!actor || s.name !== actor));
  const payload = JSON.stringify({ title, body, url: vid ? `./#v=${vid}` : "./", tag });
  let sent = 0;
  await Promise.all(list.map(async (s) => {
    try { await webpush.sendNotification(s.sub, payload, { TTL: 86400 }); sent++; }
    catch (e: any) {
      if (e?.statusCode === 404 || e?.statusCode === 410) await sb.from("push_subs").delete().eq("endpoint", s.endpoint);
    }
  }));
  return sent;
}

async function daily() {
  const today = dayNum(todayBrussels());
  const { data } = await sb.from("vehicles").select("id, data");
  const open = (data ?? []).filter((r) => r.data && !r.data.delivered && ["pcl", "reparation"].includes(r.data.stage ?? "pcl") && r.data.due);
  const tomorrow = open.filter((r) => dayNum(r.data.due) - today === 1);
  const late = open.filter((r) => dayNum(r.data.due) < today);
  let sent = 0;
  if (tomorrow.length) {
    const one = tomorrow.length === 1;
    sent += await send("all", "", one ? "À finir demain" : `${tomorrow.length} voitures à finir demain`,
      tomorrow.map((r) => car(r.data)).join("\n"), one ? tomorrow[0].id : "", "daily-tomorrow");
  }
  if (late.length) {
    const one = late.length === 1;
    sent += await send("all", "", one ? "Date de fin dépassée" : `${late.length} voitures en retard`,
      late.map((r) => `${car(r.data)} (prévue ${fmtDate(r.data.due)})`).join("\n"), one ? late[0].id : "", "daily-late");
  }
  return sent;
}

Deno.serve(async (req) => {
  if (req.headers.get("x-webhook-secret") !== Deno.env.get("WEBHOOK_SECRET")) {
    return new Response("forbidden", { status: 401 });
  }
  const p = await req.json() as { type: string; table?: string; record?: Row; old_record?: Row | null };
  const json = (o: unknown) => new Response(JSON.stringify(o), { headers: { "Content-Type": "application/json" } });

  if (p.type === "DAILY") return json({ sent: await daily() });

  const rec: D = p.record?.data ?? {};
  const old: D = p.old_record?.data ?? {};
  const id = p.record?.id ?? "";

  if (p.table === "tasks" && p.type === "INSERT") {
    return json({ sent: await send(rec.for || "all", rec.by || "", `Urgence · ${await carName(rec.vehicle)}`,
      `${rec.kind === "piece" ? "Pièce à commander" : "À faire"} : ${rec.text ?? ""}`, rec.vehicle, `task-${rec.vehicle}`) });
  }
  if (p.table === "messages" && p.type === "INSERT") {
    const target = rec.role === "atelier" ? "deviseur" : rec.role === "deviseur" ? "atelier" : "all";
    return json({ sent: await send(target, rec.by || "", `Message${rec.by ? " de " + rec.by : ""} · ${await carName(rec.vehicle)}`,
      rec.text ?? "", rec.vehicle, `msg-${rec.vehicle}`) });
  }
  if (p.table === "vehicles" && p.type === "INSERT") {
    return json({ sent: await send("all", lastBy(rec), "Nouvelle voiture", car(rec), id, `car-${id}`) });
  }
  if (p.table === "vehicles" && p.type === "UPDATE" && !rec.delivered) {
    const nd = rec.delay ?? {}, od = old.delay ?? {};
    if (nd.on && (nd.days || 0) > 0 && (nd.days || 0) !== (od.days || 0)) {
      const body = `${car(rec)} : +${dlTxt(nd.days)}${nd.cause ? " (" + nd.cause + ")" : ""}${rec.due ? " · finie pour le " + fmtDate(rec.due) : ""}`;
      return json({ sent: await send("all", lastBy(rec), "Retard annoncé", body, id, `delay-${id}`) });
    }
    if (rec.stage !== old.stage && ["finition", "pret"].includes(rec.stage)) {
      return json({ sent: await send("all", lastBy(rec), rec.stage === "finition" ? "Bientôt finie" : "Prête à livrer",
        `${car(rec)} → ${STAGE[rec.stage]}`, id, `stage-${id}`) });
    }
  }
  return new Response("ignored");
});
