export interface NoteText {
  title: string;
  description: string;
}

// Serialize writes so an older request cannot overwrite newer edits.
export function createNoteSaver(
  initialValues: NoteText,
  getValues: () => NoteText,
  persist: (values: NoteText) => Promise<boolean>,
  onSaved: (values: NoteText) => void,
) {
  let savedValues = initialValues;
  let pending: Promise<boolean> | null = null;

  function hasChanges() {
    const values = getValues();
    return (
      values.title !== savedValues.title ||
      values.description !== savedValues.description
    );
  }

  async function save(): Promise<boolean> {
    if (pending && !(await pending)) return false;
    // Several callers may be waiting for the same write.
    if (pending) return save();
    if (!hasChanges()) return true;
    const values = { ...getValues() };
    pending = (async () => {
      try {
        if (!(await persist(values))) return false;
        savedValues = values;
        onSaved(values);
        return true;
      } finally {
        pending = null;
      }
    })();
    if (!(await pending)) return false;
    return save();
  }

  function acceptRemote(values: NoteText) {
    if (pending || hasChanges()) return false;
    savedValues = values;
    onSaved(values);
    return true;
  }

  return { save, hasChanges, acceptRemote };
}
