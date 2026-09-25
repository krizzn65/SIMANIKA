import OprecBuilder from "../../OprecBuilder";
export default async function EditOprecPage({ params }) {
  const { id } = await params;
  return <OprecBuilder oprecId={id} />;
}
