import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Bot, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BotProduct {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  version: string;
  release_notes: string | null;
  supported_exchanges: string[] | null;
  price_usd: number;
  cover_image_url: string | null;
  is_published: boolean;
  is_featured: boolean;
  category_id: string | null;
  features: unknown;
  performance: Record<string, unknown> | null;
  file_path: string | null;
  license_max_activations: number;
  license_expires_days: number | null;
}

interface Category { id: string; name: string }

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const empty = {
  name: "",
  slug: "",
  short_description: "",
  description: "",
  version: "1.0.0",
  release_notes: "",
  supported_exchanges_text: "",
  price_usd: 99,
  cover_image_url: "",
  is_published: false,
  is_featured: false,
  category_id: null as string | null,
  features_text: "",
  performance_text: "",
  license_max_activations: 1,
  license_expires_days: "",
};

const AdminProducts = () => {
  const { user } = useAuth();
  const [bots, setBots] = useState<BotProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BotProduct | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const load = () => {
    supabase
      .from("bots")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setBots((data ?? []) as BotProduct[]));
  };

  useEffect(() => {
    document.title = "Admin - Bots - CipherBots";
    load();
    supabase.from("categories").select("id,name").order("name").then(({ data }) => setCategories((data ?? []) as Category[]));
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };

  const openEdit = (p: BotProduct) => {
    setEditing(p);
    setForm({
      name: p.name,
      slug: p.slug,
      short_description: p.short_description,
      description: p.description,
      version: p.version ?? "1.0.0",
      release_notes: p.release_notes ?? "",
      supported_exchanges_text: Array.isArray(p.supported_exchanges) ? p.supported_exchanges.join("\n") : "",
      price_usd: Number(p.price_usd),
      cover_image_url: p.cover_image_url ?? "",
      is_published: p.is_published,
      is_featured: p.is_featured,
      category_id: p.category_id,
      features_text: Array.isArray(p.features) ? p.features.join("\n") : "",
      performance_text: p.performance ? Object.entries(p.performance).map(([k, v]) => `${k}: ${v}`).join("\n") : "",
      license_max_activations: Number(p.license_max_activations ?? 1),
      license_expires_days: p.license_expires_days ? String(p.license_expires_days) : "",
    });
    setOpen(true);
  };

  const handleCoverUpload = async (file: File) => {
    setUploadingCover(true);
    const path = `covers/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: false });
    if (error) {
      toast.error("Upload failed: " + error.message);
      setUploadingCover(false);
      return;
    }
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    setForm((f) => ({ ...f, cover_image_url: data.publicUrl }));
    setUploadingCover(false);
    toast.success("Cover uploaded");
  };

  const handleFileUpload = async (file: File, botId: string) => {
    setUploadingFile(true);
    const path = `bots/${botId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
    const { error } = await supabase.storage.from("product-files").upload(path, file, { upsert: false });
    if (error) {
      toast.error("File upload failed: " + error.message);
      setUploadingFile(false);
      return;
    }
    await supabase.from("bots").update({ file_path: path }).eq("id", botId);
    toast.success("Bot file uploaded");
    setUploadingFile(false);
    load();
  };

  const handleSave = async () => {
    if (!form.name || !form.short_description || !form.description) {
      toast.error("Name, summary and description are required");
      return;
    }

    setSaving(true);
    const features = form.features_text.split("\n").map((f) => f.trim()).filter(Boolean);
    const supported_exchanges = form.supported_exchanges_text.split("\n").map((f) => f.trim()).filter(Boolean);
    const performance: Record<string, string> = {};

    form.performance_text.split("\n").forEach((line) => {
      const [k, ...rest] = line.split(":");
      if (k && rest.length) performance[k.trim().toLowerCase().replace(/\s+/g, "_")] = rest.join(":").trim();
    });

    const payload = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      short_description: form.short_description,
      description: form.description,
      version: form.version || "1.0.0",
      release_notes: form.release_notes || null,
      supported_exchanges,
      price_usd: form.price_usd,
      cover_image_url: form.cover_image_url || null,
      is_published: form.is_published,
      is_featured: form.is_featured,
      category_id: form.category_id,
      features,
      performance,
      license_max_activations: form.license_max_activations,
      license_expires_days: form.license_expires_days ? Number(form.license_expires_days) : null,
      created_by: user?.id ?? null,
    };

    const { error } = editing
      ? await supabase.from("bots").update(payload).eq("id", editing.id)
      : await supabase.from("bots").insert(payload);

    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? "Bot updated" : "Bot created");
    setOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this bot? This cannot be undone.")) return;
    const { error } = await supabase.from("bots").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      load();
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold">Bots</h1>
          <p className="text-muted-foreground mt-1">Manage trading bots in the marketplace.</p>
        </div>
        <Button variant="hero" onClick={openNew}><Plus className="h-4 w-4" /> New bot</Button>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left p-4">Bot</th>
              <th className="text-left p-4 hidden md:table-cell">Price</th>
              <th className="text-left p-4 hidden md:table-cell">Status</th>
              <th className="text-left p-4 hidden md:table-cell">File</th>
              <th className="text-right p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bots.length === 0 && (
              <tr><td colSpan={5} className="p-12 text-center text-muted-foreground">
                <Bot className="h-10 w-10 mx-auto mb-2 opacity-30" />
                No bots yet. Click "New bot" to add one.
              </td></tr>
            )}
            {bots.map((p) => (
              <tr key={p.id} className="border-b border-border/30 last:border-0 hover:bg-muted/20">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-muted overflow-hidden flex-shrink-0">
                      {p.cover_image_url ? (
                        <img src={p.cover_image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Bot className="h-4 w-4 text-muted-foreground/50" /></div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">/{p.slug} - v{p.version}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4 hidden md:table-cell font-mono">${Number(p.price_usd).toFixed(0)}</td>
                <td className="p-4 hidden md:table-cell">
                  <div className="flex gap-1.5">
                    <Badge variant={p.is_published ? "default" : "outline"} className={p.is_published ? "bg-success/20 text-success border-success/30" : ""}>
                      {p.is_published ? "Published" : "Draft"}
                    </Badge>
                    {p.is_featured && <Badge className="bg-gradient-accent border-0">Featured</Badge>}
                  </div>
                </td>
                <td className="p-4 hidden md:table-cell">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], p.id)}
                    />
                    {p.file_path ? (
                      <Badge variant="outline" className="text-success border-success/30">Uploaded</Badge>
                    ) : (
                      <Badge variant="outline" className="text-warning border-warning/30 cursor-pointer">
                        <Upload className="h-3 w-3 mr-1" /> Upload
                      </Badge>
                    )}
                  </label>
                </td>
                <td className="p-4 text-right">
                  <div className="flex gap-1 justify-end">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl glass-strong max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit bot" : "New bot"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.slug || slugify(e.target.value) })} />
              </div>
              <div>
                <Label>Slug</Label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} />
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <Label>Price (USD)</Label>
                <Input type="number" step="0.01" min={0} value={form.price_usd} onChange={(e) => setForm({ ...form, price_usd: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Version</Label>
                <Input value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} />
              </div>
              <div>
                <Label>Max activations</Label>
                <Input type="number" min={1} value={form.license_max_activations} onChange={(e) => setForm({ ...form, license_max_activations: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <Label>Short description</Label>
              <Input value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} maxLength={140} />
            </div>
            <div>
              <Label>Full description</Label>
              <Textarea rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={form.category_id ?? "none"} onValueChange={(v) => setForm({ ...form, category_id: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>License expiry days</Label>
                <Input value={form.license_expires_days} onChange={(e) => setForm({ ...form, license_expires_days: e.target.value })} placeholder="Blank for lifetime" />
              </div>
            </div>
            <div>
              <Label>Cover image</Label>
              <div className="flex items-center gap-3 mt-1.5">
                {form.cover_image_url && (
                  <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden">
                    <img src={form.cover_image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <label className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleCoverUpload(e.target.files[0])}
                  />
                  <Button type="button" variant="outline" className="w-full" disabled={uploadingCover} asChild>
                    <span>{uploadingCover ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Upload className="h-4 w-4" /> Upload image</>}</span>
                  </Button>
                </label>
              </div>
            </div>
            <div>
              <Label>Supported exchanges (one per line)</Label>
              <Textarea rows={3} value={form.supported_exchanges_text} onChange={(e) => setForm({ ...form, supported_exchanges_text: e.target.value })} placeholder="Binance&#10;Bybit&#10;Coinbase" />
            </div>
            <div>
              <Label>Features (one per line)</Label>
              <Textarea rows={4} value={form.features_text} onChange={(e) => setForm({ ...form, features_text: e.target.value })} placeholder="Multi-exchange support&#10;Backtested on 5 years of data&#10;Built-in risk management" />
            </div>
            <div>
              <Label>Performance metrics (key: value, one per line)</Label>
              <Textarea rows={4} value={form.performance_text} onChange={(e) => setForm({ ...form, performance_text: e.target.value })} placeholder="Annual ROI: 142%&#10;Max drawdown: 18%&#10;Sharpe ratio: 2.4" />
            </div>
            <div>
              <Label>Release notes</Label>
              <Textarea rows={3} value={form.release_notes} onChange={(e) => setForm({ ...form, release_notes: e.target.value })} />
            </div>
            <div className="flex items-center justify-between p-3 glass rounded-lg">
              <Label className="cursor-pointer">Published</Label>
              <Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} />
            </div>
            <div className="flex items-center justify-between p-3 glass rounded-lg">
              <Label className="cursor-pointer">Featured on homepage</Label>
              <Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="hero" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminProducts;
