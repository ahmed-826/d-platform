import { Loading, Sidebar, Display } from "@/components/fiche";
import { FicheProvider } from "@/contexts/FicheContext";

import { getFicheById } from "@/lib/services/ficheService";
import path from "path";

const FILE_STORAGE_PATH = process.env.FILE_STORAGE_PATH;

const page = async ({ params }) => {
  const { ficheId } = params;

  const fiche = await getFicheById(ficheId);

  const formattedFiche = {
    id: fiche.id,
    name: fiche.name,
    path: path.join(FILE_STORAGE_PATH, fiche.path),
    extension: fiche.extension,
    docType: "fiche",

    ref: fiche.ref,
    source: fiche.dump.source.name,
    createdBy: fiche.createdBy,
    status: fiche.status,
  };
  const sourceDocuments = fiche.documents.map((doc) => ({
    id: doc.id,
    name: doc.name,
    path: path.join(FILE_STORAGE_PATH, doc.path),
    extension: doc.extension,

    docType: "source",
  }));
  const observations = fiche.observations.map((obs) => ({
    id: obs.observer.id,
    name: obs.observer.name,
    path: path.join(FILE_STORAGE_PATH, obs.path),
    extension: obs.observer.extension,

    ref: obs.observer.ref,
    object: obs.observer.object,
    docType: "observation",
  }));
  const namedEntities = fiche.ficheNers.map((ner) => ner.ner);

  return (
    <Loading>
      <FicheProvider
        fiche={formattedFiche}
        sourceDocuments={sourceDocuments}
        observations={observations}
        namedEntities={namedEntities}
      >
        <div className="flex flex-1 overflow-hidden">
          <div className="w-1/5 flex-shrink-0 border-r overflow-auto bg-gray-50">
            <Sidebar />
          </div>
          <Display ficheInfo={formattedFiche} />
        </div>
      </FicheProvider>
    </Loading>
  );
};

export default page;
