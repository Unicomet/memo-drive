import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "~/components/ui/button";
import { sendOnboardingEmail } from "~/server/actions";
import { DB_MUTATIONS, DB_QUERIES } from "~/server/db/queries";

export default async function DrivePage() {
  const user = await auth();

  const { error } = await sendOnboardingEmail();

  if (!user.userId) {
    return <div>Not Authorized</div>;
  }

  const existingRootFolder = await DB_QUERIES.getRootFolderForUser(user.userId);

  if (!existingRootFolder) {
    return (
      <div>
        <form
          action={async () => {
            "use server";
            const newRootFolderId = await DB_MUTATIONS.onboardUser(user.userId);
            const { error } = await sendOnboardingEmail();
            if (error) {
              console.error("Failed to send onboarding email:", error);
            }
            redirect(`/dashboard/folder/${newRootFolderId}`);
          }}
        >
          <Button>Create New Drive</Button>
        </form>
      </div>
    );
  }

  redirect(`/dashboard/folder/${existingRootFolder.id}`);
}
