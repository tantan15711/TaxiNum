import PublicProfile from "../../components/PublicProfile";

export default async function DriverPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return <PublicProfile slug={slug} />;
}

