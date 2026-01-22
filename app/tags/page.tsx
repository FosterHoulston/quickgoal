"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";

type Tag = {
  id: string;
  name: string;
  description?: string | null;
};

const DEFAULT_TAGS = [
  { name: "Health", description: null },
  { name: "Career", description: null },
  { name: "Learning", description: null },
  { name: "Finance", description: null },
  { name: "Relationships", description: null },
  { name: "Mindset", description: null },
  { name: "Creative", description: null },
];

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionEmail, setSessionEmail] = useState<string | undefined>();
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSessionEmail(data.session?.user.email);
    });
  }, []);

  useEffect(() => {
    if (!supabase) return;

    const loadTags = async () => {
      setLoading(true);
      setError(null);
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) {
        setTags([]);
        setLoading(false);
        return;
      }

      const { data, error: loadError } = await supabase
        .from("categories")
        .select("id, name, description, user_id")
        .eq("user_id", userId)
        .order("name");

      if (loadError) {
        setError(loadError.message);
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        const { data: defaults } = await supabase
          .from("categories")
          .select("name, description")
          .is("user_id", null)
          .order("name");

        const seed = defaults && defaults.length > 0 ? defaults : DEFAULT_TAGS;

        if (seed.length > 0) {
          await supabase.from("categories").insert(
            seed.map((item) => ({
              user_id: userId,
              name: item.name,
              description: item.description ?? null,
            })),
          );
        }

        const { data: reloaded } = await supabase
          .from("categories")
          .select("id, name, description, user_id")
          .eq("user_id", userId)
          .order("name");
        setTags(reloaded ?? []);
        setLoading(false);
        return;
      }

      setTags(data);
      setLoading(false);
    };

    loadTags();
  }, []);

  const handleCreate = async () => {
    if (!supabase) return;
    setError(null);
    const name = newName.trim();
    if (!name) {
      setError("Tag name is required.");
      return;
    }
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) {
      setError("Sign in to create tags.");
      return;
    }
    const { data, error: insertError } = await supabase
      .from("categories")
      .insert({
        user_id: userId,
        name,
        description: newDescription.trim() || null,
      })
      .select("id, name, description")
      .single();
    if (insertError || !data) {
      setError(insertError?.message ?? "Unable to create tag.");
      return;
    }
    setTags((current) => [...current, data].sort((a, b) => a.name.localeCompare(b.name)));
    setNewName("");
    setNewDescription("");
  };

  const handleUpdate = async (tag: Tag) => {
    if (!supabase) return;
    setError(null);
    const { error: updateError } = await supabase
      .from("categories")
      .update({
        name: tag.name.trim(),
        description: tag.description?.trim() || null,
      })
      .eq("id", tag.id);
    if (updateError) {
      setError(updateError.message);
      return;
    }
  };

  const handleDelete = async (tagId: string) => {
    if (!supabase) return;
    if (!window.confirm("Delete this tag?")) return;
    setError(null);
    const { error: deleteError } = await supabase
      .from("categories")
      .delete()
      .eq("id", tagId);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setTags((current) => current.filter((tag) => tag.id !== tagId));
  };

  const hasTags = useMemo(() => tags.length > 0, [tags]);
  const [editTag, setEditTag] = useState<Tag | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const openEdit = (tag: Tag) => {
    setEditTag(tag);
    setEditName(tag.name);
    setEditDescription(tag.description ?? "");
  };

  const handleEditSave = async () => {
    if (!editTag) return;
    await handleUpdate({ ...editTag, name: editName, description: editDescription });
    setTags((current) =>
      current.map((item) =>
        item.id === editTag.id
          ? { ...item, name: editName, description: editDescription }
          : item,
      ),
    );
    setEditTag(null);
  };

  return (
    <AppShell sessionEmail={sessionEmail}>
      <section className="flex min-h-0 flex-1 flex-col">
        <div className="text-xs uppercase tracking-[0.2em] text-[#6b6b6b]">
          Tags
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-[#1a1a1a]">
          Organize your goals.
        </h1>
        <p className="mt-2 text-sm text-[#6b6b6b]">
          Create and edit tags with optional descriptions.
        </p>

        <div className="mt-6 flex min-h-0 flex-1 flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs uppercase tracking-[0.2em] text-[#6b6b6b]">
              {tags.length} tags
            </div>
            <Button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="rounded-full bg-[#1a1a1a] px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#2f6f6a]"
            >
              Create tag
            </Button>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
              {error}
            </div>
          ) : null}

          <div className="flex min-h-0 flex-1 flex-col">
            {loading ? (
              <div className="text-sm text-[#6b6b6b]">Loading tags...</div>
            ) : !hasTags ? (
              <div className="rounded-2xl border border-dashed border-[#e6e0d8] p-6 text-sm text-[#6b6b6b]">
                No tags yet. Create your first tag above.
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto pr-2">
                <div className="columns-1 gap-3 md:columns-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => openEdit(tag)}
                    className="mb-3 flex w-full break-inside-avoid flex-col gap-3 rounded-2xl border border-[#e6e0d8] bg-white p-4 text-left transition hover:border-[#2f6f6a]"
                  >
                    <div className="text-lg font-semibold text-[#1a1a1a]">
                      {tag.name}
                    </div>
                    <p className="text-sm text-[#6b6b6b]">
                      {tag.description || "No description yet. Click to add one."}
                    </p>
                  </button>
                ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="rounded-3xl border border-[#e6e0d8] bg-white p-6">
          <DialogHeader>
            <DialogTitle>Create tag</DialogTitle>
            <DialogDescription>
              Add a new tag with an optional description.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex flex-col gap-3">
            <Input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Tag name"
              className="h-auto rounded-2xl border-[#1a1a1a]/15 bg-white px-4 py-3 text-sm"
            />
            <Input
              value={newDescription}
              onChange={(event) => setNewDescription(event.target.value)}
              placeholder="Optional description"
              className="h-auto rounded-2xl border-[#1a1a1a]/15 bg-white px-4 py-3 text-sm"
            />
            <div className="mt-2 flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={handleCreate}
                className="rounded-full bg-[#1a1a1a] px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#2f6f6a]"
              >
                Create
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                className="rounded-full border-[#1a1a1a] px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#1a1a1a]"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTag} onOpenChange={() => setEditTag(null)}>
        <DialogContent className="rounded-3xl border border-[#e6e0d8] bg-white p-6">
          <DialogHeader>
            <DialogTitle>Edit tag</DialogTitle>
            <DialogDescription>
              Update the tag name or description.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex flex-col gap-3">
            <Input
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
              placeholder="Tag name"
              className="h-auto rounded-2xl border-[#1a1a1a]/15 bg-white px-4 py-3 text-sm"
            />
            <Input
              value={editDescription}
              onChange={(event) => setEditDescription(event.target.value)}
              placeholder="Optional description"
              className="h-auto rounded-2xl border-[#1a1a1a]/15 bg-white px-4 py-3 text-sm"
            />
            <div className="mt-2 flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={handleEditSave}
                className="rounded-full bg-[#1a1a1a] px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#2f6f6a]"
              >
                Save
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditTag(null)}
                className="rounded-full border-[#1a1a1a] px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#1a1a1a]"
              >
                Cancel
              </Button>
              {editTag ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDelete(editTag.id)}
                  className="rounded-full border-[#8b4a3a] px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#8b4a3a]"
                >
                  Delete
                </Button>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
