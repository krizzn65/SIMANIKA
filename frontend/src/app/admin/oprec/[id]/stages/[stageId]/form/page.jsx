import OprecTestBuilder from "../../../../OprecTestBuilder";
export default async function OprecTestFormPage({ params }) {
  const { id, stageId } = await params;
  return <OprecTestBuilder oprecId={id} stageId={stageId} />;
}
