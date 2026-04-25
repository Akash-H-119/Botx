import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users as UsersIcon, Shield, ShieldOff } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
}

const AdminUsers = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [admins, setAdmins] = useState<Set<string>>(new Set());

  const load = async () => {
    const [{ data: profs }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id,role").eq("role", "admin"),
    ]);
    setProfiles((profs ?? []) as Profile[]);
    setAdmins(new Set((roles ?? []).map((r) => r.user_id)));
  };

  useEffect(() => {
    document.title = "Admin · Users — CipherBots";
    load();
  }, []);

  const toggleAdmin = async (userId: string, makeAdmin: boolean) => {
    if (makeAdmin) {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
      if (error) toast.error(error.message);
      else { toast.success("Admin role granted"); load(); }
    } else {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
      if (error) toast.error(error.message);
      else { toast.success("Admin role revoked"); load(); }
    }
  };

  return (
    <AdminLayout>
      <h1 className="font-display text-3xl font-bold mb-2">Users</h1>
      <p className="text-muted-foreground mb-8">Grant or revoke admin access.</p>

      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left p-4">User</th>
              <th className="text-left p-4 hidden md:table-cell">Joined</th>
              <th className="text-left p-4">Role</th>
              <th className="text-right p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {profiles.length === 0 && (
              <tr><td colSpan={4} className="p-12 text-center text-muted-foreground">
                <UsersIcon className="h-10 w-10 mx-auto mb-2 opacity-30" />
                No users yet.
              </td></tr>
            )}
            {profiles.map((p) => {
              const isAdmin = admins.has(p.id);
              return (
                <tr key={p.id} className="border-b border-border/30 last:border-0 hover:bg-muted/20">
                  <td className="p-4">
                    <div className="font-medium">{p.display_name || "—"}</div>
                    <div className="text-xs text-muted-foreground">{p.email}</div>
                  </td>
                  <td className="p-4 hidden md:table-cell text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="p-4">
                    {isAdmin ? (
                      <Badge className="bg-gradient-primary border-0">Admin</Badge>
                    ) : (
                      <Badge variant="outline">User</Badge>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <Button variant="outline" size="sm" onClick={() => toggleAdmin(p.id, !isAdmin)}>
                      {isAdmin ? <><ShieldOff className="h-3.5 w-3.5" /> Revoke</> : <><Shield className="h-3.5 w-3.5" /> Make admin</>}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        Tip: To bootstrap your first admin, sign up first, then run an SQL update on the user_roles table to assign yourself the admin role.
      </p>
    </AdminLayout>
  );
};

export default AdminUsers;
