const STORAGE_KEY = 'candidate_application_notes_v1';

function readNotes() {
  if (typeof localStorage === 'undefined') return {};

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeNotes(notes) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function normalizeApplicationId(applicationId) {
  return String(applicationId ?? '').trim();
}

function toResponse(note) {
  return Promise.resolve({
    data: {
      success: true,
      data: { note },
    },
  });
}

const applicationNoteService = {
  getNote: (applicationId) => {
    const id = normalizeApplicationId(applicationId);
    const notes = readNotes();
    return toResponse(id ? notes[id] || '' : '');
  },

  saveNote: (applicationId, data) => {
    const id = normalizeApplicationId(applicationId);
    const note = String(data?.note ?? '').trim();
    if (!id) return toResponse('');

    const notes = readNotes();
    notes[id] = note;
    writeNotes(notes);
    return toResponse(note);
  },

  deleteNote: (applicationId) => {
    const id = normalizeApplicationId(applicationId);
    if (!id) return toResponse('');

    const notes = readNotes();
    delete notes[id];
    writeNotes(notes);
    return toResponse('');
  },
};

export default applicationNoteService;
