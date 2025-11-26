"use client";

import { eq } from "drizzle-orm";
import { useEffect, useState } from "react";
import { useShareFileDialog } from "~/app/_providers/shareFileDialog/use-share-file-dialog";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { getInvitedUsers, shareFileToUser } from "~/server/actions";

export function DialogShareFile() {
  const [emailAddress, setEmailAddress] = useState("");
  const [invitedUsers, setInvitedUsers] = useState<
    { emailAddress: string; fullName: string; role: number }[] | null
  >([]);
  const [errorLoadingInvitedUsers, setErrorLoadingInvitedUsers] =
    useState(false);
  const [hasErrorSharingFile, setHasErrorSharingFile] = useState(false);
  const [errorSharingFile, setErrorSharingFile] = useState("");
  const { isOpen, setIsOpen, fileId } = useShareFileDialog();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setEmailAddress("");
    setInvitedUsers([]);
    setErrorLoadingInvitedUsers(false);
    setHasErrorSharingFile(false);
    setErrorSharingFile("");
    setLoading(true);
    async function loadData() {
      const invitedUsers = await getInvitedUsers(fileId);
      if (invitedUsers.error) {
        setErrorLoadingInvitedUsers(true);
        return;
      }
      console.log("FileId:", fileId, " Invited Users:", invitedUsers);
      setInvitedUsers(invitedUsers.data);
      setLoading(false);
    }
    loadData();
  }, [fileId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = await shareFileToUser(fileId, emailAddress);
    if (result.error) {
      setHasErrorSharingFile(true);
      setErrorSharingFile("Error sharing file: " + result.error);
      return;
    }
    setIsOpen(false);
    setEmailAddress("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share with other people</DialogTitle>
          <DialogDescription>
            Enter the email address of the person you want to share with.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex items-center">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="link" className="sr-only">
                Email Address
              </Label>
              <Input
                placeholder="example@gmail.com"
                id="emailAddress"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
              />
              {hasErrorSharingFile && (
                <p className="text-sm text-red-500">{errorSharingFile}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">Invited Users:</h3>
            {loading ? (
              <p className="text-sm">Loading...</p>
            ) : errorLoadingInvitedUsers ? (
              <p className="text-sm text-red-500">
                Error loading invited users.
              </p>
            ) : !invitedUsers?.length ? (
              <p className="text-muted-foreground text-sm">
                No users have been invited yet.
              </p>
            ) : (
              <ul className="list-disc pl-5">
                {invitedUsers.map((user) => (
                  <li key={user.emailAddress} className="text-sm">
                    {user.fullName || user.emailAddress} - ({user.emailAddress})
                  </li>
                ))}
              </ul>
            )}
          </div>
          <DialogFooter className="sm:justify-start lg:justify-end">
            <DialogClose asChild>
              <Button variant="secondary">Close</Button>
            </DialogClose>
            <Button type="submit">Share</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
