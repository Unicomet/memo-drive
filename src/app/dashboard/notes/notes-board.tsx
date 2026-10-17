"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Plus, Save, StickyNote, Trash2, X } from "lucide-react";
import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "~/app/api/uploadthing/core";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { createNote, deleteNote, updateNote } from "~/server/note-actions";
import type { notes_table } from "~/server/db/schema";
import { createNoteSaver } from "./note-saver";

const { useUploadThing } = generateReactHelpers<OurFileRouter>();

type Note = typeof notes_table.$inferSelect;
type SaveNote = () => Promise<boolean>;

export default function NotesBoard({ initialNotes }: { initialNotes: Note[] }) {
  const [notes, setNotes] = useState(initialNotes);
  const [isCreating, startCreating] = useTransition();
  const saves = useRef(new Map<number, SaveNote>());
  const router = useRouter();
  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);
  const registerSave = useCallback((id: number, save: SaveNote) => {
    saves.current.set(id, save);
    return () => {
      saves.current.delete(id);
    };
  }, []);

  useEffect(() => {
    // Finish saves before following header links away from the notes page.
    function onClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link =
        event.target instanceof Element ? event.target.closest("a") : null;
      if (!link || link.target === "_blank" || link.hasAttribute("download"))
        return;
      const destination = new URL(link.href, window.location.href);
      if (
        destination.origin !== window.location.origin ||
        destination.pathname === window.location.pathname
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      void Promise.all([...saves.current.values()].map((save) => save())).then(
        (results) => {
          if (results.every(Boolean))
            router.push(
              destination.pathname + destination.search + destination.hash,
            );
        },
      );
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  function addNote() {
    startCreating(async () => {
      try {
        const result = await createNote();
        if (!result.note) {
          toast.error(result.error);
          return;
        }
        setNotes((current) => [result.note, ...current]);
      } catch {
        toast.error("Could not create your note. Please try again.");
      }
    });
  }

  return (
    <section className="mx-auto w-full max-w-6xl">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">My Notes</h1>
          <p className="text-muted-foreground mt-2">
            Your ideas and reminders, saved automatically when you leave a note.
          </p>
        </div>
        <Button onClick={addNote} disabled={isCreating}>
          <Plus />
          {isCreating ? "Creating…" : "New note"}
        </Button>
      </div>
      {notes.length === 0 ? (
        <div className="border-border flex flex-col items-center rounded-xl border border-dashed px-6 py-20 text-center">
          <StickyNote className="text-muted-foreground mb-4 size-10" />
          <h2 className="text-xl font-medium">Your notes start here</h2>
          <p className="text-muted-foreground mt-2">
            Create your first sticky note to jot something down.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              registerSave={registerSave}
              onDelete={() =>
                setNotes((current) =>
                  current.filter((item) => item.id !== note.id),
                )
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}

function NoteCard({
  note,
  onDelete,
  registerSave,
}: {
  note: Note;
  onDelete: () => void;
  registerSave: (id: number, save: SaveNote) => () => void;
}) {
  const [values, setValues] = useState({
    title: note.title,
    description: note.description,
    images: note.images,
  });
  const fileInput = useRef<HTMLInputElement>(null);
  const { startUpload, isUploading } = useUploadThing("noteImages");
  const latestValues = useRef(values);
  const [savedValues, setSavedValues] = useState(values);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasError, setHasError] = useState(false);
  const deleting = useRef(false);
  const saver = useRef<ReturnType<
    typeof createNoteSaver<typeof values>
  > | null>(null);
  saver.current ??= createNoteSaver(
    values,
    () => latestValues.current,
    async (snapshot) => {
      setIsSaving(true);
      setHasError(false);
      try {
        const result = await updateNote({ id: note.id, ...snapshot });
        if (result.error) throw new Error(result.error);
        return true;
      } catch {
        setHasError(true);
        toast.error(
          "Could not save your note. Your edits are still here. Try Save again.",
        );
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    setSavedValues,
  );
  const saveNote = useCallback(async () => {
    if (deleting.current) return false;
    return saver.current!.save();
  }, []);

  useEffect(() => {
    const remoteValues = {
      title: note.title,
      description: note.description,
      images: note.images,
    };
    if (saver.current!.acceptRemote(remoteValues)) {
      latestValues.current = remoteValues;
      setValues(remoteValues);
      setHasError(false);
    }
  }, [note.title, note.description, note.images]);

  useEffect(
    () => registerSave(note.id, saveNote),
    [note.id, registerSave, saveNote],
  );
  useEffect(() => {
    const timer = setTimeout(() => {
      void saveNote();
    }, 800);
    return () => clearTimeout(timer);
  }, [values, saveNote]);
  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (!deleting.current && saver.current!.hasChanges()) {
        void saveNote();
        event.preventDefault();
        event.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [saveNote]);

  function changeValues(nextValues: typeof values) {
    latestValues.current = nextValues;
    setValues(nextValues);
    setHasError(false);
  }

  async function attachImages(files: File[]) {
    const currentImages = JSON.parse(latestValues.current.images) as string[];
    if (currentImages.length + files.length > 10) {
      toast.error("You can attach up to 10 images per note.");
      return;
    }
    if (
      files.some(
        (file) =>
          !file.type.startsWith("image/") || file.size > 8 * 1024 * 1024,
      )
    ) {
      toast.error("Choose images up to 8 MB each.");
      return;
    }
    try {
      const uploaded = await startUpload(files, { noteId: note.id });
      if (!uploaded) throw new Error("Upload failed");
      const latest = latestValues.current;
      changeValues({
        ...latest,
        images: JSON.stringify([
          ...(JSON.parse(latest.images) as string[]),
          ...uploaded.map((file) => file.serverData.url),
        ]),
      });
      await saveNote();
    } catch {
      toast.error("Could not upload images. Please try again.");
    }
  }

  async function removeNote() {
    if (!window.confirm("Delete this note? This cannot be undone.")) return;
    deleting.current = true;
    setIsDeleting(true);
    try {
      // Wait for any outstanding write before deleting the row.
      await saver.current!.save();
      const result = await deleteNote(note.id);
      if (result.error) throw new Error(result.error);
      onDelete();
      toast.success("Note deleted");
    } catch {
      deleting.current = false;
      setIsDeleting(false);
      toast.error("Could not delete your note. Please try again.");
    }
  }

  const hasChanges =
    values.title !== savedValues.title ||
    values.description !== savedValues.description ||
    values.images !== savedValues.images;
  return (
    <article
      aria-label={values.title || "Untitled note"}
      className="rounded-lg border border-amber-300 bg-amber-100 p-6 text-slate-900 shadow-md sm:p-8"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) void saveNote();
      }}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void saveNote();
        }}
      >
        <fieldset
          disabled={isDeleting || isUploading}
          className="min-w-0 space-y-4"
        >
          <input
            aria-label="Note title"
            placeholder="Title"
            maxLength={200}
            value={values.title}
            onChange={(event) =>
              changeValues({ ...values, title: event.target.value })
            }
            className="w-full rounded-sm bg-transparent text-xl font-semibold outline-none placeholder:text-slate-600 focus-visible:ring-2 focus-visible:ring-slate-600"
          />
          <textarea
            aria-label="Note description"
            placeholder="Description"
            maxLength={100000}
            value={values.description}
            onChange={(event) =>
              changeValues({ ...values, description: event.target.value })
            }
            className="min-h-64 w-full resize-y rounded-sm bg-transparent text-base leading-relaxed outline-none placeholder:text-slate-600 focus-visible:ring-2 focus-visible:ring-slate-600"
          />
          <div className="space-y-4">
            {(JSON.parse(values.images) as string[]).map((url, index) => (
              <div
                key={url + index}
                className="relative overflow-hidden rounded-lg border border-amber-300"
              >
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open image ${index + 1}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Note attachment ${index + 1}`}
                    className="max-h-96 w-full object-contain"
                  />
                </a>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  aria-label={`Remove image ${index + 1}`}
                  className="absolute top-2 right-2"
                  onClick={() =>
                    changeValues({
                      ...values,
                      images: JSON.stringify(
                        (JSON.parse(values.images) as string[]).filter(
                          (_, i) => i !== index,
                        ),
                      ),
                    })
                  }
                >
                  <X />
                </Button>
              </div>
            ))}
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              aria-label="Attach images"
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                event.target.value = "";
                if (files.length) void attachImages(files);
              }}
            />
            <Button
              type="button"
              variant="ghost"
              disabled={
                isUploading ||
                (JSON.parse(values.images) as string[]).length >= 10
              }
              onClick={() => fileInput.current?.click()}
              className="text-slate-700 hover:bg-black/10"
            >
              <ImagePlus />
              {isUploading ? "Uploading…" : "Add images"}
            </Button>
            <p className="text-xs text-slate-600">
              Up to 10 images · 8 MB each
            </p>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-slate-900/10 pt-3">
            <span role="status" className="text-xs text-slate-600">
              {isUploading
                ? "Uploading…"
                : isDeleting
                  ? "Deleting…"
                  : isSaving
                    ? "Saving…"
                    : hasError
                      ? "Save failed — retry"
                      : hasChanges
                        ? "Unsaved changes"
                        : "Saved"}
            </span>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Delete note"
                onClick={removeNote}
                className="text-slate-700 hover:bg-black/10 hover:text-slate-900"
              >
                <Trash2 />
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!hasChanges || isSaving}
                className="bg-slate-900 text-white hover:bg-slate-800"
              >
                <Save />
                Save
              </Button>
            </div>
          </div>
        </fieldset>
      </form>
    </article>
  );
}
