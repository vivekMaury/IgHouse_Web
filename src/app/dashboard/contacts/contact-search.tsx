"use client";

import { useState, useMemo } from "react";
import { Search, Mail, Phone, Tag, ShieldOff, X } from "lucide-react";

type Contact = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  phone: string | null;
  platform_scoped_id: string;
  opted_out: boolean;
  created_at: string;
  updated_at: string;
  tags: Array<{ name: string; color: string }>;
};

type TagItem = {
  id: string;
  name: string;
  color: string;
};

type Filter = "all" | "with_email" | "opted_out";

export function ContactSearch({
  contacts,
  tags,
}: {
  contacts: Contact[];
  tags: TagItem[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = contacts;

    // Text search
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (c) =>
          c.username?.toLowerCase().includes(q) ||
          c.full_name?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.phone?.includes(q)
      );
    }

    // Filter
    if (filter === "with_email") {
      result = result.filter((c) => c.email);
    } else if (filter === "opted_out") {
      result = result.filter((c) => c.opted_out);
    }

    // Tag filter
    if (selectedTag) {
      result = result.filter((c) => c.tags.some((t) => t.name === selectedTag));
    }

    return result;
  }, [contacts, query, filter, selectedTag]);

  const filters: Array<{ key: Filter; label: string }> = [
    { key: "all", label: "All" },
    { key: "with_email", label: "Has email" },
    { key: "opted_out", label: "Opted out" },
  ];

  return (
    <div className="space-y-4">
      {/* Search + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 w-full rounded-md border border-border/60 bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="flex items-center gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tag chips */}
      {tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <Tag className="h-3.5 w-3.5 text-muted-foreground" />
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => setSelectedTag(selectedTag === tag.name ? null : tag.name)}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                selectedTag === tag.name
                  ? "ring-1 ring-ring"
                  : "hover:opacity-80"
              }`}
              style={{
                backgroundColor: `${tag.color}20`,
                color: tag.color,
              }}
            >
              {tag.name}
              {selectedTag === tag.name && <X className="h-3 w-3" />}
            </button>
          ))}
        </div>
      )}

      {/* Results count */}
      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {contacts.length} contacts
      </p>

      {/* Contact table */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-muted-foreground">No contacts match your search.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Tags</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Added</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((contact) => (
                <tr
                  key={contact.id}
                  className="border-b border-border/40 transition-colors hover:bg-muted/20"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {contact.avatar_url ? (
                        <img
                          src={contact.avatar_url}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                          {(contact.username ?? contact.full_name ?? "?").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium">
                          {contact.username ? `@${contact.username}` : contact.full_name ?? "Unknown"}
                        </p>
                        {contact.full_name && contact.username && (
                          <p className="text-xs text-muted-foreground">{contact.full_name}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {contact.email ? (
                      <span className="inline-flex items-center gap-1 text-xs">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        {contact.email}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/50">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {contact.phone ? (
                      <span className="inline-flex items-center gap-1 text-xs">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        {contact.phone}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/50">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {contact.tags.length > 0 ? (
                        contact.tags.map((tag) => (
                          <span
                            key={tag.name}
                            className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                            style={{
                              backgroundColor: `${tag.color}20`,
                              color: tag.color,
                            }}
                          >
                            {tag.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground/50">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {contact.opted_out ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-500">
                        <ShieldOff className="h-3 w-3" />
                        Opted out
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(contact.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
