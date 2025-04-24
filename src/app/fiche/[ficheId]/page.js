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
    path: path.join(FILE_STORAGE_PATH, fiche.path),
    extension: path.parse(fiche.path).ext,
    name: path.parse(fiche.path).name,
    ref: fiche.ref,
    source: fiche.dump.source.name,
    createdBy: fiche.createdBy,
    status: fiche.status,
    docType: "fiche",
  };
  const sourceDocuments = fiche.documents.map((doc) => ({
    id: doc.id,
    path: path.join(FILE_STORAGE_PATH, doc.path),
    extension: path.parse(doc.path).ext,
    name: path.parse(doc.path).name,
    docType: "source",
  }));
  const observations = fiche.observations.map((obs) => ({
    id: obs.observer.id,
    path: path.join(FILE_STORAGE_PATH, obs.path),
    extension: path.parse(obs.path).ext,
    name: path.parse(obs.path).name,
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
