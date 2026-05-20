export const PLAYBOARDS_COLLECTION = 'playboards';

export const getPlayboardCollectionName = () => PLAYBOARDS_COLLECTION;

export const createPlayboard = async (board, { setDocument }, id) => {
  if (!setDocument) {
    return { success: false, error: 'setDocument unavailable' };
  }

  const result = await setDocument(PLAYBOARDS_COLLECTION, id, board);
  return { ...result, id };
};

export const updatePlayboard = async (id, updates, { updateDocument }) => {
  if (!id || !updateDocument) {
    return { success: false, error: 'updateDocument unavailable' };
  }

  return updateDocument(PLAYBOARDS_COLLECTION, id, updates);
};

export const fetchPlayboard = async (id, { fetchDocument }) => {
  if (!id || !fetchDocument) return null;
  return fetchDocument(PLAYBOARDS_COLLECTION, id);
};
