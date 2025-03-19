import { notFound } from "next/navigation";

import Layout from "./layout";
import { Loading, Sidebar, Display } from "@/components/fiche";
import { FicheProvider } from "@/contexts/FicheContext";

const NEXT_IP = process.env.NEXT_IP;
const NEXT_PORT = process.env.NEXT_PORT;

const page = async ({ params }) => {
  const { data, error } = await fetch(
    `http://${NEXT_IP}:${NEXT_PORT}/api/fiche?id=${params.ficheId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  ).then((res) => res.json());

  if (error) {
    if (error.status === 404) {
      notFound();
    } else {
      return <div>Error: {error.message}</div>;
    }
  }

  const ficheInfo = {
    id: data?.id,
    name: data?.ref,
    source: data?.source,
    createdBy: data?.created_by,
    path: data?.path,
    status: data?.status,
    docType: "fiche",
  };
  const sourceDocuments = data.sourceDocuments || [];
  const observations = (data.observations || []).map((obs) => ({
    id: obs?.id,
    name: obs?.ref,
    object: obs?.object,
    path: obs?.path,
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

  const commentsData = data?.comments || [];

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
