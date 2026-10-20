import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { ContactSearch } from "./contact-search";

export const instant = false;

export default async function ContactsPage() {
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: members } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1);

  const member = members?.[0] as { workspace_id: string } | undefined;
  if (!member) redirect("/login");

  const workspaceId = member.workspace_id;

  // Fetch contacts with their tags
  const { data: contacts } = await supabase
    .from("contacts")
    .select(`
      id, username, full_name, avatar_url, email, phone,
      platform_scoped_id, custom_fields, source_flow_id,
      opted_out, created_at, updated_at
    `)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(100);

  const contactList = (contacts ?? []) as Array<{
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    email: string | null;
    phone: string | null;
    platform_scoped_id: string;
    custom_fields: Record<string, unknown>;
    source_flow_id: string | null;
    opted_out: boolean;
    created_at: string;
    updated_at: string;
  }>;

  // Fetch tags for all contacts
  const contactIds = contactList.map((c) => c.id);
  const { data: contactTags } = contactIds.length > 0
    ? await supabase
        .from("contact_tags")
        .select("contact_id, tag_id")
        .in("contact_id", contactIds)
    : { data: [] };

  const tagIds = [...new Set((contactTags ?? []).map((ct) => (ct as { tag_id: string }).tag_id))];
  const { data: tags } = tagIds.length > 0
    ? await supabase
        .from("tags")
        .select("id, name, color")
        .in("id", tagIds)
    : { data: [] };

  const tagMap = new Map(
    ((tags ?? []) as Array<{ id: string; name: string; color: string }>).map((t) => [t.id, t])
  );

  // Build contact-to-tags mapping
  const contactTagMap = new Map<string, Array<{ name: string; color: string }>>();
  for (const ct of (contactTags ?? []) as Array<{ contact_id: string; tag_id: string }>) {
    const tag = tagMap.get(ct.tag_id);
    if (tag) {
      const existing = contactTagMap.get(ct.contact_id) ?? [];
      existing.push({ name: tag.name, color: tag.color });
      contactTagMap.set(ct.contact_id, existing);
    }
  }

  // Fetch all workspace tags for filter
  const { data: allTags } = await supabase
    .from("tags")
    .select("id, name, color")
    .eq("workspace_id", workspaceId)
    .order("name");

  const allTagList = (allTags ?? []) as Array<{ id: string; name: string; color: string }>;

  // Serialize for client component
  const serializedContacts = contactList.map((c) => ({
    ...c,
    tags: contactTagMap.get(c.id) ?? [],
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contacts</h1>
          <p className="text-sm text-muted-foreground">
            {contactList.length} contact{contactList.length !== 1 ? "s" : ""} in your workspace
          </p>
        </div>
      </div>

      {contactList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 py-16">
          <Users className="h-10 w-10 text-muted-foreground/40" />
          <p className="mt-4 text-sm text-muted-foreground">No contacts yet</p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Contacts are created automatically when users interact with your flows.
          </p>
        </div>
      ) : (
        <ContactSearch contacts={serializedContacts} tags={allTagList} />
      )}
    </div>
  );
}
