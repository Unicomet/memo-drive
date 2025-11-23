import { createContext, useState } from "react";

export const DialogShareFileContext = createContext({
  isOpen: false,
  setIsOpen: (isOpen: boolean) => {},
  fileId: 0,
  setFileId: (fileId: number) => {},
  invitedUsersIds: [] as number[],
  setInvitedUsersIds: (userIds: number[]) => {},
  invitedUsersEmails: [] as string[],
  setInvitedUsersEmails: (userEmails: string[]) => {},
});

export default function ShareFileDialogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [fileId, setFileId] = useState(0);
  const [invitedUsersIds, setInvitedUsersIds] = useState<number[]>([]);
  const [invitedUsersEmails, setInvitedUsersEmails] = useState<string[]>([]);

  return (
    <DialogShareFileContext.Provider
      value={{
        isOpen: isOpen,
        setIsOpen: (isOpen: boolean) => setIsOpen(isOpen),
        fileId: fileId,
        setFileId: (fileId: number) => setFileId(fileId),
        invitedUsersIds: invitedUsersIds,
        setInvitedUsersIds: (userIds: number[]) => setInvitedUsersIds(userIds),
        invitedUsersEmails: invitedUsersEmails,
        setInvitedUsersEmails: (userEmails: string[]) =>
          setInvitedUsersEmails(userEmails),
      }}
    >
      {children}
    </DialogShareFileContext.Provider>
  );
}
