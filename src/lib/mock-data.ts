// Mock data structure
export interface File {
  id: string;
  name: string;
  fileType: "document" | "image" | "video" | "audio" | "archive";
  size: string;
  modified: string;
  url: string;
  parent: string;
}

export type Folder = {
  id: string;
  name: string;
  modified: string;
  parent?: string;
};

export const mockFolders: Folder[] = [
  {
    id: "1",
    name: "Music",
    modified: "1 day ago",
    parent: "root",
  },
  {
    id: "2",
    name: "Personal",
    modified: "2 days ago",
    parent: "root",
  },
  {
    id: "root",
    name: "root",
    modified: "N/A",
  },
  {
    id: "3",
    name: "Photos Photos",
    modified: "2 months ago",
    parent: "2",
  },
];

export const mockFiles: File[] = [
  {
    id: "1",
    name: "Documents",
    fileType: "document",
    size: "1.2 MB",
    url: "/files/documents.pdf",
    modified: "2 days ago",
    parent: "root",
  },
  {
    id: "2",
    name: "Photos",
    fileType: "image",
    size: "3.4 MB",
    url: "/files/photos.zip",
    modified: "5 days ago",
    parent: "root",
  },
  {
    id: "3",
    name: "video cq",
    fileType: "video",
    size: "700 MB",
    url: "/files/videos.zip",
    modified: "1 week ago",
    parent: "2",
  },
  {
    id: "4",
    name: "Iron Maiden music",
    fileType: "audio",
    size: "50 MB",
    url: "/files/music.zip",
    modified: "3 weeks ago",
    parent: "1",
  },
  {
    id: "5",
    name: "Old Projects",
    fileType: "archive",
    size: "120 MB",
    url: "/files/old_projects.zip",
    modified: "1 month ago",
    parent: "2",
  },
  {
    id: "6",
    name: "Resume",
    fileType: "document",
    size: "200 KB",
    url: "/files/resume.pdf",
    modified: "6 months ago",
    parent: "root",
  },
  {
    id: "7",
    name: "Cover Letter",
    fileType: "document",
    size: "150 KB",
    url: "/files/cover_letter.pdf",
    modified: "6 months ago",
    parent: "2",
  },
  {
    id: "8",
    name: "Vacation Photos",
    fileType: "image",
    size: "2.5 MB",
    url: "/files/vacation_photos.zip",
    modified: "2 months ago",
    parent: "3",
  },
];
