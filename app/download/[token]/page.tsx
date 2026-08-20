import { redirect } from "next/navigation";

export default async function DownloadPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  redirect(`${supabaseUrl}/functions/v1/download?token=${token}`);
}
