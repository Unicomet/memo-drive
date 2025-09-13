// Mock data structure
export interface File {
  id: number;
  name: string;
  fileType: "document" | "image" | "video" | "audio" | "archive";
  size: number;
  modified: string;
  url: string;
  parent: number;
}

export type Folder = {
  id: number;
  name: string;
  modified: string;
  parent?: number;
};

export const mockFolders: Folder[] = [
  {
    id: 1,
    name: "Music",
    modified: "1 day ago",
    parent: 1,
  },
  {
    id: 2,
    name: "Personal",
    modified: "2 days ago",
    parent: 1,
  },
  {
    id: 1,
    name: "root",
    modified: "N/A",
  },
  {
    id: 3,
    name: "Photos Photos",
    modified: "2 months ago",
    parent: 2,
  },
];

export const mockFiles: File[] = [
  {
    id: 1,
    name: "Documents",
    fileType: "document",
    size: 1200,
    url: "/files/documents.pdf",
    modified: "2 days ago",
    parent: 1,
  },
  {
    id: 2,
    name: "Photos",
    fileType: "image",
    size: 3400,
    url: "/files/photos.zip",
    modified: "5 days ago",
    parent: 1,
  },
  {
    id: 3,
    name: "video cq",
    fileType: "video",
    size: 700,
    url: "/files/videos.zip",
    modified: "1 week ago",
    parent: 2,
  },
  {
    id: 4,
    name: "Iron Maiden music",
    fileType: "audio",
    size: 50,
    url: "/files/music.zip",
    modified: "3 weeks ago",
    parent: 1,
  },
  {
    id: 5,
    name: "Old Projects",
    fileType: "archive",
    size: 120,
    url: "/files/old_projects.zip",
    modified: "1 month ago",
    parent: 2,
  },
  {
    id: 6,
    name: "Resume",
    fileType: "document",
    size: 200,
    url: "/files/resume.pdf",
    modified: "6 months ago",
    parent: 1,
  },
  {
    id: 7,
    name: "Cover Letter",
    fileType: "document",
    size: 150,
    url: "/files/cover_letter.pdf",
    modified: "6 months ago",
    parent: 2,
  },
  {
    id: 8,
    name: "Vacation Photos",
    fileType: "image",
    size: 2500,
    url: "/files/vacation_photos.zip",
    modified: "2 months ago",
    parent: 3,
  },
];
