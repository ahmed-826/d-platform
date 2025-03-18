import Layout from "./layout";
import { Loading, Sidebar, Display } from "@/components/fiche";
import { FicheProvider } from "@/contexts/FicheContext";

const page = async () => {
  const ficheId = 1;
  const { data, error } = await fetch(
    `http://localhost:3001/api/fiche?id=${ficheId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  ).then((res) => res.json());

  if (error) {
    return <div>Error: {error}</div>;
  }

  const ficheInfo = {
    id: data.id,
    name: data.ref,
    source: data.source,
    createdBy: data.created_by,
    path: data.path,
    docType: "fiche",
  };
  const sourceDocuments = data.sourceDocuments;
  const observations = data.observations.map((obs) => ({
    id: obs.id,
    name: obs.ref,
    object: obs.object,
    path: obs.path,
  }));
  const namedEntities = data.ner;
  const allDocuments = [
    ficheInfo,
    ...sourceDocuments.map((doc) => ({ ...doc, docType: "source" })),
    ...observations.map((doc) => ({
      ...doc,
      docType: "observation",
    })),
  ];

  const commentsData = data.comments;

  return (
    <Layout>
      <Loading>
        <FicheProvider allDocuments={allDocuments}>
          <div className="flex flex-1 overflow-hidden">
            <div className="w-1/5 flex-shrink-0 border-r overflow-auto bg-gray-50">
              <Sidebar
                ficheInfo={ficheInfo}
                sourceDocuments={sourceDocuments}
                observations={observations}
                namedEntities={namedEntities}
              />
            </div>
            <Display
              ficheInfo={ficheInfo}
              allDocuments={allDocuments}
              commentsData={commentsData}
            />
          </div>
        </FicheProvider>
      </Loading>
    </Layout>
  );
};

export default page;
