"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/components/AuthProvider";
import { useGoalData } from "@/components/GoalDataProvider";
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
import type { Category } from "@/lib/types";

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useAuth();
  const {
    categories,
    setCategories,
    categoriesLoaded,
    setCategoriesLoaded,
    setCategoriesFromDb,
    categoriesUserId,
    setCategoriesUserId,
  } = useGoalData();
  const [loading, setLoading] = useState(!categoriesLoaded);
  const [error, setError] = useState<string | null>(null);
  const sessionEmail = session?.user.email;
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [toasts, setToasts] = useState<
    { id: string; message: string; tone?: "default" | "success" | "error" }[]
  >([]);

  const pushToast = (
    message: string,
    tone: "default" | "success" | "error" = "default",
  ) => {
    const id = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4000);
  };

  useEffect(() => {
    if (searchParams?.get("create") === "1") {
      setCreateOpen(true);
      router.replace("/tags", { scroll: false });
    }
  }, [router, searchParams]);

  useEffect(() => {
    if (!supabase) return;

    const loadTags = async () => {
      setLoading(!categoriesLoaded);
      setError(null);
      const userId = session?.user.id;
      if (!userId) {
        setCategories([]);
        setCategoriesFromDb(false);
        setCategoriesUserId(null);
        setCategoriesLoaded(true);
        setLoading(false);
        return;
      }

      if (categoriesLoaded && categoriesUserId === userId) {
        setLoading(false);
        return;
      }

      setCategoriesLoaded(false);
      const { data, error: loadError } = await supabase
        .from("categories")
        .select("id, name, description, user_id")
        .eq("user_id", userId)
        .order("name");

      if (loadError) {
        setError(loadError.message);
        setLoading(false);
        setCategoriesFromDb(false);
        setCategoriesLoaded(true);
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
        setCategories((reloaded ?? []) as Category[]);
        setCategoriesFromDb(true);
        setCategoriesUserId(userId);
        setCategoriesLoaded(true);
        setLoading(false);
        return;
      }

      setCategories(data as Category[]);
      setCategoriesFromDb(true);
      setCategoriesUserId(userId);
      setCategoriesLoaded(true);
      setLoading(false);
    };

    loadTags();
  }, [
    categoriesLoaded,
    categoriesUserId,
    session,
    setCategories,
    setCategoriesLoaded,
    setCategoriesFromDb,
    setCategoriesUserId,
  ]);

  const handleCreate = async () => {
    if (!supabase) return;
    setError(null);
    const name = newName.trim();
    if (!name) {
      setError("Tag name is required.");
      pushToast("Tag name is required.", "error");
      return;
    }
    const userId = session?.user.id;
    if (!userId) {
      setError("Sign in to create tags.");
      pushToast("Sign in to create tags.", "error");
      return;
    }
    setCreateOpen(false);
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
      pushToast(insertError?.message ?? "Unable to create tag.", "error");
      return;
    }
    setCategories((current) =>
      [...current, data as Category].sort((a, b) => a.name.localeCompare(b.name)),
    );
    setCategoriesFromDb(true);
    setNewName("");
    setNewDescription("");
    pushToast("Tag created.", "success");
  };

  const handleUpdate = async (tag: Category) => {
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
      pushToast(updateError.message, "error");
      return;
    }
    pushToast("Tag updated.", "success");
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
      pushToast(deleteError.message, "error");
      return;
    }
    setCategories((current) => current.filter((tag) => tag.id !== tagId));
    pushToast("Tag deleted.", "success");
  };

  const hasTags = useMemo(() => categories.length > 0, [categories]);
  const [editTag, setEditTag] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const openEdit = (tag: Category) => {
    setEditTag(tag);
    setEditName(tag.name);
    setEditDescription(tag.description ?? "");
  };

  const handleEditSave = async () => {
    if (!editTag) return;
    setEditTag(null);
    await handleUpdate({ ...editTag, name: editName, description: editDescription });
    setCategories((current) =>
      current.map((item) =>
        item.id === editTag.id
          ? { ...item, name: editName, description: editDescription }
          : item,
      ),
    );
  };

  return (
    <AppShell sessionEmail={sessionEmail}>
      <section className="flex min-h-0 flex-1 flex-col rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3">
          <div>
            <h1 className="text-2xl font-semibold text-[color:var(--color-text)]">Tags</h1>
            <p className="mt-2 text-sm text-[color:var(--color-text-muted)]">{categories.length} total</p>
          </div>
          <Button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 rounded-full bg-[color:var(--color-button)] px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-button-text)] transition hover:bg-[color:var(--color-button-hover)]"
          >
            Create tag
            <span className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-sm border border-[color:var(--color-border)] bg-[color:var(--color-surface)] font-mono text-[11px] leading-none text-[color:var(--color-text)] shadow-sm normal-case tracking-normal">
              t
            </span>
          </Button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col px-6 py-4">
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            {error ? (
              <div className="rounded-2xl border border-[color:var(--color-danger-soft)] bg-[color:var(--color-danger-soft-2)] px-4 py-2 text-xs text-[color:var(--color-danger-strong)]">
                {error}
              </div>
            ) : null}

            <div className="flex min-h-0 flex-1 flex-col">
              {loading ? (
                <div className="text-sm text-[color:var(--color-text-muted)]">Loading tags...</div>
              ) : !hasTags ? (
                <div className="rounded-2xl border border-dashed border-[color:var(--color-border)] p-6 text-sm text-[color:var(--color-text-muted)]">
                  No tags yet. Create your first tag above.
                </div>
              ) : (
                <div className="min-h-0 flex-1 overflow-y-auto pr-2">
                  <div className="columns-1 gap-3 md:columns-2">
                  {categories.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => openEdit(tag)}
                    className="mb-3 flex w-full break-inside-avoid flex-col gap-3 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 text-left transition hover:border-[color:var(--color-accent)]"
                    >
                      <div className="text-lg font-semibold text-[color:var(--color-text)]">
                        {tag.name}
                      </div>
                      <p className="text-sm text-[color:var(--color-text-muted)]">
                        {tag.description || "No description yet. Click to add one."}
                      </p>
                    </button>
                  ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent
          className="rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6"
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            handleCreate();
          }}
        >
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
              className="h-auto rounded-2xl border-[color:var(--color-ink-15)] bg-[color:var(--color-surface)] px-4 py-3 text-sm"
            />
            <Input
              value={newDescription}
              onChange={(event) => setNewDescription(event.target.value)}
              placeholder="Optional description"
              className="h-auto rounded-2xl border-[color:var(--color-ink-15)] bg-[color:var(--color-surface)] px-4 py-3 text-sm"
            />
            <div className="mt-2 flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={handleCreate}
                className="rounded-full bg-[color:var(--color-button)] px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-button-text)] transition hover:bg-[color:var(--color-button-hover)]"
              >
                Create
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                className="rounded-full border-[color:var(--color-ink)] px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-text)]"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTag} onOpenChange={() => setEditTag(null)}>
        <DialogContent className="rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6">
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
              className="h-auto rounded-2xl border-[color:var(--color-ink-15)] bg-[color:var(--color-surface)] px-4 py-3 text-sm"
            />
            <Input
              value={editDescription}
              onChange={(event) => setEditDescription(event.target.value)}
              placeholder="Optional description"
              className="h-auto rounded-2xl border-[color:var(--color-ink-15)] bg-[color:var(--color-surface)] px-4 py-3 text-sm"
            />
            <div className="mt-2 flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={handleEditSave}
                className="rounded-full bg-[color:var(--color-button)] px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-button-text)] transition hover:bg-[color:var(--color-button-hover)]"
              >
                Save
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditTag(null)}
                className="rounded-full border-[color:var(--color-ink)] px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-text)]"
              >
                Cancel
              </Button>
              {editTag ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDelete(editTag.id)}
                  className="rounded-full border-[color:var(--color-danger-strong)] px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-danger-strong)]"
                >
                  Delete
                </Button>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="fixed bottom-6 right-6 z-50 flex w-[280px] flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast-fade rounded-2xl border px-4 py-3 text-xs shadow-lg ${
              toast.tone === "success"
                ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]"
                : toast.tone === "error"
                  ? "border-[color:var(--color-danger-strong)] bg-[color:var(--color-danger-soft)] text-[color:var(--color-danger-strong)]"
                  : "border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-text-subtle)]"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </AppShell>
  );
}
