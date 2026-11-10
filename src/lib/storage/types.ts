export interface Doc {
  id: string;
  title: string;
  content: string;
  folderId: string | null;
  /** Sort key inside its folder; fractional so a move rewrites one row. */
  order: number;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Folder {
  id: string;
  name: string;
  order: number;
  createdAt: number;
}
